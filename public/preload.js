const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('electron', {
    homeDir: () => os.homedir(),
    osVersion: () => os.arch(),
    onLayerDetails: (callback) => ipcRenderer.on('layer-details', (event, data) => callback(data))
});

contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) =>
        ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
});

contextBridge.exposeInMainWorld('api', {
    send: (channel, data) => {
        // Whitelist channels for sending messages to the main process
        let validChannels = [
            'fbx-gltf-converter','open-file-dialog','open-glbfile-dialog'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        // Whitelist channels for receiving messages from the main process
        let validChannels = [
            'fbx-conversion-success','gbl-file-content','gbl-file-value'
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes sender
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
