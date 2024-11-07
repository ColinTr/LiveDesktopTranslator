const { app, BrowserWindow, ipcMain, desktopCapturer, screen } = require('electron')
const path = require('node:path')
const {spawn} = require("child_process");
const portfinder = require('portfinder');
const WebSocket = require('ws');

let overlayWindow = null;
let ws_client = null;
let pythonServer = null;
let pointerTrackerInterval = null;

let parameters_config = {
    offline_or_online_translation: "offline",  // "offline" or "online"
    input_lang: "en",
    output_lang: "fr",
    window_bounds: null,
    maximumFPS: 1,
    flickerBeforeScreenshot: false,
    flickerDelay: 5,
    confidenceThreshold: 0.1,
}

function sendParametersConfig() {
    parameters_config.window_bounds = overlayWindow.getBounds();
    ws_client.send(JSON.stringify({ parameters_config: parameters_config }));
}

function connectWebSocketWithRetry(port, maxRetries = 20, retryDelay = 500) {
    let attempts = 0;

    function tryConnect() {
        attempts += 1;
        ws_client = new WebSocket('ws://localhost:' + port);

        ws_client.on('open', () => {
            ws_client.send(JSON.stringify({ command: "connection_test" }));
        });
        ws_client.on('message', (event) => {
            console.log(`Received message from Python: ${event.toString().substring(0, 100)}`);

            event = JSON.parse(event)

            if (event.hasOwnProperty("connection_success")) {
                // Send the current configuration of all the parameters
                sendParametersConfig();
            }

            if (event.hasOwnProperty("clear_translation")) {
                overlayWindow.webContents.send("clear-translation")
            }

            if (event.hasOwnProperty("plot_bounding_boxes")) {
                overlayWindow.webContents.send("plot-bounding-boxes", event.plot_bounding_boxes)
            }

            if (event.hasOwnProperty("translation_to_plot")) {
                overlayWindow.webContents.send("plot-translation", event.translation_to_plot)
            }

            if (event.hasOwnProperty("hide_overlay_before_screenshot")) {
                overlayWindow.setOpacity(0);
                setTimeout(() => {
                    ws_client.send(JSON.stringify({command: 'overlay_hidden_confirmation' })); // Send confirmation back to Python
                }, parameters_config.flickerDelay); // Some delay to allow rendering (in ms)
            }
            if (event.hasOwnProperty("show_overlay_after_screenshot")) {
                overlayWindow.setOpacity(1);
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

    // ToDo : Spawn the Python WebSocket server executable
    // pythonServer = spawn(path.join(__dirname, '..', 'assets', 'server.exe'), [port.toString()]);
    // pythonServer.stdout.on('data', (data) => {
    //     console.log(`Output from Python: ${data}`);
    // });
    // pythonServer.stderr.on('data', (data) => {
    //     console.error(`Error from Python: ${data}`);
    // });
    // pythonServer.on('close', (code) => {
    //     console.log(`Python process exited with code ${code}`);
    // });
    // pythonServer.on('uncaughtException', function (err) {
    //     console.log(err);
    // });

    connectWebSocketWithRetry(port);
}).catch((err) => {
    console.error(`Error during port acquisition: ${err}`);
});

function createOverlayWindow(){
    overlayWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'overlay_preload.js'),
        },
        width: 800,
        height: 600,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false,
        icon: path.join(__dirname, '..', 'assets', 'icon', 'app_icon_filled.png'),
    });

    overlayWindow.webContents.once('did-finish-load', () => {
        overlayWindow.webContents.send('initialize-state', parameters_config);
    });

    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

    // https://www.electronjs.org/docs/latest/api/browser-window/#winsetcontentprotectionenable-macos-windows
    // For Windows 10 version 2004 and up the window will be removed from capture entirely, older Windows versions behave as if WDA_MONITOR is applied capturing a black window.
    // So if your Windows version is older than Windows 10 version 2004, please check the "flicker screen" option in advanced options menu.
    overlayWindow.setContentProtection(true)

    // ToDo : If mouse is outside the window, set setIgnoreMouseEvents to false.

    // ToDo : Instead of looking at the alpha value, look for specific coordinates.
    // ToDo : No need to take screenshots anymore.
    // ToDo : When the overlay's control bar is hidden/shown, check for different coordinates.

    // Genius code from https://github.com/LZQCN
    // From https://github.com/electron/electron/issues/1335#issuecomment-1585787243
    // Why is it needed ?
    //   -> The window is transparent, and we want to ignore mouse events everywhere BUT some places.
    pointerTrackerInterval = setInterval(() => {
        const point = screen.getCursorScreenPoint();
        const [x, y] = overlayWindow.getPosition();
        const [w, h] = overlayWindow.getSize();
        if (point.x > x && point.x < x + w && point.y > y && point.y < y + h) {
            updateIgnoreMouseEvents(point.x - x, point.y - y);
        }
    }, 30);  // The shorter the interval, the more reactive, but the heavier on cpu
    const updateIgnoreMouseEvents = async (x, y) => {
        // capture 1x1 image of mouse position.
        const image = await overlayWindow.webContents.capturePage({
            x, y,
            width: 1, height: 1,
        });
        const buffer = image.getBitmap();
        // Don't ignore mouse events if the alpha value of the pixel under the mouse is not transparent (i.e. != 0)
        overlayWindow.setIgnoreMouseEvents(!buffer[3]);
        // console.log("setIgnoreMouseEvents", !buffer[3]);
    };

    parameters_config.window_bounds = overlayWindow.getBounds();  // Initialize the value
    const windowShapeUpdateEvents = ["moved", "resized", "maximize", "unmaximize"]  // "move" => Spams too much
    windowShapeUpdateEvents.forEach(event => {
        overlayWindow.on(event, () => {
            sendParametersConfig();
        });
    });
}

