import websockets
import asyncio
import json


class WebSocketServer:
    def __init__(self, host='localhost', port=8765):
        self.host = host
        self.port = port

    async def handler(self, websocket, path):
        async for message in websocket:
            data = json.loads(message)
            # Process the data (e.g., send screen capture for OCR or handle translation request)
            await websocket.send(json.dumps({"message": "Processed data here"}))

    def start_server(self):
        return websockets.serve(self.handler, self.host, self.port)

# In main.py
async def main():
    server = WebSocketServer()
    await server.start_server()
    await asyncio.Future()  # Run forever
