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
            'fbx-gltf-converter','open-file-dialog','open-glbfile-dialog','open-glbfile-mesh','prepare-download-directory','save-mesh-data','create-final-zip','save-octree-data','read-octree-file','extract-glb-files'     
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        // Whitelist channels for receiving messages from the main process
        let validChannels = [
            'fbx-conversion-success','gbl-file-content','gbl-file-value','gbl-file-mesh','download-directory-ready','mesh-save-progress','zip-complete','octree-file-data','glb-files-data'  
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes sender
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});

// const { contextBridge, ipcRenderer } = require('electron');
// const os = require('os');

// // Utility function for error handling
// const safeCallback = (callback) => {
//     return (...args) => {
//         try {
//             return callback(...args);
//         } catch (error) {
//             console.error('Error in IPC callback:', error);
//             return null;
//         }
//     };
// };

// // System information exposure
// contextBridge.exposeInMainWorld('electron', {
//     homeDir: () => {
//         try {
//             return os.homedir();
//         } catch (error) {
//             console.error('Error getting home directory:', error);
//             return null;
//         }
//     },
//     osVersion: () => {
//         try {
//             return os.arch();
//         } catch (error) {
//             console.error('Error getting OS version:', error);
//             return null;
//         }
//     },
//     onLayerDetails: (callback) => {
//         ipcRenderer.on('layer-details', (event, data) => safeCallback(callback)(data));
//     },
//     // Add GPU status checking
//     checkGPUStatus: () => {
//         try {
//             const canvas = document.createElement('canvas');
//             const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
//             return {
//                 webGLAvailable: !!gl,
//                 gpuVendor: gl ? gl.getParameter(gl.VENDOR) : null,
//                 gpuRenderer: gl ? gl.getParameter(gl.RENDERER) : null
//             };
//         } catch (error) {
//             console.error('Error checking GPU status:', error);
//             return {
//                 webGLAvailable: false,
//                 error: error.message
//             };
//         }
//     }
// });

// // Main IPC renderer exposure
// contextBridge.exposeInMainWorld('ipcRenderer', {
//     send: (channel, data) => {
//         try {
//             ipcRenderer.send(channel, data);
//         } catch (error) {
//             console.error(`Error sending message on channel ${channel}:`, error);
//         }
//     },
//     on: (channel, func) => {
//         ipcRenderer.on(channel, (event, ...args) => safeCallback(func)(event, ...args));
//     }
// });

// // API exposure with validated channels
// contextBridge.exposeInMainWorld('api', {
//     send: (channel, data) => {
//         const validChannels = [
//             'fbx-gltf-converter',
//             'open-file-dialog',
//             'open-glbfile-dialog',
//             'open-glbfile-mesh'
//         ];

//         if (validChannels.includes(channel)) {
//             try {
//                 ipcRenderer.send(channel, data);
//             } catch (error) {
//                 console.error(`Error sending message on channel ${channel}:`, error);
//                 throw new Error(`Failed to send message on channel ${channel}: ${error.message}`);
//             }
//         } else {
//             console.warn(`Invalid channel ${channel} requested`);
//         }
//     },
//     receive: (channel, func) => {
//         const validChannels = [
//             'fbx-conversion-success',
//             'gbl-file-content',
//             'gbl-file-value',
//             'gbl-file-mesh',
//             'gpu-process-crashed',  // New channel for GPU crash events
//             'webgl-status-update'   // New channel for WebGL status updates
//         ];

//         if (validChannels.includes(channel)) {
//             ipcRenderer.on(channel, (event, ...args) => {
//                 try {
//                     safeCallback(func)(...args);
//                 } catch (error) {
//                     console.error(`Error in receiver for channel ${channel}:`, error);
//                 }
//             });
//         }
//     },
//     // Add methods for GPU-related functionality
//     checkWebGLStatus: () => {
//         return new Promise((resolve) => {
//             try {
//                 const canvas = document.createElement('canvas');
//                 const gl = canvas.getContext('webgl2') ||
//                     canvas.getContext('webgl') ||
//                     canvas.getContext('experimental-webgl');

//                 if (!gl) {
//                     resolve({ available: false, reason: 'WebGL not supported' });
//                     return;
//                 }

//                 const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
//                 resolve({
//                     available: true,
//                     vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
//                     renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
//                     version: gl.getParameter(gl.VERSION)
//                 });
//             } catch (error) {
//                 resolve({ available: false, reason: error.message });
//             }
//         });
//     },
//     handleGPUCrash: (callback) => {
//         ipcRenderer.on('gpu-process-crashed', (event, details) => {
//             safeCallback(callback)(details);
//         });
//     },
//     // Method to monitor GPU memory usage
//     monitorGPUMemory: async () => {
//         try {
//             const canvas = document.createElement('canvas');
//             const gl = canvas.getContext('webgl2');
//             if (!gl) return null;

//             const ext = gl.getExtension('WEBGL_debug_renderer_info');
//             if (!ext) return null;

//             // Get approximate GPU memory usage
//             const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
//             return {
//                 vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
//                 renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
//             };
//         } catch (error) {
//             console.error('Error monitoring GPU memory:', error);
//             return null;
//         }
//     }
// });
