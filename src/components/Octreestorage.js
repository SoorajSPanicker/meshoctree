// // BabylonSceneLoader.jsx
// import React, { useRef, useState, useEffect } from 'react';
// import * as BABYLON from '@babylonjs/core';
// import '@babylonjs/loaders/glTF';
// import { openDB } from 'idb';

// function BabylonSceneLoader() {
//     const canvasRef = useRef(null);
//     const [scene, setScene] = useState(null);
//     const [engine, setEngine] = useState(null);
//     const [status, setStatus] = useState('');
//     const [camera, setCamera] = useState(null);
//     const loadedMeshesRef = useRef({ original: {}, merged: {} });
//     const octreeRef = useRef(null);

//     useEffect(() => {
//         if (canvasRef.current) {
//             const engine = new BABYLON.Engine(canvasRef.current, true);
//             const scene = new BABYLON.Scene(engine);

//             const camera = new BABYLON.ArcRotateCamera(
//                 "camera",
//                 -Math.PI / 2,
//                 Math.PI / 2.5,
//                 10,
//                 BABYLON.Vector3.Zero(),
//                 scene
//             );
//             camera.attachControl(canvasRef.current, true);

//             // Add light
//             const light = new BABYLON.HemisphericLight(
//                 "light",
//                 new BABYLON.Vector3(0, 1, 0),
//                 scene
//             );

//             setScene(scene);
//             setEngine(engine);
//             setCamera(camera);

//             // Add observer for camera movement
//             scene.registerBeforeRender(() => {
//                 if (octreeRef.current) {
//                     updateMeshVisibility(camera, octreeRef.current, loadedMeshesRef.current);
//                 }
//             });

//             engine.runRenderLoop(() => {
//                 scene.render();
//             });

//             return () => {
//                 engine.dispose();
//             };
//         }
//     }, [canvasRef]);

//     // Function to update mesh visibility based on camera distance
//     const updateMeshVisibility = (camera, octreeData, loadedMeshes) => {
//         const updateNodeMeshes = (nodeData) => {
//             const nodeCenter = new BABYLON.Vector3(
//                 nodeData.center.x,
//                 nodeData.center.y,
//                 nodeData.center.z
//             );

//             const distance = BABYLON.Vector3.Distance(
//                 camera.position,
//                 nodeCenter
//             );

//             const nodeId = nodeData.nodeId;

//             // Handle original meshes
//             if (loadedMeshes.original[nodeId]) {
//                 loadedMeshes.original[nodeId].forEach(mesh => {
//                     mesh.setEnabled(distance <= 10);
//                 });
//             }

//             // Handle merged meshes
//             if (loadedMeshes.merged[nodeId]) {
//                 loadedMeshes.merged[nodeId].forEach(mesh => {
//                     mesh.setEnabled(distance > 10 && distance <= 100);
//                 });
//             }

//             // Recursively update child nodes
//             nodeData.children.forEach(updateNodeMeshes);
//         };

//         updateNodeMeshes(octreeData.root);
//     };

//     const loadFromIndexedDB = async () => {
//         try {
//             setStatus('Loading data from IndexedDB...');
//             const db = await openDB('ModelStorage', 1);

//             // Load octree data
//             const octreeData = await db.get('octrees', 'currentOctree');
//             if (!octreeData) {
//                 throw new Error('No octree data found in IndexedDB');
//             }

//             octreeRef.current = octreeData;

//             // Load models
//             const modelEntries = await db.getAll('models');

//             for (const entry of modelEntries) {
//                 const meshData = entry.data;
//                 const nodeId = meshData.nodeId;

//                 try {
//                     if (entry.fileName.startsWith('original_')) {
//                         // Create mesh for original model
//                         const mesh = createMeshFromData(meshData, scene);
//                         if (!loadedMeshesRef.current.original[nodeId]) {
//                             loadedMeshesRef.current.original[nodeId] = [];
//                         }
//                         loadedMeshesRef.current.original[nodeId].push(mesh);
//                         mesh.setEnabled(false); // Initially disable
//                     } else if (entry.fileName.startsWith('merged_')) {
//                         // Create mesh for merged bounding box
//                         const mesh = createMeshFromData(meshData, scene);
//                         if (!loadedMeshesRef.current.merged[nodeId]) {
//                             loadedMeshesRef.current.merged[nodeId] = [];
//                         }
//                         loadedMeshesRef.current.merged[nodeId].push(mesh);
//                         mesh.setEnabled(false); // Initially disable
//                     }
//                 } catch (error) {
//                     console.error(`Error creating mesh for ${entry.fileName}:`, error);
//                 }
//             }

//             setStatus('Data loaded successfully');
//         } catch (error) {
//             console.error('Error loading data:', error);
//             setStatus(`Error loading data: ${error.message}`);
//         }
//     };

//     const createMeshFromData = (meshData, scene) => {
//         const mesh = new BABYLON.Mesh(meshData.name, scene);

//         // Create vertex data
//         const vertexData = new BABYLON.VertexData();

//         if (meshData.vertices) {
//             vertexData.positions = meshData.vertices;
//         }
//         if (meshData.normals) {
//             vertexData.normals = meshData.normals;
//         }
//         if (meshData.indices) {
//             vertexData.indices = meshData.indices;
//         }

//         // Apply vertex data to mesh
//         vertexData.applyToMesh(mesh);

