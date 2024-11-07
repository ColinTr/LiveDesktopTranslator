import numpy as np
import websockets
import asyncio
import json
import mss
import sys
import csv
import os

from capture import capture_screen
from ocr_classes import *
from translator import *

# The parameters that can be adjusted by the client
params = {
    "offline_or_online_translation": "offline",  # "offline" or "online"
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

    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = os.path.join('C:\\', 'Program Files', 'Tesseract-OCR', 'tesseract.exe')

    ocr_reader = EasyOCRReader(params["input_lang"])
    translator = Translator(params)

    current_screenshot = np.array([0])

    with mss.mss() as sct:
        while True:
            # Reload OCR reader if input language has changed
            ocr_reader.updateInputLang(params["input_lang"])

            # If the input/output lang changed, or the translation is now offline/online, update the translator:
            translator.updateTranslator(params)

            if params["is_running"]:
                np_screenshot = await capture_screen(sct, params, websocket)

                # Only update the translation if the detected image changed
                # ToDo : This idea can be improved by detecting only which parts of the screen changed.
                # TODO :   And we could apply easy_ocr_reader.extract_text only on the part that changed.
                if current_screenshot.shape != np_screenshot.shape or not (current_screenshot == np_screenshot).all():
                    current_screenshot = np_screenshot

                    res = pytesseract.image_to_data(np_screenshot)

                    reader = csv.DictReader(res.split("\n"), delimiter="\t", quoting=csv.QUOTE_NONE)
                    boxes = []
                    for l in reader:
                        if l['level'] == '3':
                            boxes.append({"box": {
                                "x1": int(l["left"]),
                                "y1": int(l["top"]),
                                "x2": int(l["left"]) + int(l["width"]),
                                "y2": int(l["top"]) + int(l["height"]),
                            }})

                    await websocket.send(json.dumps({"plot_bounding_boxes": boxes}))

                await asyncio.sleep(1 / params["fps"])
            else:
                # If not capturing, wait a bit before checking again
                await asyncio.sleep(0.1)

def updateParameters(parameters_config):
    if 'window_bounds' in parameters_config:
        params["window_bounds"] = parameters_config['window_bounds']
    if 'offline_or_online_translation' in parameters_config:
        params["offline_or_online_translation"] = parameters_config['offline_or_online_translation']
    if 'input_lang' in parameters_config:
        params["input_lang"] = parameters_config['input_lang']
    if 'output_lang' in parameters_config:
        params["output_lang"] = parameters_config['output_lang']
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
