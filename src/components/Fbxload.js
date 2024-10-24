// import React, { useEffect, useRef, useState } from 'react';
// import { calculateBoundingBoxes, createBoundingBoxMesh } from './Bbload';  // Import createBoundingBoxMesh
// import { createCustomOctree, visualizeCustomOctree, initializeScene } from './Octreecreation';
// import * as BABYLON from '@babylonjs/core';

// function Fbxload() {
//     const [selectedFiles, setSelectedFiles] = useState([]);
//     const [conversionResults, setConversionResults] = useState([]);
//     const [boundingBoxes, setBoundingBoxes] = useState([]);
//     const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
//     const canvasRef = useRef(null);
//     const sceneRef = useRef(null);

//     const handleFileSelect = () => {
//         window.api.send('open-file-dialog');
//     };

//     useEffect(() => {
//         let scene;
//         if (canvasRef.current && !sceneRef.current) {
//             const { scene: newScene, engine } = initializeScene(canvasRef.current);
//             sceneRef.current = newScene;
//             scene = newScene;

//             // Add camera control for easier navigation
//             const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
//             camera.setPosition(new BABYLON.Vector3(0, 5, -10));
//             camera.attachControl(canvasRef.current, true);
//         }

//         window.api.receive('gbl-file-content', (fileInfoArray) => {
//             if (fileInfoArray && fileInfoArray.length > 0) {
//                 console.log('Selected files:', fileInfoArray);
//                 window.api.send('fbx-gltf-converter', fileInfoArray);
//             } else {
//                 console.log('No files selected');
//             }
//         });

//         window.api.receive('fbx-conversion-success', async (results) => {
//             console.log('Conversion results:', results);
//             setConversionResults(results);
//             try {
//                 const { individualResults, cumulativeBoundingBox } = await calculateBoundingBoxes(results, canvasRef.current);
//                 console.log('Individual results:', individualResults);
//                 console.log('Cumulative bounding box:', cumulativeBoundingBox);
        
//                 setBoundingBoxes(individualResults);
//                 setCumulativeBoundingBox(cumulativeBoundingBox);
        
//                 if (!cumulativeBoundingBox || !cumulativeBoundingBox.min || !cumulativeBoundingBox.max) {
//                     console.error('Invalid cumulative bounding box:', cumulativeBoundingBox);
//                     return;
//                 }
        
//                 const size = {
//                     x: cumulativeBoundingBox.max.x - cumulativeBoundingBox.min.x,
//                     y: cumulativeBoundingBox.max.y - cumulativeBoundingBox.min.y,
//                     z: cumulativeBoundingBox.max.z - cumulativeBoundingBox.min.z
//                 };
//                 const center = {
//                     x: (cumulativeBoundingBox.max.x + cumulativeBoundingBox.min.x) / 2,
//                     y: (cumulativeBoundingBox.max.y + cumulativeBoundingBox.min.y) / 2,
//                     z: (cumulativeBoundingBox.max.z + cumulativeBoundingBox.min.z) / 2
//                 };
        
//                 if (scene) {
//                     try {
//                         const customOctree = createCustomOctree(scene, size, center);
                        
//                         individualResults.forEach(fileResult => {
//                             if (!fileResult.error) {
//                                 fileResult.boundingBoxes.forEach(boxData => {
//                                     // Create bounding box mesh using the imported function
//                                     const boundingBoxMesh = createBoundingBoxMesh(boxData.originalMesh, scene);
                                    
//                                     // Insert original mesh
//                                     console.log("Inserting original mesh into octree:", boxData.originalMesh.name);
//                                     customOctree.insertMesh(customOctree.root, boxData.originalMesh, 0);
                                    
//                                     // Insert bounding box mesh
//                                     console.log("Inserting bounding box mesh into octree:", boundingBoxMesh.name);
//                                     customOctree.insertMesh(customOctree.root, boundingBoxMesh, 0);
//                                 });
//                             }
//                         });
    
