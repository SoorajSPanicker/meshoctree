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
import { createCustomOctree, visualizeCustomOctree, initializeScene, positionCameraToFitBoundingBox } from './Octreecreation';
import * as BABYLON from '@babylonjs/core';
import Octreestorage from './Octreestorage';
function Fbxload() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [conversionResults, setConversionResults] = useState([]);
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
    const [octreeData, setOctreeData] = useState(null);
    const [originalMeshesData, setOriginalMeshesData] = useState([]);
    const [mergedMeshesData, setMergedMeshesData] = useState([]);
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

        // Modified mesh data collection function with proper checks
        const collectMeshData = (mesh, nodeId, isOriginal = true) => {
            if (!mesh) {
                console.warn('Invalid mesh passed to collectMeshData');
                return null;
            }

            try {
                // Basic mesh data that should always be available
                const meshData = {
                    id: mesh.id,
                    name: mesh.name,
                    nodeId: nodeId,
                    Dis: isOriginal ? 10 : 100,
                    position: {
                        x: mesh.position.x,
                        y: mesh.position.y,
                        z: mesh.position.z
                    },
                    rotation: {
                        x: mesh.rotation.x,
                        y: mesh.rotation.y,
                        z: mesh.rotation.z
                    },
                    scaling: {
                        x: mesh.scaling.x,
                        y: mesh.scaling.y,
                        z: mesh.scaling.z
                    }
                };

                // Add geometry data only if available
                if (mesh.getVerticesData && mesh.getTotalVertices() > 0) {
                    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                    if (positions) {
                        meshData.vertices = Array.from(positions);
                    }

                    const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
                    if (normals) {
                        meshData.normals = Array.from(normals);
                    }
                }

                // Add indices only if available
                if (mesh.getTotalIndices && mesh.getTotalIndices() > 0) {
                    const indices = mesh.getIndices();
                    if (indices) {
                        meshData.indices = Array.from(indices);
                    }
                }

                // Add material data if available
                if (mesh.material) {
                    meshData.materialId = mesh.material.id;
                    meshData.materialData = {
                        diffuseColor: mesh.material.diffuseColor ? {
                            r: mesh.material.diffuseColor.r,
                            g: mesh.material.diffuseColor.g,
                            b: mesh.material.diffuseColor.b
                        } : null,
                        alpha: mesh.material.alpha
                    };
                }

                return meshData;
            } catch (error) {
                console.error(`Error collecting data for mesh ${mesh.name}:`, error);
                return null;
            }
        };

        // Function to collect octree data for serialization
        const collectOctreeData = (octree) => {
            const collectNodeData = (node) => {
                return {
                    nodeId: node.nodeId,
                    center: {
                        x: node.center.x,
                        y: node.center.y,
                        z: node.center.z
                    },
                    size: node.size,
                    objects: node.objects.map(obj => obj.id),
                    children: node.children.map(child => collectNodeData(child))
                };
            };

            return {
                root: collectNodeData(octree.root),
                maxDepth: octree.maxDepth,
                nodeCounter: octree.nodeCounter
            };
        };

        window.api.receive('gbl-file-content', (fileInfoArray) => {
            if (fileInfoArray && fileInfoArray.length > 0) {
                console.log('Selected files:', fileInfoArray);
                window.api.send('fbx-gltf-converter', fileInfoArray);
            } else {
                console.log('No files selected');
            }
        });


        // window.api.receive('fbx-conversion-success', async (results) => {
        //     console.log('Conversion results:', results);
        //     setConversionResults(results);
        //     try {
        //         // Validate initial results
        //         if (!results || !Array.isArray(individualResults)) {
        //             throw new Error('Invalid conversion results format');
        //         }

        //         const { individualResults, cumulativeBoundingBox } = await calculateBoundingBoxes(results, canvasRef.current);
        //         console.log('Individual results:', individualResults);
        //         console.log('Cumulative bounding box:', cumulativeBoundingBox);

        //         // Validate bounding box calculations
        //         if (!cumulativeBoundingBox || !cumulativeBoundingBox.min || !cumulativeBoundingBox.max) {
        //             throw new Error('Invalid cumulative bounding box calculation');
        //         }

        //         setBoundingBoxes(individualResults);
        //         setCumulativeBoundingBox(cumulativeBoundingBox);

        //         const size = {
        //             x: cumulativeBoundingBox.max.x - cumulativeBoundingBox.min.x,
        //             y: cumulativeBoundingBox.max.y - cumulativeBoundingBox.min.y,
        //             z: cumulativeBoundingBox.max.z - cumulativeBoundingBox.min.z
        //         };
        //         const center = {
        //             x: (cumulativeBoundingBox.max.x + cumulativeBoundingBox.min.x) / 2,
        //             y: (cumulativeBoundingBox.max.y + cumulativeBoundingBox.min.y) / 2,
        //             z: (cumulativeBoundingBox.max.z + cumulativeBoundingBox.min.z) / 2
        //         };

        //         if (!scene) {
        //             throw new Error('Scene is not initialized');
        //         }

        //         const customOctree = createCustomOctree(scene, size, center);
        //         const originalMeshDataArray = [];
        //         const mergedMeshDataArray = [];

        //         // Process and insert meshes with validation
        //         individualResults.forEach((fileResult, fileIndex) => {
        //             if (!fileResult) {
        //                 console.warn(`Skipping undefined file result at index ${fileIndex}`);
        //                 return;
        //             }

        //             if (fileResult.error) {
        //                 console.warn(`Skipping file result with error:`, fileResult.error);
        //                 return;
        //             }

        //             if (!Array.isArray(fileResult.boundingBoxes)) {
        //                 console.warn(`Invalid boundingBoxes for file result:`, fileResult);
        //                 return;
        //             }

        //             fileResult.boundingBoxes.forEach((boxData, boxIndex) => {
        //                 if (!boxData) {
        //                     console.warn(`Skipping undefined box data at index ${boxIndex}`);
        //                     return;
        //                 }

        //                 if (!boxData.originalMesh) {
        //                     console.warn(`Missing originalMesh in box data:`, boxData);
        //                     return;
        //                 }

        //                 try {
        //                     // Validate mesh before processing
        //                     if (!boxData.originalMesh.getBoundingInfo) {
        //                         console.warn(`Invalid mesh object:`, boxData.originalMesh);
        //                         return;
        //                     }

        //                     const boundingBox = boxData.originalMesh.getBoundingInfo().boundingBox;
        //                     if (!boundingBox || !boundingBox.maximumWorld || !boundingBox.minimumWorld) {
        //                         console.warn(`Invalid bounding box for mesh:`, boxData.originalMesh.name);
        //                         return;
        //                     }

        //                     // Create bounding box mesh
        //                     const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
        //                     const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
        //                     const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;

        //                     const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox(
        //                         `boundingBox_${boxData.originalMesh.name}`,
        //                         {
        //                             width: sizeX,
        //                             height: sizeY,
        //                             depth: sizeZ
        //                         },
        //                         scene
        //                     );
        //                     boundingBoxMesh.position = boundingBox.centerWorld;
        //                     boundingBoxMesh.visibility = 0.3;

        //                     // Insert into octree
        //                     const nodeId = customOctree.root.nodeId;
        //                     customOctree.insertMesh(
        //                         customOctree.root,
        //                         boxData.originalMesh,
        //                         boundingBoxMesh,
        //                         0
        //                     );

        //                     // Collect original mesh data
        //                     const originalMeshData = collectMeshData(boxData.originalMesh, nodeId, true);
        //                     if (originalMeshData) {
        //                         originalMeshDataArray.push(originalMeshData);
        //                     }

        //                 } catch (error) {
        //                     console.error(`Error processing mesh ${boxData.originalMesh?.name}:`, error);
        //                 }
        //             });
        //         });

        //         // Merge bounding boxes and collect merged mesh data
        //         await customOctree.mergeBoundingBoxesInAllNodes(scene);

        //         // Collect merged mesh data with validation
        //         const collectMergedMeshData = (node) => {
        //             if (node && node.mergedMesh) {
        //                 const mergedMeshData = collectMeshData(node.mergedMesh, node.nodeId, false);
        //                 if (mergedMeshData) {
        //                     mergedMeshDataArray.push(mergedMeshData);
        //                 }
        //             }
        //             if (node && Array.isArray(node.children)) {
        //                 node.children.forEach(child => collectMergedMeshData(child));
        //             }
        //         };
        //         collectMergedMeshData(customOctree.root);

        //         // Update state only if we have valid data
        //         if (originalMeshDataArray.length > 0 || mergedMeshDataArray.length > 0) {
        //             setOctreeData(collectOctreeData(customOctree));
        //             setOriginalMeshesData(originalMeshDataArray);
        //             setMergedMeshesData(mergedMeshDataArray);
        //         }

        //         // Visualize octree only if we have valid root
        //         if (customOctree.root) {
        //             visualizeCustomOctree(scene, customOctree);
        //             console.log("Octree visualization completed");
        //         }

        //     } catch (error) {
        //         console.error("Error processing conversion results:", error);
        //         // You might want to set an error state here to show to the user
        //     }
        // });


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

                // Position camera to fit the cumulative bounding box
                if (sceneRef.current) {
                    const camera = sceneRef.current.cameras[0];
                    // if (camera) {
                    positionCameraToFitBoundingBox(camera, cumulativeBoundingBox, sceneRef.current);
                    // }
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

                console.log(center);


                if (scene) {
                    try {
                        const customOctree = createCustomOctree(scene, size, center);
                        console.log(customOctree);
                        const originalMeshDataArray = [];
                        const mergedMeshDataArray = [];

                        // Process and insert meshes
                        individualResults.forEach(fileResult => {
                            if (!fileResult.error) {
                                fileResult.boundingBoxes.forEach(boxData => {
                                    if (!boxData.originalMesh) {
                                        console.warn('Invalid mesh data:', boxData);
                                        return;
                                    }

                                    try {
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
                                        const nodeId = customOctree.root.nodeId;
                                        console.log(nodeId);
                                        customOctree.insertMesh(
                                            customOctree.root,
                                            boxData.originalMesh,
                                            boundingBoxMesh,
                                            0
                                        );

                                        // Collect original mesh data with proper checks
                                        const originalMeshData = collectMeshData(boxData.originalMesh, nodeId, true);
                                        if (originalMeshData) {
                                            originalMeshDataArray.push(originalMeshData);
                                        }

                                    } catch (error) {
                                        console.error(`Error processing mesh ${boxData.originalMesh?.name}:`, error);
                                    }
                                });
                            }
                        });

                        // Merge bounding boxes and collect merged mesh data
                        await customOctree.mergeBoundingBoxesInAllNodes(scene);
                        console.log(customOctree);

                        // Collect merged mesh data with proper checks
                        const collectMergedMeshData = (node) => {
                            if (node.mergedMesh) {
                                const mergedMeshData = collectMeshData(node.mergedMesh, node.nodeId, false);
                                if (mergedMeshData) {
                                    mergedMeshDataArray.push(mergedMeshData);
                                }
                            }
                            node.children.forEach(child => collectMergedMeshData(child));
                        };
                        collectMergedMeshData(customOctree.root);

                        // Store collected data only if we have valid data
                        if (originalMeshDataArray.length > 0 || mergedMeshDataArray.length > 0) {
                            setOctreeData(collectOctreeData(customOctree));
                            setOriginalMeshesData(originalMeshDataArray);
                            setMergedMeshesData(mergedMeshDataArray);
                        }

                        // Visualize octree only if we have data
                        if (customOctree.root) {
                            visualizeCustomOctree(scene, customOctree);
                            console.log("Octree visualization completed");
                        }

                    } catch (error) {
                        console.error("Error in custom octree creation or visualization:", error);
                    }
                } else {
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

            {/* {octreeData && originalMeshesData.length > 0 && (
                <Octreestorage
                    convertedModels={[
                        ...originalMeshesData.map(data => ({
                            fileName: `original_${data.name}`,
                            data: data
                        })),
                        ...mergedMeshesData.map(data => ({
                            fileName: `merged_${data.name}`,
                            data: data
                        }))
                    ]}
                    octree={octreeData}
                />
            )} */}

        </div>
    );
}
export default Fbxload;