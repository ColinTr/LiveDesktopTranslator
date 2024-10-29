// https://www.electronjs.org/docs/latest/tutorial/ipc

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getSources: (opts) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts),
    startButtonPress: () => ipcRenderer.invoke('START_BUTTON_PRESS'),
    stopButtonPress: () => ipcRenderer.invoke('STOP_BUTTON_PRESS'),
    selectSource: (sourceId) => ipcRenderer.send('select-source', sourceId),
    fpsUpdate: (fpsValue) => ipcRenderer.send('fps-update', fpsValue),
    inputLangUpdate: (lang) => ipcRenderer.send('input-lang-update', lang),
    outputLangUpdate: (lang) => ipcRenderer.send('output-lang-update', lang),
    onFlickerScreenshotSwitchUpdate: (state) => ipcRenderer.send('flicker-screenshot-update', state),
    flickerDelayUpdate: (flickerDelayValue) => ipcRenderer.send('flicker-delay-update', flickerDelayValue),
});
