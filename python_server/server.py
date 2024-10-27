import websockets
import asyncio
import json
import sys


async def handler(websocket, path):
    print("Client connected")
    try:
        async for message in websocket:
            message_json = json.loads(message)

            if message_json['type'] == 'connection_test':
                response = {"status": "Connection successfully established!"}
                await websocket.send(json.dumps(response))  # Send back JSON response

    except websockets.exceptions.ConnectionClosed as e:
        print("Client disconnected")


async def main(ws_port):
    # Start the WebSocket server on localhost:8765
    async with websockets.serve(handler, "localhost", ws_port):
        print(f"WebSocket server listening on ws://localhost:{ws_port}")
        await asyncio.Future()  # Keeps the server running


if __name__ == "__main__":
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    else:
        port = 8765

    asyncio.run(main(port))
