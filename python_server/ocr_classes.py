import cv2.text as cvt
# import pytesseract
import easyocr


class EasyOCR:
    def __init__(self, language):
        """
        https://github.com/JaidedAI/EasyOCR
        :param language:
        """
        self.language = language
        self.reader  = easyocr.Reader([self.language])

    def extract_text(self, image, paragraph):
        """
        Returns text with coordinates
        :param image:
        :param paragraph:
        :return:
        """
        return self.reader.readtext(image, paragraph=paragraph)


class DBNetOCR:
    def __init__(self, language):
        """
        https://github.com/MhLiao/DB
        :param language:
        """
        self.language = language
        self.reader = None

    def extract_text(self, image):
        """
        Returns text with coordinates
        :param image:
        :return:
        """
        return None


class TrOCR:
    def __init__(self, language):
        """
        https://huggingface.co/docs/transformers/en/model_doc/trocr
        # !!! Seems extremely popular  (Downloads last month = 1,386,528)
        # !!! THIS MODEL DOES NOT PRODUCE BOUNDING BOXES
        # !!! It is meant to recognize text from a **single text line**
        :param language:
        """
        self.language = language
        self.reader = None

    def extract_text(self, image):
        """
        Returns text with coordinates
        :param image:
        :return:
        """
        return None


class docTROCR:
    def __init__(self, language):
        """
        https://github.com/mindee/doctr
        :param language:
        """
        self.language = language
        self.reader = None

    def extract_text(self, image):
        """
        Returns text with coordinates
        :param image:
        :return:
        """
        return None


class docTROCR:
    def __init__(self, language):
        """
        https://github.com/open-mmlab/mmocr
        :param language:
        """
        self.language = language
        self.reader = None

    def extract_text(self, image):
        """
        Returns text with coordinates
        :param image:
        :return:
        """
        return None
