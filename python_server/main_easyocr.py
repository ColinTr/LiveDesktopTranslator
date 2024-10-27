from capture import capture_screen
from PIL import Image
import numpy as np
import time
import mss
import cv2
import os

from ocr_classes import *

from transformers import VisionEncoderDecoderModel
from transformers import TrOCRProcessor

def get_words_in_line(d, line_index):
    pass


if __name__ == "__main__":
    start = time.time()
    print(f"Loading model...")

    processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
    model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")

    print(f"Done ({(time.time() - start):.2f} seconds) !")

    with mss.mss() as sct:

        np_screenshot = capture_screen(sct,
                                       top = 0, left = 0,
                                       width = 736, height = 736,
                                       monitor_number = 1)

        Image.fromarray(np_screenshot).save('out.png')

        # ToDo : Some preprocessing might be required to improve text detection (e.g. grayscale, noise removal, thresholding, dilation, erosion, canny edge detection, skew correction, ...) ?

        res = db_model.recognize(np_screenshot)
        print(res)