//                         // Merge bounding boxes in each node
//                         customOctree.mergeBoundingBoxesInAllNodes(scene);
    
//                         // Print octree contents after insertion and merging
//                         console.log("\nFinal Octree Structure with Merged Meshes:");
//                         customOctree.printOctreeContents();
    
//                         visualizeCustomOctree(scene, customOctree);
//                         console.log("Custom octree created and visualized successfully");
//                     } catch (error) {
//                         console.error("Error in custom octree creation or visualization:", error);
//                     }
//                 } else {
//                     console.error("Scene is not initialized");
//                 }
        
//             } catch (error) {
//                 console.error("Error processing conversion results:", error);
//             }
//         });

//         return () => {
//             if (scene) {
//                 scene.dispose();
//             }
//         };
//     }, []);
//     return (
//         <div>
//             <button
//                 onClick={handleFileSelect}
//                 className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//                 Select FBX File
//             </button>
//             <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />

//             {cumulativeBoundingBox && (
//                 <div>
//                     <h2>Cumulative Bounding Box:</h2>
//                     <p>
//                         Min: ({cumulativeBoundingBox.min.x.toFixed(2)}, {cumulativeBoundingBox.min.y.toFixed(2)}, {cumulativeBoundingBox.min.z.toFixed(2)})
//                     </p>
//                     <p>
//                         Max: ({cumulativeBoundingBox.max.x.toFixed(2)}, {cumulativeBoundingBox.max.y.toFixed(2)}, {cumulativeBoundingBox.max.z.toFixed(2)})
//                     </p>
//                 </div>
//             )}
//             {boundingBoxes.length > 0 && (
//                 <div>
//                     <h2>Individual Bounding Boxes:</h2>
//                     {boundingBoxes.map((fileResult, index) => (
//                         <div key={index}>
//                             <h3>{fileResult.filePath}</h3>
//                             {fileResult.error ? (
//                                 <p>Error: {fileResult.error}</p>
//                             ) : (
//                                 <ul>
//                                     {fileResult.boundingBoxes.map((box, boxIndex) => (
//                                         <li key={boxIndex}>
//                                             {box.meshName}: Min ({box.min.x.toFixed(2)}, {box.min.y.toFixed(2)}, {box.min.z.toFixed(2)}),
//                                             Max ({box.max.x.toFixed(2)}, {box.max.y.toFixed(2)}, {box.max.z.toFixed(2)})
//                                         </li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default Fbxload;



// import { LoadFile } from 'babylonjs';
// import React, { useEffect, useRef, useState } from 'react'
// import GlbodifierComponent from './GlbodifierComponent';
// import {applyLODToFile} from './babylonLODFunctions'

// function Fbxload() {
//     // const [selectedFiles, setSelectedFiles] = useState([]);
//     // const fileInputRef = useRef(null);
//     const [conversionResults, setConversionResults] = useState([]);
//     const [lodResults, setLodResults] = useState([]);
//     const [errors, setErrors] = useState([]);
//     const [logs, setLogs] = useState([]);
//     // Choose FBX files
//     const handleFileSelect = () => {
//         window.api.send('open-file-dialog');
//     };

//     useEffect(() => {
//         window.api.receive('gbl-file-content', (fileInfoArray) => {
//             if (fileInfoArray && fileInfoArray.length > 0) {
//                 console.log('Selected files:', fileInfoArray);
//                 // Send the entire fileInfoArray to the main process
//                 window.api.send('fbx-gltf-converter', fileInfoArray);
//             } else {
//                 console.log('No files selected');
//             }
//         });
//     }, []);

//     window.api.receive('fbx-conversion-success', (results) => {
//         console.log('Conversion results:', results);
//         setConversionResults(results);
//         processLOD(results);
//         // Handle the results (e.g., update state, display to user)
//     });
//     // const processFiles = (selectedFiles) => {
//     //     // const updatedFiles = [...files, ...selectedFiles];
//     //     // // setFiles(updatedFiles);
//     //     // console.log(updatedFiles);
//     //     const filesWithPath = selectedFiles.map((file) => {
//     //         return { name: file.name, path: file.path };
//     //     });
//     //     console.log(filesWithPath);
//     // };

