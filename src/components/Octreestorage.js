import React, { useEffect, useState } from 'react';
import { openDB } from 'idb';
import * as BABYLON from '@babylonjs/core';

const Octreestorage = ({ convertedModels, lpolyModels, octree , scene }) => {
    const [storageStatus, setStorageStatus] = useState('');
    const [meshPairs, setMeshPairs] = useState(null);
    const DB_NAME = 'ModelStorage';
    const DB_VERSION = 2; // Increased version number for new store

    // Initialize database
    const initDB = async () => {
        try {
            const db = await openDB(DB_NAME, DB_VERSION, {
                upgrade(db, oldVersion, newVersion, transaction) {
                    // Create stores if they don't exist
                    if (!db.objectStoreNames.contains('models')) {
                        db.createObjectStore('models', { keyPath: 'fileName' });
                    }
                    if (!db.objectStoreNames.contains('lmodels')) {
                        db.createObjectStore('lmodels', { keyPath: 'fileName' });
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

   

    const getMeshesAndLowPolyPairs = async () => {
        const DB_NAME = 'ModelStorage';
        const DB_VERSION = 2;
        const TARGET_DEPTH = 4;
    
        try {
            const db = await openDB(DB_NAME, DB_VERSION);
            
            // Get the octree data
            const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
            const octreeData = await octreeStore.get('mainOctree');
            
            if (!octreeData || !octreeData.data || !octreeData.data.blockHierarchy) {
                throw new Error('No valid octree data found');
            }
    
            // Function to get nodes at depth 4
            const getNodesAtDepth = (block, currentDepth = 0, results = []) => {
                if (!block) return results;
                
                // If we're at depth 4 and the node has meshes, collect them
                if (currentDepth === TARGET_DEPTH && block.meshInfos && block.meshInfos.length > 0) {
                    results.push({
                        nodeNumber: block.properties.nodeNumber,
                        meshIds: block.meshInfos.map(info => info.id)
                    });
                    return results;
                }
                
                // If not at depth 4, check child blocks
                if (block.relationships && block.relationships.childBlocks) {
                    block.relationships.childBlocks.forEach(childBlock => {
                        getNodesAtDepth(childBlock, currentDepth + 1, results);
                    });
                }
                
                return results;
            };
    
            // Get all nodes at depth 4 with their mesh IDs
            const depth4Nodes = getNodesAtDepth(octreeData.data.blockHierarchy);

            
            // Get all low-poly models
            const lmodelsStore = db.transaction('lmodels', 'readonly').objectStore('lmodels');
            const allLowPolyModels = await lmodelsStore.getAll();
    
            // Process each node and find corresponding low-poly meshes
            const results = depth4Nodes.map(node => {
                const meshGroups = node.meshIds.map(originalId => {
                    // Find corresponding low-poly model
                    const lowPolyMatch = allLowPolyModels.find(lmodel => 
                        lmodel.fileName.includes(originalId) || 
                        lmodel.data.metadata.id.includes(originalId)
                    );
    
                    return {
                        originalMeshId: originalId,
                        lowPolyMeshId: lowPolyMatch ? lowPolyMatch.fileName : null
                    };
                });
    
                return {
                    nodeNumber: node.nodeNumber,
                    meshPairs: meshGroups
                };
            });
    
            return {
                success: true,
                nodeCount: depth4Nodes.length,
                data: results,
                summary: {
                    totalNodes: results.length,
                    totalMeshPairs: results.reduce((sum, node) => sum + node.meshPairs.length, 0)
                }
            };
    
        } catch (error) {
            console.error('Error retrieving mesh data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };

   
   const retrieveMeshPairs = async () => {
    const result = await getMeshesAndLowPolyPairs();
    // if (result.success) {
    //     console.log('Created merged meshes:', result);
        
    //     result.mergedMeshes.forEach(mesh => {
    //         console.log(`Merged mesh ${mesh.name}:`, {
    //             nodeNumber: mesh.metadata.nodeNumber,
    //             originalMeshes: mesh.metadata.originalMeshIds,
    //             lowPolyMeshes: mesh.metadata.lowPolyMeshes,
    //             vertices: mesh.getTotalVertices(),
    //             faces: mesh.getTotalIndices() / 3
    //         });

    //         // Make the merged mesh visible
    //         mesh.isVisible = true;
    //     });
    // } else {
    //     console.error('Failed to merge meshes:', result.error);
    // }
    if (result.success) {
        setMeshPairs(result.data);
        console.log('Found mesh pairs:', result);
        
        // Example of how to use the results
        result.data.forEach(node => {
            console.log(`Node ${node.nodeNumber} contains:`);
            node.meshPairs.forEach(pair => {
                console.log(`  Original mesh: ${pair.originalMeshId}`);
                console.log(`  Low-poly version: ${pair.lowPolyMeshId}`);
            });
        });
    } else {
        console.error('Failed to retrieve mesh pairs:', result.error);
    }

};
   
    // Serialize mesh data (for both original and low-poly models)
    const serializelMeshData = (meshData) => {
        return {
            fileName: meshData.fileName,
            data: {
                name: meshData.data.name,
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
                    screenCoverage: meshData.data.metadata.screenCoverage !== undefined 
                    ? meshData.data.metadata.screenCoverage 
                    : null,
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

    const serializeMeshData = (meshData) => {
        return {
            fileName: meshData.fileName,
            data: {
                name: meshData.data.name,
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

    // Serialize octree data with updated structure
    const serializeOctree = (octreeData) => {
        if (!octreeData || !octreeData.bounds) {
            console.error('Invalid octree data:', octreeData);
            return null;
        }

        try {
            return {
                properties: {
                    maxDepth: octreeData.properties.maxDepth,
                    minSize: octreeData.properties.minSize,
                    totalNodes: octreeData.properties.totalNodes,
                    nodesPerLevel: [...octreeData.properties.nodesPerLevel],
                    nodesWithBoxes: [...octreeData.properties.nodesWithBoxes]
                },
                bounds: {
                    min: { ...octreeData.bounds.min },
                    max: { ...octreeData.bounds.max }
                },
                statistics: {
                    totalMeshes: octreeData.statistics.totalMeshes,
                    meshesPerLevel: { ...octreeData.statistics.meshesPerLevel },
                    nodeDistribution: octreeData.statistics.nodeDistribution.map(dist => ({
                        depth: dist.depth,
                        totalNodes: dist.totalNodes,
                        nodesWithContent: dist.nodesWithContent
                    }))
                },
                blockHierarchy: serializeBlockHierarchy(octreeData.blockHierarchy)
            };
        } catch (error) {
            console.error('Error serializing octree:', error);
            return null;
        }
    };

    // Helper function to serialize block hierarchy
    const serializeBlockHierarchy = (block) => {
        if (!block) return null;

        return {
            bounds: {
                min: { ...block.bounds.min },
                max: { ...block.bounds.max }
            },
            properties: {
                depth: block.properties.depth,
                nodeNumber: block.properties.nodeNumber,
                capacity: block.properties.capacity
            },
            meshInfos: block.meshInfos.map(info => ({
                id: info.id,
                boundingBox: info.boundingBox
            })),
            relationships: {
                parentNode: block.relationships.parentNode,
                childBlocks: block.relationships.childBlocks.map(child => 
                    serializeBlockHierarchy(child)
                ).filter(child => child !== null)
            }
        };
    };

    // Save data to IndexedDB
    const saveToIndexedDB = async () => {
        try {
            setStorageStatus('Initializing storage...');
            const db = await initDB();

            // Store original models
            const modelTx = db.transaction('models', 'readwrite');
            const modelStore = modelTx.objectStore('models');

            for (const model of convertedModels) {
                setStorageStatus(`Storing original model: ${model.fileName}`);
                const serializedModel = serializeMeshData(model);
                await modelStore.put(serializedModel);
            }

            // Store low-poly models
            const lmodelTx = db.transaction('lmodels', 'readwrite');
            const lmodelStore = lmodelTx.objectStore('lmodels');

            for (const model of lpolyModels) {
                setStorageStatus(`Storing low-poly model: ${model.fileName}`);
                const serializedModel = serializelMeshData(model);
                await lmodelStore.put(serializedModel);
            }

            // Store octree data
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

            // Verify storage
            const modelCount = await db.count('models');
            const lmodelCount = await db.count('lmodels');
            const octreeCount = await db.count('octrees');

            setStorageStatus(
                `Storage complete. Stored ${modelCount} original models, ` +
                `${lmodelCount} low-poly models, and ${octreeCount} octrees.`
            );

            console.log(`Storage statistics:`, {
                originalModels: modelCount,
                lowPolyModels: lmodelCount,
                octrees: octreeCount
            });

            // handleRetrieveMeshes();

        } catch (error) {
            console.error('Error saving to IndexedDB:', error);
            setStorageStatus(`Error: ${error.message}`);
        }
    };

    useEffect(() => {
        if (convertedModels?.length > 0 && lpolyModels?.length > 0 && octree) {
            console.log('Starting storage process with:', {
                originalModels: convertedModels.length,
                lowPolyModels: lpolyModels.length,
                octreePresent: !!octree
            });
            
            saveToIndexedDB().then(() => {
                retrieveMeshPairs();
            });
        }
    }, [convertedModels, lpolyModels, octree]);

    return (
        <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Storage Status</h2>
            <p className={`mb-2 ${storageStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {storageStatus}
            </p>
            <div className="mt-4">
                <p className="text-sm text-gray-600">
                    Original models to store: {convertedModels?.length || 0}
                </p>
                <p className="text-sm text-gray-600">
                    Low-poly models to store: {lpolyModels?.length || 0}
                </p>
                <p className="text-sm text-gray-600">
                    Octree structure present: {octree ? 'Yes' : 'No'}
                </p>
            </div>
        </div>
    );
};

export default Octreestorage;













// import React, { useEffect, useState } from 'react';
// import { openDB } from 'idb';

// const Octreestorage = ({ convertedModels,lpolyModels,octree }) => {
//     const [storageStatus, setStorageStatus] = useState('');
//     const DB_NAME = 'ModelStorage';
//     const DB_VERSION = 1;

//     // Initialize database
//     const initDB = async () => {
//         try {
//             const db = await openDB(DB_NAME, DB_VERSION, {
//                 upgrade(db) {
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

//     // Serialize mesh data
//     const serializeMeshData = (meshData) => {
//         return {
//             fileName: meshData.fileName,
//             data: {
//                 name: meshData.data.name,
//                 nodeNumber: meshData.data.nodeNumber,
//                 depth: meshData.data.depth,
//                 parentNode: meshData.data.parentNode,
//                 vertexData: meshData.data.vertexData,
//                 transforms: {
//                     position: meshData.data.transforms.position,
//                     rotation: meshData.data.transforms.rotation,
//                     scaling: meshData.data.transforms.scaling,
//                     worldMatrix: Array.from(meshData.data.transforms.worldMatrix)
//                 },
//                 boundingInfo: meshData.data.boundingInfo,
//                 metadata: {
//                     id: meshData.data.metadata.id,
//                     geometryInfo: meshData.data.metadata.geometryInfo,
//                     material: meshData.data.metadata.material ? {
//                         name: meshData.data.metadata.material.name,
//                         id: meshData.data.metadata.material.id,
//                         diffuseColor: meshData.data.metadata.material.diffuseColor
//                     } : null
//                 }
//             }
//         };
//     };

//     // Serialize octree data
//     const serializeOctree = (octreeData) => {
//         if (!octreeData || !octreeData.metadata?.boundingBox) {
//             console.error('Invalid octree data:', octreeData);
//             return null;
//         }

//         try {
//             const serializableOctree = {
//                 metadata: {
//                     maxDepth: octreeData.metadata.maxDepth,
//                     minSize: octreeData.metadata.minSize,
//                     totalNodes: octreeData.metadata.totalNodes,
//                     nodesByDepth: { ...octreeData.metadata.nodesByDepth },
//                     boundingBox: octreeData.metadata.boundingBox ? {
//                         min: {
//                             x: octreeData.metadata.boundingBox.min.x,
//                             y: octreeData.metadata.boundingBox.min.y,
//                             z: octreeData.metadata.boundingBox.min.z
//                         },
//                         max: {
//                             x: octreeData.metadata.boundingBox.max.x,
//                             y: octreeData.metadata.boundingBox.max.y,
//                             z: octreeData.metadata.boundingBox.max.z
//                         }
//                     } : null,
//                     meshDistribution: octreeData.metadata.meshDistribution
//                 },
//                 structure: octreeData.structure.map(node => ({
//                     nodeNumber: node.nodeNumber,
//                     depth: node.depth,
//                     parentNode: node.parentNode,
//                     bounds: node.bounds,
//                     meshCounts: node.meshCounts,
//                     childNodes: node.childNodes
//                 }))
//             };

//             return serializableOctree;
//         } catch (error) {
//             console.error('Error serializing octree:', error);
//             return null;
//         }
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
//                 const serializedModel = serializeMeshData(model);
//                 await modelStore.put(serializedModel);
//             }

//             // Serialize and store octree
//             const serializedOctree = serializeOctree(octree);
//             if (serializedOctree) {
//                 const octreeTx = db.transaction('octrees', 'readwrite');
//                 const octreeStore = octreeTx.objectStore('octrees');
//                 await octreeStore.put({
//                     name: 'mainOctree',
//                     data: serializedOctree,
//                     timestamp: new Date().toISOString()
//                 });
//             }

//             setStorageStatus('Storage complete');

//             // Verify storage
//             const verifyTx = db.transaction(['models'], 'readonly');
//             const modelCount = await verifyTx.objectStore('models').count();
//             // const octreeCount = await verifyTx.objectStore('octrees').count();
//             console.log(`Stored ${modelCount} models `);

//         } catch (error) {
//             console.error('Error saving to IndexedDB:', error);
//             setStorageStatus(`Error: ${error.message}`);
//         }
//     };

//     useEffect(() => {
//         if (convertedModels?.length > 0 ) {
//             console.log(convertedModels);
            
//             saveToIndexedDB();
//         }
//     }, [convertedModels]);

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





// import React, { useEffect, useState } from 'react';
// import { openDB } from 'idb';

// const Octreestorage = ({ convertedModels }) => {
//     const [status, setStatus] = useState('');
//     const DB_NAME = 'ModelStorage';
//     const STORE_NAME = 'models';
//     const DB_VERSION = 1;

//     useEffect(() => {
//         const initializeDB = async () => {
//             try {
//                 setStatus('Initializing database...');

//                 const db = await openDB(DB_NAME, DB_VERSION, {
//                     upgrade(db) {
//                         // Create the object store if it doesn't exist
//                         if (!db.objectStoreNames.contains(STORE_NAME)) {
//                             db.createObjectStore(STORE_NAME);
//                         }
//                     },
//                 });

//                 setStatus('Storing data...');

//                 // Start a transaction
//                 const tx = db.transaction(STORE_NAME, 'readwrite');
//                 const store = tx.objectStore(STORE_NAME);

//                 // Clear existing data
//                 await store.clear();

//                 // Store each model
//                 for (const model of convertedModels) {
//                     try {
//                         await store.put(model.data, model.fileName);
//                     } catch (error) {
//                         console.error(`Error storing model ${model.fileName}:`, error);
//                         throw error;
//                     }
//                 }

//                 // Complete the transaction
//                 await tx.done;

//                 setStatus('Data stored successfully');

//                 // Optional: Verify stored data
//                 const verificationTx = db.transaction(STORE_NAME, 'readonly');
//                 const count = await verificationTx.store.count();
//                 console.log(`Successfully stored ${count} models`);

//                 // Close the database connection
//                 db.close();

//             } catch (error) {
//                 console.error('Database error:', error);
//                 setStatus(`Error storing data: ${error.message}`);
//             }
//         };

//         if (convertedModels && convertedModels.length > 0) {
//             console.log(convertedModels);
//             initializeDB();
//         }
//     }, [convertedModels]);

//     // Helper function to format the status display
//     const getStatusStyle = () => {
//         if (status.includes('Error')) {
//             return 'text-red-500';
//         } else if (status === 'Data stored successfully') {
//             return 'text-green-500';
//         }
//         return 'text-blue-500';
//     };

//     return (
//         <div className="p-4">
//             <h2 className="text-lg font-bold mb-2">Storage Status</h2>
//             <p className={`${getStatusStyle()} font-semibold`}>
//                 {status || 'Waiting for data...'}
//             </p>
//             {status.includes('Error') && (
//                 <button
//                     className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     onClick={() => window.location.reload()}
//                 >
//                     Retry
//                 </button>
//             )}
//         </div>
//     );
// };

// export default Octreestorage;

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