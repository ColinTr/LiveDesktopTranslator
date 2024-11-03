from abc import abstractmethod
import cv2.text as cvt
# import pytesseract
import easyocr
import logging


class AbstractOCRReader:
    @abstractmethod
    def __init__(self, input_lang):
        pass

    @abstractmethod
    def extractText(self, image):
        pass

    @abstractmethod
    def updateInputLang(self, input_lang):
        pass


class EasyOCRReader(AbstractOCRReader):
    # https://github.com/JaidedAI/EasyOCR

    def __init__(self, input_lang):
        self.input_lang = input_lang
        self.reader  = easyocr.Reader([self.input_lang])

    def extractText(self, image):
        return self.reader.readtext(image, paragraph=True)

    def updateInputLang(self, input_lang):
        if input_lang != self.input_lang:
            self.reader = easyocr.Reader(input_lang)
            logging.debug(f"Reloaded EasyOCR with lang: {input_lang}")
            self.input_lang = input_lang


class DBNetOCRReader(AbstractOCRReader):
    # https://github.com/MhLiao/DB

    def __init__(self, language):
        self.language = language
        self.reader = None

    def extractText(self, image):
        pass

    def updateInputLang(self, input_lang):
        pass


class TrOCRReader(AbstractOCRReader):
    # https://huggingface.co/docs/transformers/en/model_doc/trocr
    # !!! Seems extremely popular  (Downloads last month = 1,386,528)
    # !!! THIS MODEL DOES NOT PRODUCE BOUNDING BOXES
    # !!! It is meant to recognize text from a **single text line**

    def __init__(self, language):
        self.language = language
        self.reader = None

    def extractText(self, image):
        pass

    def updateInputLang(self, input_lang):
        pass


class DocTROCRReader(AbstractOCRReader):
    # https://github.com/mindee/doctr

    def __init__(self, language):
        self.language = language
        self.reader = None

    def extractText(self, image):
        pass

    def updateInputLang(self, input_lang):
        pass


class MMOCRReader(AbstractOCRReader):
    # https://github.com/open-mmlab/mmocr

    def __init__(self, language):
        self.language = language
        self.reader = None

    def extractText(self, image):
        pass

    def updateInputLang(self, input_lang):
        pass
