const { app, BrowserWindow, ipcMain, desktopCapturer, session, Menu } = require('electron')
const path = require('node:path')

let selectedSourceId = null;  // Store the selected source ID

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        }
    });

    win.loadFile(path.join(__dirname, 'control_menu.html'));

    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        if (selectedSourceId) {
            desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
                const selectedSource = sources.find(source => source.id === selectedSourceId);
                if (selectedSource) {
                    // Grant access to the selected screen or window
                    callback({ video: selectedSource });
                } else {
                    console.log("Selected source not found!");
                }
            }).catch(err => console.error("Error getting sources: ", err));
        } else {
            console.log("No source selected.");
        }
    }, { useSystemPicker: true });

    // Save the selected source ID when it's chosen from the menu
    ipcMain.on('select-source', (event, sourceId) => {
        selectedSourceId = sourceId;  // Update the selected source ID
        console.log(`Source selected: ${sourceId}`);
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', async (event, opts) => {
        return await desktopCapturer.getSources(opts);
    });

    // Handle showing the popup menu
    ipcMain.on('show-popup-menu', (event, menuTemplate) => {
        const menu = Menu.buildFromTemplate(menuTemplate.map(item => ({
            label: item.label,
            click: () => {
                // console.log("Selected source with ID: " + item.id + " and name: " + item.label);
                win.webContents.send('source-selected', item.id)
                selectedSourceId = item.id;
            }
        })));

        // Show the popup menu in the appropriate window
        menu.popup(BrowserWindow.fromWebContents(event.sender));
    });

    win.removeMenu()
    win.webContents.openDevTools()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
