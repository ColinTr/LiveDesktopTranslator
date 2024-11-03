from translate import Translator as pythonTranslateLibrary
from dataclasses import dataclass
import argostranslate.translate
from abc import abstractmethod
import argostranslate.package
from typing import List
import logging

@dataclass
class TranslationEntry:
    input_text: str
    model: str
    input_lang: str
    output_lang: str
    translation: str

class Translator:
    def __init__(self, params):
        self.offline_or_online_translation = params['offline_or_online_translation']
        self.input_lang = params["input_lang"]
        self.output_lang = params["output_lang"]
        self.entries: List[TranslationEntry] = []

        if self.offline_or_online_translation == "offline":
            self.translator = ArgosTranslatorAbstraction(from_lang=self.input_lang, to_lang=self.output_lang)
        elif self.offline_or_online_translation == "online":
            self.translator = PythonTranslateLibraryAbstraction(from_lang=self.input_lang, to_lang=self.output_lang)
        else:
            raise ValueError(f"Unsupported offline_or_online_translation value: {self.offline_or_online_translation}")

    def updateTranslator(self, params):
        # If the offline/online status changed, redeclare the whole translator:
        if params["offline_or_online_translation"] != self.offline_or_online_translation:
            if params["offline_or_online_translation"] == "offline":
                self.translator = ArgosTranslatorAbstraction(from_lang=params["input_lang"], to_lang=params["output_lang"])
            elif params["offline_or_online_translation"] == "online":
                self.translator = PythonTranslateLibraryAbstraction(from_lang=params["input_lang"], to_lang=params["output_lang"])
        # Otherwise, just update the languages:
        else:
            if params["input_lang"] != self.input_lang or params["output_lang"] != self.output_lang:
                logging.info(f"Updating translator: from_lang={self.input_lang}, to_lang={self.output_lang}")
                self.translator.updateLanguages(from_lang=params["input_lang"], to_lang=params["output_lang"])

        self.offline_or_online_translation = params["offline_or_online_translation"]
        self.input_lang = params["input_lang"]
        self.output_lang = params["output_lang"]

    def translate(self, input_text):
        if self.input_lang == self.output_lang:
            return input_text

        # Check if the translation already exists
        for entry in self.entries:
            if (entry.input_text == input_text and
                entry.model == self.offline_or_online_translation and
                entry.input_lang == self.input_lang and
                entry.output_lang == self.output_lang):
                return entry.translation

        # If it doesn't already exist, translate it
        translated_text = self.translator.translate(input_text)
        # Save the entry
        self.entries.append(TranslationEntry(input_text, self.offline_or_online_translation, self.input_lang, self.output_lang, translated_text))
        # And return the translation
        return translated_text


class AbstractTranslator:
    """
    Base class for all translators.
    Implementations of this class must override the __init__, updateLanguages and translate methods.
    """
    @abstractmethod
    def __init__(self, from_lang, to_lang):
        pass

    @abstractmethod
    def updateLanguages(self, from_lang, to_lang):
        pass

    @abstractmethod
    def translate(self, sentence):
        pass


class ArgosTranslatorAbstraction(AbstractTranslator):
    def __init__(self, from_lang, to_lang):
        self.from_lang = from_lang
        self.to_lang = to_lang

    def updateLanguages(self, from_lang, to_lang):
        self.__init__(from_lang, to_lang)

    def translate(self, sentence):
        if self.from_lang == self.to_lang:
            return sentence
        else:
            return argostranslate.translate.translate(sentence, self.from_lang, self.to_lang)


class PythonTranslateLibraryAbstraction:
    def __init__(self, from_lang, to_lang):
        self.from_lang = from_lang
        self.to_lang = to_lang
        self.translator = pythonTranslateLibrary(from_lang=self.from_lang, to_lang=self.to_lang)

    def updateLanguages(self, from_lang, to_lang):
        self.__init__(from_lang, to_lang)

    def translate(self, sentence):
        if self.from_lang == self.to_lang:
            return sentence
        else:
            return self.translator.translate(sentence)
