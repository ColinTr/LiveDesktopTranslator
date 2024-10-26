const { app, BrowserWindow, ipcMain, desktopCapturer, session, Menu } = require('electron')
const path = require('node:path')

let selectedSourceId = null;  // Store the selected source ID

function createWindow() {
    const win = new BrowserWindow({
        width: 500,
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
    // win.webContents.openDevTools();
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
