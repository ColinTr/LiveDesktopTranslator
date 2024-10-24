from capture import capture_screen
from pytesseract import Output
import cv2.text as cvt
from PIL import Image
import numpy as np
import pytesseract
import mss
import cv2
import os


if __name__ == "__main__":
    with mss.mss() as sct:

        np_screenshot = capture_screen(sct,
                                       top = 0, left = 0,
                                       width = 1920, height = 1080,
                                       monitor_number = 1)

        # ToDo : Some preprocessing might be required to improve text detection (e.g. grayscale, noise removal, thresholding, dilation, erosion, canny edge detection, skew correction, ...)

        # textSpotter = cvt.TextDetectorCNN.create(os.path.join('textbox_model', 'textbox_deploy.prototxt'),
        #                            os.path.join('textbox_model', 'textbox.caffemodel'))

        # rects, outProbs = textSpotter.detect(np_screenshot)

        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract'

        d = pytesseract.image_to_data(np_screenshot, output_type=Output.DICT, lang='fra')

        img = np_screenshot.copy()
        n_boxes = len(d['level'])

        # Levels :
        # 1 = a page
        # 2 = a block
        # 3 = a paragraph
        # 4 = a line
        # 5 = a word

        for l in np.unique(d['level']):
            # print(l)
            # print(np.array(d['text'])[d['level'] == l])
            # print('=========')

            img_with_boxes = img.copy()

            for i in range(n_boxes):
                if d['level'][i] == l:
                    (x, y, w, h) = (d['left'][i], d['top'][i], d['width'][i], d['height'][i])
                    cv2.rectangle(img_with_boxes, (x, y), (x + w, y + h), (0, 255, 0), 2)

            Image.fromarray(img_with_boxes).save('out_' + str(l) + '.png')

        # ToDo : Should the translation be made at the line or paragraph ?
        # Let's go with line level for now...

        # detected_text = Image.new('1', size=(img.shape[1], img.shape[0]), color='white')
        detected_text = np.ones((img.shape[0], img.shape[1], 3), dtype=np.uint8) * 255
        # detected_text = img.copy()

        # ToDo : Only translate high confidence detections ?

        for i in range(n_boxes):
            if d['level'][i] == 5:
                if d['conf'][i] > 10:
                    cv2.putText(detected_text,
                                d['text'][i],
                                org=(d['left'][i], d['top'][i] + d['height'][i]),
                                fontFace=cv2.FONT_HERSHEY_SIMPLEX, fontScale=0.5, color=(0, 0, 0), thickness=1)

                    # (x, y, w, h) = (d['left'][i], d['top'][i], d['width'][i], d['height'][i])
                    # cv2.rectangle(detected_text, (x, y), (x + w, y + h), (0, 255, 0), 2)

        Image.fromarray(detected_text).save(f"detected_text_{l}.png")

