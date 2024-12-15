const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs').promises;
const { execFile } = require('child_process');
let mainWindow;
const glbFolderPath = 'C:\\Users\\srjsp\\Downloads\\allglbfiles';


function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Food order App',
        width: 1500,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.webContents.openDevTools();

    const startUrl = url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file',
    });
    mainWindow.loadURL(startUrl);

}
app.whenReady().then(() => {
    createMainWindow();

    // ipcMain.on('fbx-gltf-converter', async (event, files) => {
    //     const conversionResults = [];

    //     for (const file of files) {
    //         const filePath = file.path;
    //         const dirPath = path.dirname(filePath);
    //         const fileStem = path.basename(filePath, path.extname(filePath));
    //         const outputFilePath = path.resolve(dirPath, fileStem + '.glb');

    //         const execPath = path.resolve(__dirname, '..', 'public', 'converters', 'FbxExporter', 'FBX2glTF-windows-x64.exe');
    //         const execParams = ['--input', filePath, '--output', outputFilePath];

    //         try {
    //             await new Promise((resolve, reject) => {
    //                 execFile(execPath, execParams, (err) => {
    //                     if (err) {
    //                         console.error(`Error converting ${filePath}:`, err.message);
    //                         reject(err);
    //                     } else {
    //                         console.log(`Converted: ${outputFilePath}`);
    //                         const convertedFileName = path.basename(outputFilePath);
    //                         conversionResults.push({
    //                             convertedFilePath: outputFilePath,
    //                             convertedFileName: convertedFileName
    //                         });
    //                         resolve();
    //                     }
    //                 });
    //             });
    //         } catch (err) {
    //             // If there's an error, we'll add a null result to maintain the order
    //             conversionResults.push(null);
    //         }
    //     }

    //     // Send all results back to the renderer process
    //     event.sender.send('fbx-conversion-success', conversionResults);
    // });

    ipcMain.on('fbx-gltf-converter', async (event, files) => {
        const conversionResults = [];

        for (const file of files) {
            const filePath = file.path;
            const dirPath = path.dirname(filePath);
            // Get the parent directory of the input file's directory
            const parentDirPath = path.dirname(dirPath);
            const fileStem = path.basename(filePath, path.extname(filePath));

            // // Create 'allglbfiles' directory in the parent directory
            // glbFolderPath = path.join(parentDirPath, 'allglbfiles');
            // try {
            //     await fs.promises.mkdir(glbFolderPath, { recursive: true });
            //     console.log(`Directory created or already exists at: ${glbFolderPath}`);
            // } catch (err) {
            //     console.error('Error creating directory:', err);
            // }

            // Use the new directory path for output
            const outputFilePath = path.resolve(glbFolderPath, fileStem + '.glb');

            const execPath = path.resolve(__dirname, '..', 'public', 'converters', 'FbxExporter', 'FBX2glTF-windows-x64.exe');
            const execParams = ['--input', filePath, '--output', outputFilePath];

            try {
                await new Promise((resolve, reject) => {
                    execFile(execPath, execParams, (err) => {
                        if (err) {
                            console.error(`Error converting ${filePath}:`, err.message);
                            reject(err);
                        } else {
                            console.log(`Converted: ${outputFilePath}`);
                            const convertedFileName = path.basename(outputFilePath);
                            conversionResults.push({
                                convertedFilePath: outputFilePath,
                                convertedFileName: convertedFileName
                            });
                            resolve();
                        }
                    });
                });
            } catch (err) {
                conversionResults.push(null);
            }
        }

        event.sender.send('fbx-conversion-success', conversionResults);
    });

    ipcMain.on('open-file-dialog', async (event) => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [{ name: 'Supported Files', extensions: ['html', 'htm', 'fbx'] }]
            });

            console.log(result);

            if (!result.canceled && result.filePaths.length > 0) {
                const fileInfoArray = result.filePaths.map(fullPath => ({
                    path: fullPath,
                    name: path.basename(fullPath)
                }));

                event.reply('gbl-file-content', fileInfoArray);
            } else {
                event.reply('gbl-file-content', null);
            }
        } catch (err) {
            console.error('Error in open-file-dialog:', err);
            event.reply('gbl-file-content', null);
        }
    });

    // ipcMain.on('open-glbfile-dialog', async (event) => {
    //     // try {
    //     //     const result = await dialog.showOpenDialog({
    //     //         properties: ['openFile', 'multiSelections'],
    //     //         filters: [{ name: 'Supported Files', extensions: ['html', 'htm', 'glb'] }]
    //     //     });

    //     //     console.log(result);

    //     //     if (!result.canceled && result.filePaths.length > 0) {
    //     //         const fileInfoArray = result.filePaths.map(fullPath => ({
    //     //             filePath: fullPath,
    //     //             convertedFileName: path.basename(fullPath)
    //     //         }));

    //     //         event.reply('gbl-file-value', fileInfoArray);
    //     //     } else {
    //     //         event.reply('gbl-file-value', null);
    //     //     }
    //     // } catch (err) {
    //     //     console.error('Error in open-file-dialog:', err);
    //     //     event.reply('gbl-file-value', null);
    //     // }

    //     try {
    //         if (!glbFolderPath) {
    //             console.error('No GLB folder path available. Please convert FBX files first.');
    //             event.reply('gbl-file-value', null);
    //             return;
    //         }

    //         console.log('Scanning directory:', glbFolderPath);



    //         // Read all files in the directory
    //         const files = await fs.readdir(glbFolderPath);
    //         console.log(files);

    //         // Create file info array with full paths
    //         const fileInfoArray = await Promise.all(files.map(async (file) => {
    //             const fullPath = path.join(glbFolderPath, file);
    //             const stats = await fs.stat(fullPath);

    //             return {
    //                 convertedFilePath: fullPath,
    //                 convertedFileName: file
    //                 // ,
    //                 // isDirectory: stats.isDirectory(),
    //                 // size: stats.size,
    //                 // modifiedDate: stats.mtime
    //             };
    //         }));
    //         // console.log(fileInfoArray);


    //         // Send the file information back to the renderer
    //         event.reply('gbl-file-value', fileInfoArray);
    //     } catch (err) {
    //         console.error('Error scanning folder:', err);
    //         event.reply('gbl-file-value', null);
    //     }
    // });

    ipcMain.on('open-glbfile-dialog', async (event) => {
        try {
            if (!glbFolderPath) {
                console.error('No GLB folder path available. Please convert FBX files first.');
                event.reply('gbl-file-value', null);
                return;
            }

            console.log('Scanning directory:', glbFolderPath);

            // Read all files in the directory
            const files = await fs.readdir(glbFolderPath);
            console.log('Total files found:', files.length);

            // Get file stats for all files
            const filesWithStats = await Promise.all(files.map(async (file) => {
                const fullPath = path.join(glbFolderPath, file);
                const stats = await fs.stat(fullPath);
                return {
                    convertedFilePath: fullPath,
                    convertedFileName: file,
                    size: stats.size // size in bytes
                };
            }));

            // Create batches based on size limit (150MB = 150 * 1024 * 1024 bytes)
            const SIZE_LIMIT = 150 * 1024 * 1024; // 150MB in bytes
            const batches = [];
            let currentBatch = [];
            let currentBatchSize = 0;

            for (const fileInfo of filesWithStats) {
                if (currentBatchSize + fileInfo.size > SIZE_LIMIT) {
                    // Current batch would exceed limit, start a new batch
                    if (currentBatch.length > 0) {
                        batches.push(currentBatch);
                    }
                    currentBatch = [];
                    currentBatchSize = 0;
                }

                // Add file to current batch
                currentBatch.push({
                    convertedFilePath: fileInfo.convertedFilePath,
                    convertedFileName: fileInfo.convertedFileName
                });
                currentBatchSize += fileInfo.size;
            }

            // Add the last batch if it's not empty
            if (currentBatch.length > 0) {
                batches.push(currentBatch);
            }

            console.log(`Created ${batches.length} batches of files`);
            batches.forEach((batch, index) => {
                console.log(`Batch ${index + 1} contains ${batch.length} files`);
            });

            // Send the batched file information back to the renderer
            event.reply('gbl-file-value', batches);

        } catch (err) {
            console.error('Error scanning folder:', err);
            event.reply('gbl-file-value', null);
        }
    });

    ipcMain.on('open-glbfile-mesh', async (event) => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [{ name: 'Supported Files', extensions: ['html', 'htm', 'glb'] }]
            });

            console.log(result);

            if (!result.canceled && result.filePaths.length > 0) {
                const fileInfoArray = result.filePaths.map(fullPath => ({
                    convertedFilePath: fullPath,
                    convertedFileName: path.basename(fullPath)
                }));

                event.reply('gbl-file-mesh', fileInfoArray);
            } else {
                event.reply('gbl-file-mesh', null);
            }
        } catch (err) {
            console.error('Error in open-file-dialog:', err);
            event.reply('gbl-file-mesh', null);
        }
    });
})