//     const processLOD = async (results) => {
//         for (const result of results) {
//             try {
//                 console.log(`Processing LOD for file: ${result.convertedFilePath}`);
//                 const lodResult = await applyLODToFile(result.convertedFilePath);
//                 if (lodResult) {
//                     setLodResults(prev => [...prev, {
//                         fileName: result.convertedFileName,
//                         ...lodResult
//                     }]);
//                     console.log(`LOD applied to ${result.convertedFileName}`);
//                 } else {
//                     setErrors(prev => [...prev, `Failed to apply LOD to ${result.convertedFileName}`]);
//                 }
//             } catch (error) {
//                 console.error(`Error processing LOD for ${result.convertedFileName}:`, error);
//                 setErrors(prev => [...prev, `Error processing LOD for ${result.convertedFileName}: ${error.message}`]);
//             }
//         }
//     };

//     return (
//         <div>
//             <button
//                 onClick={handleFileSelect}
//                 className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//                 Select fbx File
//             </button>

//             {/* <GlbodifierComponent conversionResults={conversionResults}></GlbodifierComponent> */}
//             {errors.length > 0 && (
//                 <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
//                     <h2 className="text-xl font-bold mb-2 text-red-700">Errors:</h2>
//                     {errors.map((error, index) => (
//                         <p key={index} className="text-red-600">{error}</p>
//                     ))}
//                 </div>
//             )}

// {lodResults.length > 0 && (
//     <div className="mt-4">
//         <h2 className="text-xl font-bold mb-2">LOD Results:</h2>
//         {lodResults.map((result, index) => (
//             <div key={index} className="mb-4 p-4 border rounded">
//                 <h3 className="font-semibold">{result.fileName}</h3>
//                 <p>Original Number of Meshes: {result.originalMeshCount}</p>
//                 <p>Original - Total Vertices: {result.originalVertices}, Total Faces: {result.originalFaces}</p>
//                 <p>Simplified - Vertices: {result.simplifiedVertices}, Faces: {result.simplifiedFaces}</p>
//                 <p>Reduction - Vertices: {result.vertexReduction}%, Faces: {result.faceReduction}%</p>
//             </div>
//         ))}
//     </div>
// )}
//         </div>
//     )
// }

// export default Fbxload





// import React, { useEffect, useRef, useState } from 'react';
// import { calculateBoundingBoxes } from './Bbload';
// import { createCustomOctree, visualizeCustomOctree, initializeScene } from './Octreecreation';
// import * as BABYLON from '@babylonjs/core';

// function Fbxload() {
//     const [selectedFiles, setSelectedFiles] = useState([]);
//     const [conversionResults, setConversionResults] = useState([]);
//     const [boundingBoxes, setBoundingBoxes] = useState([]);
//     const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
//     const canvasRef = useRef(null);
//     const sceneRef = useRef(null);
//     const [loadedMeshes, setLoadedMeshes] = useState([]);

//     const handleFileSelect = () => {
//         window.api.send('open-file-dialog');
//     };

//     useEffect(() => {
//         let scene;
//         if (canvasRef.current && !sceneRef.current) {
//             const { scene: newScene, engine } = initializeScene(canvasRef.current);
//             sceneRef.current = newScene;
//             scene = newScene;

//             // Add camera control for easier navigation
//             const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
//             camera.setPosition(new BABYLON.Vector3(0, 5, -10));
//             camera.attachControl(canvasRef.current, true);
//         }

//         window.api.receive('gbl-file-content', (fileInfoArray) => {
//             if (fileInfoArray && fileInfoArray.length > 0) {
//                 console.log('Selected files:', fileInfoArray);
//                 window.api.send('fbx-gltf-converter', fileInfoArray);
//             } else {
//                 console.log('No files selected');
//             }
//         });

