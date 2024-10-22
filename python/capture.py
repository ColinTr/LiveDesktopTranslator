import numpy as np
import mss


class ScreenCapture:
    def __init__(self, region=None):
        self.sct = mss.mss()
        self.region = region

    def capture(self):
        screenshot = self.sct.grab(self.region) if self.region else self.sct.grab(self.sct.monitors[1])
        return np.array(screenshot)  # Returns a NumPy array of the image for further processing
