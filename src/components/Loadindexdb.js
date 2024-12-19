import React, { useEffect, useState } from 'react';
import { openDB } from 'idb';
import * as BABYLON from '@babylonjs/core';

const Loadindexdb = ({ engine, scene }) => {

    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLpoly, setIsLoadingLpoly] = useState(false);

    const DB_NAME = 'ModelStorage';
    const DB_VERSION = 3; // Increased version for new store
    const TARGET_DEPTH = 4;

    const initDB = async () => {
        try {
            const db = await openDB(DB_NAME, DB_VERSION, {
                upgrade(db, oldVersion, newVersion) {
                    // Keep existing stores
                    if (!db.objectStoreNames.contains('models')) {
                        db.createObjectStore('models', { keyPath: 'fileName' });
                    }
                    if (!db.objectStoreNames.contains('lmodels')) {
                        db.createObjectStore('lmodels', { keyPath: 'fileName' });
                    }
                    if (!db.objectStoreNames.contains('octrees')) {
                        db.createObjectStore('octrees', { keyPath: 'name' });
                    }
                    // Add new store for merged meshes
                    if (!db.objectStoreNames.contains('mergedlpoly')) {
                        db.createObjectStore('mergedlpoly', { keyPath: 'name' });
                    }
                }
            });
            return db;
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    };

    const createWireframeBox = (bounds) => {
        if (!scene) return null;

        const min = bounds.min;
        const max = bounds.max;

        const size = {
            width: Math.abs(max.x - min.x),
            height: Math.abs(max.y - min.y),
            depth: Math.abs(max.z - min.z)
        };

        const center = new BABYLON.Vector3(
            (max.x + min.x) / 2,
            (max.y + min.y) / 2,
            (max.z + min.z) / 2
        );

        const box = BABYLON.MeshBuilder.CreateBox(
            "rootOctreeBox",
            size,
            scene
        );

        box.position = center;
        const material = new BABYLON.StandardMaterial("rootWireframeMat", scene);
        material.wireframe = true;
        material.alpha = 0.3;
        material.emissiveColor = new BABYLON.Color3(1, 0, 0);

        box.material = material;
        box.isPickable = false;
        return box;
    };



    const fitCameraToOctree = (camera, maximum, minimum) => {
        const maxVector = (maximum instanceof BABYLON.Vector3)
            ? maximum
            : new BABYLON.Vector3(maximum.x, maximum.y, maximum.z);

        const minVector = (minimum instanceof BABYLON.Vector3)
            ? minimum
            : new BABYLON.Vector3(minimum.x, minimum.y, minimum.z);

        const center = BABYLON.Vector3.Center(minVector, maxVector);
        const size = maxVector.subtract(minVector);
        const maxDimension = Math.max(size.x, size.y, size.z);

        camera.setTarget(center);

        const fovRadians = camera.fov || (Math.PI / 4);
        const distanceToFit = maxDimension / (2 * Math.tan(fovRadians / 2));

        camera.radius = distanceToFit * 1.2; // Added 20% padding
        camera.alpha = Math.PI / 4;
        camera.beta = Math.PI / 3;

        camera.wheelPrecision = 50;
        camera.minZ = maxDimension * 0.01;
        camera.maxZ = maxDimension * 1000;
    };


    const collectMergedMeshData = (mesh) => {
        return {
            name: mesh.name,
            vertexData: {
                positions: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind) || []),
                normals: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind) || []),
                indices: Array.from(mesh.getIndices() || [])
            },
            transforms: {
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
                },
                worldMatrix: Array.from(mesh.getWorldMatrix().toArray())
            },
            boundingInfo: {
                minimum: {
                    x: mesh.getBoundingInfo().boundingBox.minimumWorld.x,
                    y: mesh.getBoundingInfo().boundingBox.minimumWorld.y,
                    z: mesh.getBoundingInfo().boundingBox.minimumWorld.z
                },
                maximum: {
                    x: mesh.getBoundingInfo().boundingBox.maximumWorld.x,
                    y: mesh.getBoundingInfo().boundingBox.maximumWorld.y,
                    z: mesh.getBoundingInfo().boundingBox.maximumWorld.z
                }
            },
            metadata: {
                nodeNumber: mesh.metadata.nodeNumber,
                originalMeshCount: mesh.metadata.originalMeshCount,
                geometryInfo: {
                    totalVertices: mesh.getTotalVertices(),
                    totalIndices: mesh.getTotalIndices(),
                    faceCount: mesh.getTotalIndices() / 3
                }
            }
        };
    }


    // const loadLPolyMeshes = async () => {
    //     if (!scene || !engine) {
    //         setStatus('Error: Scene or Engine not initialized');
    //         return;
    //     }

    //     setIsLoading(true);
    //     setStatus('Starting to load merged meshes...');

    //     try {
    //         const db = await initDB();

    //         // Create shared material
    //         const sharedMaterial = new BABYLON.StandardMaterial("sharedMaterial", scene);
    //         sharedMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    //         sharedMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    //         sharedMaterial.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    //         sharedMaterial.backFaceCulling = false;

    //         // Get octree data
    //         const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
    //         const octreeData = await octreeStore.get('mainOctree');

    //         if (!octreeData || !octreeData.data) {
    //             throw new Error('No octree data found');
    //         }

    //         // Create root octree visualization
    //         createWireframeBox(octreeData.data.bounds);

    //         // Function to find node bounds by node number in octree
    //         const findNodeBounds = (block, targetNodeNumber) => {
    //             if (!block) return null;

    //             if (block.properties && block.properties.nodeNumber === targetNodeNumber) {
    //                 return block.bounds;
    //             }

    //             if (block.relationships && block.relationships.childBlocks) {
    //                 for (const childBlock of block.relationships.childBlocks) {
    //                     const result = findNodeBounds(childBlock, targetNodeNumber);
    //                     if (result) return result;
    //                 }
    //             }

    //             return null;
    //         };

    //         // // Create a map to store node visualization meshes
    //         // const nodeVisualizations = new Map();

    //         // // Function to create visualization for a specific node
    //         // const createNodeVisualization = (nodeBounds, nodeNumber) => {
    //         //     const size = {
    //         //         width: Math.abs(nodeBounds.max.x - nodeBounds.min.x),
    //         //         height: Math.abs(nodeBounds.max.y - nodeBounds.min.y),
    //         //         depth: Math.abs(nodeBounds.max.z - nodeBounds.min.z)
    //         //     };

    //         //     const center = new BABYLON.Vector3(
    //         //         (nodeBounds.max.x + nodeBounds.min.x) / 2,
    //         //         (nodeBounds.max.y + nodeBounds.min.y) / 2,
    //         //         (nodeBounds.max.z + nodeBounds.min.z) / 2
    //         //     );

    //         //     const box = BABYLON.MeshBuilder.CreateBox(
    //         //         `node_${nodeNumber}_bounds`,
    //         //         size,
    //         //         scene
    //         //     );

    //         //     box.position = center;
    //         //     const material = new BABYLON.StandardMaterial(`node_${nodeNumber}_material`, scene);
    //         //     material.wireframe = true;
    //         //     material.alpha = 0.3;
    //         //     material.emissiveColor = new BABYLON.Color3(0, 1, 0);

    //         //     box.material = material;
    //         //     box.isPickable = false;

    //         //     return box;
    //         // };

    //         // Get all merged meshes from IndexedDB
    //         const mergedStore = db.transaction('mergedlpoly', 'readonly').objectStore('mergedlpoly');
    //         const mergedMeshes = await mergedStore.getAll();

    //         if (!mergedMeshes || mergedMeshes.length === 0) {
    //             throw new Error('No merged meshes found in database');
    //         }

    //         setStatus(`Loading ${mergedMeshes.length} merged meshes...`);

    //         // Group meshes by node number
    //         const nodeMap = new Map();
    //         mergedMeshes.forEach(meshData => {
    //             const nodeNumber = meshData.metadata.nodeNumber;
    //             if (!nodeMap.has(nodeNumber)) {
    //                 nodeMap.set(nodeNumber, []);
    //             }
    //             nodeMap.get(nodeNumber).push(meshData);
    //         });

    //         // Process each node and its meshes
    //         for (const [nodeNumber, nodeMeshes] of nodeMap) {
    //             // Find node bounds in octree
    //             const nodeBounds = findNodeBounds(octreeData.data.blockHierarchy, nodeNumber);

    //             if (!nodeBounds) {
    //                 console.warn(`Could not find bounds for node ${nodeNumber}`);
    //                 continue;
    //             }

    //             // // Create node visualization
    //             // const nodeVis = createNodeVisualization(nodeBounds, nodeNumber);
    //             // nodeVisualizations.set(nodeNumber, nodeVis);

    //             // Create meshes for this node
    //             for (const meshData of nodeMeshes) {
    //                 try {
    //                     // Create new mesh
    //                     const mesh = new BABYLON.Mesh(meshData.name, scene);

    //                     // Apply vertex data
    //                     const vertexData = new BABYLON.VertexData();
    //                     vertexData.positions = new Float32Array(meshData.vertexData.positions);
    //                     vertexData.indices = new Uint32Array(meshData.vertexData.indices);

    //                     if (meshData.vertexData.normals && meshData.vertexData.normals.length > 0) {
    //                         vertexData.normals = new Float32Array(meshData.vertexData.normals);
    //                     }

    //                     vertexData.applyToMesh(mesh);

    //                     // Apply transforms
    //                     if (meshData.transforms.worldMatrix) {
    //                         const matrix = BABYLON.Matrix.FromArray(meshData.transforms.worldMatrix);
    //                         mesh.setPreTransformMatrix(matrix);
    //                     } else {
    //                         mesh.position = new BABYLON.Vector3(
    //                             meshData.transforms.position.x,
    //                             meshData.transforms.position.y,
    //                             meshData.transforms.position.z
    //                         );
    //                         mesh.rotation = new BABYLON.Vector3(
    //                             meshData.transforms.rotation.x,
    //                             meshData.transforms.rotation.y,
    //                             meshData.transforms.rotation.z
    //                         );
    //                         mesh.scaling = new BABYLON.Vector3(
    //                             meshData.transforms.scaling.x,
    //                             meshData.transforms.scaling.y,
    //                             meshData.transforms.scaling.z
    //                         );
    //                     }

    //                     // Apply material and settings
    //                     mesh.material = sharedMaterial;
    //                     mesh.isPickable = false;
    //                     mesh.isVisible = true;

    //                     // Store metadata
    //                     mesh.metadata = {
    //                         nodeNumber: nodeNumber,
    //                         originalMeshCount: meshData.metadata.originalMeshCount
    //                     };

    //                     // Verify mesh is within node bounds
    //                     const meshBoundingBox = mesh.getBoundingInfo().boundingBox;
    //                     const isWithinBounds = (
    //                         meshBoundingBox.minimumWorld.x >= nodeBounds.min.x &&
    //                         meshBoundingBox.maximumWorld.x <= nodeBounds.max.x &&
    //                         meshBoundingBox.minimumWorld.y >= nodeBounds.min.y &&
    //                         meshBoundingBox.maximumWorld.y <= nodeBounds.max.y &&
    //                         meshBoundingBox.minimumWorld.z >= nodeBounds.min.z &&
    //                         meshBoundingBox.maximumWorld.z <= nodeBounds.max.z
    //                     );

    //                     if (!isWithinBounds) {
    //                         // console.warn(`Mesh ${meshData.name} is outside its node bounds`);
    //                     }

    //                     console.log(`Loaded merged mesh for node ${nodeNumber}`);
    //                 } catch (error) {
    //                     console.error(`Error creating mesh from data:`, error);
    //                 }
    //             }
    //         }

    //         // Position camera to fit the scene
    //         if (scene.activeCamera && octreeData.data.bounds) {
    //             fitCameraToOctree(scene.activeCamera, octreeData.data.bounds.max, octreeData.data.bounds.min);
    //         }

    //         setStatus(`Successfully loaded meshes for ${nodeMap.size} nodes`);
    //         scene.render();

    //     } catch (error) {
    //         console.error('Error loading merged meshes:', error);
    //         setStatus(`Error: ${error.message}`);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };





    // const loadLPolyMeshes = async () => {
    //     if (!scene || !engine) {
    //         setStatus('Error: Scene or Engine not initialized');
    //         return;
    //     }

    //     setIsLoadingLpoly(true);
    //     setStatus('Starting to load merged low-poly models...');

    //     try {
    //         const db = await initDB();

    //         // Create shared material
    //         const sharedMaterial = new BABYLON.StandardMaterial("sharedMaterial", scene);
    //         sharedMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    //         sharedMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    //         sharedMaterial.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    //         sharedMaterial.backFaceCulling = false;

    //         // Get octree data first
    //         const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
    //         const octreeData = await octreeStore.get('mainOctree');

    //         if (!octreeData || !octreeData.data) {
    //             throw new Error('No octree data found');
    //         }

    //         // Create root wireframe box for visualization
    //         createWireframeBox(octreeData.data.bounds);

    //         // Get all merged lpoly meshes
    //         const mergedStore = db.transaction('mergedlpoly', 'readonly').objectStore('mergedlpoly');
    //         const allMergedMeshes = await mergedStore.getAll();

    //         if (!allMergedMeshes || allMergedMeshes.length === 0) {
    //             throw new Error('No merged meshes found in database');
    //         }

    //         setStatus(`Found ${allMergedMeshes.length} merged meshes`);

    //         // Create meshes for each merged mesh data
    //         for (const mergedMeshData of allMergedMeshes) {
    //             try {
    //                 // Extract node number from mesh name
    //                 const nodeNumber = parseInt(mergedMeshData.name.split('_')[2]);

    //                 // Create new mesh
    //                 const mesh = new BABYLON.Mesh(mergedMeshData.name, scene);

    //                 // Apply vertex data
    //                 const vertexData = new BABYLON.VertexData();
    //                 vertexData.positions = new Float32Array(mergedMeshData.vertexData.positions);
    //                 vertexData.indices = new Uint32Array(mergedMeshData.vertexData.indices);

    //                 if (mergedMeshData.vertexData.normals) {
    //                     vertexData.normals = new Float32Array(mergedMeshData.vertexData.normals);
    //                 }

    //                 vertexData.applyToMesh(mesh);

    //                 // Apply transforms
    //                 if (mergedMeshData.transforms.worldMatrix) {
    //                     const matrix = BABYLON.Matrix.FromArray(mergedMeshData.transforms.worldMatrix);
    //                     mesh.setPreTransformMatrix(matrix);
    //                 } else {
    //                     mesh.position = new BABYLON.Vector3(
    //                         mergedMeshData.transforms.position.x,
    //                         mergedMeshData.transforms.position.y,
    //                         mergedMeshData.transforms.position.z
    //                     );
    //                     mesh.rotation = new BABYLON.Vector3(
    //                         mergedMeshData.transforms.rotation.x,
    //                         mergedMeshData.transforms.rotation.y,
    //                         mergedMeshData.transforms.rotation.z
    //                     );
    //                     mesh.scaling = new BABYLON.Vector3(
    //                         mergedMeshData.transforms.scaling.x,
    //                         mergedMeshData.transforms.scaling.y,
    //                         mergedMeshData.transforms.scaling.z
    //                     );
    //                 }

    //                 // Apply material and settings
    //                 mesh.material = sharedMaterial;
    //                 mesh.isPickable = false;
    //                 mesh.isVisible = true;

    //                 // Store metadata
    //                 mesh.metadata = {
    //                     nodeNumber: nodeNumber,
    //                     originalMeshCount: mergedMeshData.metadata.originalMeshCount
    //                 };

    //                 console.log(`Created mesh for node ${nodeNumber} with ${mergedMeshData.metadata.originalMeshCount} original meshes`);
    //             } catch (error) {
    //                 console.error(`Error creating mesh from merged data:`, error);
    //             }
    //         }

    //         // Position camera to fit the scene
    //         if (scene.activeCamera && octreeData.data.bounds) {
    //             fitCameraToOctree(scene.activeCamera, octreeData.data.bounds.max, octreeData.data.bounds.min);
    //         }

    //         setStatus('Successfully loaded all merged low-poly meshes');
    //         scene.render();

    //     } catch (error) {
    //         console.error('Error loading merged lpoly models:', error);
    //         setStatus(`Error: ${error.message}`);
    //     } finally {
    //         setIsLoadingLpoly(false);
    //     }
    // };


    // Helper function to find node by number in octree
    const findNodeByNumber = (block, targetNodeNumber) => {
        if (!block) return null;

        if (block.properties.nodeNumber === targetNodeNumber) {
            return block;
        }

        if (block.relationships && block.relationships.childBlocks) {
            for (const childBlock of block.relationships.childBlocks) {
                const found = findNodeByNumber(childBlock, targetNodeNumber);
                if (found) return found;
            }
        }

        return null;
    };

    const loadLPolyMeshes = async () => {
        if (!scene || !engine) {
            setStatus('Error: Scene or Engine not initialized');
            return;
        }

        setIsLoadingLpoly(true);
        setStatus('Starting to load merged low-poly models...');

        try {
            const db = await initDB();

            // Create shared material
            const sharedMaterial = new BABYLON.StandardMaterial("sharedMaterial", scene);
            sharedMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
            sharedMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            sharedMaterial.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            sharedMaterial.backFaceCulling = false;

            // Get octree data first
            const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
            const octreeData = await octreeStore.get('mainOctree');

            if (!octreeData || !octreeData.data) {
                throw new Error('No octree data found');
            }

            // Create root wireframe box for visualization
            createWireframeBox(octreeData.data.bounds);

            // Get all merged lpoly meshes
            const mergedStore = db.transaction('mergedlpoly', 'readonly').objectStore('mergedlpoly');
            const allMergedMeshes = await mergedStore.getAll();

            if (!allMergedMeshes || allMergedMeshes.length === 0) {
                throw new Error('No merged meshes found in database');
            }

            setStatus(`Found ${allMergedMeshes.length} merged meshes`);

            // Process each merged mesh
            for (const mergedMeshData of allMergedMeshes) {
                try {
                    // Extract node number from mesh name
                    const nodeNumber = parseInt(mergedMeshData.name.split('_')[2]);

                    // Find corresponding node in octree
                    const targetNode = findNodeByNumber(octreeData.data.blockHierarchy, nodeNumber);

                    if (!targetNode) {
                        console.warn(`Node ${nodeNumber} not found in octree`);
                        continue;
                    }

                    // Create mesh
                    const mesh = new BABYLON.Mesh(mergedMeshData.name, scene);

                    // Apply vertex data
                    const vertexData = new BABYLON.VertexData();
                    vertexData.positions = new Float32Array(mergedMeshData.vertexData.positions);
                    vertexData.indices = new Uint32Array(mergedMeshData.vertexData.indices);

                    if (mergedMeshData.vertexData.normals) {
                        vertexData.normals = new Float32Array(mergedMeshData.vertexData.normals);
                    }

                    vertexData.applyToMesh(mesh);

                    // Apply transforms
                    if (mergedMeshData.transforms.worldMatrix) {
                        const matrix = BABYLON.Matrix.FromArray(mergedMeshData.transforms.worldMatrix);
                        mesh.setPreTransformMatrix(matrix);
                    } else {
                        mesh.position = new BABYLON.Vector3(
                            mergedMeshData.transforms.position.x,
                            mergedMeshData.transforms.position.y,
                            mergedMeshData.transforms.position.z
                        );
                        mesh.rotation = new BABYLON.Vector3(
                            mergedMeshData.transforms.rotation.x,
                            mergedMeshData.transforms.rotation.y,
                            mergedMeshData.transforms.rotation.z
                        );
                        mesh.scaling = new BABYLON.Vector3(
                            mergedMeshData.transforms.scaling.x,
                            mergedMeshData.transforms.scaling.y,
                            mergedMeshData.transforms.scaling.z
                        );
                    }

                    // Apply material
                    mesh.material = sharedMaterial;
                    mesh.isPickable = false;
                    mesh.isVisible = true;

                    // Store metadata including node information
                    mesh.metadata = {
                        nodeNumber: nodeNumber,
                        originalMeshCount: mergedMeshData.metadata.originalMeshCount,
                        nodeBounds: targetNode.bounds
                    };

                    // // Create wireframe box for the node (optional, for visualization)
                    // const nodeBox = createWireframeBox({
                    //     min: new BABYLON.Vector3(
                    //         targetNode.bounds.min.x,
                    //         targetNode.bounds.min.y,
                    //         targetNode.bounds.min.z
                    //     ),
                    //     max: new BABYLON.Vector3(
                    //         targetNode.bounds.max.x,
                    //         targetNode.bounds.max.y,
                    //         targetNode.bounds.max.z
                    //     )
                    // });

                    // if (nodeBox) {
                    //     nodeBox.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
                    //     nodeBox.material.alpha = 0.3;
                    // }

                    console.log(`Created mesh for node ${nodeNumber} with bounds:`, targetNode.bounds);
                } catch (error) {
                    console.error(`Error creating mesh from merged data:`, error);
                }
            }

            // Position camera to fit the scene
            if (scene.activeCamera && octreeData.data.bounds) {
                fitCameraToOctree(scene.activeCamera, octreeData.data.bounds.max, octreeData.data.bounds.min);
            }

            setStatus('Successfully loaded all merged low-poly meshes in their respective nodes');
            scene.render();

        } catch (error) {
            console.error('Error loading merged lpoly models:', error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setIsLoadingLpoly(false);
        }
    };


    const loadModelsFromOctree = async () => {
        if (!scene || !engine) {
            setStatus('Error: Scene or Engine not initialized');
            return;
        }

        setIsLoading(true);
        setStatus('Starting to load models...');

        try {
            const db = await initDB();

            // Create shared material
            const sharedMaterial = new BABYLON.StandardMaterial("sharedMaterial", scene);
            sharedMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
            sharedMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            sharedMaterial.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            sharedMaterial.backFaceCulling = false;

            const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
            const octreeData = await octreeStore.get('mainOctree');

            if (!octreeData || !octreeData.data) {
                throw new Error('No octree data found');
            }

            createWireframeBox(octreeData.data.bounds);

            const depth4Nodes = [];
            const getDepth4Nodes = (block, depth = 0) => {
                if (!block) return;
                if (depth === TARGET_DEPTH && block.meshInfos && block.meshInfos.length > 0) {
                    depth4Nodes.push({
                        nodeNumber: block.properties.nodeNumber,
                        meshIds: block.meshInfos.map(info => info.id),
                        bounds: block.bounds
                    });
                }
                if (block.relationships && block.relationships.childBlocks) {
                    block.relationships.childBlocks.forEach(child =>
                        getDepth4Nodes(child, depth + 1)
                    );
                }
            };

            getDepth4Nodes(octreeData.data.blockHierarchy);
            setStatus(`Found ${depth4Nodes.length} nodes at depth 4`);

            const lmodelsStore = db.transaction('lmodels', 'readonly').objectStore('lmodels');
            const lowPolyModels = await lmodelsStore.getAll();

            // Array to collect all merged mesh data
            const mergedMeshesData = [];

            // Process each depth 4 node separately
            for (const node of depth4Nodes) {
                const meshesToMerge = [];

                // Find qualifying meshes for this node
                for (const meshId of node.meshIds) {
                    const lowPolyMatch = lowPolyModels.find(lmodel =>
                        lmodel.fileName.includes(meshId) ||
                        lmodel.data.metadata.id.includes(meshId)
                    );
                    // && lowPolyMatch.data.metadata.screenCoverage > 0.1
                    if (lowPolyMatch && lowPolyMatch.data.metadata.screenCoverage > 0.1) {
                        try {
                            const tempMesh = new BABYLON.Mesh("temp", scene);
                            const vertexData = new BABYLON.VertexData();
                            vertexData.positions = new Float32Array(lowPolyMatch.data.vertexData.positions);
                            vertexData.indices = new Uint32Array(lowPolyMatch.data.vertexData.indices);
                            if (lowPolyMatch.data.vertexData.normals) {
                                vertexData.normals = new Float32Array(lowPolyMatch.data.vertexData.normals);
                            }
                            vertexData.applyToMesh(tempMesh);

                            if (lowPolyMatch.data.transforms.worldMatrix) {
                                const matrix = BABYLON.Matrix.FromArray(lowPolyMatch.data.transforms.worldMatrix);
                                tempMesh.setPreTransformMatrix(matrix);
                            } else {
                                tempMesh.position = new BABYLON.Vector3(
                                    lowPolyMatch.data.transforms.position.x,
                                    lowPolyMatch.data.transforms.position.y,
                                    lowPolyMatch.data.transforms.position.z
                                );
                                tempMesh.rotation = new BABYLON.Vector3(
                                    lowPolyMatch.data.transforms.rotation.x,
                                    lowPolyMatch.data.transforms.rotation.y,
                                    lowPolyMatch.data.transforms.rotation.z
                                );
                                tempMesh.scaling = new BABYLON.Vector3(
                                    lowPolyMatch.data.transforms.scaling.x,
                                    lowPolyMatch.data.transforms.scaling.y,
                                    lowPolyMatch.data.transforms.scaling.z
                                );
                            }

                            meshesToMerge.push(tempMesh);
                        } catch (error) {
                            console.error(`Error creating temporary mesh for ${meshId}:`, error);
                        }
                    }
                }

                // If we have meshes to merge for this node
                if (meshesToMerge.length > 0) {
                    try {
                        const mergedMesh = BABYLON.Mesh.MergeMeshes(
                            meshesToMerge,
                            true,
                            true,
                            undefined,
                            false,
                            true
                        );

                        if (mergedMesh) {
                            mergedMesh.name = `lpoly_node_${node.nodeNumber}`;
                            mergedMesh.material = sharedMaterial;
                            mergedMesh.isPickable = false;
                            mergedMesh.isVisible = true;
                            mergedMesh.metadata = {
                                nodeNumber: node.nodeNumber,
                                originalMeshCount: meshesToMerge.length
                            };

                            // Collect merged mesh data
                            const mergedMeshData = collectMergedMeshData(mergedMesh);
                            mergedMeshesData.push(mergedMeshData);

                            console.log(`Created merged mesh for node ${node.nodeNumber} from ${meshesToMerge.length} meshes`);
                        }

                        // Clean up temporary meshes
                        meshesToMerge.forEach(mesh => {
                            if (mesh) mesh.dispose();
                        });

                    } catch (error) {
                        console.error(`Error merging meshes for node ${node.nodeNumber}:`, error);
                    }
                }
            }

            // Store merged mesh data in IndexedDB
            if (mergedMeshesData.length > 0) {
                const mergedStore = db.transaction('mergedlpoly', 'readwrite').objectStore('mergedlpoly');

                for (const meshData of mergedMeshesData) {
                    await mergedStore.put(meshData);
                }

                console.log(`Stored ${mergedMeshesData.length} merged meshes in IndexedDB`);
                setStatus(`Stored ${mergedMeshesData.length} merged meshes in database`);
            }

            // Position camera
            if (scene.activeCamera && octreeData.data.bounds) {
                fitCameraToOctree(scene.activeCamera, octreeData.data.bounds.max, octreeData.data.bounds.min);
            }

            scene.render();

        } catch (error) {
            console.error('Error loading models:', error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (


        <div className="p-4 bg-gray-100 rounded-lg">
            <button
                onClick={loadModelsFromOctree}
                disabled={isLoading || !scene}
                className={`mb-4 p-2 ${isLoading || !scene
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                    } text-white rounded`}
            >
                {isLoading ? 'Loading...' : 'Load Models'}
            </button>

            <button
                onClick={loadLPolyMeshes}
                disabled={isLoadingLpoly || !scene}
                className={`mb-4 p-2 ${isLoadingLpoly || !scene
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                    } text-white rounded`}
            >
                {isLoadingLpoly ? 'Loading Lpoly...' : 'Load Lpoly'}
            </button>

            <div className="mt-2">
                <p className={`text-sm ${status.includes('Error')
                    ? 'text-red-500'
                    : 'text-green-500'
                    }`}>
                    {status}
                </p>
            </div>
        </div>
    );
};

export default Loadindexdb;



// import React, { useEffect, useState } from 'react';
// import { openDB } from 'idb';
// import * as BABYLON from '@babylonjs/core';

// const Loadindexdb = ({ engine, scene }) => {
//     const [status, setStatus] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     const DB_NAME = 'ModelStorage';
//     const DB_VERSION = 2;
//     const TARGET_DEPTH = 4;

//     // Function to create wireframe box for octree visualization
//     // const createWireframeBox = (bounds, depth = 0) => {
//     //     if (!scene) return null;

//     //     const min = bounds.min;
//     //     const max = bounds.max;

//     //     const size = {
//     //         width: Math.abs(max.x - min.x),
//     //         height: Math.abs(max.y - min.y),
//     //         depth: Math.abs(max.z - min.z)
//     //     };

//     //     const center = new BABYLON.Vector3(
//     //         (max.x + min.x) / 2,
//     //         (max.y + min.y) / 2,
//     //         (max.z + min.z) / 2
//     //     );

//     //     const box = BABYLON.MeshBuilder.CreateBox(
//     //         `octreeBox_${depth}_${Date.now()}`,
//     //         size,
//     //         scene
//     //     );

//     //     box.position = center;
//     //     const material = new BABYLON.StandardMaterial(`wireframeMat_${depth}`, scene);
//     //     material.wireframe = true;
//     //     material.alpha = 0.3; // Make wireframe semi-transparent

//     //     switch (depth) {
//     //         case 0: material.emissiveColor = new BABYLON.Color3(1, 0, 0); break;
//     //         case 1: material.emissiveColor = new BABYLON.Color3(0, 1, 0); break;
//     //         case 2: material.emissiveColor = new BABYLON.Color3(0, 0, 1); break;
//     //         case 3: material.emissiveColor = new BABYLON.Color3(1, 1, 0); break;
//     //         default: material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
//     //     }

//     //     box.material = material;
//     //     box.isPickable = false;
//     //     return box;
//     // };


//     const createWireframeBox = (bounds) => {
//         if (!scene) return null;

//         const min = bounds.min;
//         const max = bounds.max;

//         const size = {
//             width: Math.abs(max.x - min.x),
//             height: Math.abs(max.y - min.y),
//             depth: Math.abs(max.z - min.z)
//         };

//         const center = new BABYLON.Vector3(
//             (max.x + min.x) / 2,
//             (max.y + min.y) / 2,
//             (max.z + min.z) / 2
//         );

//         const box = BABYLON.MeshBuilder.CreateBox(
//             "rootOctreeBox",
//             size,
//             scene
//         );

//         box.position = center;
//         const material = new BABYLON.StandardMaterial("rootWireframeMat", scene);
//         material.wireframe = true;
//         material.alpha = 0.3;
//         material.emissiveColor = new BABYLON.Color3(1, 0, 0); // Red color for root box

//         box.material = material;
//         box.isPickable = false;
//         return box;
//     };


//     // Function to visualize octree structure
//     const visualizeOctreeStructure = (block, depth = 0) => {
//         if (!block || !block.bounds) return;
//         // Only create wireframe boxes for depths 0-3
//         if (depth == 1) {
//             createWireframeBox(block.bounds, depth);
//         }
//         if (block.relationships && block.relationships.childBlocks) {
//             block.relationships.childBlocks.forEach(child => {
//                 visualizeOctreeStructure(child, depth + 1);
//             });
//         }
//     };

//     const calculateScreenCoverage = (mesh, camera, engine) => {
//         const boundingBox = mesh.getBoundingInfo().boundingBox;
//         const centerWorld = boundingBox.centerWorld;
//         const size = boundingBox.maximumWorld.subtract(boundingBox.minimumWorld);
//         // console.log(size);

//         // Project the center of the bounding box to screen coordinates
//         const centerScreen = BABYLON.Vector3.Project(
//             centerWorld,
//             BABYLON.Matrix.Identity(),
//             scene.getTransformMatrix(),
//             camera.viewport.toGlobal(
//                 engine.getRenderWidth(),
//                 engine.getRenderHeight()
//             )
//         );

//         // Find the max dimension and take the average of the other two
//         const dimensions = [size.x, size.y, size.z];
//         const maxDimension = Math.max(...dimensions);
//         const otherDimensions = dimensions.filter(dim => dim !== maxDimension);
//         const averageOfOthers = otherDimensions.reduce((a, b) => a + b, 0) / otherDimensions.length;

//         // Calculate radius in screen space
//         const radiusScreen = averageOfOthers / camera.radius;
//         return radiusScreen * engine.getRenderWidth();
//     };

//     // Function to create mesh from vertex data with verified transform application
//     const createMeshFromData = (meshData, nodeNumber) => {
//         try {
//             if (!scene) {
//                 throw new Error('Scene is not initialized');
//             }

//             console.log('Creating mesh from data:', {
//                 name: meshData.data.name,
//                 vertexCount: meshData.data.vertexData.positions.length / 3,
//                 indexCount: meshData.data.vertexData.indices.length
//             });

//             // Create mesh with unique name
//             const meshName = `${meshData.data.name}_${nodeNumber}_${Date.now()}`;
//             const mesh = new BABYLON.Mesh(meshName, scene);

//             // Create and apply vertex data
//             const vertexData = new BABYLON.VertexData();
//             vertexData.positions = new Float32Array(meshData.data.vertexData.positions);
//             vertexData.indices = new Uint32Array(meshData.data.vertexData.indices);

//             if (meshData.data.vertexData.normals && meshData.data.vertexData.normals.length > 0) {
//                 vertexData.normals = new Float32Array(meshData.data.vertexData.normals);
//             } else {
//                 // Compute normals if not provided
//                 BABYLON.VertexData.ComputeNormals(
//                     vertexData.positions,
//                     vertexData.indices,
//                     vertexData.normals
//                 );
//             }

//             // Apply vertex data to mesh
//             vertexData.applyToMesh(mesh, true);

//             // Apply transforms using world matrix
//             if (meshData.data.transforms.worldMatrix) {
//                 const matrix = BABYLON.Matrix.FromArray(meshData.data.transforms.worldMatrix);
//                 mesh.setPreTransformMatrix(matrix);
//             } else {
//                 // Fallback to individual transforms if world matrix not available
//                 mesh.position = new BABYLON.Vector3(
//                     meshData.data.transforms.position.x,
//                     meshData.data.transforms.position.y,
//                     meshData.data.transforms.position.z
//                 );
//                 mesh.rotation = new BABYLON.Vector3(
//                     meshData.data.transforms.rotation.x,
//                     meshData.data.transforms.rotation.y,
//                     meshData.data.transforms.rotation.z
//                 );
//                 mesh.scaling = new BABYLON.Vector3(
//                     meshData.data.transforms.scaling.x,
//                     meshData.data.transforms.scaling.y,
//                     meshData.data.transforms.scaling.z
//                 );
//             }

//             // Create and apply material
//             const material = new BABYLON.StandardMaterial(meshName + "_material", scene);

//             if (meshData.data.metadata.material && meshData.data.metadata.material.diffuseColor) {
//                 material.diffuseColor = new BABYLON.Color3(
//                     meshData.data.metadata.material.diffuseColor.r,
//                     meshData.data.metadata.material.diffuseColor.g,
//                     meshData.data.metadata.material.diffuseColor.b
//                 );
//             } else {
//                 // Default material properties
//                 material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//                 material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
//                 material.emissiveColor = new BABYLON.Color3(0, 0, 0);
//                 material.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
//             }

//             // const sharedMaterial = new BABYLON.StandardMaterial("sharedMaterial", scene);
//             // sharedMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//             // sharedMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
//             // sharedMaterial.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
//             // sharedMaterial.backFaceCulling = true;

//             // Ensure material is not wireframe
//             material.wireframe = false;
//             material.backFaceCulling = true;

//             mesh.material = material;
//             // mesh.material = sharedMaterial;

//             // Ensure mesh is visible and enabled
//             mesh.isVisible = true;
//             mesh.setEnabled(true);

//             // Store metadata
//             mesh.metadata = {
//                 ...meshData.data.metadata,
//                 originalId: meshData.fileName,
//                 nodeNumber: nodeNumber
//             };

//             console.log(`Created mesh: ${meshName}`, {
//                 position: mesh.position,
//                 isVisible: mesh.isVisible,
//                 isEnabled: mesh.isEnabled,
//                 vertexCount: mesh.getTotalVertices(),
//                 faceCount: mesh.getTotalIndices() / 3
//             });

//             return mesh;
//         } catch (error) {
//             console.error('Error creating mesh:', error);
//             return null;
//         }
//     };

//     // const fitCameraToOctree = (camera, maximum , minimum) => {
//     //     const center = BABYLON.Vector3.Center(minimum, maximum);  // Calculate the center of the bounding box
//     //     const size = maximum.subtract(minimum);                   // Get the size vector (width, height, depth)
//     //     const maxDimension = Math.max(size.x, size.y, size.z);    // Find the largest dimension of the bounding box

//     //     camera.setTarget(center);                                 // Center the camera's target on the bounding box center

//     //     // Calculate distance needed to fit bounding box into view
//     //     const fovRadians = camera.fov || (Math.PI / 4); // Camera field of view (default to 45 degrees if undefined)
//     //     const distanceToFit = maxDimension / (2 * Math.tan(fovRadians / 2)); // Distance calculation based on FOV

//     //     // Set camera properties to ensure it fits the bounding box in view
//     //     camera.radius = distanceToFit;
//     //     console.log(distanceToFit);
//     //     // Slightly increase to give padding around the bounding box
//     //     camera.alpha = Math.PI / 4;           // Set initial camera angle horizontally
//     //     camera.beta = Math.PI / 3;            // Set initial camera angle vertically

//     //     // maxDistance = distanceToFit

//     //     // Fine-tune camera controls
//     //     camera.wheelPrecision = 50;                    // Adjust zoom speed with mouse wheel
//     //     camera.minZ = maxDimension * 0.01;             // Near clipping plane
//     //     camera.maxZ = maxDimension * 1000;             // Far clipping plane


//     //     // if (!(camera instanceof BABYLON.ArcRotateCamera)) return;

//     //     // const dimensions = {
//     //     //     width: bounds.max.x - bounds.min.x,
//     //     //     height: bounds.max.y - bounds.min.y,
//     //     //     depth: bounds.max.z - bounds.min.z
//     //     // };

//     //     // const center = new BABYLON.Vector3(
//     //     //     (bounds.max.x + bounds.min.x) / 2,
//     //     //     (bounds.max.y + bounds.min.y) / 2,
//     //     //     (bounds.max.z + bounds.min.z) / 2
//     //     // );

//     //     // const maxDimension = Math.max(dimensions.width, dimensions.height, dimensions.depth);
//     //     // const distanceFactor = 1.5;
//     //     // const optimalDistance = (maxDimension / 2) / Math.tan(camera.fov / 2) * distanceFactor;

//     //     // camera.setTarget(center);
//     //     // camera.radius = optimalDistance;
//     //     // camera.alpha = Math.PI / 4;
//     //     // camera.beta = Math.PI / 3;
//     //     // camera.rebuildAnglesAndRadius();
//     // };

//     const fitCameraToOctree = (camera, maximum, minimum) => {
//         // Convert to Vector3 if they aren't already
//         const maxVector = (maximum instanceof BABYLON.Vector3)
//             ? maximum
//             : new BABYLON.Vector3(maximum.x, maximum.y, maximum.z);

//         const minVector = (minimum instanceof BABYLON.Vector3)
//             ? minimum
//             : new BABYLON.Vector3(minimum.x, minimum.y, minimum.z);

//         const center = BABYLON.Vector3.Center(minVector, maxVector);
//         const size = maxVector.subtract(minVector);
//         const maxDimension = Math.max(size.x, size.y, size.z);

//         camera.setTarget(center);

//         const fovRadians = camera.fov || (Math.PI / 4);
//         const distanceToFit = maxDimension / (2 * Math.tan(fovRadians / 2));

//         camera.radius = distanceToFit;
//         console.log(distanceToFit);
//         camera.alpha = Math.PI / 4;
//         camera.beta = Math.PI / 3;

//         camera.wheelPrecision = 50;
//         camera.minZ = maxDimension * 0.01;
//         camera.maxZ = maxDimension * 1000;
//     };

//     // const loadModelsFromOctree = async () => {
//     //     if (!scene || !engine) {
//     //         setStatus('Error: Scene or Engine not initialized');
//     //         return;
//     //     }

//     //     setIsLoading(true);
//     //     setStatus('Starting to load models...');

//     //     try {
//     //         const db = await openDB(DB_NAME, DB_VERSION);

//     //         // Get octree data
//     //         const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
//     //         const octreeData = await octreeStore.get('mainOctree');

//     //         if (!octreeData || !octreeData.data) {
//     //             throw new Error('No octree data found');
//     //         }

//     //         setStatus('Creating octree visualization...');
//     //         visualizeOctreeStructure(octreeData.data.blockHierarchy);

//     //         // Get depth 4 nodes
//     //         const depth4Nodes = [];
//     //         const getDepth4Nodes = (block, depth = 0) => {
//     //             if (!block) return;
//     //             if (depth === TARGET_DEPTH && block.meshInfos && block.meshInfos.length > 0) {
//     //                 depth4Nodes.push({
//     //                     nodeNumber: block.properties.nodeNumber,
//     //                     meshIds: block.meshInfos.map(info => info.id),
//     //                     bounds: block.bounds
//     //                 });
//     //             }
//     //             if (block.relationships && block.relationships.childBlocks) {
//     //                 block.relationships.childBlocks.forEach(child =>
//     //                     getDepth4Nodes(child, depth + 1)
//     //                 );
//     //             }
//     //         };

//     //         getDepth4Nodes(octreeData.data.blockHierarchy);
//     //         console.log('Found depth 4 nodes:', depth4Nodes);

//     //         // Get low-poly models
//     //         const lmodelsStore = db.transaction('lmodels', 'readonly').objectStore('lmodels');
//     //         const lowPolyModels = await lmodelsStore.getAll();

//     //         setStatus(`Loading meshes from ${depth4Nodes.length} nodes...`);
//     //         let createdMeshCount = 0;

//     //         for (const node of depth4Nodes) {
//     //             for (const meshId of node.meshIds) {
//     //                 const lowPolyMatch = lowPolyModels.find(lmodel =>
//     //                     lmodel.fileName.includes(meshId) ||
//     //                     lmodel.data.metadata.id.includes(meshId)
//     //                 );

//     //                 if (lowPolyMatch) {
//     //                     const mesh = createMeshFromData(lowPolyMatch, node.nodeNumber);
//     //                     if (mesh) {
//     //                         createdMeshCount++;
//     //                         setStatus(`Created ${createdMeshCount} meshes...`);
//     //                     }
//     //                 }
//     //             }
//     //         }

//     //         setStatus(`Successfully loaded ${createdMeshCount} meshes`);

//     //         // Update camera position
//     //         // if (scene.activeCamera && octreeData.data.bounds) {
//     //         //     const bounds = octreeData.data.bounds;
//     //         //     const center = new BABYLON.Vector3(
//     //         //         (bounds.max.x + bounds.min.x) / 2,
//     //         //         (bounds.max.y + bounds.min.y) / 2,
//     //         //         (bounds.max.z + bounds.min.z) / 2
//     //         //     );
//     //         //     const radius = BABYLON.Vector3.Distance(
//     //         //         new BABYLON.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
//     //         //         new BABYLON.Vector3(bounds.max.x, bounds.max.y, bounds.max.z)
//     //         //     ) / 2;

//     //         //     if (scene.activeCamera instanceof BABYLON.ArcRotateCamera) {
//     //         //         scene.activeCamera.setTarget(center);
//     //         //         scene.activeCamera.radius = radius * 2;
//     //         //     }
//     //         // }
//     //         if (scene.activeCamera && octreeData.data.bounds) {
//     //             fitCameraToOctree(scene.activeCamera, octreeData.data.bounds.max, octreeData.data.bounds.min);
//     //         }

//     //         // Calculate screen coverage for all meshes
//     //         const meshCoverages = createdMeshes.map(mesh => {
//     //             const coverage = calculateScreenCoverage(mesh, scene.activeCamera, engine);
//     //             // return {
//     //             //     meshName: mesh.name,
//     //             //     nodeNumber: mesh.metadata.nodeNumber,
//     //             //     coverage: coverage,
//     //             //     position: mesh.position.toString(),
//     //             //     vertexCount: mesh.getTotalVertices(),
//     //             //     faceCount: mesh.getTotalIndices() / 3
//     //             // };
//     //             return coverage
//     //         });

//     //         // Log screen coverage information
//     //         console.log('Mesh Screen Coverages:', meshCoverages);

//     //         scene.render();

//     //     } catch (error) {
//     //         console.error('Error loading models:', error);
//     //         setStatus(`Error: ${error.message}`);
//     //     } finally {
//     //         setIsLoading(false);
//     //     }
//     // };


//     const loadModelsFromOctree = async () => {
//         if (!scene || !engine) {
//             setStatus('Error: Scene or Engine not initialized');
//             return;
//         }

//         setIsLoading(true);
//         setStatus('Starting to load models...');

//         try {
//             const db = await openDB(DB_NAME, DB_VERSION);

//             // Get octree data
//             const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
//             const octreeData = await octreeStore.get('mainOctree');

//             if (!octreeData || !octreeData.data) {
//                 throw new Error('No octree data found');
//             }

//             // setStatus('Creating octree visualization...');
//             // visualizeOctreeStructure(octreeData.data.blockHierarchy);

//             // Get depth 4 nodes
//             const depth4Nodes = [];
//             const getDepth4Nodes = (block, depth = 0) => {
//                 if (!block) return;
//                 if (depth === TARGET_DEPTH && block.meshInfos && block.meshInfos.length > 0) {
//                     depth4Nodes.push({
//                         nodeNumber: block.properties.nodeNumber,
//                         meshIds: block.meshInfos.map(info => info.id),
//                         bounds: block.bounds
//                     });
//                 }
//                 if (block.relationships && block.relationships.childBlocks) {
//                     block.relationships.childBlocks.forEach(child =>
//                         getDepth4Nodes(child, depth + 1)
//                     );
//                 }
//             };

//             getDepth4Nodes(octreeData.data.blockHierarchy);
//             console.log('Found depth 4 nodes:', depth4Nodes);

//             // Get low-poly models
//             const lmodelsStore = db.transaction('lmodels', 'readonly').objectStore('lmodels');
//             const lowPolyModels = await lmodelsStore.getAll();

//             setStatus(`Loading meshes from ${depth4Nodes.length} nodes...`);
//             let createdMeshCount = 0;
//             const createdMeshes = []; // Array to store created meshes

//             // Create meshes and store them in array
//             for (const node of depth4Nodes) {
//                 for (const meshId of node.meshIds) {
//                     const lowPolyMatch = lowPolyModels.find(lmodel =>
//                         lmodel.fileName.includes(meshId) ||
//                         lmodel.data.metadata.id.includes(meshId)
//                     );

//                     if (lowPolyMatch) {
//                         const mesh = createMeshFromData(lowPolyMatch, node.nodeNumber);
//                         if (mesh) {
//                             createdMeshes.push(mesh);
//                             createdMeshCount++;
//                             setStatus(`Created ${createdMeshCount} meshes...`);
//                         }
//                     }
//                 }
//             }

//             // Update camera position
//             if (scene.activeCamera && octreeData.data.bounds) {
//                 fitCameraToOctree(scene.activeCamera, octreeData.data.bounds.max, octreeData.data.bounds.min);
//             }

//             // Calculate screen coverage for all meshes
//             const meshCoverages = createdMeshes.map(mesh => {
//                 const coverage = calculateScreenCoverage(mesh, scene.activeCamera, engine);
//                 return {
//                     meshName: mesh.name,
//                     nodeNumber: mesh.metadata.nodeNumber,
//                     coverage: coverage,
//                     position: mesh.position.toString(),
//                     vertexCount: mesh.getTotalVertices(),
//                     faceCount: mesh.getTotalIndices() / 3
//                 };
//                 // return coverage
//             });

//             // Log screen coverage information
//             console.log('Mesh Screen Coverages:', meshCoverages);

//             // Sort meshes by screen coverage
//             const sortedCoverages = [...meshCoverages].sort((a, b) => b.coverage - a.coverage);
//             console.log('Sorted Mesh Coverages (largest to smallest):', sortedCoverages);

//             // const updateMeshVisibility = () => {
//             //     if (!scene || !scene.activeCamera) return;

//             // meshesRef.current.forEach((meshes, nodeNumber) => {


//             // createdMeshes.forEach(mesh => {
//             //     const coverage = calculateScreenCoverage(mesh, scene.activeCamera, engine);
//             //     mesh.isVisible = coverage >= 0.5; // 1% screen coverage threshold
//             // });


//             // });
//             // };

//             // // Calculate statistics
//             // const totalCoverage = meshCoverages.reduce((sum, item) => sum + item.coverage, 0);
//             // const averageCoverage = totalCoverage / meshCoverages.length;
//             // const maxCoverage = Math.max(...meshCoverages.map(item => item.coverage));
//             // const minCoverage = Math.min(...meshCoverages.map(item => item.coverage));

//             // console.log('Coverage Statistics:', {
//             //     totalCoverage,
//             //     averageCoverage,
//             //     maxCoverage,
//             //     minCoverage,
//             //     numberOfMeshes: meshCoverages.length
//             // });

//             // // Optional: Add coverage information to mesh metadata
//             // createdMeshes.forEach((mesh, index) => {
//             //     mesh.metadata.screenCoverage = meshCoverages[index].coverage;
//             // });

//             setStatus(`Successfully loaded ${createdMeshCount} meshes and calculated screen coverage`);
//             scene.render();

//         } catch (error) {
//             console.error('Error loading models:', error);
//             setStatus(`Error: ${error.message}`);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // const loadModelsFromOctree = async () => {
//     //     if (!scene || !engine) {
//     //         setStatus('Error: Scene or Engine not initialized');
//     //         return;
//     //     }

//     //     setIsLoading(true);
//     //     setStatus('Starting to load models...');

//     //     try {
//     //         const db = await openDB(DB_NAME, DB_VERSION);

//     //         // Create a single shared material for all meshes
//     //         const sharedMaterial = new BABYLON.StandardMaterial("sharedMaterial", scene);
//     //         sharedMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//     //         sharedMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
//     //         sharedMaterial.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);
//     //         sharedMaterial.backFaceCulling = true;

//     //         // Modify createMeshFromData to use shared material
//     //         const createMeshFromData = (meshData, nodeNumber) => {
//     //             try {
//     //                 if (!scene) {
//     //                     throw new Error('Scene is not initialized');
//     //                 }

//     //                 const meshName = `${meshData.data.name}_${nodeNumber}_${Date.now()}`;
//     //                 const mesh = new BABYLON.Mesh(meshName, scene);

//     //                 const vertexData = new BABYLON.VertexData();
//     //                 vertexData.positions = new Float32Array(meshData.data.vertexData.positions);
//     //                 vertexData.indices = new Uint32Array(meshData.data.vertexData.indices);

//     //                 if (meshData.data.vertexData.normals && meshData.data.vertexData.normals.length > 0) {
//     //                     vertexData.normals = new Float32Array(meshData.data.vertexData.normals);
//     //                 } else {
//     //                     BABYLON.VertexData.ComputeNormals(
//     //                         vertexData.positions,
//     //                         vertexData.indices,
//     //                         vertexData.normals
//     //                     );
//     //                 }

//     //                 vertexData.applyToMesh(mesh, true);

//     //                 // Apply transforms
//     //                 if (meshData.data.transforms.worldMatrix) {
//     //                     const matrix = BABYLON.Matrix.FromArray(meshData.data.transforms.worldMatrix);
//     //                     mesh.setPreTransformMatrix(matrix);
//     //                 } else {
//     //                     mesh.position = new BABYLON.Vector3(
//     //                         meshData.data.transforms.position.x,
//     //                         meshData.data.transforms.position.y,
//     //                         meshData.data.transforms.position.z
//     //                     );
//     //                     mesh.rotation = new BABYLON.Vector3(
//     //                         meshData.data.transforms.rotation.x,
//     //                         meshData.data.transforms.rotation.y,
//     //                         meshData.data.transforms.rotation.z
//     //                     );
//     //                     mesh.scaling = new BABYLON.Vector3(
//     //                         meshData.data.transforms.scaling.x,
//     //                         meshData.data.transforms.scaling.y,
//     //                         meshData.data.transforms.scaling.z
//     //                     );
//     //                 }

//     //                 // Use the shared material
//     //                 mesh.material = sharedMaterial;

//     //                 mesh.isVisible = true;
//     //                 mesh.setEnabled(true);

//     //                 mesh.metadata = {
//     //                     ...meshData.data.metadata,
//     //                     originalId: meshData.fileName,
//     //                     nodeNumber: nodeNumber
//     //                 };

//     //                 return mesh;
//     //             } catch (error) {
//     //                 console.error('Error creating mesh:', error);
//     //                 return null;
//     //             }
//     //         };

//     //         // Rest of your loading code...
//     //         const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
//     //         const octreeData = await octreeStore.get('mainOctree');
//     //         // ... rest of the function remains the same
//     //     } catch (error) {
//     //         console.error('Error loading models:', error);
//     //         setStatus(`Error: ${error.message}`);
//     //     } finally {
//     //         setIsLoading(false);
//     //     }
//     // };
//     return (
//         <div className="p-4 bg-gray-100 rounded-lg">
//             <button
//                 onClick={loadModelsFromOctree}
//                 disabled={isLoading || !scene}
//                 className={`mb-4 p-2 ${isLoading || !scene
//                     ? 'bg-gray-400 cursor-not-allowed'
//                     : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded`}
//             >
//                 {isLoading ? 'Loading...' : 'Load Models'}
//             </button>

//             <div className="mt-2">
//                 <p className={`text-sm ${status.includes('Error')
//                     ? 'text-red-500'
//                     : 'text-green-500'
//                     }`}>
//                     {status}
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Loadindexdb;



// import React, { useEffect, useState } from 'react';
// import { openDB } from 'idb';
// import * as BABYLON from '@babylonjs/core';

// const Loadindexdb = ({ engine, scene }) => {
//     const [status, setStatus] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     const DB_NAME = 'ModelStorage';
//     const DB_VERSION = 2;
//     const TARGET_DEPTH = 4;

//     // Function to create wireframe box
//     const createWireframeBox = (bounds, depth = 0) => {
//         if (!scene) return null;

//         const min = bounds.min;
//         const max = bounds.max;

//         const size = {
//             width: max.x - min.x,
//             height: max.y - min.y,
//             depth: max.z - min.z
//         };

//         const center = new BABYLON.Vector3(
//             (max.x + min.x) / 2,
//             (max.y + min.y) / 2,
//             (max.z + min.z) / 2
//         );

//         const box = BABYLON.MeshBuilder.CreateBox(
//             `octreeBox_${depth}_${Date.now()}`,
//             size,
//             scene
//         );

//         box.position = center;
//         const material = new BABYLON.StandardMaterial(`wireframeMat_${depth}`, scene);
//         material.wireframe = true;

//         // Different colors for different depths
//         switch (depth) {
//             case 0: material.emissiveColor = new BABYLON.Color3(1, 0, 0); break;
//             case 1: material.emissiveColor = new BABYLON.Color3(0, 1, 0); break;
//             case 2: material.emissiveColor = new BABYLON.Color3(0, 0, 1); break;
//             case 3: material.emissiveColor = new BABYLON.Color3(1, 1, 0); break;
//             default: material.emissiveColor = new BABYLON.Color3(1, 1, 1);
//         }

//         box.material = material;
//         box.isPickable = false;

//         return box;
//     };

//     // Function to visualize entire octree structure
//     const visualizeOctreeStructure = (block, depth = 0) => {
//         if (!block || !block.bounds) return;

//         // Create wireframe box for current node
//         createWireframeBox(block.bounds, depth);

//         // Recursively create boxes for child nodes
//         if (block.relationships && block.relationships.childBlocks) {
//             block.relationships.childBlocks.forEach(child => {
//                 visualizeOctreeStructure(child, depth + 1);
//             });
//         }
//     };

//     // Function to create mesh from vertex data
//     const createMeshFromData = (meshData) => {
//         try {
//             if (!scene) {
//                 throw new Error('Scene is not initialized');
//             }

//             // Create a unique name for the mesh
//             const meshName = `${meshData.data.name}_${Date.now()}`;
//             const mesh = new BABYLON.Mesh(meshName, scene);

//             // Create vertex data
//             const vertexData = new BABYLON.VertexData();

//             // Apply vertex data
//             vertexData.positions = new Float32Array(meshData.data.vertexData.positions);
//             if (meshData.data.vertexData.normals) {
//                 vertexData.normals = new Float32Array(meshData.data.vertexData.normals);
//             }
//             if (meshData.data.vertexData.indices) {
//                 vertexData.indices = new Uint32Array(meshData.data.vertexData.indices);
//             }
//             if (meshData.data.vertexData.uvs) {
//                 vertexData.uvs = new Float32Array(meshData.data.vertexData.uvs);
//             }

//             vertexData.applyToMesh(mesh);

//             // Apply transforms
//             mesh.position = new BABYLON.Vector3(
//                 meshData.data.transforms.position.x,
//                 meshData.data.transforms.position.y,
//                 meshData.data.transforms.position.z
//             );
//             mesh.rotation = new BABYLON.Vector3(
//                 meshData.data.transforms.rotation.x,
//                 meshData.data.transforms.rotation.y,
//                 meshData.data.transforms.rotation.z
//             );
//             mesh.scaling = new BABYLON.Vector3(
//                 meshData.data.transforms.scaling.x,
//                 meshData.data.transforms.scaling.y,
//                 meshData.data.transforms.scaling.z
//             );

//             // Create and apply material
//             const material = new BABYLON.StandardMaterial(meshName + "_material", scene);
//             if (meshData.data.metadata.material && meshData.data.metadata.material.diffuseColor) {
//                 material.diffuseColor = new BABYLON.Color3(
//                     meshData.data.metadata.material.diffuseColor.r,
//                     meshData.data.metadata.material.diffuseColor.g,
//                     meshData.data.metadata.material.diffuseColor.b
//                 );
//             } else {
//                 material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//             }
//             mesh.material = material;

//             // Store metadata
//             mesh.metadata = {
//                 ...meshData.data.metadata,
//                 originalId: meshData.fileName
//             };

//             return mesh;
//         } catch (error) {
//             console.error('Error creating mesh:', error);
//             return null;
//         }
//     };

//     const loadModelsFromOctree = async () => {
//         if (!scene || !engine) {
//             setStatus('Error: Scene or Engine not initialized');
//             return;
//         }

//         setIsLoading(true);
//         setStatus('Starting to load models...');

//         try {
//             const db = await openDB(DB_NAME, DB_VERSION);

//             // Get octree data
//             const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
//             const octreeData = await octreeStore.get('mainOctree');

//             if (!octreeData || !octreeData.data) {
//                 throw new Error('No octree data found');
//             }

//             setStatus('Visualizing octree structure...');
//             // Visualize the entire octree structure
//             visualizeOctreeStructure(octreeData.data.blockHierarchy);

//             // Get depth 4 nodes with mesh IDs
//             const depth4Nodes = [];
//             const getDepth4Nodes = (block, depth = 0) => {
//                 if (!block) return;

//                 if (depth === TARGET_DEPTH && block.meshInfos && block.meshInfos.length > 0) {
//                     depth4Nodes.push({
//                         nodeNumber: block.properties.nodeNumber,
//                         meshIds: block.meshInfos.map(info => info.id)
//                     });
//                 }

//                 if (block.relationships && block.relationships.childBlocks) {
//                     block.relationships.childBlocks.forEach(child =>
//                         getDepth4Nodes(child, depth + 1)
//                     );
//                 }
//             };

//             getDepth4Nodes(octreeData.data.blockHierarchy);
//             setStatus(`Found ${depth4Nodes.length} nodes at depth 4`);

//             // Get and create low-poly models
//             const lmodelsStore = db.transaction('lmodels', 'readonly').objectStore('lmodels');
//             const lowPolyModels = await lmodelsStore.getAll();

//             let createdMeshCount = 0;
//             for (const node of depth4Nodes) {
//                 for (const meshId of node.meshIds) {
//                     const lowPolyMatch = lowPolyModels.find(lmodel =>
//                         lmodel.fileName.includes(meshId) ||
//                         lmodel.data.metadata.id.includes(meshId)
//                     );

//                     if (lowPolyMatch) {
//                         const mesh = createMeshFromData(lowPolyMatch);
//                         if (mesh) {
//                             mesh.isVisible = true;
//                             createdMeshCount++;
//                             setStatus(`Created ${createdMeshCount} meshes...`);
//                         }
//                     }
//                 }
//             }

//             setStatus(`Successfully loaded ${createdMeshCount} meshes`);

//             // Position camera to view the entire scene
//             const octreeBounds = octreeData.data.bounds;
//             const boundingSize = new BABYLON.Vector3(
//                 octreeBounds.max.x - octreeBounds.min.x,
//                 octreeBounds.max.y - octreeBounds.min.y,
//                 octreeBounds.max.z - octreeBounds.min.z
//             );
//             const maxDimension = Math.max(boundingSize.x, boundingSize.y, boundingSize.z);

//             if (scene.activeCamera && scene.activeCamera instanceof BABYLON.ArcRotateCamera) {
//                 scene.activeCamera.radius = maxDimension * 2;
//                 scene.activeCamera.target = new BABYLON.Vector3(
//                     (octreeBounds.max.x + octreeBounds.min.x) / 2,
//                     (octreeBounds.max.y + octreeBounds.min.y) / 2,
//                     (octreeBounds.max.z + octreeBounds.min.z) / 2
//                 );
//             }

//             scene.render();

//         } catch (error) {
//             console.error('Error loading models:', error);
//             setStatus(`Error: ${error.message}`);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="p-4 bg-gray-100 rounded-lg">
//             <button
//                 onClick={loadModelsFromOctree}
//                 disabled={isLoading || !scene}
//                 className={`mb-4 p-2 ${isLoading || !scene
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded`}
//             >
//                 {isLoading ? 'Loading...' : 'Load Models'}
//             </button>

//             <div className="mt-2">
//                 <p className={`text-sm ${status.includes('Error')
//                         ? 'text-red-500'
//                         : 'text-green-500'
//                     }`}>
//                     {status}
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Loadindexdb;


// import React, { useEffect, useState } from 'react';
// import { openDB } from 'idb';
// import * as BABYLON from '@babylonjs/core';

// const Loadindexdb = ({ engine, scene }) => {
//     const [status, setStatus] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     const DB_NAME = 'ModelStorage';
//     const DB_VERSION = 2;
//     const TARGET_DEPTH = 4;

//     // Verify scene is ready
//     useEffect(() => {
//         if (scene) {
//             scene.onReadyObservable.addOnce(() => {
//                 console.log("Scene is ready");
//             });
//         }
//     }, [scene]);

//     // Function to create wireframe box for octree visualization
//     const createWireframeBox = (minimum, maximum, depth = 0) => {
//         if (!scene) return null;

//         const size = {
//             width: maximum.x - minimum.x,
//             height: maximum.y - minimum.y,
//             depth: maximum.z - minimum.z
//         };

//         const center = new BABYLON.Vector3(
//             (maximum.x + minimum.x) / 2,
//             (maximum.y + minimum.y) / 2,
//             (maximum.z + minimum.z) / 2
//         );

//         const box = BABYLON.MeshBuilder.CreateBox(
//             "octreeBox_" + depth + "_" + Date.now(),
//             size,
//             scene
//         );

//         box.position = center;

//         const material = new BABYLON.StandardMaterial("wireframeMat_" + depth, scene);
//         material.wireframe = true;

//         switch (depth) {
//             case 0: material.emissiveColor = new BABYLON.Color3(1, 0, 0); break;
//             case 1: material.emissiveColor = new BABYLON.Color3(0, 1, 0); break;
//             case 2: material.emissiveColor = new BABYLON.Color3(0, 0, 1); break;
//             case 3: material.emissiveColor = new BABYLON.Color3(1, 1, 0); break;
//             default: material.emissiveColor = new BABYLON.Color3(1, 1, 1);
//         }

//         box.material = material;
//         box.isPickable = false;

//         return box;
//     };

//     // Function to create mesh from vertex data
//     const createMeshFromData = (meshData) => {
//         try {
//             if (!scene) {
//                 throw new Error('Scene is not initialized');
//             }

//             // Create a unique name for the mesh
//             const meshName = `${meshData.data.name}_${Date.now()}`;
//             const mesh = new BABYLON.Mesh(meshName, scene);

//             // Create vertex data
//             const vertexData = new BABYLON.VertexData();

//             // Apply vertex data
//             if (meshData.data.vertexData.positions && meshData.data.vertexData.positions.length > 0) {
//                 vertexData.positions = new Float32Array(meshData.data.vertexData.positions);
//             } else {
//                 throw new Error('No position data found');
//             }

//             if (meshData.data.vertexData.normals && meshData.data.vertexData.normals.length > 0) {
//                 vertexData.normals = new Float32Array(meshData.data.vertexData.normals);
//             }

//             if (meshData.data.vertexData.indices && meshData.data.vertexData.indices.length > 0) {
//                 vertexData.indices = new Uint32Array(meshData.data.vertexData.indices);
//             } else {
//                 throw new Error('No indices found');
//             }

//             if (meshData.data.vertexData.uvs && meshData.data.vertexData.uvs.length > 0) {
//                 vertexData.uvs = new Float32Array(meshData.data.vertexData.uvs);
//             }

//             // Apply the vertex data to the mesh
//             vertexData.applyToMesh(mesh, true);

//             // Apply transforms
//             mesh.position = new BABYLON.Vector3(
//                 meshData.data.transforms.position.x,
//                 meshData.data.transforms.position.y,
//                 meshData.data.transforms.position.z
//             );

//             mesh.rotation = new BABYLON.Vector3(
//                 meshData.data.transforms.rotation.x,
//                 meshData.data.transforms.rotation.y,
//                 meshData.data.transforms.rotation.z
//             );

//             mesh.scaling = new BABYLON.Vector3(
//                 meshData.data.transforms.scaling.x,
//                 meshData.data.transforms.scaling.y,
//                 meshData.data.transforms.scaling.z
//             );

//             // Create and apply material
//             const material = new BABYLON.StandardMaterial(meshName + "_material", scene);

//             if (meshData.data.metadata.material && meshData.data.metadata.material.diffuseColor) {
//                 material.diffuseColor = new BABYLON.Color3(
//                     meshData.data.metadata.material.diffuseColor.r,
//                     meshData.data.metadata.material.diffuseColor.g,
//                     meshData.data.metadata.material.diffuseColor.b
//                 );
//             } else {
//                 material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//             }

//             mesh.material = material;

//             // Store metadata
//             mesh.metadata = {
//                 ...meshData.data.metadata,
//                 originalId: meshData.fileName
//             };

//             // Make mesh visible
//             mesh.isVisible = true;

//             return mesh;

//         } catch (error) {
//             console.error('Error creating mesh:', error);
//             throw error;
//         }
//     };

//     const loadModelsFromOctree = async () => {
//         if (!scene || !engine) {
//             setStatus('Error: Scene or Engine not initialized');
//             return;
//         }

//         setIsLoading(true);
//         setStatus('Starting to load models...');

//         try {
//             const db = await openDB(DB_NAME, DB_VERSION);

//             // Get octree data
//             const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
//             const octreeData = await octreeStore.get('mainOctree');

//             if (!octreeData || !octreeData.data) {
//                 throw new Error('No octree data found');
//             }

//             // Get depth 4 nodes
//             const depth4Nodes = [];
//             const traverseOctree = (block, depth = 0) => {
//                 if (!block) return;

//                 if (depth === TARGET_DEPTH && block.meshInfos && block.meshInfos.length > 0) {
//                     depth4Nodes.push({
//                         nodeNumber: block.properties.nodeNumber,
//                         meshIds: block.meshInfos.map(info => info.id)
//                     });

//                     // Visualize the octree node
//                     createWireframeBox(block.bounds.min, block.bounds.max, depth);
//                 }

//                 if (block.relationships && block.relationships.childBlocks) {
//                     block.relationships.childBlocks.forEach(child =>
//                         traverseOctree(child, depth + 1)
//                     );
//                 }
//             };

//             traverseOctree(octreeData.data.blockHierarchy);
//             setStatus(`Found ${depth4Nodes.length} nodes at depth 4`);

//             // Get low-poly models
//             const lmodelsStore = db.transaction('lmodels', 'readonly').objectStore('lmodels');
//             const lowPolyModels = await lmodelsStore.getAll();

//             let createdMeshCount = 0;

//             // Create meshes for each node
//             for (const node of depth4Nodes) {
//                 for (const meshId of node.meshIds) {
//                     const lowPolyMatch = lowPolyModels.find(lmodel =>
//                         lmodel.fileName.includes(meshId) ||
//                         lmodel.data.metadata.id.includes(meshId)
//                     );

//                     if (lowPolyMatch) {
//                         try {
//                             const mesh = createMeshFromData(lowPolyMatch);
//                             if (mesh) {
//                                 mesh.metadata.nodeNumber = node.nodeNumber;
//                                 mesh.metadata.originalMeshId = meshId;
//                                 createdMeshCount++;
//                                 setStatus(`Created ${createdMeshCount} meshes...`);
//                             }
//                         } catch (error) {
//                             console.warn(`Failed to create mesh for ${meshId}:`, error);
//                         }
//                     }
//                 }
//             }

//             setStatus(`Successfully loaded ${createdMeshCount} meshes`);
//             scene.render();

//         } catch (error) {
//             console.error('Error loading models:', error);
//             setStatus(`Error: ${error.message}`);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="p-4 bg-gray-100 rounded-lg">
//             <button
//                 onClick={loadModelsFromOctree}
//                 disabled={isLoading || !scene}
//                 className={`mb-4 p-2 ${isLoading || !scene
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded`}
//             >
//                 {isLoading ? 'Loading...' : 'Load Models'}
//             </button>

//             <div className="mt-2">
//                 <p className={`text-sm ${status.includes('Error')
//                         ? 'text-red-500'
//                         : 'text-green-500'
//                     }`}>
//                     {status}
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Loadindexdb;


// import React, { useEffect, useState, useRef } from 'react';
// import { openDB } from 'idb';
// import * as BABYLON from '@babylonjs/core';

// const Loadindexdb = ({ engine, scene }) => {
//     const [status, setStatus] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     const DB_NAME = 'ModelStorage';
//     const DB_VERSION = 2;
//     const TARGET_DEPTH = 4;

//     // Function to deserialize block hierarchy
//     const deserializeBlockHierarchy = (block) => {
//         if (!block) return null;

//         return {
//             bounds: {
//                 min: new BABYLON.Vector3(block.bounds.min.x, block.bounds.min.y, block.bounds.min.z),
//                 max: new BABYLON.Vector3(block.bounds.max.x, block.bounds.max.y, block.bounds.max.z)
//             },
//             properties: { ...block.properties },
//             meshInfos: block.meshInfos.map(info => ({
//                 id: info.id,
//                 boundingBox: info.boundingBox
//             })),
//             relationships: {
//                 parentNode: block.relationships.parentNode,
//                 childBlocks: block.relationships.childBlocks.map(child =>
//                     deserializeBlockHierarchy(child)
//                 ).filter(child => child !== null)
//             }
//         };
//     };

//     // Function to deserialize octree
//     const deserializeOctree = (octreeData) => {
//         if (!octreeData || !octreeData.bounds) {
//             console.error('Invalid octree data:', octreeData);
//             return null;
//         }

//         return {
//             properties: { ...octreeData.properties },
//             bounds: {
//                 min: new BABYLON.Vector3(
//                     octreeData.bounds.min.x,
//                     octreeData.bounds.min.y,
//                     octreeData.bounds.min.z
//                 ),
//                 max: new BABYLON.Vector3(
//                     octreeData.bounds.max.x,
//                     octreeData.bounds.max.y,
//                     octreeData.bounds.max.z
//                 )
//             },
//             statistics: { ...octreeData.statistics },
//             blockHierarchy: deserializeBlockHierarchy(octreeData.blockHierarchy)
//         };
//     };

//     // Function to create mesh from vertex data
//     const createMeshFromData = (meshData, scene) => {
//         try {
//             const mesh = new BABYLON.Mesh(meshData.data.name, scene);

//             // Create vertex data
//             const vertexData = new BABYLON.VertexData();

//             // Apply vertex data
//             vertexData.positions = new Float32Array(meshData.data.vertexData.positions);
//             if (meshData.data.vertexData.normals) {
//                 vertexData.normals = new Float32Array(meshData.data.vertexData.normals);
//             }
//             if (meshData.data.vertexData.indices) {
//                 vertexData.indices = new Uint32Array(meshData.data.vertexData.indices);
//             }
//             if (meshData.data.vertexData.uvs) {
//                 vertexData.uvs = new Float32Array(meshData.data.vertexData.uvs);
//             }

//             vertexData.applyToMesh(mesh);

//             // Apply transforms
//             mesh.position = new BABYLON.Vector3(
//                 meshData.data.transforms.position.x,
//                 meshData.data.transforms.position.y,
//                 meshData.data.transforms.position.z
//             );
//             mesh.rotation = new BABYLON.Vector3(
//                 meshData.data.transforms.rotation.x,
//                 meshData.data.transforms.rotation.y,
//                 meshData.data.transforms.rotation.z
//             );
//             mesh.scaling = new BABYLON.Vector3(
//                 meshData.data.transforms.scaling.x,
//                 meshData.data.transforms.scaling.y,
//                 meshData.data.transforms.scaling.z
//             );

//             // Create and apply material
//             const material = new BABYLON.StandardMaterial(meshData.data.name + "_material", scene);
//             if (meshData.data.metadata.material && meshData.data.metadata.material.diffuseColor) {
//                 material.diffuseColor = new BABYLON.Color3(
//                     meshData.data.metadata.material.diffuseColor.r,
//                     meshData.data.metadata.material.diffuseColor.g,
//                     meshData.data.metadata.material.diffuseColor.b
//                 );
//             } else {
//                 material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//             }
//             mesh.material = material;

//             // Store metadata
//             mesh.metadata = meshData.data.metadata;

//             return mesh;
//         } catch (error) {
//             console.error('Error creating mesh:', error);
//             return null;
//         }
//     };

//     const loadModelsFromOctree = async () => {
//         setIsLoading(true);
//         setStatus('Starting to load models...');

//         try {
//             const db = await openDB(DB_NAME, DB_VERSION);

//             // Get octree data
//             const octreeStore = db.transaction('octrees', 'readonly').objectStore('octrees');
//             const octreeData = await octreeStore.get('mainOctree');

//             if (!octreeData || !octreeData.data) {
//                 throw new Error('No octree data found');
//             }

//             setStatus('Deserializing octree...');
//             const deserializedOctree = deserializeOctree(octreeData.data);

//             // Function to get depth 4 nodes with mesh IDs
//             const getDepth4Nodes = (block, currentDepth = 0, results = []) => {
//                 if (!block) return results;

//                 if (currentDepth === TARGET_DEPTH && block.meshInfos && block.meshInfos.length > 0) {
//                     results.push({
//                         nodeNumber: block.properties.nodeNumber,
//                         meshIds: block.meshInfos.map(info => info.id)
//                     });
//                     return results;
//                 }

//                 if (block.relationships && block.relationships.childBlocks) {
//                     block.relationships.childBlocks.forEach(childBlock => {
//                         getDepth4Nodes(childBlock, currentDepth + 1, results);
//                     });
//                 }

//                 return results;
//             };

//             const depth4Nodes = getDepth4Nodes(deserializedOctree.blockHierarchy);
//             setStatus(`Found ${depth4Nodes.length} nodes at depth 4`);

//             // Get low-poly models for depth 4 nodes
//             const lmodelsStore = db.transaction('lmodels', 'readonly').objectStore('lmodels');

//             for (const node of depth4Nodes) {
//                 for (const meshId of node.meshIds) {
//                     // Find corresponding low-poly model (assuming naming convention)
//                     const lowPolyModels = await lmodelsStore.getAll();
//                     const lowPolyMatch = lowPolyModels.find(lmodel =>
//                         lmodel.fileName.includes(meshId) ||
//                         lmodel.data.metadata.id.includes(meshId)
//                     );

//                     if (lowPolyMatch) {
//                         setStatus(`Creating mesh for ${lowPolyMatch.fileName}...`);
//                         const mesh = createMeshFromData(lowPolyMatch, scene);
//                         if (mesh) {
//                             mesh.metadata.nodeNumber = node.nodeNumber;
//                             mesh.metadata.originalMeshId = meshId;
//                         }
//                     }
//                 }
//             }

//             setStatus('All models loaded successfully');
//             scene.render();

//         } catch (error) {
//             console.error('Error loading models:', error);
//             setStatus(`Error: ${error.message}`);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="p-4 bg-gray-100 rounded-lg">
//             <button
//                 onClick={loadModelsFromOctree}
//                 disabled={isLoading}
//                 className={`mb-4 p-2 ${isLoading
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-blue-500 hover:bg-blue-600'
//                     } text-white rounded`}
//             >
//                 {isLoading ? 'Loading...' : 'Load Models'}
//             </button>

//             <div className="mt-2">
//                 <p className={`text-sm ${status.includes('Error')
//                         ? 'text-red-500'
//                         : 'text-green-500'
//                     }`}>
//                     {status}
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Loadindexdb;


// import React from 'react';
// import { openDB } from 'idb';
// import * as BABYLON from '@babylonjs/core';

// const Loadindexdb = ({ scene, canvasRef }) => {
//     const DB_NAME = 'ModelStorage';
//     const DB_VERSION = 1;

//     // Deserialize octree data
//     const deserializeOctree = (serializedOctree) => {
//         if (!serializedOctree) {
//             console.error('No octree data to deserialize');
//             return null;
//         }

//         try {
//             console.log('Starting octree deserialization', serializedOctree);

//             // Deserialize bounding box vectors
//             const boundingBox = serializedOctree.metadata.boundingBox ? {
//                 min: new BABYLON.Vector3(
//                     serializedOctree.metadata.boundingBox.min.x,
//                     serializedOctree.metadata.boundingBox.min.y,
//                     serializedOctree.metadata.boundingBox.min.z
//                 ),
//                 max: new BABYLON.Vector3(
//                     serializedOctree.metadata.boundingBox.max.x,
//                     serializedOctree.metadata.boundingBox.max.y,
//                     serializedOctree.metadata.boundingBox.max.z
//                 )
//             } : null;

//             // Deserialize node bounds and reconstruct structure
//             const structure = serializedOctree.structure.map(node => ({
//                 ...node,
//                 bounds: node.bounds ? {
//                     minimum: new BABYLON.Vector3(
//                         node.bounds.minimum.x,
//                         node.bounds.minimum.y,
//                         node.bounds.minimum.z
//                     ),
//                     maximum: new BABYLON.Vector3(
//                         node.bounds.maximum.x,
//                         node.bounds.maximum.y,
//                         node.bounds.maximum.z
//                     )
//                 } : null,
//                 // Reconstruct other node properties
//                 meshCounts: { ...node.meshCounts },
//                 childNodes: [...node.childNodes]
//             }));

//             // Reconstruct the full octree object
//             const deserializedOctree = {
//                 metadata: {
//                     ...serializedOctree.metadata,
//                     boundingBox,
//                     meshDistribution: { ...serializedOctree.metadata.meshDistribution }
//                 },
//                 structure
//             };

//             console.log('Octree deserialization complete:', deserializedOctree);
//             return deserializedOctree;

//         } catch (error) {
//             console.error('Error deserializing octree:', error);
//             return null;
//         }
//     };

//     // Load and visualize octree
//     const loadOctree = async () => {
//         try {
//             if (!scene) {
//                 console.error('Scene is not available');
//                 return;
//             }

//             console.log('Loading with scene:', scene);

//             const db = await openDB(DB_NAME, DB_VERSION);
//             const octreeData = await db.get('octrees', 'mainOctree');

//             if (!octreeData || !octreeData.data) {
//                 console.warn('No octree data found in IndexedDB');
//                 return;
//             }

//             // Deserialize octree data
//             const deserializedOctree = deserializeOctree(octreeData.data);
//             if (!deserializedOctree) {
//                 console.error('Failed to deserialize octree data');
//                 return;
//             }

//             // Clear existing octree wireframes
//             const existingWireframes = scene.meshes.filter(mesh =>
//                 mesh.name.startsWith("octreeVisBox_")
//             );
//             console.log('Clearing existing wireframes:', existingWireframes.length);
//             existingWireframes.forEach(mesh => mesh.dispose());

//             // Create wireframe visualization
//             await visualizeOctree(deserializedOctree, scene);

//             // Position camera to view the octree
//             positionCameraForOctree(deserializedOctree, scene);

//             // Force scene to render
//             scene.render();

//         } catch (error) {
//             console.error('Error loading octree from IndexedDB:', error);
//         }
//     };

// const createWireframeBox = (scene, minimum, maximum, depth = 0) => {
//     if (!scene) {
//         console.error('No scene provided to createWireframeBox');
//         return null;
//     }

//     try {
//         const size = maximum.subtract(minimum);
//         const center = BABYLON.Vector3.Center(minimum, maximum);

//         const box = BABYLON.MeshBuilder.CreateBox(
//             `octreeVisBox_${depth}_${Math.random()}`,
//             {
//                 width: Math.max(0.001, size.x),
//                 height: Math.max(0.001, size.y),
//                 depth: Math.max(0.001, size.z)
//             },
//             scene
//         );

//         box.position = center;
//         const material = new BABYLON.StandardMaterial(`wireframeMat_${depth}_${Math.random()}`, scene);
//         material.wireframe = true;
//         material.alpha = 1;

//         switch (depth) {
//             case 0: material.emissiveColor = new BABYLON.Color3(1, 0, 0); break;
//             case 1: material.emissiveColor = new BABYLON.Color3(0, 1, 0); break;
//             case 2: material.emissiveColor = new BABYLON.Color3(0, 0, 1); break;
//             case 3: material.emissiveColor = new BABYLON.Color3(1, 1, 0); break;
//             default: material.emissiveColor = new BABYLON.Color3(1, 1, 1);
//         }

//         box.material = material;
//         box.isPickable = false;
//         return box;
//     } catch (error) {
//         console.error('Error creating wireframe box:', error);
//         return null;
//     }
// };

//     // // Deserialize mesh data and create mesh
//     // const createMeshFromData = (meshData, scene) => {
//     //     try {
//     //         const mesh = new BABYLON.Mesh(meshData.name, scene);
//     //         const vertexData = new BABYLON.VertexData();

//     //         // Apply vertex data
//     //         vertexData.positions = new Float32Array(meshData.vertexData.positions);
//     //         vertexData.normals = new Float32Array(meshData.vertexData.normals);
//     //         vertexData.indices = new Uint32Array(meshData.vertexData.indices);
//     //         if (meshData.vertexData.uvs && meshData.vertexData.uvs.length > 0) {
//     //             vertexData.uvs = new Float32Array(meshData.vertexData.uvs);
//     //         }

//     //         vertexData.applyToMesh(mesh);

//     //         // Apply transforms
//     //         mesh.position = new BABYLON.Vector3(
//     //             meshData.transforms.position.x,
//     //             meshData.transforms.position.y,
//     //             meshData.transforms.position.z
//     //         );
//     //         mesh.rotation = new BABYLON.Vector3(
//     //             meshData.transforms.rotation.x,
//     //             meshData.transforms.rotation.y,
//     //             meshData.transforms.rotation.z
//     //         );
//     //         mesh.scaling = new BABYLON.Vector3(
//     //             meshData.transforms.scaling.x,
//     //             meshData.transforms.scaling.y,
//     //             meshData.transforms.scaling.z
//     //         );

//     //         // Create and apply material
//     //         const material = new BABYLON.StandardMaterial(meshData.name + "_material", scene);
//     //         if (meshData.metadata.material && meshData.metadata.material.diffuseColor) {
//     //             material.diffuseColor = new BABYLON.Color3(
//     //                 meshData.metadata.material.diffuseColor.r,
//     //                 meshData.metadata.material.diffuseColor.g,
//     //                 meshData.metadata.material.diffuseColor.b
//     //             );
//     //         } else {
//     //             material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//     //         }
//     //         mesh.material = material;

//     //         return mesh;
//     //     } catch (error) {
//     //         console.error('Error creating mesh:', error);
//     //         return null;
//     //     }
//     // };

//     // // Load meshes and octree
//     // const loadData = async () => {
//     //     try {
//     //         if (!scene) {
//     //             console.error('Scene is not available');
//     //             return;
//     //         }

//     //         const db = await openDB(DB_NAME, DB_VERSION);

//     //         // Load meshes
//     //         const modelStore = db.transaction('models', 'readonly').store;
//     //         const meshDatas = await modelStore.getAll();

//     //         // Clear existing meshes
//     //         scene.meshes
//     //             .filter(mesh => !mesh.name.startsWith("octreeVisBox_"))
//     //             .forEach(mesh => mesh.dispose());

//     //         // Create new meshes
//     //         let createdMeshCount = 0;
//     //         for (const meshData of meshDatas) {
//     //             const mesh = createMeshFromData(meshData.data, scene);
//     //             if (mesh) {
//     //                 createdMeshCount++;
//     //             }
//     //         }
//     //         console.log(`Created ${createdMeshCount} meshes`);

//     //         // Load octree structure
//     //         const octreeData = await db.get('octrees', 'mainOctree');
//     //         if (!octreeData || !octreeData.data) {
//     //             console.warn('No octree data found');
//     //             return;
//     //         }

//     //         const deserializedOctree = deserializeOctree(octreeData.data);
//     //         if (!deserializedOctree) {
//     //             console.error('Failed to deserialize octree');
//     //             return;
//     //         }

//     //         // Position camera
//     //         positionCameraForOctree(deserializedOctree, scene);

//     //         // Force scene to render
//     //         scene.render();

//     //     } catch (error) {
//     //         console.error('Error loading data:', error);
//     //     }
//     // };

// const visualizeOctree = async (octree, scene) => {
//     if (!scene || !octree) {
//         console.error('Missing scene or octree for visualization');
//         return;
//     }

//     console.log('Starting octree visualization');

//     // Create root bounding box
//     const boundingBox = octree.metadata.boundingBox;
//     if (boundingBox) {
//         console.log('Creating root bounding box');
//         const rootBox = createWireframeBox(scene, boundingBox.min, boundingBox.max, 0);
//         if (rootBox) {
//             console.log('Root box created');
//         }
//     }

//     // Visualize each node
//     let nodeCount = 0;
//     for (const node of octree.structure) {
//         if (node.bounds) {
//             const box = createWireframeBox(
//                 scene,
//                 node.bounds.minimum,
//                 node.bounds.maximum,
//                 node.depth
//             );
//             if (box) nodeCount++;
//         }
//     }
//     console.log(`Created ${nodeCount} node boxes`);
// };

//     const positionCameraForOctree = (octree, scene) => {
//         if (!scene.activeCamera || !octree.metadata.boundingBox) return;

//         const boundingBox = octree.metadata.boundingBox;
//         const size = boundingBox.max.subtract(boundingBox.min);
//         const maxDimension = Math.max(size.x, size.y, size.z);

//         const camera = scene.activeCamera;
//         camera.radius = maxDimension * 2;
//         camera.beta = Math.PI / 3;
//         camera.alpha = Math.PI / 4;
//         camera.target = BABYLON.Vector3.Center(boundingBox.min, boundingBox.max);
//     };

//     return (
//         <div>
//             <button
//                 onClick={loadOctree}
//                 className="mb-4 mr-4 p-2 bg-green-500 text-white rounded hover:bg-green-600"
//             >
//                 Load Octree from DB
//             </button>
//         </div>
//     );
// };

// export default Loadindexdb;














// import React, { useEffect, useRef, useState } from 'react';
// import { openDB } from 'idb';
// import * as BABYLON from '@babylonjs/core';

// const Loadindexdb = () => {
//     const canvasRef = useRef(null);
//     const [status, setStatus] = useState('');
//     let scene;
//     let engine;
//     let camera;
//     const [isWireframe, setIsWireframe] = useState(false);

//     const deserializeOctree = (serializedOctree) => {
//         return {
//             structure: serializedOctree.structure.map(node => ({
//                 ...node,
//                 bounds: node.bounds ? {
//                     minimum: new BABYLON.Vector3(
//                         node.bounds.minimum.x,
//                         node.bounds.minimum.y,
//                         node.bounds.minimum.z
//                     ),
//                     maximum: new BABYLON.Vector3(
//                         node.bounds.maximum.x,
//                         node.bounds.maximum.y,
//                         node.bounds.maximum.z
//                     )
//                 } : null
//             })),
//             metadata: serializedOctree.metadata
//         };
//     };



//     const createMeshFromData = (meshData, scene) => {
//         try {
//             const mesh = new BABYLON.Mesh(meshData.data.name, scene);

//             // Create vertex data
//             const vertexData = new BABYLON.VertexData();
//             vertexData.positions = new Float32Array(meshData.data.vertexData.positions);
//             vertexData.indices = new Uint32Array(meshData.data.vertexData.indices);

//             if (meshData.data.vertexData.normals && meshData.data.vertexData.normals.length > 0) {
//                 vertexData.normals = new Float32Array(meshData.data.vertexData.normals);
//             }

//             if (meshData.data.vertexData.uvs && meshData.data.vertexData.uvs.length > 0) {
//                 vertexData.uvs = new Float32Array(meshData.data.vertexData.uvs);
//             }

//             // Apply vertex data to mesh
//             vertexData.applyToMesh(mesh);

//             // Set transforms
//             mesh.position = new BABYLON.Vector3(
//                 meshData.data.transforms.position.x,
//                 meshData.data.transforms.position.y,
//                 meshData.data.transforms.position.z
//             );

//             mesh.rotation = new BABYLON.Vector3(
//                 meshData.data.transforms.rotation.x,
//                 meshData.data.transforms.rotation.y,
//                 meshData.data.transforms.rotation.z
//             );

//             mesh.scaling = new BABYLON.Vector3(
//                 meshData.data.transforms.scaling.x,
//                 meshData.data.transforms.scaling.y,
//                 meshData.data.transforms.scaling.z
//             );

//             // Create and apply material
//             const material = new BABYLON.StandardMaterial(`material_${mesh.name}`, scene);
//             material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//             material.backFaceCulling = false;
//             material.wireframe = false; // Ensure wireframe is off
//             mesh.material = material;

//             // Set metadata
//             mesh.nodeNumber = meshData.data.nodeNumber;
//             mesh.depth = meshData.data.depth;
//             mesh.parentNode = meshData.data.parentNode;

//             // Ensure the mesh is not showing its bounding box
//             mesh.showBoundingBox = false;

//             return mesh;
//         } catch (error) {
//             console.error('Error creating mesh:', error);
//             return null;
//         }
//     };

//     const createWireframeBox = (scene, minimum, maximum, depth = 0) => {
//         if (!scene) {
//             console.error('No scene provided to createWireframeBox');
//             return null;
//         }

//         try {
//             const size = maximum.subtract(minimum);
//             const center = BABYLON.Vector3.Center(minimum, maximum);

//             const box = BABYLON.MeshBuilder.CreateBox(
//                 `octreeVisBox_${depth}_${Math.random()}`,
//                 {
//                     width: Math.max(0.001, size.x),
//                     height: Math.max(0.001, size.y),
//                     depth: Math.max(0.001, size.z)
//                 },
//                 scene
//             );

//             box.position = center;
//             const material = new BABYLON.StandardMaterial(`wireframeMat_${depth}_${Math.random()}`, scene);
//             material.wireframe = true;
//             material.alpha = 1;

//             switch (depth) {
//                 case 0: material.emissiveColor = new BABYLON.Color3(1, 0, 0); break;
//                 case 1: material.emissiveColor = new BABYLON.Color3(0, 1, 0); break;
//                 case 2: material.emissiveColor = new BABYLON.Color3(0, 0, 1); break;
//                 case 3: material.emissiveColor = new BABYLON.Color3(1, 1, 0); break;
//                 default: material.emissiveColor = new BABYLON.Color3(1, 1, 1);
//             }

//             box.material = material;
//             box.isPickable = false;
//             return box;
//         } catch (error) {
//             console.error('Error creating wireframe box:', error);
//             return null;
//         }
//     };



//     const visualizeOctree = async (scene, octree) => {
//         if (!scene || !octree) {
//             console.error('Missing scene or octree for visualization');
//             return;
//         }

//         console.log('Starting octree visualization');

//         // Create root bounding box
//         const boundingBox = octree.metadata.boundingBox;
//         if (boundingBox) {
//             console.log('Creating root bounding box');
//             // Ensure min and max are BABYLON.Vector3 objects
//             const minVector = new BABYLON.Vector3(
//                 boundingBox.min.x,
//                 boundingBox.min.y,
//                 boundingBox.min.z
//             );
//             const maxVector = new BABYLON.Vector3(
//                 boundingBox.max.x,
//                 boundingBox.max.y,
//                 boundingBox.max.z
//             );

//             const rootBox = createWireframeBox(scene, minVector, maxVector, 0);
//             if (rootBox) {
//                 console.log('Root box created');
//             }
//         }

//         // // Visualize each node
//         // let nodeCount = 0;
//         // for (const node of octree.structure) {
//         //     if (node.bounds) {
//         //         try {
//         //             // Ensure minimum and maximum are BABYLON.Vector3 objects
//         //             const minimum = new BABYLON.Vector3(
//         //                 node.bounds.minimum.x,
//         //                 node.bounds.minimum.y,
//         //                 node.bounds.minimum.z
//         //             );
//         //             const maximum = new BABYLON.Vector3(
//         //                 node.bounds.maximum.x,
//         //                 node.bounds.maximum.y,
//         //                 node.bounds.maximum.z
//         //             );

//         //             const box = createWireframeBox(
//         //                 scene,
//         //                 minimum,
//         //                 maximum,
//         //                 node.depth
//         //             );
//         //             if (box) nodeCount++;
//         //         } catch (error) {
//         //             console.error('Error creating node box:', error);
//         //         }
//         //     }
//         // }
//         // console.log(`Created ${nodeCount} node boxes`);
//     };
//     const setupScene = () => {
//         engine = new BABYLON.Engine(canvasRef.current, true);
//         scene = new BABYLON.Scene(engine);

//         // Create camera
//         camera = new BABYLON.ArcRotateCamera(
//             "camera",
//             0,
//             Math.PI / 3,
//             10,
//             BABYLON.Vector3.Zero(),
//             scene
//         );
//         camera.attachControl(canvasRef.current, true);
//         camera.wheelPrecision = 50;
//         camera.pinchPrecision = 50;

//         // Add lights
//         const hemisphericLight = new BABYLON.HemisphericLight(
//             "light",
//             new BABYLON.Vector3(0, 1, 0),
//             scene
//         );
//         hemisphericLight.intensity = 0.7;

//         const pointLight = new BABYLON.PointLight(
//             "pointLight",
//             new BABYLON.Vector3(0, 10, 0),
//             scene
//         );
//         pointLight.intensity = 0.5;

//         engine.runRenderLoop(() => {
//             scene.render();
//         });

//         window.addEventListener('resize', () => {
//             engine.resize();
//         });

//         return scene;
//     };

//     const filterMeshVisibility = (scene) => {
//         if (!scene) return;

//         // Hide all meshes first
//         scene.meshes.forEach(mesh => {
//             // Skip octree wireframe boxes
//             if (mesh.name.startsWith('octreeVisBox_')) {
//                 return;
//             }

//             // Check if mesh name ends with '_angle20'
//             if (mesh.name.endsWith('_angle20')) {
//                 mesh.isVisible = true;
//                 mesh.setEnabled(true);
//             } else {
//                 mesh.isVisible = false;
//                 mesh.setEnabled(false);
//             }
//         });
//     };
//     // const showwireframe = () => {
//     //     setIsWireframe(prev => !prev);
//     //     console.log("Entered wireframe");

//     //     if (scene) {
//     //         const visibleMeshes = scene.meshes.filter(mesh =>
//     //             mesh.isVisible &&
//     //             !mesh.name.startsWith("octreeVisBox_") &&
//     //             mesh.material
//     //         );

//     //         visibleMeshes.forEach(mesh => {
//     //             if (isWireframe) {
//     //                 // Restore original material settings if they exist
//     //                 if (mesh._originalMaterialSettings) {
//     //                     mesh.material.wireframe = mesh._originalMaterialSettings.wireframe;
//     //                     mesh.material.backFaceCulling = mesh._originalMaterialSettings.backFaceCulling;
//     //                     if (mesh._originalMaterialSettings.emissiveColor) {
//     //                         mesh.material.emissiveColor = mesh._originalMaterialSettings.emissiveColor;
//     //                     }
//     //                     if (mesh._originalMaterialSettings.diffuseColor) {
//     //                         mesh.material.diffuseColor = mesh._originalMaterialSettings.diffuseColor;
//     //                     }
//     //                 }
//     //             } else {
//     //                 // Store original material settings
//     //                 if (!mesh._originalMaterialSettings) {
//     //                     mesh._originalMaterialSettings = {
//     //                         wireframe: mesh.material.wireframe,
//     //                         backFaceCulling: mesh.material.backFaceCulling,
//     //                         emissiveColor: mesh.material.emissiveColor ? mesh.material.emissiveColor.clone() : null,
//     //                         diffuseColor: mesh.material.diffuseColor ? mesh.material.diffuseColor.clone() : null,
//     //                     };
//     //                 }

//     //                 // Apply wireframe settings
//     //                 mesh.material.wireframe = true;
//     //                 mesh.material.backFaceCulling = false;
//     //                 mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
//     //                 mesh.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
//     //             }
//     //         });
//     //     }
//     // };

//     // const showwireframe = () => {
//     //     setIsWireframe(prev => !prev);
//     //     console.log("Toggling wireframe mode");

//     //     if (scene) {
//     //         // Get only visible meshes that aren't octree boxes
//     //         const visibleMeshes = scene.meshes.filter(mesh =>
//     //             mesh.isVisible &&
//     //             !mesh.name.startsWith("octreeVisBox_") &&
//     //             mesh.name.endsWith("_angle20") &&
//     //             mesh.material
//     //         );

//     //         visibleMeshes.forEach(mesh => {
//     //             if (mesh.material) {
//     //                 if (!isWireframe) {
//     //                     // Store original material settings before switching to wireframe
//     //                     if (!mesh._originalMaterialSettings) {
//     //                         mesh._originalMaterialSettings = {
//     //                             wireframe: mesh.material.wireframe,
//     //                             backFaceCulling: mesh.material.backFaceCulling,
//     //                             diffuseColor: mesh.material.diffuseColor.clone(),
//     //                             emissiveColor: mesh.material.emissiveColor ?
//     //                                 mesh.material.emissiveColor.clone() : null
//     //                         };
//     //                     }

//     //                     // Apply wireframe settings
//     //                     mesh.material.wireframe = true;
//     //                     mesh.material.backFaceCulling = false;
//     //                     mesh.material.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//     //                 } else {
//     //                     // Restore original material settings
//     //                     if (mesh._originalMaterialSettings) {
//     //                         mesh.material.wireframe = mesh._originalMaterialSettings.wireframe;
//     //                         mesh.material.backFaceCulling = mesh._originalMaterialSettings.backFaceCulling;
//     //                         mesh.material.diffuseColor = mesh._originalMaterialSettings.diffuseColor;
//     //                         if (mesh._originalMaterialSettings.emissiveColor) {
//     //                             mesh.material.emissiveColor = mesh._originalMaterialSettings.emissiveColor;
//     //                         }
//     //                     }
//     //                 }
//     //             }
//     //         });
//     //     }
//     // };

//     const showwireframe = () => {
//         // Toggle wireframe state and use the new value immediately
//         setIsWireframe(prevState => {
//             const newWireframeState = !prevState;
//             console.log("Toggling wireframe mode:", newWireframeState);

//             if (scene) {
//                 // Get only visible meshes that aren't octree boxes
//                 const visibleMeshes = scene.meshes.filter(mesh =>
//                     mesh.isVisible &&
//                     !mesh.name.startsWith("octreeVisBox_") &&
//                     mesh.name.endsWith("_angle20") &&
//                     mesh.material
//                 );

//                 visibleMeshes.forEach(mesh => {
//                     if (mesh.material) {
//                         if (newWireframeState) { // Using new state value instead of !isWireframe
//                             // Store original material settings before switching to wireframe
//                             if (!mesh._originalMaterialSettings) {
//                                 mesh._originalMaterialSettings = {
//                                     wireframe: mesh.material.wireframe,
//                                     backFaceCulling: mesh.material.backFaceCulling,
//                                     diffuseColor: mesh.material.diffuseColor.clone(),
//                                     emissiveColor: mesh.material.emissiveColor ?
//                                         mesh.material.emissiveColor.clone() : null
//                                 };
//                             }

//                             // Apply wireframe settings
//                             mesh.material.wireframe = true;
//                             mesh.material.backFaceCulling = false;
//                             mesh.material.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//                         } else {
//                             // Restore original material settings
//                             if (mesh._originalMaterialSettings) {
//                                 mesh.material.wireframe = mesh._originalMaterialSettings.wireframe;
//                                 mesh.material.backFaceCulling = mesh._originalMaterialSettings.backFaceCulling;
//                                 mesh.material.diffuseColor = mesh._originalMaterialSettings.diffuseColor;
//                                 if (mesh._originalMaterialSettings.emissiveColor) {
//                                     mesh.material.emissiveColor = mesh._originalMaterialSettings.emissiveColor;
//                                 }
//                             }
//                         }
//                     }
//                 });
//             }

//             return newWireframeState;
//         });
//     };

//     const loadFromIndexedDB = async () => {
//         try {
//             setStatus('Opening database...');
//             const db = await openDB('ModelStorage', 1);

//             // Load octree data
//             setStatus('Loading octree data...');
//             const octreeData = await db.get('octrees', 'mainOctree');
//             if (!octreeData || !octreeData.data) {
//                 throw new Error('No octree data found');
//             }

//             // Load mesh data
//             setStatus('Loading mesh data...');
//             const meshesData = await db.getAll('models');
//             if (!meshesData || meshesData.length === 0) {
//                 throw new Error('No mesh data found');
//             }

//             // Setup scene
//             const scene = setupScene();

//             // Create meshes
//             setStatus('Creating meshes...');
//             const loadedMeshes = [];
//             for (const meshData of meshesData) {
//                 const mesh = createMeshFromData(meshData, scene);
//                 if (mesh) {
//                     loadedMeshes.push(mesh);
//                 }
//             }

//             // Deserialize and visualize octree
//             setStatus('Visualizing octree...');
//             const octree = deserializeOctree(octreeData.data);
//             visualizeOctree(scene, octree);

//             // Filter mesh visibility
//             setStatus('Filtering meshes...');
//             filterMeshVisibility(scene);

//             // Position camera to view all content
//             setStatus('Positioning camera...');
//             if (octreeData.data.metadata.boundingBox) {
//                 const min = new BABYLON.Vector3(
//                     octreeData.data.metadata.boundingBox.min.x,
//                     octreeData.data.metadata.boundingBox.min.y,
//                     octreeData.data.metadata.boundingBox.min.z
//                 );
//                 const max = new BABYLON.Vector3(
//                     octreeData.data.metadata.boundingBox.max.x,
//                     octreeData.data.metadata.boundingBox.max.y,
//                     octreeData.data.metadata.boundingBox.max.z
//                 );

//                 const center = BABYLON.Vector3.Center(min, max);
//                 const size = max.subtract(min);
//                 const maxDimension = Math.max(size.x, size.y, size.z);

//                 camera.setTarget(center);
//                 camera.radius = maxDimension * 2;
//                 camera.alpha = Math.PI / 4;
//                 camera.beta = Math.PI / 3;
//             }

//             setStatus(`Loaded ${loadedMeshes.length} meshes and ${octree.structure.length} octree nodes`);

//         } catch (error) {
//             console.error('Load error:', error);
//             setStatus(`Error: ${error.message}`);
//         }
//     };

//     useEffect(() => {
//         return () => {
//             if (scene) {
//                 scene.dispose();
//             }
//             if (engine) {
//                 engine.dispose();
//             }
//         };
//     }, []);

//     return (
//         <div className="relative">
//             <button
//                 onClick={loadFromIndexedDB}
//                 className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//                 Load Model
//             </button>
//             <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
//                 <p>{status}</p>
//             </div>
//             <canvas ref={canvasRef} style={{ width: '100%', height: '70vh' }} />
//             {/* <button
//                 onClick={() => setupCamera('orbit')}
//                 style={{
//                     marginRight: '10px',
//                     backgroundColor: cameraMode === 'orbit' ? '#4CAF50' : '#ddd',
//                     padding: '8px 16px',
//                     border: 'none',
//                     borderRadius: '4px',
//                     cursor: 'pointer',
//                     color: 'white'
//                 }}
//             >
//                 Orbit Camera
//             </button>
//             <button
//                 onClick={() => setupCamera('fly')}
//                 style={{
//                     backgroundColor: cameraMode === 'fly' ? '#2196F3' : '#ddd',
//                     padding: '8px 16px',
//                     border: 'none',
//                     borderRadius: '4px',
//                     cursor: 'pointer',
//                     color: 'white'
//                 }}
//             >
//                 Fly Camera
//             </button> */}
//             <div id='rightopt' style={{ right: '0px' }} >
//                 <i class="fa-solid fa-circle-info  button " title='Tag Info'  ></i>
//                 <i class="fa fa-search-plus button" title='Zoomin' ></i>
//                 <i class="fa fa-search-plus button" title='Download' ></i>
//                 <i
//                     className="fa-solid fa-circle-info button"
//                     title={`Wireframe ${isWireframe ? 'Off' : 'On'}`}
//                     onClick={showwireframe}
//                     style={{
//                         cursor: 'pointer',
//                         color: isWireframe ? '#4CAF50' : '#000000'
//                     }}
//                 ></i>
//             </div>
//         </div>
//     );
// };

// export default Loadindexdb;