app.whenReady().then(() => {
    createOverlayWindow()

    ipcMain.on('set-fullscreen-button', (event, bool) => {
        overlayWindow.setFullScreen(bool)
        sendParametersConfig();
    });

    ipcMain.on('fps-update', (event, fpsValue) => {
        console.log(`Updated FPS value: ${fpsValue}`);
        parameters_config.maximumFPS = fpsValue
        sendParametersConfig();
    });

    ipcMain.on('offline-or-online-translation', (event, state) => {
        console.log(`Updated translation state: ${state}`);
        parameters_config.offline_or_online_translation = state
        sendParametersConfig();
    });

    ipcMain.on('input-lang-update', (event, lang) => {
        console.log(`Updated input language: ${lang}`);
        parameters_config.input_lang = lang
        sendParametersConfig();
    });

    ipcMain.on('output-lang-update', (event, lang) => {
        console.log(`Updated output language: ${lang}`);
        parameters_config.output_lang = lang
        sendParametersConfig();
    });

    ipcMain.on('flicker-screenshot-update', (event, state) => {
        console.log(`Updated flicker screenshot state: ${state}`);
        parameters_config.flickerBeforeScreenshot = state
        sendParametersConfig();

        if (state === true) {
            overlayWindow.setContentProtection(false)
        } else {
            overlayWindow.setContentProtection(true)
        }
    });

    ipcMain.on('flicker-delay-update', (event, flickerDelayValue) => {
        console.log(`Updated flicker delay: ${flickerDelayValue}`);
        parameters_config.flickerDelay = flickerDelayValue
        // This one is handled only by the client, no need to send it to the server
    });

    ipcMain.on('confidence-threshold-update', (event, confidenceThresholdValue) => {
        console.log(`Updated confidence threshold: ${confidenceThresholdValue}`);
        parameters_config.confidenceThreshold = confidenceThresholdValue
        sendParametersConfig();
    });

    ipcMain.handle('START_BUTTON_PRESS', async () => {
        console.log(`Sending start command...`);
        ws_client.send(JSON.stringify({ command: "start" }));
    });

    ipcMain.handle('STOP_BUTTON_PRESS', async () => {
        console.log(`Sending stop command...`);
        ws_client.send(JSON.stringify({ command: "stop" }));
    });
});

// app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createControlMenuWindow()
// });

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

    clearInterval(pointerTrackerInterval)

    // Terminate the Python process
    if (pythonServer) {
        pythonServer.kill();
        console.log("Python process terminated.");
    }
});
