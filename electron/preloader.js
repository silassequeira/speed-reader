const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the preloader process
contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),
    onDarkMode: (callback) => ipcRenderer.on('apply-dark-mode', callback),
});
