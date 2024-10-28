// https://www.electronjs.org/docs/latest/tutorial/ipc

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    plotTranslation: (callback) => ipcRenderer.on('plot-translation', (_event, translation_to_plot) => callback(translation_to_plot)),
});