// const { app, BrowserWindow, dialog, ipcMain } = require('electron');
// const url = require('url');
// const path = require('path');
// const fs = require('fs').promises;
// const { execFile } = require('child_process');

// let mainWindow;
// const glbFolderPath = 'C:\\Users\\srjsp\\Downloads\\allglbfiles';

// // Add GPU-related command line switches
// app.commandLine.appendSwitch('disable-gpu-sandbox');
// app.commandLine.appendSwitch('ignore-gpu-blacklist');
// app.commandLine.appendSwitch('enable-gpu-rasterization');
// app.commandLine.appendSwitch('enable-zero-copy');

// function createMainWindow() {
//     mainWindow = new BrowserWindow({
//         title: 'Food order App',
//         width: 1500,
//         height: 800,
//         webPreferences: {
//             contextIsolation: true,
//             nodeIntegration: true,
//             preload: path.join(__dirname, 'preload.js'),
//             // Add GPU-related settings
//             offscreen: false,
//             backgroundThrottling: false
//         },
//     });

//     // Add GPU process crash handling
//     mainWindow.webContents.on('gpu-process-crashed', (event, killed) => {
//         console.error('GPU process crashed', { killed });
//         dialog.showErrorBox('GPU Error', 'GPU process crashed. The application will attempt to recover.');
//         mainWindow.reload();
//     });

