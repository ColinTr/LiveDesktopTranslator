from abc import abstractmethod
from translate import Translator as pythonTranslateLibrary
import argostranslate.translate
import argostranslate.package


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
