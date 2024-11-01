from translate import Translator as python_translate_library
# from transformers import MarianMTModel, MarianTokenizer
# import time

if __name__ == '__main__':
    # ========== Using HuggingFace Transformers ==========
    # print(f"Loading model...")
    # start = time.time()
    # translator_model = Translator('jap', 'en')
    # print(f"Done in {time.time() - start:.2f} seconds")
    # print(translator_model.translate("こんにちは世界"))

    # print(f"Loading model...")
    # start = time.time()
    # mt = dlt.TranslationModel()
    # print(f"Done in {time.time() - start:.2f} seconds")
    # text_hi = "संयुक्त राष्ट्र के प्रमुख का कहना है कि सीरिया में कोई सैन्य समाधान नहीं है"
    # print(f"Translating...")
    # start = time.time()
    # translated_text = mt.translate(text_hi, source=dlt.lang.HINDI, target=dlt.lang.ENGLISH)
    # print(f"Done in {time.time() - start:.2f} seconds")
    # print(translated_text)

    translator = python_translate_library(to_lang="zh")
    translation = translator.translate("This is a pen.")
    print(translation)

    pass
