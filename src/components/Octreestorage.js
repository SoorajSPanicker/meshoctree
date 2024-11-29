// import React, { useState, useEffect } from 'react';
// import * as BABYLON from "@babylonjs/core";
// import { openDB } from 'idb';

// function OctreeStorage({ convertedModels, octree }) {
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
//                     db.createObjectStore('models');
//                     db.createObjectStore('octrees');
//                 },
//             });

//             // Store GLB files
//             for (const model of convertedModels) {
//                 await db.put('models', model.data, model.fileName);
//             }

//             // Log octree structure for debugging
//             console.log('Original Octree:', octree);

//             // Serialize octree
//             const serializedOctree = serializeOctree(octree);
//             console.log('Serialized Octree:', serializedOctree);

//             // Store serialized octree
//             await db.put('octrees', serializedOctree, 'serializedOctree');

//             setStorageStatus('Data stored successfully');
//         } catch (error) {
//             console.error('Error storing data:', error);
//             setStorageStatus('Error storing data');
//         }
//     };

//     const serializeOctree = (octree) => {
//         if (!octree) {
//             console.warn('Octree is undefined');
//             return null;
//         }

//         const serialized = {
//             maxDepth: octree.maxDepth,
//             blocks: [],
//             entries: []
//         };

//         const serializeBlock = (block) => {
//             if (!block) return null;

//             return {
//                 minPoint: block.minPoint ? { x: block.minPoint.x, y: block.minPoint.y, z: block.minPoint.z } : null,
//                 maxPoint: block.maxPoint ? { x: block.maxPoint.x, y: block.maxPoint.y, z: block.maxPoint.z } : null,
//                 capacity: block.capacity,
//                 blocks: block.blocks ? block.blocks.map(serializeBlock).filter(Boolean) : [],
//                 entries: block.entries ? block.entries.map(entry => entry.id).filter(Boolean) : []
//             };
//         };

//         if (octree.blocks && octree.blocks.length > 0) {
//             serialized.blocks = octree.blocks.map(serializeBlock).filter(Boolean);
//         }

//         if (octree.entries && octree.entries.length > 0) {
//             serialized.entries = octree.entries.map(entry => entry.id).filter(Boolean);
//         }

//         return serialized;
//     };

//     return (
//         <div>
//             <h2>Octree and Model Storage</h2>
//             <p>Status: {storageStatus}</p>
//         </div>
//     );
// }

// export default OctreeStorage;



// import React, { useEffect, useState } from 'react';
// import { openDB } from 'idb';

// const Octreestorage = ({ convertedModels, octree }) => {
//     const [storageStatus, setStorageStatus] = useState('');

//     const serializeOctree = (octree) => {
//         const serializedOctree = {
//             structure: octree.structure.map(node => ({
//                 ...node,
//                 bounds: node.bounds ? { ...node.bounds } : null,
//                 meshTypes: { ...node.meshTypes },
//                 childNodes: [...node.childNodes]
//             })),
//             metadata: {
//                 ...octree.metadata,
//                 nodesByDepth: { ...octree.metadata.nodesByDepth }
//             }
//         };
//         return serializedOctree;
//     };

//     const saveToIndexedDB = async () => {
//         try {
//             setStorageStatus('Initializing storage...');

//             const db = await openDB('ModelStorage', 1, {
//                 upgrade(db) {
//                     if (!db.objectStoreNames.contains('models')) {
//                         db.createObjectStore('models');
//                     }
//                     if (!db.objectStoreNames.contains('octrees')) {
//                         db.createObjectStore('octrees');
//                     }
//                 },
//             });

//             setStorageStatus('Storing model data...');
//             const modelTx = db.transaction('models', 'readwrite');
//             const modelStore = modelTx.objectStore('models');

//             for (const model of convertedModels) {
//                 await modelStore.put(model.data, model.fileName);
//             }

//             setStorageStatus('Serializing octree...');
//             const serializedOctree = serializeOctree(octree);

//             console.log('Original Octree:', octree);
//             console.log('Serialized Octree:', serializedOctree);

//             const octreeTx = db.transaction('octrees', 'readwrite');
//             const octreeStore = octreeTx.objectStore('octrees');
//             await octreeStore.put(serializedOctree, 'octree');

//             await modelTx.complete;
//             await octreeTx.complete;

//             const verifyTx = db.transaction(['models', 'octrees'], 'readonly');
//             const modelCount = await verifyTx.objectStore('models').count();
//             const octreeExists = await verifyTx.objectStore('octrees').get('octree');

//             setStorageStatus(`Storage complete: ${modelCount} models saved`);

//         } catch (error) {
//             console.error('Storage error:', error);
//             setStorageStatus(`Error storing data: ${error.message}`);
//         }
//     };

//     useEffect(() => {
//         if (convertedModels && convertedModels.length > 0 && octree) {
//             saveToIndexedDB();
//         }
//     }, [convertedModels, octree]);

