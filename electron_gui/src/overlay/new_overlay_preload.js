// https://www.electronjs.org/docs/latest/tutorial/ipc

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

});
