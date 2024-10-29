const { app, BrowserWindow, ipcMain, desktopCapturer, screen } = require('electron')
const path = require('node:path')

let controlMenuWindow = null;
let overlayWindow = null;
let ws_client = null;
let pythonServer = null;

let selectedMonitor = 0;
let flickerDelay = 5;

const WebSocket = require('ws');
const {spawn} = require("child_process");
const portfinder = require('portfinder');// Function to connect to WebSocket with retry mechanism
function connectWebSocketWithRetry(port, maxRetries = 50, retryDelay = 1000) {
    let attempts = 0;

    function tryConnect() {
        attempts += 1;
        ws_client = new WebSocket('ws://localhost:' + port);

        ws_client.on('open', () => {
            ws_client.send(JSON.stringify({ type: "connection_test", fps: "1" }));
        });
        ws_client.on('message', (event) => {
            console.log(`Received message from Python: ${event.toString().substring(0, 100)}`);

            event = JSON.parse(event)
            if (event.hasOwnProperty("translation_to_plot")) {
                if (overlayWindow != null) {
                    overlayWindow.webContents.send("plot-translation", event.translation_to_plot)
                }
            }

            if (event.hasOwnProperty("hide_overlay_before_screenshot")) {
                if (overlayWindow != null) {
                    overlayWindow.setOpacity(0);
                    setTimeout(() => {
                        ws_client.send(JSON.stringify({overlay_hidden_confirmation: 'done' })); // Send confirmation back to Python
                    }, flickerDelay); // Some delay to allow rendering (in ms)
                }
            }
            if (event.hasOwnProperty("show_overlay_after_screenshot")) {
                if (overlayWindow != null) {
                    overlayWindow.setOpacity(1);
                }
            }
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
    port = 8765
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

function createControlMenuWindow() {
    controlMenuWindow = new BrowserWindow({
        width: 500 + 500,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, 'control_menu', 'control_menu_preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });
    controlMenuWindow.loadFile(path.join(__dirname, 'control_menu', 'control_menu.html'));
    controlMenuWindow.removeMenu();

    // ToDo : remove before deploying
    controlMenuWindow.webContents.openDevTools();
}

function createOverlayWindow() {
    // Create the overlay window as a child of the main window
    overlayWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'overlay', 'overlay_preload.js'),
        },
        parent: controlMenuWindow,      // Makes this window a child of the main window
        transparent: true,       // Transparent background
        frame: false,            // No window frame
        alwaysOnTop: true,       // Keeps it above other windows
        fullscreen: true,        // Makes it full screen (optional, or set specific dimensions)
        resizable: false,
        skipTaskbar: true,       // Hides it from the taskbar
    });
    moveWindowToMonitor(overlayWindow, selectedMonitor);
    overlayWindow.loadFile(path.join(__dirname, 'overlay', 'overlay.html'));
    // Set overlay window to ignore all mouse events, making it click-through
    overlayWindow.setIgnoreMouseEvents(true);

    // https://www.electronjs.org/docs/latest/api/browser-window/#winsetcontentprotectionenable-macos-windows
    // For Windows 10 version 2004 and up the window will be removed from capture entirely, older Windows versions behave as if WDA_MONITOR is applied capturing a black window.
    // So if your Windows version is older than Windows 10 version 2004, please check the "flicker screen" option in advanced options menu.
    overlayWindow.setContentProtection(true)

    // ToDo : remove before deploying
    // overlayWindow.webContents.openDevTools();
}

// Move the window to the specified monitor index (e.g., 1 for the second monitor)
function moveWindowToMonitor(window, monitorNumber) {
    const displays = screen.getAllDisplays();
    const { x, y, width, height } = displays[monitorNumber].bounds;
    window.setBounds({ x: x, y: y, width: width, height: height });
}

app.whenReady().then(() => {
    createControlMenuWindow();

    ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', async () => {
        // ['window', 'screen']
        const inputSources = await desktopCapturer.getSources({ types: [ 'screen'], fetchWindowIcons: true, thumbnailSize: { width: 500, height: 500 } });
        return inputSources.map(source => ({
            id: source.id,
            thumbnail: source.thumbnail.toDataURL(),
            name: source.name,
        }));
    });

    ipcMain.on('select-source', (event, sourceId) => {
        console.log(`Selected source: ${sourceId}`);
        ws_client.send(JSON.stringify({ monitor_number: sourceId }));
        selectedMonitor = sourceId - 1  // Python's monitor number start at 1, here at 0

        if (overlayWindow != null) {
            moveWindowToMonitor(overlayWindow, selectedMonitor);
        }
    });

    ipcMain.on('fps-update', (event, fpsValue) => {
        console.log(`Updated FPS value: ${fpsValue}`);
        ws_client.send(JSON.stringify({ fps: fpsValue }));
    });

    ipcMain.on('input-lang-update', (event, lang) => {
        console.log(`Updated input language: ${lang}`);
        ws_client.send(JSON.stringify({ input_lang: lang }));
    });

    ipcMain.on('output-lang-update', (event, lang) => {
        console.log(`Updated output language: ${lang}`);
        ws_client.send(JSON.stringify({ output_lang: lang }));
    });

    ipcMain.on('flicker-screenshot-update', (event, state) => {
        console.log(`Updated flicker screenshot state: ${state}`);
        ws_client.send(JSON.stringify({ flicker_for_screenshot: state }));
    });

    ipcMain.on('flicker-delay-update', (event, flickerDelayValue) => {
        console.log(`Updated flicker delay: ${flickerDelayValue}`);
        flickerDelay = flickerDelayValue
    });

    ipcMain.on('confidence-threshold-update', (event, confidenceThresholdValue) => {
        console.log(`Updated confidence threshold: ${confidenceThresholdValue}`);
        ws_client.send(JSON.stringify({ confidence_threshold: confidenceThresholdValue }));
    });

    ipcMain.handle('START_BUTTON_PRESS', async () => {
        if (overlayWindow != null) {
            console.log('ALREADY RUNNING')
            // ToDo : display error to user
        } else {
            ws_client.send(JSON.stringify({ command: "start" }));
            createOverlayWindow();
        }
    });

    ipcMain.handle('STOP_BUTTON_PRESS', async () => {
        if (overlayWindow == null) {
            console.log('CANNOT CLOSE, NOT RUNNING')
            // ToDo : display error to user
        } else {
            ws_client.send(JSON.stringify({ command: "stop" }));
            overlayWindow.close();
            overlayWindow = null;
        }
    });
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlMenuWindow()
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
