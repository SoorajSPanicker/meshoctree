// import React, { useEffect, useState } from 'react';
// import { openDB } from 'idb';

// const Octreestorage = ({ convertedModels, octree }) => {
//     const [storageStatus, setStorageStatus] = useState('');
//     const DB_NAME = 'ModelStorage';
//     const DB_VERSION = 1;

//     // Initialize database
//     const initDB = async () => {
//         try {
//             const db = await openDB(DB_NAME, DB_VERSION, {
//                 upgrade(db) {
//                     // Create object stores if they don't exist
//                     if (!db.objectStoreNames.contains('models')) {
//                         db.createObjectStore('models', { keyPath: 'fileName' });
//                     }
//                     if (!db.objectStoreNames.contains('octrees')) {
//                         db.createObjectStore('octrees', { keyPath: 'name' });
//                     }
//                 },
//             });
//             return db;
//         } catch (error) {
//             console.error('Error initializing database:', error);
//             setStorageStatus('Error initializing database');
//             throw error;
//         }
//     };

//     // Serialize octree data
//     const serializeOctree = (octreeData) => {
//         // Create a deep copy of the octree and transform any non-serializable data
//         const serializableOctree = {
//             ...octreeData,
//             metadata: {
//                 ...octreeData.metadata,
//                 boundingBox: {
//                     min: {
//                         x: octreeData.metadata.boundingBox.min.x,
//                         y: octreeData.metadata.boundingBox.min.y,
//                         z: octreeData.metadata.boundingBox.min.z
//                     },
//                     max: {
//                         x: octreeData.metadata.boundingBox.max.x,
//                         y: octreeData.metadata.boundingBox.max.y,
//                         z: octreeData.metadata.boundingBox.max.z
//                     }
//                 }
//             },
//             structure: octreeData.structure.map(node => ({
//                 ...node,
//                 bounds: node.bounds ? {
//                     minimum: {
//                         x: node.bounds.minimum.x,
//                         y: node.bounds.minimum.y,
//                         z: node.bounds.minimum.z
//                     },
//                     maximum: {
//                         x: node.bounds.maximum.x,
//                         y: node.bounds.maximum.y,
//                         z: node.bounds.maximum.z
//                     }
//                 } : null,
//                 meshCounts: {
//                     ...node.meshCounts
//                 },
//                 childNodes: [...node.childNodes]
//             }))
//         };

//         return serializableOctree;
//     };

//     // Save data to IndexedDB
//     const saveToIndexedDB = async () => {
//         try {
//             setStorageStatus('Initializing storage...');
//             const db = await initDB();

//             // Store model data
//             const modelTx = db.transaction('models', 'readwrite');
//             const modelStore = modelTx.objectStore('models');

//             // Store each model
//             for (const model of convertedModels) {
//                 setStorageStatus(`Storing model: ${model.fileName}`);
//                 await modelStore.put(model);
//             }

//             // Serialize and store octree
//             const serializedOctree = serializeOctree(octree);
//             console.log('Original Octree:', octree);
//             console.log('Serialized Octree:', serializedOctree);

//             const octreeTx = db.transaction('octrees', 'readwrite');
//             const octreeStore = octreeTx.objectStore('octrees');
//             await octreeStore.put({
//                 name: 'mainOctree',
//                 data: serializedOctree,
//                 timestamp: new Date().toISOString()
//             });

//             setStorageStatus('Storage complete');

//             // Verify storage
//             const verifyTx = db.transaction(['models', 'octrees'], 'readonly');
//             const modelCount = await verifyTx.objectStore('models').count();
//             const octreeCount = await verifyTx.objectStore('octrees').count();
//             console.log(`Stored ${modelCount} models and ${octreeCount} octrees`);

//         } catch (error) {
//             console.error('Error saving to IndexedDB:', error);
//             setStorageStatus(`Error: ${error.message}`);
//         }
//     };

//     // Effect to trigger storage when component receives data
//     useEffect(() => {
//         if (convertedModels?.length > 0 && octree) {
//             saveToIndexedDB();
//         }
//     }, [convertedModels, octree]);

//     return (
//         <div className="p-4 bg-gray-100 rounded-lg">
//             <h2 className="text-xl font-bold mb-4">Storage Status</h2>
//             <p className={`mb-2 ${storageStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
//                 {storageStatus}
//             </p>
//             <div className="mt-4">
//                 <p className="text-sm text-gray-600">
//                     Models to store: {convertedModels?.length || 0}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                     Octree nodes: {octree?.structure?.length || 0}
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Octreestorage;


import React, { useEffect, useState } from 'react';
import { openDB } from 'idb';

