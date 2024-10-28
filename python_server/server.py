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
    "fullscreen_capture": None,
    "monitor_source": None,
    "window_position": {"x": None, "y": None, "width": None, "height": None},
    "fps": 1.0,
    "input_lang": None,
    "output_lang": None,
    "is_running": False  # Control flag to start/stop the translation process
}

async def loop_process(websocket):
    easy_ocr_reader = EasyOCR('en')

    with mss.mss() as sct:
        while True:
            if params["is_running"]:
                np_screenshot = capture_screen(sct,
                                               top = 0, left = 0,
                                               width = 1920, height = 1080,
                                               monitor_number = 1)

                res = easy_ocr_reader.extract_text(np_screenshot)

                detected_text = []
                for word_data in res:
                    ((top_left, top_right, bottom_right, bottom_left), word, confidence) = word_data
                    detected_text.append({"text": word, "position": {"x": int(top_left[0]), "y": int(top_left[1])}})

                # example_translation_object = {
                #     "translation_to_plot": [
                #         {"text": "text_1", "position": {"x": 10, "y": 20}},
                #         {"text": "text_2", "position": {"x": 30, "y": 50}}
                #     ]
                # }
                logging.error(detected_text)

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
                response = {"status": "Connection successfully established!"}
                await websocket.send(json.dumps(response))  # Send back JSON response

            if 'fullscreen_capture' in message_json:
                params["fullscreen_capture"] = message_json['fullscreen_capture']
                logging.debug(f"fullscreen_capture updated to {params['fullscreen_capture']}")

            if 'monitor_source' in message_json:
                params["monitor_source"] = message_json['monitor_source']
                logging.debug(f"monitor_source updated to {params['monitor_source']}")

            if 'fps' in message_json:
                received_fps = message_json['fps']
                try:
                    received_fps = float(received_fps)
                except ValueError:
                    await websocket.send(json.dumps({"error": f"fps received is not a float. Received {received_fps}"}))
                received_fps = float(received_fps)
                if received_fps <= 0:
                    await websocket.send(json.dumps({"error": f"fps can't be <= 0. Received {received_fps}"}))
                else:
                    params["fps"] = received_fps
                    logging.debug(f"FPS updated to {params['fps']}")

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

            if 'window_position' in message_json:
                params["window_position"]["x"] = message_json['window_position']['x']
                params["window_position"]["y"] = message_json['window_position']['y']
                params["window_position"]["width"] = message_json['window_position']['width']
                params["window_position"]["height"] = message_json['window_position']['height']
                logging.debug(f"window_position updated to {params["window_position"]}")

    except websockets.exceptions.ConnectionClosed as e:
        logging.debug(f"Client disconnected: {e}")
        # ToDo : Gracefully stop the app
        # exit()


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
