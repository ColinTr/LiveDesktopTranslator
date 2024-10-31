// https://www.electronjs.org/docs/latest/tutorial/ipc

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onInitializeState: (callback) => ipcRenderer.on('initialize-state', (event, data) => callback(data)),
    plotTranslation: (callback) => ipcRenderer.on('plot-translation', (_event, translation_to_plot) => callback(translation_to_plot)),

    startButtonPress: () => ipcRenderer.invoke('START_BUTTON_PRESS'),
    stopButtonPress: () => ipcRenderer.invoke('STOP_BUTTON_PRESS'),

    inputLangUpdate: (lang) => ipcRenderer.send('input-lang-update', lang),
    outputLangUpdate: (lang) => ipcRenderer.send('output-lang-update', lang),
    fpsUpdate: (fpsValue) => ipcRenderer.send('fps-update', fpsValue),
    onFlickerScreenshotSwitchUpdate: (state) => ipcRenderer.send('flicker-screenshot-update', state),
    flickerDelayUpdate: (flickerDelayValue) => ipcRenderer.send('flicker-delay-update', flickerDelayValue),
    confidenceThresholdUpdate: (confidenceThresholdValue) => ipcRenderer.send('confidence-threshold-update', confidenceThresholdValue),
    setFullscreen: (bool) => ipcRenderer.send('set-fullscreen-button', bool),
});
