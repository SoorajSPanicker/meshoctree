const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const url = require('url');
const path = require('path');
const fsPromises = require('fs').promises;
const fs = require('fs');                   // For sync operations
const { execFile } = require('child_process');
const archiver = require('archiver');
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



    ipcMain.on('fbx-gltf-converter', async (event, files) => {
        const conversionResults = [];

        for (const file of files) {
            const filePath = file.path;
            const dirPath = path.dirname(filePath);
            // Get the parent directory of the input file's directory
            const parentDirPath = path.dirname(dirPath);
            const fileStem = path.basename(filePath, path.extname(filePath));


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



    ipcMain.on('open-glbfile-dialog', async (event) => {
        try {
            if (!glbFolderPath) {
                console.error('No GLB folder path available. Please convert FBX files first.');
                event.reply('gbl-file-value', null);
                return;
            }

            console.log('Scanning directory:', glbFolderPath);

            // Read all files in the directory
            const files = await fsPromises.readdir(glbFolderPath);
            console.log('Total files found:', files.length);

            // Get file stats for all files
            const filesWithStats = await Promise.all(files.map(async (file) => {
                const fullPath = path.join(glbFolderPath, file);
                const stats = await fsPromises.stat(fullPath);
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
    // ipcMain.on('prepare-download-directory', (event) => {
    //     try {
    //         // Create a directory outside the program directory
    //         const appDir = path.dirname(app.getPath('exe'));
    //         const downloadDir = path.join(appDir, '..', 'MergedMeshDownloads');

    //         // Create directory if it doesn't exist
    //         if (!fs.existsSync(downloadDir)) {
    //             fs.mkdirSync(downloadDir, { recursive: true });
    //         }

    //         event.reply('download-directory-ready', {
    //             success: true,
    //             path: downloadDir
    //         });
    //     } catch (error) {
    //         console.error('Error preparing download directory:', error);
    //         event.reply('download-directory-ready', {
    //             success: false,
    //             error: error.message
    //         });
    //     }
    // });

    // ipcMain.on('save-mesh-data', async (event, { fileName, meshName, data }) => {
    //     try {
    //         // Get the download directory path
    //         const appDir = path.dirname(app.getPath('exe'));
    //         const downloadDir = path.join(appDir, '..', 'MergedMeshDownloads');

    //         // Create a directory for this specific mesh
    //         const meshDir = path.join(downloadDir, meshName);
    //         if (!fs.existsSync(meshDir)) {
    //             fs.mkdirSync(meshDir, { recursive: true });
    //         }

    //         // Save the JSON file
    //         const jsonPath = path.join(meshDir, fileName);
    //         fs.writeFileSync(jsonPath, data);

    //         // Create a zip file
    //         const zipPath = path.join(downloadDir, `${meshName}.zip`);
    //         const output = fs.createWriteStream(zipPath);
    //         const archive = archiver('zip', {
    //             zlib: { level: 9 } // Maximum compression
    //         });

    //         output.on('close', () => {
    //             console.log(`${meshName}.zip created - ${archive.pointer()} total bytes`);
    //             event.reply('mesh-save-complete', {
    //                 success: true,
    //                 meshName: meshName,
    //                 zipPath: zipPath
    //             });

    //             // Clean up the temporary directory
    //             fs.rmSync(meshDir, { recursive: true, force: true });
    //         });

    //         archive.on('error', (err) => {
    //             throw err;
    //         });

    //         // Pipe archive data to the file
    //         archive.pipe(output);

    //         // Add the JSON file to the archive
    //         archive.file(jsonPath, { name: fileName });

    //         // Finalize the archive
    //         await archive.finalize();

    //     } catch (error) {
    //         console.error(`Error saving mesh ${meshName}:`, error);
    //         event.reply('mesh-save-complete', {
    //             success: false,
    //             meshName: meshName,
    //             error: error.message
    //         });
    //     }
    // });

    ipcMain.on('prepare-download-directory', (event) => {
        try {
            // Update base directory path
            const baseDir = path.join('D:', 'Poul Consult', 'huldraoctree', 'new version3');
            const downloadDir = path.join(baseDir, 'MergedMeshDownloads');
            const tempDir = path.join(downloadDir, 'temp_meshes');

            // Create directories if they don't exist
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            console.log('Download directory created at:', downloadDir);
            console.log('Temporary directory created at:', tempDir);

            event.reply('download-directory-ready', {
                success: true,
                downloadPath: downloadDir,
                tempPath: tempDir
            });
        } catch (error) {
            console.error('Error preparing directories:', error);
            event.reply('download-directory-ready', {
                success: false,
                error: error.message
            });
        }
    });

    // ipcMain.on('save-mesh-data', async (event, { fileName, meshName, glbData }) => {
    //     try {
    //         const baseDir = path.join('D:', 'Poul Consult', 'huldraoctree', 'new version2');
    //         const downloadDir = path.join(baseDir, 'MergedMeshDownloads');
    //         const tempDir = path.join(downloadDir, 'temp_meshes');

    //         // Save GLB file
    //         const glbPath = path.join(tempDir, `${meshName}.glb`);
    //         fs.writeFileSync(glbPath, Buffer.from(glbData));

    //         console.log(`Created GLB file: ${glbPath}`);

    //         event.reply('mesh-save-progress', {
    //             success: true,
    //             meshName: meshName,
    //             filePath: glbPath
    //         });

    //     } catch (error) {
    //         console.error(`Error saving mesh ${meshName}:`, error);
    //         event.reply('mesh-save-progress', {
    //             success: false,
    //             meshName: meshName,
    //             error: error.message
    //         });
    //     }
    // });

    ipcMain.on('save-mesh-data', async (event, { fileName, meshName, glbData }) => {
        try {
            const baseDir = path.join('D:', 'Poul Consult', 'huldraoctree', 'new version3');
            const downloadDir = path.join(baseDir, 'MergedMeshDownloads');
            const tempDir = path.join(downloadDir, 'temp_meshes');

            // Convert array back to Buffer
            const buffer = Buffer.from(glbData);

            // Save GLB file
            const glbPath = path.join(tempDir, `${meshName}.glb`);
            fs.writeFileSync(glbPath, buffer);

            console.log(`Created GLB file: ${glbPath}`);

            event.reply('mesh-save-progress', {
                success: true,
                meshName: meshName,
                filePath: glbPath
            });

        } catch (error) {
            console.error(`Error saving mesh ${meshName}:`, error);
            event.reply('mesh-save-progress', {
                success: false,
                meshName: meshName,
                error: error.message
            });
        }
    });

    ipcMain.on('create-final-zip', async (event) => {
        try {
            const baseDir = path.join('D:', 'Poul Consult', 'huldraoctree', 'new version3');
            const downloadDir = path.join(baseDir, 'MergedMeshDownloads');
            const tempDir = path.join(downloadDir, 'temp_meshes');

            // Create zip file with current timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const zipPath = path.join(baseDir, `merged_meshes_${timestamp}.zip`);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => {
                console.log(`Final zip created at ${zipPath} - ${archive.pointer()} total bytes`);

                // Clean up temp directories
                fs.rmSync(downloadDir, { recursive: true, force: true });

                event.reply('zip-complete', {
                    success: true,
                    zipPath: zipPath,
                    size: archive.pointer()
                });
            });

            archive.on('error', (err) => {
                throw err;
            });

            archive.pipe(output);
            archive.directory(tempDir, false);
            await archive.finalize();

        } catch (error) {
            console.error('Error creating final zip:', error);
            event.reply('zip-complete', {
                success: false,
                error: error.message
            });
        }
    });

    // Add this handler for octree data
    ipcMain.on('save-octree-data', (event, { fileName, data }) => {
        try {
            const downloadPath = 'D:\\Poul Consult\\huldraoctree\\new version3';
            const filePath = path.join(downloadPath, fileName);

            // Write the JSON file
            fs.writeFileSync(filePath, data);
            console.log(`Saved octree data to ${filePath}`);
        } catch (error) {
            console.error('Error saving octree data:', error);
        }
    });

    // // Modify your existing zip creation handler to include the JSON file
    // ipcMain.on('create-final-zip', async (event) => {
    //     const downloadPath = 'D:\\Poul Consult\\huldraoctree\\new version3';
    //     const zipFilePath = path.join(downloadPath, 'merged_meshes.zip');

    //     try {
    //         // Create zip file including both .glb files and octree JSON
    //         const zip = new JSZip();

    //         // Add all .glb files
    //         const files = fs.readdirSync(downloadPath);
    //         for (const file of files) {
    //             if (file.endsWith('.glb') || file === 'octree_structure.json') {
    //                 const filePath = path.join(downloadPath, file);
    //                 const fileData = fs.readFileSync(filePath);
    //                 zip.file(file, fileData);
    //             }
    //         }

    //         // Generate zip file
    //         const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    //         fs.writeFileSync(zipFilePath, zipContent);

    //         // Clean up individual files if needed
    //         for (const file of files) {
    //             if (file.endsWith('.glb')) {
    //                 fs.unlinkSync(path.join(downloadPath, file));
    //             }
    //         }

    //         event.reply('zip-complete', {
    //             success: true,
    //             zipPath: zipFilePath
    //         });
    //     } catch (error) {
    //         console.error('Error creating zip:', error);
    //         event.reply('zip-complete', {
    //             success: false,
    //             error: error.message
    //         });
    //     }
    // });

})



