import numpy as np
import asyncio
import json


async def capture_screen(sct, params, websocket):
    monitor = {
        "top": params["window_bounds"]["y"],
        "left": params["window_bounds"]["x"],
        "width": params["window_bounds"]["width"],
        "height": params["window_bounds"]["height"],
        "mon": 0,
    }

    if params["flicker_for_screenshot"] is True:
        await websocket.send(json.dumps({"hide_overlay_before_screenshot": True}))
        # Await for confirmation from Electron:
        while params['overlay_hidden_confirmation_received'] is not True:
            await asyncio.sleep(0.001)

    screenshot = sct.grab(monitor)

    if params["flicker_for_screenshot"] is True:
        await websocket.send(json.dumps({"show_overlay_after_screenshot": True}))
        params['overlay_hidden_confirmation_received'] = False

    # (optional) Save the picture to a file
    # mss.tools.to_png(screenshot.rgb, screenshot.size, output="test.png")

    # Convert raw BGRA values to RGB
    # https://python-mss.readthedocs.io/examples.html#bgra-to-rgb

    # ToDo : Benchmark these three alternatives :

    """ Efficient Pillow version. """
    # np_screenshot = np.array(Image.frombytes('RGB', screenshot.size, screenshot.bgra, 'raw', 'BGRX'))

    """ Slow Numpy version. """
    # np_screenshot = np.array(screenshot, dtype=np.uint8)[..., [2, 1, 0]]

    """ Most efficient Numpy version as of now. """
    np_screenshot = np.flip(np.array(screenshot, dtype=np.uint8)[:, :, :3], 2)

    return np_screenshot