//         // Set transform
//         mesh.position = new BABYLON.Vector3(
//             meshData.position.x,
//             meshData.position.y,
//             meshData.position.z
//         );
//         mesh.rotation = new BABYLON.Vector3(
//             meshData.rotation.x,
//             meshData.rotation.y,
//             meshData.rotation.z
//         );
//         mesh.scaling = new BABYLON.Vector3(
//             meshData.scaling.x,
//             meshData.scaling.y,
//             meshData.scaling.z
//         );

//         // Apply material if present
//         if (meshData.materialData) {
//             const material = new BABYLON.StandardMaterial(meshData.materialId || "material", scene);
//             if (meshData.materialData.diffuseColor) {
//                 material.diffuseColor = new BABYLON.Color3(
//                     meshData.materialData.diffuseColor.r,
//                     meshData.materialData.diffuseColor.g,
//                     meshData.materialData.diffuseColor.b
//                 );
//             }
//             material.alpha = meshData.materialData.alpha || 1;
//             mesh.material = material;
//         }

//         return mesh;
//     };

//     return (
//         <div>
//             <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />
//             <button 
//                 onClick={loadFromIndexedDB}
//                 className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//                 Load Models from IndexedDB
//             </button>
//             <p>{status}</p>
//         </div>
//     );
// }

// export default BabylonSceneLoader;


import React, { useState, useEffect } from 'react';
import { openDB } from 'idb';

function Octreestorage({ convertedModels, octree }) {
    const [storageStatus, setStorageStatus] = useState('');

    useEffect(() => {
        if (convertedModels.length > 0 && octree) {
            storeData();
        }
    }, [convertedModels, octree]);

    const storeData = async () => {
        try {
            setStorageStatus('Storing data...');

            // Open IndexedDB
            const db = await openDB('ModelStorage', 1, {
                upgrade(db) {
                    // Create stores with indices
                    const modelStore = db.createObjectStore('models', { keyPath: 'fileName' });
                    modelStore.createIndex('nodeId', 'data.nodeId');
                    modelStore.createIndex('Dis', 'data.Dis');

                    db.createObjectStore('octrees');
                }
            });
            // Store mesh data with transaction
            const tx = db.transaction(['models'], 'readwrite');
            const modelStore = tx.objectStore('models');
            // Store all models
            await Promise.all(
                convertedModels.map(model =>
                    modelStore.put({
                        fileName: model.fileName,
                        data: {
                            ...model.data,
                            timestamp: new Date().getTime()
                        }
                    })
                )
            );
            await tx.done;
            // Store octree
            await db.put('octrees', {
                ...octree,
                timestamp: new Date().getTime()
            }, 'currentOctree');
            console.log('Stored models:', convertedModels);
            console.log('Stored octree:', octree);

            setStorageStatus('Data stored successfully');
        } catch (error) {
            console.error('Error storing data:', error);
            setStorageStatus('Error storing data');
        }
    };
    return (
        <div>
            <h2>Octree and Model Storage</h2>
            <p>Status: {storageStatus}</p>
        </div>
    );
}
export default Octreestorage;



// import React, { useState, useEffect } from 'react';
// import { openDB } from 'idb';

// function Octreestorage({ convertedModels, octree }) {
//     const [storageStatus, setStorageStatus] = useState('');

//     useEffect(() => {
//         if (convertedModels.length > 0 && octree) {
//             storeData();
//         }
//     }, [convertedModels, octree]);

//     const storeData = async () => {
//         try {
//             setStorageStatus('Storing data...');

//             // Open IndexedDB
//             const db = await openDB('ModelStorage', 1, {
//                 upgrade(db) {
//                     // Create stores with additional indices
//                     const modelStore = db.createObjectStore('models', { keyPath: 'fileName' });
//                     modelStore.createIndex('nodeId', 'data.nodeId');
//                     modelStore.createIndex('Dis', 'data.Dis');
//                     modelStore.createIndex('meshType', 'data.meshType'); // Add index for mesh type
                    
//                     db.createObjectStore('octrees');
//                 }
//             });

//             // Store mesh data with transaction
//             const tx = db.transaction(['models'], 'readwrite');
//             const modelStore = tx.objectStore('models');

//             // Clear existing data (optional)
//             // await modelStore.clear();

//             // Store all models with additional logging
//             await Promise.all(
//                 convertedModels.map(async model => {
//                     const entry = {
//                         fileName: model.fileName,
//                         data: {
//                             ...model.data,
//                             timestamp: new Date().getTime()
//                         }
//                     };
//                     await modelStore.put(entry);
//                     console.log(`Stored ${model.data.meshType} mesh:`, entry);
//                 })
//             );

//             await tx.done;

//             // Store octree
//             await db.put('octrees', {
//                 ...octree,
//                 timestamp: new Date().getTime()
//             }, 'currentOctree');

//             // Log storage summary
//             const count = await modelStore.count();
//             console.log('Total stored models:', count);
//             console.log('Stored octree:', octree);

//             // Verify storage
//             const originalCount = await modelStore.index('meshType').count('original');
//             const mergedCount = await modelStore.index('meshType').count('merged');
//             console.log(`Stored ${originalCount} original meshes and ${mergedCount} merged meshes`);

//             setStorageStatus(`Data stored successfully: ${originalCount} original meshes, ${mergedCount} merged meshes`);
//         } catch (error) {
//             console.error('Error storing data:', error);
//             setStorageStatus(`Error storing data: ${error.message}`);
//         }
//     };

//     return (
//         <div>
//             <h2>Octree and Model Storage</h2>
//             <p>Status: {storageStatus}</p>
//         </div>
//     );
// }

// export default Octreestorage;