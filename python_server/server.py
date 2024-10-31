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
    "input_lang": "en",
    "output_lang": "fr",
    "fps": 1.0,
    "flicker_for_screenshot": False,
    "confidence_threshold": 0.1,

    "window_bounds": {"x": 0, "y": 0, "width": 100, "height": 100},
    "is_running": False,  # Control flag to start/stop the translation process
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

                np_screenshot = capture_screen(sct, params["window_bounds"])

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

def updateParameters(parameters_config):
    if 'window_bounds' in parameters_config:
        params["window_bounds"] = parameters_config['window_bounds']
        print(params["window_bounds"])
    if 'inputLang' in parameters_config:
        params["input_lang"] = parameters_config['inputLang']
    if 'output_lang' in parameters_config:
        params["outputLang"] = parameters_config['outputLang']
    if 'maximumFPS' in parameters_config:
        received_fps = parameters_config['maximumFPS']
        try:
            received_fps = float(received_fps)
        except ValueError:
            logging.error(f"fps received is not a float. Received {received_fps}")
        if received_fps <= 0:
            logging.error(f"fps can't be <= 0. Received {received_fps}")
        else:
            params["fps"] = received_fps
    if 'flickerBeforeScreenshot' in parameters_config:
        params["flicker_for_screenshot"] = bool(parameters_config['flickerBeforeScreenshot'])
    if 'confidenceThreshold' in parameters_config:
        confidence_threshold = parameters_config['confidenceThreshold']
        try:
            confidence_threshold = float(confidence_threshold)
        except ValueError:
            logging.error(f"Confidence threshold received is not a float. Received {confidence_threshold}")
        if confidence_threshold < 0:
            logging.error(f"Confidence threshold can't be < 0.0. Received {confidence_threshold}")
        elif confidence_threshold >= 1.0:
            logging.error(f"Confidence threshold can't be >= 1.0. Received {confidence_threshold}")
        else:
            params["confidence_threshold"] = confidence_threshold

async def handle_messages(websocket):
    """Handle incoming messages from the client for parameter updates."""
    try:
        async for message in websocket:
            message_json = json.loads(message)

            if 'command' in message_json:
                if message_json['command'] == 'start':
                    params["is_running"] = True
                    logging.debug("Capture process started.")
                elif message_json['command'] == 'stop':
                    params["is_running"] = False
                    logging.debug("Capture process stopped.")
                elif message_json['command'] == 'connection_test':
                    await websocket.send(json.dumps({"connection_success": True}))
                elif message_json['command'] == 'overlay_hidden_confirmation':
                    params['overlay_hidden_confirmation_received'] = True

            if 'parameters_config' in message_json:
                updateParameters(message_json['parameters_config'])

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
