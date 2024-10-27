from capture import capture_screen
from PIL import Image
import numpy as np
import mss
import cv2
import os

from ocr_classes import *


def get_words_in_line(d, line_index):
    pass


if __name__ == "__main__":
    easy_ocr_reader = EasyOCR('en')

    with mss.mss() as sct:

        np_screenshot = capture_screen(sct,
                                       top = 0, left = 0,
                                       width = 1920, height = 1080,
                                       monitor_number = 1)
        Image.fromarray(np_screenshot).save('out.png')

        # ToDo : Some preprocessing might be required to improve text detection (e.g. grayscale, noise removal, thresholding, dilation, erosion, canny edge detection, skew correction, ...) ?

        res = easy_ocr_reader.extract_text(np_screenshot)
        print(res)

        img_with_boxes = np_screenshot.copy()

        for word_data in res:
            ((top_left, top_right, bottom_right, bottom_left), word, confidence) = word_data
            print(word_data)
            print((int(top_left[0]), int(top_left[1])), (int(bottom_right[0]), int(bottom_right[1])))
            cv2.rectangle(img_with_boxes, (int(top_left[0]), int(top_left[1])), (int(bottom_right[0]), int(bottom_right[1])), (0, 255, 0), 2)
            print('============')

        Image.fromarray(img_with_boxes).save('out_with_boxes.png')

        detected_text = np.ones((np_screenshot.shape[0], np_screenshot.shape[1], 3), dtype=np.uint8) * 255

        # ToDo : Only translate high confidence detections ?

        # ToDo : Form the sentences before translating and plotting them

        for word_data in res:
            ((top_left, top_right, bottom_right, bottom_left), word, confidence) = word_data
            if confidence > 0.1:
                cv2.putText(detected_text,
                            word,
                            org=(int(bottom_left[0]), int(bottom_left[1])),
                            fontFace=cv2.FONT_HERSHEY_SIMPLEX, fontScale=0.5, color=(0, 0, 0), thickness=1)

        Image.fromarray(detected_text).save(f"detected_text.png")
