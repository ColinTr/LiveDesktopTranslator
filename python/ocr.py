import easyocr


class OCRProcessor:
    def __init__(self):
        self.reader = easyocr.Reader(['en', 'fr'])  # Add required languages

    def extract_text(self, image):
        return self.reader.readtext(image)  # Returns text with coordinates
