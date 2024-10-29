import websockets
import asyncio
import logging
import json
import mss
import sys

from capture import capture_screen
from ocr_classes import *

# The parameters that can be adjusted by the client
params = {
    "fullscreen_capture": True,
    "monitor_number": 1,
    "window_position": {"x": None, "y": None, "width": None, "height": None},
    "fps": 1.0,
    "confidence_threshold": 0.1,
    "input_lang": None,
    "output_lang": None,
    "is_running": False,  # Control flag to start/stop the translation process
    "flicker_for_screenshot": False,
    "overlay_hidden_confirmation_received": False,
}

async def loop_process(websocket):
    easy_ocr_reader = EasyOCR('en')

    with mss.mss() as sct:
        while True:
            if params["is_running"]:
                if params["flicker_for_screenshot"] is True:
                    await websocket.send(json.dumps({"hide_overlay_before_screenshot": True}))

                    # Wait for confirmation from Electron:
                    while params['overlay_hidden_confirmation_received'] is not True:
                        await asyncio.sleep(0.001)

                np_screenshot = capture_screen(sct, params["fullscreen_capture"], params["monitor_number"], params["window_position"])

                if params["flicker_for_screenshot"] is True:
                    await websocket.send(json.dumps({"show_overlay_after_screenshot": True}))
                    params['overlay_hidden_confirmation_received'] = False

                res = easy_ocr_reader.extract_text(np_screenshot)

                detected_text = []
                for word_data in res:
                    ((top_left, top_right, bottom_right, bottom_left), word, confidence) = word_data
                    if confidence >= params["confidence_threshold"]:
                        detected_text.append({"text": word,
                                              "position": {
                                                  "top_left_x": int(top_left[0]),
                                                  "top_left_y": int(top_left[1]),
                                                  "width": int(bottom_right[0]) - int(top_left[0]),
                                                  "height": int(bottom_right[1]) - int(top_left[1])
                                              }})

                await websocket.send(json.dumps({"translation_to_plot": detected_text}))

                await asyncio.sleep(1 / params["fps"])
            else:
                # If not capturing, wait a bit before checking again
                await asyncio.sleep(0.1)

async def handle_messages(websocket):
    """Handle incoming messages from the client for parameter updates."""
    try:
        async for message in websocket:
            message_json = json.loads(message)

            if message_json.get('type') == 'connection_test':
                await websocket.send(json.dumps({"status": "Connection successfully established!"}))  # Send back JSON response

            if 'fullscreen_capture' in message_json:
                params["fullscreen_capture"] = message_json['fullscreen_capture']
                logging.debug(f"fullscreen_capture updated to {params['fullscreen_capture']}")

            if 'monitor_number' in message_json:
                params["monitor_number"] = message_json['monitor_number']
                logging.debug(f"monitor_number updated to {params['monitor_number']}")

            if 'fps' in message_json:
                received_fps = message_json['fps']
                try:
                    received_fps = float(received_fps)
                except ValueError:
                    await websocket.send(json.dumps({"error": f"fps received is not a float. Received {received_fps}"}))

                if received_fps <= 0:
                    await websocket.send(json.dumps({"error": f"fps can't be <= 0. Received {received_fps}"}))
                else:
                    params["fps"] = received_fps
                    logging.debug(f"FPS updated to {params['fps']}")

            if 'confidence_threshold' in message_json:
                confidence_threshold = message_json['confidence_threshold']
                try:
                    confidence_threshold = float(confidence_threshold)
                except ValueError:
                    await websocket.send(json.dumps({"error": f"Confidence threshold received is not a float. Received {confidence_threshold}"}))

                if confidence_threshold < 0:
                    await websocket.send(json.dumps({"error": f"Confidence threshold can't be < 0.0. Received {confidence_threshold}"}))
                elif confidence_threshold >= 1.0:
                    await websocket.send(json.dumps({"error": f"Confidence threshold can't be >= 1.0. Received {confidence_threshold}"}))
                else:
                    params["confidence_threshold"] = confidence_threshold
                    logging.debug(f"Confidence threshold updated to {params['confidence_threshold']}")

            if 'is_running' in message_json:
                params["is_running"] = message_json['is_running']
                logging.debug(f"is_running updated to {params['is_running']}")

            if message_json.get("command") == "start":
                params["is_running"] = True
                logging.debug("Capture process started.")
            elif message_json.get("command") == "stop":
                params["is_running"] = False
                logging.debug("Capture process stopped.")

            if 'input_lang' in message_json:
                params["input_lang"] = message_json['input_lang']
                logging.debug(f"input_lang updated to {params['input_lang']}")

            if 'output_lang' in message_json:
                params["output_lang"] = message_json['output_lang']
                logging.debug(f"output_lang updated to {params['output_lang']}")

            if 'flicker_for_screenshot' in message_json:
                params["flicker_for_screenshot"] = bool(message_json['flicker_for_screenshot'])
                logging.debug(f"flicker_for_screenshot updated to {params['flicker_for_screenshot']}")

            if 'overlay_hidden_confirmation' in message_json:
                params['overlay_hidden_confirmation_received'] = True

            if 'window_position' in message_json:
                params["window_position"]["x"] = message_json['window_position']['x']
                params["window_position"]["y"] = message_json['window_position']['y']
                params["window_position"]["width"] = message_json['window_position']['width']
                params["window_position"]["height"] = message_json['window_position']['height']
                logging.debug(f"window_position updated to {params["window_position"]}")

    except Exception as e:
        logging.error(f"Exception during message reception: {e}")
    finally:
        logging.info("Detected client disconnection, stopping the server.")

        for task in asyncio.all_tasks():
            task.cancel()

        # Stop the event loop to terminate the program
        asyncio.get_running_loop().stop()


async def websocket_handler(websocket, path):
    """Run both the capture-and-send and message handler in parallel."""
    await asyncio.gather(
        loop_process(websocket),
        handle_messages(websocket)
    )


async def main(ws_port):
    # Start the WebSocket server on localhost:8765
    async with websockets.serve(websocket_handler, "localhost", ws_port):
        logging.info(f"WebSocket server listening on ws://localhost:{ws_port}")
        await asyncio.Future()  # Keeps the server running

if __name__ == "__main__":
    # ToDo : Use sys.argv to set the logging level
    logging.basicConfig()
    logging.getLogger().setLevel(logging.DEBUG)

    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 8765

    asyncio.run(main(port))
