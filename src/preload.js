const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getSources: (opts) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts),
    showPopupMenu: (menuTemplate) => ipcRenderer.send('show-popup-menu', menuTemplate),
    onSourceSelected: (callback) => ipcRenderer.on('source-selected', (event, sourceId) => {callback(sourceId);})
});