//         window.api.receive('fbx-conversion-success', async (results) => {
//             console.log('Conversion results:', results);
//             setConversionResults(results);
//             try {
//                 const { individualResults, cumulativeBoundingBox, meshes } = await calculateBoundingBoxes(results, canvasRef.current);
//                 console.log('Individual results:', individualResults);
//                 console.log('Cumulative bounding box:', cumulativeBoundingBox);
//                 console.log('Loaded meshes:', meshes);

//                 setBoundingBoxes(individualResults);
//                 setCumulativeBoundingBox(cumulativeBoundingBox);
//                 setLoadedMeshes(meshes);

//                 if (!cumulativeBoundingBox || !cumulativeBoundingBox.min || !cumulativeBoundingBox.max) {
//                     console.error('Invalid cumulative bounding box:', cumulativeBoundingBox);
//                     return;
//                 }

//                 const size = {
//                     x: cumulativeBoundingBox.max.x - cumulativeBoundingBox.min.x,
//                     y: cumulativeBoundingBox.max.y - cumulativeBoundingBox.min.y,
//                     z: cumulativeBoundingBox.max.z - cumulativeBoundingBox.min.z
//                 };
//                 const center = {
//                     x: (cumulativeBoundingBox.max.x + cumulativeBoundingBox.min.x) / 2,
//                     y: (cumulativeBoundingBox.max.y + cumulativeBoundingBox.min.y) / 2,
//                     z: (cumulativeBoundingBox.max.z + cumulativeBoundingBox.min.z) / 2
//                 };

//                 console.log("Calculated size:", size);
//                 console.log("Calculated center:", center);

//                 if (scene) {
//                     try {
//                         const customOctree = createCustomOctree(scene, size, center, meshes);
//                         console.log("Custom octree creation result:", customOctree);
//                         visualizeCustomOctree(scene, customOctree);
//                         console.log("Custom octree created and visualized successfully");

//                         // Add meshes to the scene
//                         meshes.forEach(mesh => {
//                             mesh.setParent(null);
//                             scene.addMesh(mesh);
//                         });
//                     } catch (error) {
//                         console.error("Error in custom octree creation or visualization:", error);
//                     }
//                 } else {
//                     console.error("Scene is not initialized");
//                 }

//             } catch (error) {
//                 console.error("Error processing conversion results:", error);
//             }
//         });

//         return () => {
//             if (scene) {
//                 scene.dispose();
//             }
//         };
//     }, []);
//     return (
//         <div>
//             <button
//                 onClick={handleFileSelect}
//                 className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//                 Select FBX File
//             </button>
//             <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />

//             {cumulativeBoundingBox && (
//                 <div>
//                     <h2>Cumulative Bounding Box:</h2>
//                     <p>
//                         Min: ({cumulativeBoundingBox.min.x.toFixed(2)}, {cumulativeBoundingBox.min.y.toFixed(2)}, {cumulativeBoundingBox.min.z.toFixed(2)})
//                     </p>
//                     <p>
//                         Max: ({cumulativeBoundingBox.max.x.toFixed(2)}, {cumulativeBoundingBox.max.y.toFixed(2)}, {cumulativeBoundingBox.max.z.toFixed(2)})
//                     </p>
//                 </div>
//             )}
//             {boundingBoxes.length > 0 && (
//                 <div>
//                     <h2>Individual Bounding Boxes:</h2>
//                     {boundingBoxes.map((fileResult, index) => (
//                         <div key={index}>
//                             <h3>{fileResult.filePath}</h3>
//                             {fileResult.error ? (
//                                 <p>Error: {fileResult.error}</p>
//                             ) : (
//                                 <ul>
//                                     {fileResult.boundingBoxes.map((box, boxIndex) => (
//                                         <li key={boxIndex}>
//                                             {box.meshName}: Min ({box.min.x.toFixed(2)}, {box.min.y.toFixed(2)}, {box.min.z.toFixed(2)}),
//                                             Max ({box.max.x.toFixed(2)}, {box.max.y.toFixed(2)}, {box.max.z.toFixed(2)})
//                                         </li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default Fbxload;