//     mainWindow.webContents.openDevTools();

//     const startUrl = url.format({
//         pathname: path.join(__dirname, '../build/index.html'),
//         protocol: 'file',
//     });
//     mainWindow.loadURL(startUrl);
// }

// async function checkWebGLAvailability() {
//     try {
//         const result = await mainWindow.webContents.executeJavaScript(`
//             try {
//                 const canvas = document.createElement('canvas');
//                 const gl = canvas.getContext('webgl2') ||
//                           canvas.getContext('webgl') ||
//                           canvas.getContext('experimental-webgl');
//                 return gl ? true : false;
//             } catch (e) {
//                 return false;
//             }
//         `);
//         return result;
//     } catch (error) {
//         console.error('Error checking WebGL availability:', error);
//         return false;
//     }
// }

// app.whenReady().then(async () => {
//     // Check GPU features before creating window
//     const gpuFeatures = await app.getGPUFeatureStatus();
//     console.log('GPU Features Status:', gpuFeatures);

//     createMainWindow();

//     // FBX to GLTF converter handler
//     ipcMain.on('fbx-gltf-converter', async (event, files) => {
//         const conversionResults = [];

//         for (const file of files) {
//             const filePath = file.path;
//             const dirPath = path.dirname(filePath);
//             const parentDirPath = path.dirname(dirPath);
//             const fileStem = path.basename(filePath, path.extname(filePath));
//             const outputFilePath = path.resolve(glbFolderPath, fileStem + '.glb');

//             const execPath = path.resolve(__dirname, '..', 'public', 'converters', 'FbxExporter', 'FBX2glTF-windows-x64.exe');
//             const execParams = ['--input', filePath, '--output', outputFilePath];

//             try {
//                 await new Promise((resolve, reject) => {
//                     execFile(execPath, execParams, (err) => {
//                         if (err) {
//                             console.error(`Error converting ${filePath}:`, err.message);
//                             reject(err);
//                         } else {
//                             console.log(`Converted: ${outputFilePath}`);
//                             const convertedFileName = path.basename(outputFilePath);
//                             conversionResults.push({
//                                 convertedFilePath: outputFilePath,
//                                 convertedFileName: convertedFileName
//                             });
//                             resolve();
//                         }
//                     });
//                 });
//             } catch (err) {
//                 conversionResults.push(null);
//             }
//         }

//         event.sender.send('fbx-conversion-success', conversionResults);
//     });