const Octreestorage = ({ convertedModels, octree }) => {
    const [storageStatus, setStorageStatus] = useState('');
    const DB_NAME = 'ModelStorage';
    const DB_VERSION = 1;

    // Initialize database
    const initDB = async () => {
        try {
            const db = await openDB(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains('models')) {
                        db.createObjectStore('models', { keyPath: 'fileName' });
                    }
                    if (!db.objectStoreNames.contains('octrees')) {
                        db.createObjectStore('octrees', { keyPath: 'name' });
                    }
                },
            });
            return db;
        } catch (error) {
            console.error('Error initializing database:', error);
            setStorageStatus('Error initializing database');
            throw error;
        }
    };

    // Serialize mesh data
    const serializeMeshData = (meshData) => {
        return {
            fileName: meshData.fileName,
            data: {
                name: meshData.data.name,
                nodeNumber: meshData.data.nodeNumber,
                depth: meshData.data.depth,
                parentNode: meshData.data.parentNode,
                vertexData: meshData.data.vertexData,
                transforms: {
                    position: meshData.data.transforms.position,
                    rotation: meshData.data.transforms.rotation,
                    scaling: meshData.data.transforms.scaling,
                    worldMatrix: Array.from(meshData.data.transforms.worldMatrix)
                },
                boundingInfo: meshData.data.boundingInfo,
                metadata: {
                    id: meshData.data.metadata.id,
                    geometryInfo: meshData.data.metadata.geometryInfo,
                    material: meshData.data.metadata.material ? {
                        name: meshData.data.metadata.material.name,
                        id: meshData.data.metadata.material.id,
                        diffuseColor: meshData.data.metadata.material.diffuseColor
                    } : null
                }
            }
        };
    };

    // Serialize octree data
    const serializeOctree = (octreeData) => {
        if (!octreeData || !octreeData.metadata?.boundingBox) {
            console.error('Invalid octree data:', octreeData);
            return null;
        }

        try {
            const serializableOctree = {
                metadata: {
                    maxDepth: octreeData.metadata.maxDepth,
                    minSize: octreeData.metadata.minSize,
                    totalNodes: octreeData.metadata.totalNodes,
                    nodesByDepth: { ...octreeData.metadata.nodesByDepth },
                    boundingBox: octreeData.metadata.boundingBox ? {
                        min: {
                            x: octreeData.metadata.boundingBox.min.x,
                            y: octreeData.metadata.boundingBox.min.y,
                            z: octreeData.metadata.boundingBox.min.z
                        },
                        max: {
                            x: octreeData.metadata.boundingBox.max.x,
                            y: octreeData.metadata.boundingBox.max.y,
                            z: octreeData.metadata.boundingBox.max.z
                        }
                    } : null,
                    meshDistribution: octreeData.metadata.meshDistribution
                },
                structure: octreeData.structure.map(node => ({
                    nodeNumber: node.nodeNumber,
                    depth: node.depth,
                    parentNode: node.parentNode,
                    bounds: node.bounds,
                    meshCounts: node.meshCounts,
                    childNodes: node.childNodes
                }))
            };

            return serializableOctree;
        } catch (error) {
            console.error('Error serializing octree:', error);
            return null;
        }
    };

    // Save data to IndexedDB
    const saveToIndexedDB = async () => {
        try {
            setStorageStatus('Initializing storage...');
            const db = await initDB();

            // Store model data
            const modelTx = db.transaction('models', 'readwrite');
            const modelStore = modelTx.objectStore('models');

            // Store each model
            for (const model of convertedModels) {
                setStorageStatus(`Storing model: ${model.fileName}`);
                const serializedModel = serializeMeshData(model);
                await modelStore.put(serializedModel);
            }

            // Serialize and store octree
            const serializedOctree = serializeOctree(octree);
            if (serializedOctree) {
                const octreeTx = db.transaction('octrees', 'readwrite');
                const octreeStore = octreeTx.objectStore('octrees');
                await octreeStore.put({
                    name: 'mainOctree',
                    data: serializedOctree,
                    timestamp: new Date().toISOString()
                });
            }

            setStorageStatus('Storage complete');

            // Verify storage
            const verifyTx = db.transaction(['models', 'octrees'], 'readonly');
            const modelCount = await verifyTx.objectStore('models').count();
            const octreeCount = await verifyTx.objectStore('octrees').count();
            console.log(`Stored ${modelCount} models and ${octreeCount} octrees`);

        } catch (error) {
            console.error('Error saving to IndexedDB:', error);
            setStorageStatus(`Error: ${error.message}`);
        }
    };

    useEffect(() => {
        if (convertedModels?.length > 0 && octree) {
            saveToIndexedDB();
        }
    }, [convertedModels, octree]);

    return (
        <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Storage Status</h2>
            <p className={`mb-2 ${storageStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {storageStatus}
            </p>
            <div className="mt-4">
                <p className="text-sm text-gray-600">
                    Models to store: {convertedModels?.length || 0}
                </p>
                <p className="text-sm text-gray-600">
                    Octree nodes: {octree?.structure?.length || 0}
                </p>
            </div>
        </div>
    );
};

export default Octreestorage;