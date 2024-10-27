from capture import capture_screen
from PIL import Image
import numpy as np
import time
import mss
import cv2
import os

from ocr_classes import *


def get_words_in_line(d, line_index):
    pass


if __name__ == "__main__":
    model_path = os.path.join('models', 'DB_IC15_resnet50.onnx')
    # model_path = os.path.join('models', 'DB_IC15_resnet18.onnx')

    start = time.time()
    print(f"Loading model...")
    db_model = cv2.dnn.TextRecognitionModel(model_path)
    print(f"Done ({(time.time() - start):.2f} seconds) !")

    inputSize = (736, 736)
    scale = 1.0 / 127.5
    mean = (122.67891434, 116.66876762, 104.00698793)
    db_model.setInputParams(scale, inputSize, mean)

    db_model.setDecodeType("CTC-greedy")
    # db_model.setDecodeType("CTC-prefix-beam-search")

    with mss.mss() as sct:

        np_screenshot = capture_screen(sct,
                                       top = 0, left = 0,
                                       width = 736, height = 736,
                                       monitor_number = 1)

        Image.fromarray(np_screenshot).save('out.png')

        # ToDo : Some preprocessing might be required to improve text detection (e.g. grayscale, noise removal, thresholding, dilation, erosion, canny edge detection, skew correction, ...) ?

        res = db_model.recognize(np_screenshot)
        print(res)
