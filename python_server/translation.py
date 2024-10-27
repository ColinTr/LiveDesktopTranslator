from transformers import MarianMTModel, MarianTokenizer


class Translator:
    def __init__(self, src_lang, tgt_lang):
        self.model_name = f'Helsinki-NLP/opus-mt-{src_lang}-{tgt_lang}'
        self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
        self.model = MarianMTModel.from_pretrained(self.model_name)

    def translate(self, text):
        inputs = self.tokenizer(text, return_tensors="pt", padding=True)
        translated = self.model.generate(**inputs)
        return [self.tokenizer.decode(t, skip_special_tokens=True) for t in translated]
