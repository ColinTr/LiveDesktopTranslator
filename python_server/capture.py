import numpy as np


# screenshot = self.sct.grab(self.region) if self.region else self.sct.grab(self.sct.monitors[1])


def capture_screen(sct, top, left, width, height, monitor_number):
    # The screen part to capture
    mon = sct.monitors[monitor_number]
    monitor = {
        "top": mon["top"] + top,  # 0px from the top
        "left": mon["left"] + left,  # 0px from the left
        "width": width,
        "height": height,
        "mon": monitor_number,
    }

    screenshot = sct.grab(monitor)

    # (optional) Save the picture to a file
    # mss.tools.to_png(screenshot.rgb, screenshot.size, output=output)

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