// import React, { useEffect, useRef, useState } from 'react';
// import { calculateBoundingBoxes } from './Bbload';
// import { createCustomOctree, visualizeCustomOctree,initializeScene } from './Octreecreation';
// import * as BABYLON from '@babylonjs/core';
// function Fbxload() {
//     const [selectedFiles, setSelectedFiles] = useState([]);
//     const [conversionResults, setConversionResults] = useState([]);
//     const [boundingBoxes, setBoundingBoxes] = useState([]);
//     const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
//     const canvasRef = useRef(null);
//     const sceneRef = useRef(null);
//     const handleFileSelect = () => {
//         window.api.send('open-file-dialog');
//     };
//     useEffect(() => {
//         let scene;
//         if (canvasRef.current && !sceneRef.current) {
//             const { scene: newScene, engine } = initializeScene(canvasRef.current);
//             sceneRef.current = newScene;
//             scene = newScene;
//             // Add camera control for easier navigation
//             const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
//             camera.setPosition(new BABYLON.Vector3(0, 5, -10));
//             camera.attachControl(canvasRef.current, true);
//         }
//         window.api.receive('gbl-file-content', (fileInfoArray) => {
//             if (fileInfoArray && fileInfoArray.length > 0) {
//                 console.log('Selected files:', fileInfoArray);
//                 window.api.send('fbx-gltf-converter', fileInfoArray);
//             } else {
//                 console.log('No files selected');
//             }
//         });
//         window.api.receive('fbx-conversion-success', async (results) => {
//             console.log('Conversion results:', results);
//             setConversionResults(results);
//             try {
//                 const { individualResults, cumulativeBoundingBox } = await calculateBoundingBoxes(results, canvasRef.current);
//                 console.log('Individual results:', individualResults);
//                 console.log('Cumulative bounding box:', cumulativeBoundingBox);
        
//                 setBoundingBoxes(individualResults);
//                 setCumulativeBoundingBox(cumulativeBoundingBox);
        
//                 if (!cumulativeBoundingBox || !cumulativeBoundingBox.min || !cumulativeBoundingBox.max) {
//                     console.error('Invalid cumulative bounding box:', cumulativeBoundingBox);
//                     return;
//                 }
        
//                 const size = {
//                     x: cumulativeBoundingBox.max.x - cumulativeBoundingBox.min.x,
//                     y: cumulativeBoundingBox.max.y - cumulativeBoundingBox.min.y,
//                     z: cumulativeBoundingBox.max.z - cumulativeBoundingBox.min.z
//                 };
//                 const center = {
//                     x: (cumulativeBoundingBox.max.x + cumulativeBoundingBox.min.x) / 2,
//                     y: (cumulativeBoundingBox.max.y + cumulativeBoundingBox.min.y) / 2,
//                     z: (cumulativeBoundingBox.max.z + cumulativeBoundingBox.min.z) / 2
//                 };
        
//                 if (scene) {
//                     try {
//                         const customOctree = createCustomOctree(scene, size, center);
                        
//                         // Insert both original meshes and bounding box meshes into octree
//                         individualResults.forEach(fileResult => {
//                             if (!fileResult.error) {
//                                 fileResult.boundingBoxes.forEach(boxData => {
//                                     // Insert original mesh
//                                     customOctree.insertMesh(customOctree.root, boxData.originalMesh, 0);
                                    
//                                     // Insert bounding box mesh
//                                     customOctree.insertMesh(customOctree.root, boxData.boundingBoxMesh, 0);
//                                 });
//                             }
//                         });
//                         customOctree.printOctreeContents();
//                         visualizeCustomOctree(scene, customOctree);
//                         console.log("Custom octree created and visualized successfully");
//                     } catch (error) {
//                         console.error("Error in custom octree creation or visualization:", error);
//                     }
//                 } else {
//                     console.error("Scene is not initialized");
//                 }
        
