from translation import Translator
from capture import ScreenCapture
from ipc import WebSocketServer
from ocr_classes import OCRProcessor
import asyncio


async def process_translation(screen_capture, ocr_processor, translator):
    while True:
        # Step 1: Capture screen
        image = screen_capture.capture()

        # Step 2: Extract text using OCR
        detected_text = ocr_processor.extract_text(image)

        # Step 3: Translate the text
        translations = [translator.translate(text) for text, *_ in detected_text]

        # Step 4: Send translation back to Electron (through WebSocket or zerorpc)
        # Placeholder: Implement the sending logic

        await asyncio.sleep(0.1)  # Control the frequency of captures (adjust as needed)


async def main():
    # Initialize components
    screen_capture = ScreenCapture()
    ocr_processor = OCRProcessor()
    translator = Translator('en', 'es')  # Example: English to Spanish

    # Start the WebSocket server
    websocket_server = WebSocketServer()
    asyncio.create_task(websocket_server.start_server())

    # Process translations in a loop
    await process_translation(screen_capture, ocr_processor, translator)


if __name__ == "__main__":
    asyncio.run(main())