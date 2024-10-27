from capture import capture_screen
import time
import mss

from ocr_classes import *


if __name__ == "__main__":
    start = time.time()
    print(f"Loading model...")
    easy_ocr_reader = EasyOCR('en')
    print(f"Done ({(time.time() - start):.2f} seconds) !")

    with mss.mss() as sct:

        start = time.time()
        count = 0

        while True:
            np_screenshot = capture_screen(sct,
                                           top = 0, left = 0,
                                           width = 1920, height = 1080,
                                           monitor_number = 1)

            # ToDo : Some preprocessing might be required to improve text detection (e.g. grayscale, noise removal, thresholding, dilation, erosion, canny edge detection, skew correction, ...) ?

            res = easy_ocr_reader.extract_text(np_screenshot)

            end = time.time()
            count += 1

            print(f"Average FPS = {count / (end - start):.2f}")