//             } catch (error) {
//                 console.error("Error processing conversion results:", error);
//             }
//         });
//         return () => {
//             if (scene) {
//                 scene.dispose();
//             }
//         };
//     }, []);
//     return (
//         <div>
//             <button
//                 onClick={handleFileSelect}
//                 className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//                 Select FBX File
//             </button>
//             <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />
//             {cumulativeBoundingBox && (
//                 <div>
//                     <h2>Cumulative Bounding Box:</h2>
//                     <p>
//                         Min: ({cumulativeBoundingBox.min.x.toFixed(2)}, {cumulativeBoundingBox.min.y.toFixed(2)}, {cumulativeBoundingBox.min.z.toFixed(2)})
//                     </p>
//                     <p>
//                         Max: ({cumulativeBoundingBox.max.x.toFixed(2)}, {cumulativeBoundingBox.max.y.toFixed(2)}, {cumulativeBoundingBox.max.z.toFixed(2)})
//                     </p>
//                 </div>
//             )}
//             {boundingBoxes.length > 0 && (
//                 <div>
//                     <h2>Individual Bounding Boxes:</h2>
//                     {boundingBoxes.map((fileResult, index) => (
//                         <div key={index}>
//                             <h3>{fileResult.filePath}</h3>
//                             {fileResult.error ? (
//                                 <p>Error: {fileResult.error}</p>
//                             ) : (
//                                 <ul>
//                                     {fileResult.boundingBoxes.map((box, boxIndex) => (
//                                         <li key={boxIndex}>
//                                             {box.meshName}: Min ({box.min.x.toFixed(2)}, {box.min.y.toFixed(2)}, {box.min.z.toFixed(2)}),
//                                             Max ({box.max.x.toFixed(2)}, {box.max.y.toFixed(2)}, {box.max.z.toFixed(2)})
//                                         </li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }
// export default Fbxload;

