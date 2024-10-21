const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs').promises;
const { execFile } = require('child_process');
let mainWindow;

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

    ipcMain.on('fbx-gltf-converter', async (event, files) => {
        const conversionResults = [];
    
        for (const file of files) {
            const filePath = file.path;
            const dirPath = path.dirname(filePath);
            const fileStem = path.basename(filePath, path.extname(filePath));
            const outputFilePath = path.resolve(dirPath, fileStem + '.glb');
    
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
                // If there's an error, we'll add a null result to maintain the order
                conversionResults.push(null);
            }
        }
    
        // Send all results back to the renderer process
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
})
