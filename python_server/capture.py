import numpy as np

def capture_screen(sct, window_bounds):
    monitor = {
        "top": window_bounds["y"],
        "left": window_bounds["x"],
        "width": window_bounds["width"],
        "height": window_bounds["height"],
        "mon": 0,
    }

    screenshot = sct.grab(monitor)

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