import React, { useEffect, useRef, useState } from 'react';
import { calculateBoundingBoxes, createBoundingBoxMesh } from './Bbload';
import { createCustomOctree, visualizeCustomOctree,initializeScene } from './Octreecreation';
import * as BABYLON from '@babylonjs/core';
function Fbxload() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [conversionResults, setConversionResults] = useState([]);
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);
    const handleFileSelect = () => {
        window.api.send('open-file-dialog');
    };
    useEffect(() => {
        let scene;
        if (canvasRef.current && !sceneRef.current) {
            const { scene: newScene, engine } = initializeScene(canvasRef.current);
            sceneRef.current = newScene;
            scene = newScene;
            // Add camera control for easier navigation
            const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
            camera.setPosition(new BABYLON.Vector3(0, 5, -10));
            camera.attachControl(canvasRef.current, true);
        }
        window.api.receive('gbl-file-content', (fileInfoArray) => {
            if (fileInfoArray && fileInfoArray.length > 0) {
                console.log('Selected files:', fileInfoArray);
                window.api.send('fbx-gltf-converter', fileInfoArray);
            } else {
                console.log('No files selected');
            }
        });
        window.api.receive('fbx-conversion-success', async (results) => {
            console.log('Conversion results:', results);
            setConversionResults(results);
            try {
                const { individualResults, cumulativeBoundingBox } = await calculateBoundingBoxes(results, canvasRef.current);
                console.log('Individual results:', individualResults);
                console.log('Cumulative bounding box:', cumulativeBoundingBox);
        
                setBoundingBoxes(individualResults);
                setCumulativeBoundingBox(cumulativeBoundingBox);
        
                if (!cumulativeBoundingBox || !cumulativeBoundingBox.min || !cumulativeBoundingBox.max) {
                    console.error('Invalid cumulative bounding box:', cumulativeBoundingBox);
                    return;
                }
        
                const size = {
                    x: cumulativeBoundingBox.max.x - cumulativeBoundingBox.min.x,
                    y: cumulativeBoundingBox.max.y - cumulativeBoundingBox.min.y,
                    z: cumulativeBoundingBox.max.z - cumulativeBoundingBox.min.z
                };
                const center = {
                    x: (cumulativeBoundingBox.max.x + cumulativeBoundingBox.min.x) / 2,
                    y: (cumulativeBoundingBox.max.y + cumulativeBoundingBox.min.y) / 2,
                    z: (cumulativeBoundingBox.max.z + cumulativeBoundingBox.min.z) / 2
                };
        
                if (scene) {
                    try {
                        const customOctree = createCustomOctree(scene, size, center);
                        
                        individualResults.forEach(fileResult => {
                            if (!fileResult.error) {
                                fileResult.boundingBoxes.forEach(boxData => {
                                    // Skip if originalMesh is undefined or null
                                    if (!boxData.originalMesh) {
                                        console.warn('Invalid mesh data:', boxData);
                                        return;
                                    }
            
                                    // Create bounding box mesh
                                    const boundingBox = boxData.originalMesh.getBoundingInfo().boundingBox;
                                    const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
                                    const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
                                    const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;
            
                                    const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox(
                                        "boundingBox_" + boxData.originalMesh.name,
                                        {
                                            width: sizeX,
                                            height: sizeY,
                                            depth: sizeZ
                                        },
                                        scene
                                    );
                                    boundingBoxMesh.position = boundingBox.centerWorld;
                                    boundingBoxMesh.visibility = 0.3;
            
                                    // Insert into octree
                                    customOctree.insertMesh(
                                        customOctree.root,
                                        boxData.originalMesh,
                                        boundingBoxMesh,
                                        0
                                    );
                                });
                            }
                        });
            
                        // Merge bounding boxes and print details
                        await customOctree.mergeBoundingBoxesInAllNodes(scene);
                        customOctree.printMergedMeshDetails();
            
                        visualizeCustomOctree(scene, customOctree);
                    } catch (error) {
                        console.error("Error in custom octree creation or visualization:", error);
                    }
                }else {
                    console.error("Scene is not initialized");
                }
        
            } catch (error) {
                console.error("Error processing conversion results:", error);
            }
        });
        return () => {
            if (scene) {
                scene.dispose();
            }
        };
    }, []);
    return (
        <div>
            <button
                onClick={handleFileSelect}
                className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Select FBX File
            </button>
            <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />
            {cumulativeBoundingBox && (
                <div>
                    <h2>Cumulative Bounding Box:</h2>
                    <p>
                        Min: ({cumulativeBoundingBox.min.x.toFixed(2)}, {cumulativeBoundingBox.min.y.toFixed(2)}, {cumulativeBoundingBox.min.z.toFixed(2)})
                    </p>
                    <p>
                        Max: ({cumulativeBoundingBox.max.x.toFixed(2)}, {cumulativeBoundingBox.max.y.toFixed(2)}, {cumulativeBoundingBox.max.z.toFixed(2)})
                    </p>
                </div>
            )}
            {boundingBoxes.length > 0 && (
                <div>
                    <h2>Individual Bounding Boxes:</h2>
                    {boundingBoxes.map((fileResult, index) => (
                        <div key={index}>
                            <h3>{fileResult.filePath}</h3>
                            {fileResult.error ? (
                                <p>Error: {fileResult.error}</p>
                            ) : (
                                <ul>
                                    {fileResult.boundingBoxes.map((box, boxIndex) => (
                                        <li key={boxIndex}>
                                            {box.meshName}: Min ({box.min.x.toFixed(2)}, {box.min.y.toFixed(2)}, {box.min.z.toFixed(2)}),
                                            Max ({box.max.x.toFixed(2)}, {box.max.y.toFixed(2)}, {box.max.z.toFixed(2)})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
export default Fbxload;