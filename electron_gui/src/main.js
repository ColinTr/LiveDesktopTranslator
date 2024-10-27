const { app, BrowserWindow, ipcMain, desktopCapturer, session, Menu } = require('electron')
const path = require('node:path')

let selectedSourceId = null;  // Store the selected source ID
let ws_client = null;
let pythonServer = null;

const WebSocket = require('ws');
const {spawn} = require("child_process");
const portfinder = require('portfinder');// Function to connect to WebSocket with retry mechanism
function connectWebSocketWithRetry(port, maxRetries = 10, retryDelay = 500) {
    let attempts = 0;

    function tryConnect() {
        attempts += 1;
        ws_client = new WebSocket('ws://localhost:' + port);

        ws_client.on('open', () => {
            ws_client.send(JSON.stringify({ type: "connection_test" }));
        });
        ws_client.on('message', (event) => {
            console.log(`Received message from Python: ${event}`);
        });

        ws_client.on('error', (error) => {
            console.error(`WebSocket connection error: ${error.message}`);
            if (attempts < maxRetries) {
                console.log(`Retrying WebSocket connection... (${attempts}/${maxRetries})`);
                setTimeout(tryConnect, retryDelay);  // Retry after delay
            } else {
                console.error("Max retry attempts reached. Could not connect to WebSocket server.");
            }
        });
    }

    tryConnect();
}

// Select port and start server
portfinder.getPortPromise().then(port => {
    console.log('Port selected for Python server: ' + port.toString())

    // Spawn the Python WebSocket server executable
    pythonServer = spawn(path.join(__dirname, '..', 'assets', 'server.exe'), [port.toString()]);
    pythonServer.stdout.on('data', (data) => {
        console.log(`Output from Python: ${data}`);
    });
    pythonServer.stderr.on('data', (data) => {
        console.error(`Error from Python: ${data}`);
    });
    pythonServer.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
    pythonServer.on('uncaughtException', function (err) {
        console.log(err);
    });

    connectWebSocketWithRetry(port);  // Attempt to connect to WebSocket server with retry
}).catch((err) => {
    console.error(`Error during port acquisition: ${err}`);
});

function createWindow() {
    const win = new BrowserWindow({
        width: 500 + 300,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    win.loadFile(path.join(__dirname, 'control_menu.html'));

    win.removeMenu();

    // ToDo : remove before deploying
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    // Save the selected source ID when it's chosen from the menu
    ipcMain.on('select-source', (event, sourceId) => {
        selectedSourceId = sourceId;  // Update the selected source ID
        console.log(`Selected source: ${sourceId}`);
    });

    ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', async () => {
        // ['window', 'screen']
        const inputSources = await desktopCapturer.getSources({ types: [ 'screen'], fetchWindowIcons: true, thumbnailSize: { width: 500, height: 500 } });
        return inputSources.map(source => ({
            id: source.id,
            thumbnail: source.thumbnail.toDataURL(),
            name: source.name,
        }));
    });
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

// Listen for Electron app events to gracefully shut down
app.on('before-quit', () => {
    // Close the WebSocket connection
    if (ws_client && ws_client.readyState === WebSocket.OPEN) {
        ws_client.close();
        console.log("WebSocket connection closed.");
    }

    // Terminate the Python process
    if (pythonServer) {
        pythonServer.kill();
        console.log("Python process terminated.");
    }
});