//     return (
//         <div className="p-4 bg-gray-100 rounded">
//             <h2 className="text-lg font-bold mb-2">Storage Status</h2>
//             <p className="text-gray-700">{storageStatus}</p>
//         </div>
//     );
// };

// export default Octreestorage;


import React, { useEffect, useState } from 'react';
import { openDB } from 'idb';

const Octreestorage = ({ convertedModels, octree }) => {
    const [storageStatus, setStorageStatus] = useState('');

    const cleanMeshData = (meshData) => {
        return {
            name: meshData.name,
            nodeNumber: meshData.nodeNumber,
            depth: meshData.depth,
            parentNode: meshData.parentNode,
            vertexData: {
                positions: Array.from(meshData.vertexData.positions),
                normals: Array.from(meshData.vertexData.normals),
                indices: Array.from(meshData.vertexData.indices),
                uvs: Array.from(meshData.vertexData.uvs)
            },
            transforms: {
                position: { ...meshData.transforms.position },
                rotation: { ...meshData.transforms.rotation },
                scaling: { ...meshData.transforms.scaling },
                worldMatrix: Array.from(meshData.transforms.worldMatrix)
            },
            boundingInfo: {
                minimum: { ...meshData.boundingInfo.minimum },
                maximum: { ...meshData.boundingInfo.maximum },
                boundingSphere: {
                    center: { ...meshData.boundingInfo.boundingSphere.center },
                    radius: meshData.boundingInfo.boundingSphere.radius
                }
            },
            metadata: {
                id: meshData.metadata.id,
                isVisible: meshData.metadata.isVisible ? true : false,
                isEnabled: meshData.metadata.isEnabled ? true : false,
                renderingGroupId: meshData.metadata.renderingGroupId,
                material: meshData.metadata.material ? {
                    name: meshData.metadata.material.name,
                    id: meshData.metadata.material.id,
                    diffuseColor: meshData.metadata.material.diffuseColor ? {
                        r: meshData.metadata.material.diffuseColor.r,
                        g: meshData.metadata.material.diffuseColor.g,
                        b: meshData.metadata.material.diffuseColor.b
                    } : null
                } : null,
                geometryInfo: {
                    totalVertices: meshData.metadata.geometryInfo.totalVertices,
                    totalIndices: meshData.metadata.geometryInfo.totalIndices,
                    faceCount: meshData.metadata.geometryInfo.faceCount
                }
            }
        };
    };

    const serializeOctree = (octree) => {
        return {
            structure: octree.structure.map(node => ({
                nodeNumber: node.nodeNumber,
                depth: node.depth,
                parentNode: node.parentNode,
                bounds: node.bounds ? {
                    minimum: { ...node.bounds.minimum },
                    maximum: { ...node.bounds.maximum }
                } : null,
                meshCount: node.meshCount,
                meshTypes: {
                    original: node.meshTypes.original,
                    merged: node.meshTypes.merged
                },
                childNodes: [...node.childNodes]
            })),
            metadata: {
                maxDepth: octree.metadata.maxDepth,
                minSize: octree.metadata.minSize,
                totalNodes: octree.metadata.totalNodes,
                nodesByDepth: { ...octree.metadata.nodesByDepth },
                averageMeshesPerNode: octree.metadata.averageMeshesPerNode
            }
        };
    };

    const saveToIndexedDB = async () => {
        try {
            setStorageStatus('Initializing storage...');
            const db = await openDB('ModelStorage', 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains('models')) {
                        db.createObjectStore('models');
                    }
                    if (!db.objectStoreNames.contains('octrees')) {
                        db.createObjectStore('octrees');
                    }
                },
            });

            setStorageStatus('Cleaning and storing model data...');
            const modelTx = db.transaction('models', 'readwrite');
            const modelStore = modelTx.objectStore('models');

            for (const model of convertedModels) {
                const cleanedData = cleanMeshData(model.data);
                await modelStore.put(cleanedData, model.fileName);
            }

            setStorageStatus('Serializing octree data...');
            const serializedOctree = serializeOctree(octree);

            const octreeTx = db.transaction('octrees', 'readwrite');
            const octreeStore = octreeTx.objectStore('octrees');
            await octreeStore.put(serializedOctree, 'mainOctree');

            await modelTx.complete;
            await octreeTx.complete;

            setStorageStatus('Storage complete');

        } catch (error) {
            console.error('Storage error:', error);
            setStorageStatus(`Error storing data: ${error.message}`);
        }
    };

    useEffect(() => {
        if (convertedModels?.length > 0 && octree) {
            saveToIndexedDB();
        }
    }, [convertedModels, octree]);

    return (
        <div className="p-4 bg-gray-100 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Storage Status</h2>
            <p className="text-gray-700">{storageStatus}</p>
        </div>
    );
};

export default Octreestorage;