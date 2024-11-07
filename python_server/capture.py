from PIL import Image
import numpy as np
import asyncio
import json


async def capture_screen(sct, params, websocket, return_format=np.array):
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

    if return_format == np.array:
        return np.flip(np.array(screenshot, dtype=np.uint8)[:, :, :3], 2)
    elif return_format == Image.Image:
        return Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