//     // Open file dialog handler
//     ipcMain.on('open-file-dialog', async (event) => {
//         try {
//             const result = await dialog.showOpenDialog({
//                 properties: ['openFile', 'multiSelections'],
//                 filters: [{ name: 'Supported Files', extensions: ['html', 'htm', 'fbx'] }]
//             });

//             if (!result.canceled && result.filePaths.length > 0) {
//                 const fileInfoArray = result.filePaths.map(fullPath => ({
//                     path: fullPath,
//                     name: path.basename(fullPath)
//                 }));

//                 event.reply('gbl-file-content', fileInfoArray);
//             } else {
//                 event.reply('gbl-file-content', null);
//             }
//         } catch (err) {
//             console.error('Error in open-file-dialog:', err);
//             event.reply('gbl-file-content', null);
//         }
//     });

//     // GLB file dialog handler with GPU checks
//     ipcMain.on('open-glbfile-dialog', async (event) => {
//         try {
//             // Check WebGL availability
//             const hasWebGL = await checkWebGLAvailability();
//             if (!hasWebGL) {
//                 console.error('WebGL not available');
//                 event.reply('gbl-file-value', { error: 'WebGL not available' });
//                 return;
//             }

//             if (!glbFolderPath) {
//                 console.error('No GLB folder path available. Please convert FBX files first.');
//                 event.reply('gbl-file-value', null);
//                 return;
//             }

//             console.log('Scanning directory:', glbFolderPath);

//             const files = await fs.readdir(glbFolderPath);
//             console.log('Total files found:', files.length);

//             const filesWithStats = await Promise.all(files.map(async (file) => {
//                 const fullPath = path.join(glbFolderPath, file);
//                 const stats = await fs.stat(fullPath);
//                 return {
//                     convertedFilePath: fullPath,
//                     convertedFileName: file,
//                     size: stats.size
//                 };
//             }));

//             const SIZE_LIMIT = 50 * 1024 * 1024; // 20MB batch size
//             const batches = [];
//             let currentBatch = [];
//             let currentBatchSize = 0;

//             for (const fileInfo of filesWithStats) {
//                 if (currentBatchSize + fileInfo.size > SIZE_LIMIT) {
//                     if (currentBatch.length > 0) {
//                         batches.push(currentBatch);
//                     }
//                     currentBatch = [];
//                     currentBatchSize = 0;
//                 }

//                 currentBatch.push({
//                     convertedFilePath: fileInfo.convertedFilePath,
//                     convertedFileName: fileInfo.convertedFileName
//                 });
//                 currentBatchSize += fileInfo.size;
//             }

//             if (currentBatch.length > 0) {
//                 batches.push(currentBatch);
//             }

//             console.log(`Created ${batches.length} batches of files`);
//             batches.forEach((batch, index) => {
//                 console.log(`Batch ${index + 1} contains ${batch.length} files`);
//             });

//             event.reply('gbl-file-value', batches);

//         } catch (err) {
//             console.error('Error scanning folder:', err);
//             event.reply('gbl-file-value', null);
//         }
//     });

//     // GLB mesh handler
//     ipcMain.on('open-glbfile-mesh', async (event) => {
//         try {
//             const hasWebGL = await checkWebGLAvailability();
//             if (!hasWebGL) {
//                 console.error('WebGL not available');
//                 event.reply('gbl-file-mesh', { error: 'WebGL not available' });
//                 return;
//             }

//             const result = await dialog.showOpenDialog({
//                 properties: ['openFile', 'multiSelections'],
//                 filters: [{ name: 'Supported Files', extensions: ['html', 'htm', 'glb'] }]
//             });

//             if (!result.canceled && result.filePaths.length > 0) {
//                 const fileInfoArray = result.filePaths.map(fullPath => ({
//                     convertedFilePath: fullPath,
//                     convertedFileName: path.basename(fullPath)
//                 }));

//                 event.reply('gbl-file-mesh', fileInfoArray);
//             } else {
//                 event.reply('gbl-file-mesh', null);
//             }
//         } catch (err) {
//             console.error('Error in open-file-dialog:', err);
//             event.reply('gbl-file-mesh', null);
//         }
//     });
// });

// // Handle app activation
// app.on('window-all-closed', () => {
//     if (process.platform !== 'darwin') {
//         app.quit();
//     }
// });

// app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//         createMainWindow();
//     }
// });