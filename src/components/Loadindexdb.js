

// import React, { useState } from 'react';
// import { openDB } from 'idb';
// import * as BABYLON from '@babylonjs/core';

// const Loadindexdb = ({ scene, camera }) => {
//     const [status, setStatus] = useState('');

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

//     const createMeshFromData = (meshData) => {
//         if (!scene) return null;

//         const mesh = new BABYLON.Mesh(meshData.name, scene);

//         // Create vertex data
//         const vertexData = new BABYLON.VertexData();
//         vertexData.positions = new Float32Array(meshData.vertexData.positions);
//         vertexData.indices = new Uint32Array(meshData.vertexData.indices);

//         if (meshData.vertexData.normals && meshData.vertexData.normals.length > 0) {
//             vertexData.normals = new Float32Array(meshData.vertexData.normals);
//         }

//         if (meshData.vertexData.uvs && meshData.vertexData.uvs.length > 0) {
//             vertexData.uvs = new Float32Array(meshData.vertexData.uvs);
//         }

//         // Apply vertex data to mesh
//         vertexData.applyToMesh(mesh);

//         // Set transforms
//         mesh.position = new BABYLON.Vector3(
//             meshData.transforms.position.x,
//             meshData.transforms.position.y,
//             meshData.transforms.position.z
//         );

//         mesh.rotation = new BABYLON.Vector3(
//             meshData.transforms.rotation.x,
//             meshData.transforms.rotation.y,
//             meshData.transforms.rotation.z
//         );

//         mesh.scaling = new BABYLON.Vector3(
//             meshData.transforms.scaling.x,
//             meshData.transforms.scaling.y,
//             meshData.transforms.scaling.z
//         );

//         // Set world matrix if available
//         if (meshData.transforms.worldMatrix) {
//             const matrix = BABYLON.Matrix.FromArray(meshData.transforms.worldMatrix);
//             mesh.setPreTransformMatrix(matrix);
//         }

//         // Create and apply material
//         if (meshData.metadata.material) {
//             const material = new BABYLON.StandardMaterial(meshData.metadata.material.name, scene);
//             if (meshData.metadata.material.diffuseColor) {
//                 material.diffuseColor = new BABYLON.Color3(
//                     meshData.metadata.material.diffuseColor.r,
//                     meshData.metadata.material.diffuseColor.g,
//                     meshData.metadata.material.diffuseColor.b
//                 );
//             }
//             mesh.material = material;
//         }

//         // Set visibility and enabled state
//         mesh.isVisible = meshData.metadata.isVisible;
//         mesh.setEnabled(meshData.metadata.isEnabled);

//         return mesh;
//     };

//     const visualizeOctree = (octree) => {
//         // Clear existing octree visualization
//         scene.meshes
//             .filter(mesh => mesh.name.startsWith('octreeNode_'))
//             .forEach(mesh => mesh.dispose());

//         octree.structure.forEach(node => {
//             if (node.bounds) {
//                 const size = new BABYLON.Vector3(
//                     node.bounds.maximum.x - node.bounds.minimum.x,
//                     node.bounds.maximum.y - node.bounds.minimum.y,
//                     node.bounds.maximum.z - node.bounds.minimum.z
//                 );

//                 const center = new BABYLON.Vector3(
//                     (node.bounds.maximum.x + node.bounds.minimum.x) / 2,
//                     (node.bounds.maximum.y + node.bounds.minimum.y) / 2,
//                     (node.bounds.maximum.z + node.bounds.minimum.z) / 2
//                 );

//                 const box = BABYLON.MeshBuilder.CreateBox(
//                     `octreeNode_${node.nodeNumber}`,
//                     { width: size.x, height: size.y, depth: size.z },
//                     scene
//                 );

//                 box.position = center;

//                 const material = new BABYLON.StandardMaterial(`octreeMat_${node.nodeNumber}`, scene);
//                 material.wireframe = true;
//                 material.emissiveColor = new BABYLON.Color3(
//                     node.depth === 4 ? 1 : 0,
//                     node.depth === 4 ? 0 : 1,
//                     0
//                 );

//                 box.material = material;
//                 box.isPickable = false;
//             }
//         });
//     };

//     const loadFromIndexedDB = async () => {
//         if (!scene) {
//             setStatus('Scene not initialized');
//             return;
//         }
//         if (!camera) {
//             setStatus('Camera not initialized');
//             return;
//         }

//         try {
//             // Clear existing meshes except lights and cameras
//             scene.meshes
//                 .filter(mesh => !(mesh instanceof BABYLON.Light || mesh instanceof BABYLON.Camera))
//                 .forEach(mesh => mesh.dispose());

//             setStatus('Opening database...');
//             const db = await openDB('ModelStorage', 1);

//             // Load octree
//             setStatus('Loading octree data...');
//             const serializedOctree = await db.get('octrees', 'mainOctree');
//             const octree = deserializeOctree(serializedOctree);

//             // Load meshes
//             setStatus('Loading mesh data...');
//             const modelStore = db.transaction('models', 'readonly').objectStore('models');
//             const meshKeys = await modelStore.getAllKeys();
//             const meshesData = await Promise.all(
//                 meshKeys.map(key => modelStore.get(key))
//             );

//             // Create meshes
//             setStatus('Creating meshes...');
//             const loadedMeshes = meshesData
//                 .filter(data => data.depth === 4) // Only get meshes at depth 4
//                 .map(meshData => createMeshFromData(meshData))
//                 .filter(mesh => mesh !== null);

//             // Visualize octree
//             setStatus('Visualizing octree...');
//             visualizeOctree(octree);

//             // Calculate bounding box for all loaded meshes
//             const boundingBox = calculateBoundingBox(loadedMeshes);

//             // Position camera to fit all meshes
//             positionCamera(boundingBox);

//             setStatus('Load complete');

//         } catch (error) {
//             console.error('Load error:', error);
//             setStatus(`Error loading data: ${error.message}`);
//         }
//     };

//     const calculateBoundingBox = (meshes) => {
//         let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
//         let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

//         meshes.forEach(mesh => {
//             const boundingBox = mesh.getBoundingInfo().boundingBox;
//             min = BABYLON.Vector3.Minimize(min, boundingBox.minimum);
//             max = BABYLON.Vector3.Maximize(max, boundingBox.maximum);
//         });

//         return { minimum: min, maximum: max };
//     };

//     const positionCamera = (boundingBox) => {
//         if (!camera || !boundingBox) return;

//         const center = BABYLON.Vector3.Center(
//             boundingBox.minimum,
//             boundingBox.maximum
//         );

//         const size = boundingBox.maximum.subtract(boundingBox.minimum);
//         const maxDimension = Math.max(size.x, size.y, size.z);

//         camera.setTarget(center);
//         camera.radius = maxDimension * 2;
//         camera.alpha = Math.PI / 4;
//         camera.beta = Math.PI / 3;
//     };

//     return (
//         <div className="absolute top-4 left-4 z-10">
//             <button
//                 onClick={loadFromIndexedDB}
//                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-4"
//             >
//                 Load Model
//             </button>
//             <span className="bg-white p-2 rounded shadow">{status}</span>
//         </div>
//     );
// };

// export default Loadindexdb;


import React, { useEffect, useRef, useState } from 'react';
import { openDB } from 'idb';
import * as BABYLON from '@babylonjs/core';

const Loadindexdb = () => {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState('');
    let scene;
    let engine;
    let camera;

    const deserializeOctree = (serializedOctree) => {
        return {
            structure: serializedOctree.structure.map(node => ({
                ...node,
                bounds: node.bounds ? {
                    minimum: new BABYLON.Vector3(
                        node.bounds.minimum.x,
                        node.bounds.minimum.y,
                        node.bounds.minimum.z
                    ),
                    maximum: new BABYLON.Vector3(
                        node.bounds.maximum.x,
                        node.bounds.maximum.y,
                        node.bounds.maximum.z
                    )
                } : null
            })),
            metadata: serializedOctree.metadata
        };
    };

    const createMeshFromData = (meshData, scene) => {
        const mesh = new BABYLON.Mesh(meshData.name, scene);

        // Create vertex data
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = new Float32Array(meshData.vertexData.positions);
        vertexData.indices = new Uint32Array(meshData.vertexData.indices);

        if (meshData.vertexData.normals && meshData.vertexData.normals.length > 0) {
            vertexData.normals = new Float32Array(meshData.vertexData.normals);
        }

        if (meshData.vertexData.uvs && meshData.vertexData.uvs.length > 0) {
            vertexData.uvs = new Float32Array(meshData.vertexData.uvs);
        }

        // Apply vertex data to mesh
        vertexData.applyToMesh(mesh);

        // Set transforms
        mesh.position = new BABYLON.Vector3(
            meshData.transforms.position.x,
            meshData.transforms.position.y,
            meshData.transforms.position.z
        );

        mesh.rotation = new BABYLON.Vector3(
            meshData.transforms.rotation.x,
            meshData.transforms.rotation.y,
            meshData.transforms.rotation.z
        );

        mesh.scaling = new BABYLON.Vector3(
            meshData.transforms.scaling.x,
            meshData.transforms.scaling.y,
            meshData.transforms.scaling.z
        );

        // Create and apply material
        if (meshData.metadata.material) {
            const material = new BABYLON.StandardMaterial(meshData.metadata.material.name, scene);
            if (meshData.metadata.material.diffuseColor) {
                material.diffuseColor = new BABYLON.Color3(
                    meshData.metadata.material.diffuseColor.r,
                    meshData.metadata.material.diffuseColor.g,
                    meshData.metadata.material.diffuseColor.b
                );
            }
            mesh.material = material;
        }

        // Set visibility and enabled state
        mesh.isVisible = meshData.metadata.isVisible;
        mesh.setEnabled(meshData.metadata.isEnabled);
        // Add octree-specific properties
        mesh.nodeNumber = meshData.nodeNumber;
        mesh.depth = meshData.depth;
        mesh.parentNode = meshData.parentNode;

        return mesh;
    };

    // const visualizeOctree = (octree, scene) => {
    //     octree.structure.forEach(node => {
    //         if (node.bounds) {
    //             const size = new BABYLON.Vector3(
    //                 node.bounds.maximum.x - node.bounds.minimum.x,
    //                 node.bounds.maximum.y - node.bounds.minimum.y,
    //                 node.bounds.maximum.z - node.bounds.minimum.z
    //             );

    //             const center = new BABYLON.Vector3(
    //                 (node.bounds.maximum.x + node.bounds.minimum.x) / 2,
    //                 (node.bounds.maximum.y + node.bounds.minimum.y) / 2,
    //                 (node.bounds.maximum.z + node.bounds.minimum.z) / 2
    //             );

    //             const box = BABYLON.MeshBuilder.CreateBox(
    //                 `octreeNode_${node.nodeNumber}`,
    //                 { width: size.x, height: size.y, depth: size.z },
    //                 scene
    //             );

    //             box.position = center;

    //             const material = new BABYLON.StandardMaterial(`octreeMat_${node.nodeNumber}`, scene);
    //             material.wireframe = true;
    //             material.emissiveColor = new BABYLON.Color3(
    //                 node.depth === 4 ? 1 : 0,
    //                 node.depth === 4 ? 0 : 1,
    //                 0
    //             );

    //             box.material = material;
    //             box.isPickable = false;
    //         }
    //     });
    // };
    // const visualizeOctree = (scene, octreeData) => {
    //     // Create materials for different depths
    //     const materials = {
    //         0: new BABYLON.StandardMaterial("depth0", scene),
    //         1: new BABYLON.StandardMaterial("depth1", scene),
    //         2: new BABYLON.StandardMaterial("depth2", scene),
    //         3: new BABYLON.StandardMaterial("depth3", scene)
    //     };

    //     // Set up materials with different colors
    //     Object.values(materials).forEach(material => {
    //         material.wireframe = true;
    //         material.alpha = 0.3;
    //     });
    //     materials[0].emissiveColor = new BABYLON.Color3(1, 0, 0); // Red
    //     materials[1].emissiveColor = new BABYLON.Color3(0, 1, 0); // Green
    //     materials[2].emissiveColor = new BABYLON.Color3(0, 0, 1); // Blue
    //     materials[3].emissiveColor = new BABYLON.Color3(1, 1, 0); // Yellow

    //     // Visualize each node in the octree
    //     octreeData.structure.forEach(node => {
    //         if (node.bounds) {
    //             const min = new BABYLON.Vector3(
    //                 node.bounds.minimum.x,
    //                 node.bounds.minimum.y,
    //                 node.bounds.minimum.z
    //             );
    //             const max = new BABYLON.Vector3(
    //                 node.bounds.maximum.x,
    //                 node.bounds.maximum.y,
    //                 node.bounds.maximum.z
    //             );

    //             // Calculate size and center
    //             const size = max.subtract(min);
    //             const center = BABYLON.Vector3.Center(min, max);

    //             // Create box for visualization
    //             const box = BABYLON.MeshBuilder.CreateBox(
    //                 `octreeNode_${node.nodeNumber}`,
    //                 {
    //                     width: size.x,
    //                     height: size.y,
    //                     depth: size.z
    //                 },
    //                 scene
    //             );

    //             // Position the box
    //             box.position = center;

    //             // Apply material based on depth
    //             box.material = materials[node.depth] || materials[0];
    //             box.isPickable = false;
    //         }
    //     });
    // };

    const visualizeOctree = (scene, octreeData) => {
        // Clear existing octree visualization
        scene.meshes
            .filter(mesh => mesh.name.startsWith('octreeNode_'))
            .forEach(mesh => mesh.dispose());

        // Create materials for different depths
        const materials = {
            0: new BABYLON.StandardMaterial("depth0", scene),
            1: new BABYLON.StandardMaterial("depth1", scene),
            2: new BABYLON.StandardMaterial("depth2", scene),
            3: new BABYLON.StandardMaterial("depth3", scene),
            4: new BABYLON.StandardMaterial("depth4", scene)
        };

        // Set up materials with different colors
        Object.values(materials).forEach(material => {
            material.wireframe = true;
            material.alpha = 0.3;
        });
        materials[0].emissiveColor = new BABYLON.Color3(1, 0, 0);   // Red
        materials[1].emissiveColor = new BABYLON.Color3(0, 1, 0);   // Green
        materials[2].emissiveColor = new BABYLON.Color3(0, 0, 1);   // Blue
        materials[3].emissiveColor = new BABYLON.Color3(1, 1, 0);   // Yellow
        materials[4].emissiveColor = new BABYLON.Color3(1, 0, 1);   // Purple

        // Create a map to track created boxes
        const createdBoxes = new Map();

        // Visualize each node in the octree, but only once per node
        octreeData.structure.forEach(node => {
            if (node.bounds && !createdBoxes.has(node.nodeNumber)) {
                const min = new BABYLON.Vector3(
                    node.bounds.minimum.x,
                    node.bounds.minimum.y,
                    node.bounds.minimum.z
                );
                const max = new BABYLON.Vector3(
                    node.bounds.maximum.x,
                    node.bounds.maximum.y,
                    node.bounds.maximum.z
                );

                // Calculate size and center
                const size = max.subtract(min);
                const center = BABYLON.Vector3.Center(min, max);

                // Create box for visualization
                const box = BABYLON.MeshBuilder.CreateBox(
                    `octreeNode_${node.nodeNumber}`,
                    {
                        width: size.x,
                        height: size.y,
                        depth: size.z
                    },
                    scene
                );

                // Position the box
                box.position = center;

                // Apply material based on depth
                box.material = materials[node.depth] || materials[0];
                box.isPickable = false;

                // Track this box
                createdBoxes.set(node.nodeNumber, box);
            }
        });
    };
    const setupScene = () => {
        engine = new BABYLON.Engine(canvasRef.current, true);
        scene = new BABYLON.Scene(engine);

        // Create camera
        camera = new BABYLON.ArcRotateCamera(
            "camera",
            0,
            Math.PI / 3,
            10,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvasRef.current, true);

        // Add light
        new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );

        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener('resize', () => {
            engine.resize();
        });

        return scene;
    };

    const isInsideNode = (mesh, bounds) => {
        const center = mesh.getBoundingInfo().boundingBox.centerWorld;
        const min = bounds.minimum;
        const max = bounds.maximum;

        return (center.x >= min.x && center.x <= max.x &&
            center.y >= min.y && center.y <= max.y &&
            center.z >= min.z && center.z <= max.z);
    };

    // const loadFromIndexedDB = async () => {
    //     try {
    //         setStatus('Opening database...');
    //         const db = await openDB('ModelStorage', 1);

    //         // Load octree
    //         setStatus('Loading octree data...');
    //         const serializedOctree = await db.get('octrees', 'mainOctree');
    //         const octree = deserializeOctree(serializedOctree);

    //         // Load meshes
    //         setStatus('Loading mesh data...');
    //         const modelStore = db.transaction('models', 'readonly').objectStore('models');
    //         const meshKeys = await modelStore.getAllKeys();
    //         const meshesData = await Promise.all(
    //             meshKeys.map(key => modelStore.get(key))
    //         );

    //         // Setup scene
    //         setStatus('Setting up scene...');
    //         const scene = setupScene();

    //         // Create meshes
    //         setStatus('Creating meshes...');
    //         const loadedMeshes = meshesData
    //             .filter(data => data.depth === 4) // Only get meshes at depth 4
    //             .map(meshData => createMeshFromData(meshData, scene));

    //         // Visualize octree
    //         setStatus('Visualizing octree...');
    //         visualizeOctree(octree, scene);

    //         // Position camera to fit all meshes
    //         const boundingBox = calculateBoundingBox(loadedMeshes);
    //         positionCamera(boundingBox);

    //         setStatus('Load complete');

    //     } catch (error) {
    //         console.error('Load error:', error);
    //         setStatus(`Error loading data: ${error.message}`);
    //     }
    // };


    // const loadFromIndexedDB = async () => {
    //     try {
    //         setStatus('Opening database...');
    //         const db = await openDB('ModelStorage', 1);

    //         // Load octree first
    //         setStatus('Loading octree data...');
    //         const serializedOctree = await db.get('octrees', 'mainOctree');

    //         if (!serializedOctree) {
    //             throw new Error('No octree data found');
    //         }

    //         // Load meshes
    //         setStatus('Loading mesh data...');
    //         const modelStore = db.transaction('models', 'readonly').objectStore('models');
    //         const meshKeys = await modelStore.getAllKeys();
    //         const meshesData = await Promise.all(
    //             meshKeys.map(key => modelStore.get(key))
    //         );

    //         // Setup scene if not already set up
    //         const scene = setupScene();

    //         // Create meshes from loaded data
    //         setStatus('Creating meshes...');
    //         const loadedMeshes = meshesData.map(meshData => 
    //             createMeshFromData(meshData, scene)
    //         ).filter(mesh => mesh !== null);

    //         // Visualize the octree structure
    //         setStatus('Visualizing octree...');
    //         visualizeOctree(scene, serializedOctree);

    //         // Position camera to fit all loaded content
    //         const boundingBox = calculateBoundingBox(loadedMeshes);
    //         positionCamera(boundingBox);

    //         // Enable octree for loaded meshes
    //         loadedMeshes.forEach(mesh => {
    //             // Map mesh to its octree node based on position
    //             const nodeForMesh = findNodeForMesh(serializedOctree, mesh);
    //             if (nodeForMesh) {
    //                 mesh.nodeNumber = nodeForMesh.nodeNumber;
    //             }
    //         });

    //         setStatus('Load complete');

    //     } catch (error) {
    //         console.error('Load error:', error);
    //         setStatus(`Error loading data: ${error.message}`);
    //     }
    // };
    // Modified loadFromIndexedDB function


    //     const loadFromIndexedDB = async () => {
    //     try {
    //         setStatus('Opening database...');
    //         const db = await openDB('ModelStorage', 1);

    //         // Load octree first
    //         setStatus('Loading octree data...');
    //         const serializedOctree = await db.get('octrees', 'mainOctree');

    //         if (!serializedOctree) {
    //             throw new Error('No octree data found');
    //         }

    //         // Load meshes
    //         setStatus('Loading mesh data...');
    //         const modelStore = db.transaction('models', 'readonly').objectStore('models');
    //         const meshKeys = await modelStore.getAllKeys();
    //         const meshesData = await Promise.all(
    //             meshKeys.map(key => modelStore.get(key))
    //         );

    //         // Setup scene if not already set up
    //         const scene = setupScene();

    //         // First, create all meshes and store them in an array
    //         setStatus('Creating meshes...');
    //         const allMeshes = [];
    //         for (const meshData of meshesData) {
    //             const mesh = createMeshFromData(meshData, scene);
    //             if (mesh) {
    //                 // Store node information in mesh
    //                 mesh.nodeNumber = meshData.nodeNumber;
    //                 mesh.depth = meshData.depth;
    //                 allMeshes.push(mesh);
    //             }
    //         }

    //         // Visualize the single octree structure
    //         setStatus('Visualizing octree...');
    //         visualizeOctree(scene, serializedOctree);

    //         // Calculate cumulative bounding box from all meshes
    //         const boundingBox = calculateBoundingBox(allMeshes);
    //         positionCamera(boundingBox);

    //         // Organize meshes according to octree structure
    //         serializedOctree.structure.forEach(node => {
    //             // Find meshes belonging to this node
    //             const nodeMeshes = allMeshes.filter(mesh => 
    //                 mesh.nodeNumber === node.nodeNumber
    //             );

    //             // Set visibility/material based on node depth or other criteria
    //             nodeMeshes.forEach(mesh => {
    //                 // Set mesh properties based on its node
    //                 mesh.isVisible = true;

    //                 // Optional: Color meshes based on their depth in the octree
    //                 const material = new BABYLON.StandardMaterial(`mat_${mesh.nodeNumber}`, scene);
    //                 material.diffuseColor = new BABYLON.Color3(
    //                     node.depth / 4,  // Vary color based on depth
    //                     1 - (node.depth / 4),
    //                     0.5
    //                 );
    //                 mesh.material = material;
    //             });
    //         });

    //         setStatus('Load complete');

    //     } catch (error) {
    //         console.error('Load error:', error);
    //         setStatus(`Error loading data: ${error.message}`);
    //     }
    // };

    const loadFromIndexedDB = async () => {
        try {
            setStatus('Opening database...');
            const db = await openDB('ModelStorage', 1);

            // Load octree first
            setStatus('Loading octree data...');
            const serializedOctree = await db.get('octrees', 'mainOctree');

            if (!serializedOctree) {
                throw new Error('No octree data found');
            }

            // Load meshes
            setStatus('Loading mesh data...');
            const modelStore = db.transaction('models', 'readonly').objectStore('models');
            const meshKeys = await modelStore.getAllKeys();
            const meshesData = await Promise.all(
                meshKeys.map(key => modelStore.get(key))
            );

            // Setup scene if not already set up
            const scene = setupScene();

            // First load all meshes
            setStatus('Creating meshes...');
            const allMeshes = [];
            for (const meshData of meshesData) {
                try {
                    const mesh = createMeshFromData(meshData, scene);
                    if (mesh) {
                        // Initially set all meshes as invisible
                        mesh.isVisible = false;
                        allMeshes.push(mesh);
                    }
                } catch (err) {
                    console.error(`Error creating mesh for ${meshData.name}:`, err);
                }
            }

            // Calculate cumulative bounding box for all meshes
            setStatus('Calculating scene bounds...');
            const totalBoundingBox = calculateBoundingBox(allMeshes);

            // Deserialize and visualize the single octree structure
            setStatus('Visualizing octree structure...');
            const octree = deserializeOctree(serializedOctree);

            // Clear any existing octree visualization
            scene.meshes
                .filter(mesh => mesh.name.startsWith('octreeNode_'))
                .forEach(mesh => mesh.dispose());

            // Visualize the single octree
            visualizeOctree(scene, octree);

            // Position camera based on total bounds
            setStatus('Positioning camera...');
            positionCamera(totalBoundingBox);

            // Create materials for different depths
            const depthMaterials = {};
            for (let i = 0; i <= 4; i++) {
                const material = new BABYLON.StandardMaterial(`depth_material_${i}`, scene);
                material.diffuseColor = new BABYLON.Color3(
                    i / 4,
                    1 - (i / 4),
                    0.5
                );
                depthMaterials[i] = material;
            }

            // Organize and show meshes according to octree structure
            setStatus('Organizing meshes in octree...');
            octree.structure.forEach(node => {
                // Find meshes that belong to this node
                const nodeMeshes = allMeshes.filter(mesh => {
                    const meshBounds = mesh.getBoundingInfo().boundingBox;
                    const meshCenter = meshBounds.centerWorld;

                    // Check if mesh center is within node bounds
                    if (!node.bounds) return false;

                    const min = node.bounds.minimum;
                    const max = node.bounds.maximum;

                    return (
                        meshCenter.x >= min.x && meshCenter.x <= max.x &&
                        meshCenter.y >= min.y && meshCenter.y <= max.y &&
                        meshCenter.z >= min.z && meshCenter.z <= max.z
                    );
                });

                // Process meshes in this node
                nodeMeshes.forEach(mesh => {
                    // Store node information in mesh
                    mesh.nodeNumber = node.nodeNumber;
                    mesh.depth = node.depth;

                    // Make mesh visible
                    mesh.isVisible = true;

                    // Apply depth-based material
                    mesh.material = depthMaterials[node.depth].clone(`mat_${mesh.nodeNumber}_${mesh.name}`);
                });
            });

            // Log statistics
            const visibleMeshCount = allMeshes.filter(mesh => mesh.isVisible).length;
            console.log(`Total meshes loaded: ${allMeshes.length}`);
            console.log(`Visible meshes: ${visibleMeshCount}`);
            console.log(`Octree nodes: ${octree.structure.length}`);

            setStatus('Load complete');

        } catch (error) {
            console.error('Load error:', error);
            setStatus(`Error loading data: ${error.message}`);

            // Additional error details
            if (error.stack) {
                console.error('Error stack:', error.stack);
            }
        }
    };

    // Helper function to find appropriate node for a mesh
    const findNodeForMesh = (octreeData, mesh) => {
        const meshCenter = mesh.getBoundingInfo().boundingBox.centerWorld;

        return octreeData.structure.find(node => {
            if (!node.bounds) return false;

            const min = new BABYLON.Vector3(
                node.bounds.minimum.x,
                node.bounds.minimum.y,
                node.bounds.minimum.z
            );
            const max = new BABYLON.Vector3(
                node.bounds.maximum.x,
                node.bounds.maximum.y,
                node.bounds.maximum.z
            );

            return meshCenter.x >= min.x && meshCenter.x <= max.x &&
                meshCenter.y >= min.y && meshCenter.y <= max.y &&
                meshCenter.z >= min.z && meshCenter.z <= max.z;
        });
    };

    const calculateBoundingBox = (meshes) => {
        let min = new BABYLON.Vector3(Infinity, Infinity, Infinity);
        let max = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);

        meshes.forEach(mesh => {
            const boundingBox = mesh.getBoundingInfo().boundingBox;
            min = BABYLON.Vector3.Minimize(min, boundingBox.minimum);
            max = BABYLON.Vector3.Maximize(max, boundingBox.maximum);
        });

        return { minimum: min, maximum: max };
    };

    const positionCamera = (boundingBox) => {
        if (!camera || !boundingBox) return;

        const center = BABYLON.Vector3.Center(
            boundingBox.minimum,
            boundingBox.maximum
        );

        const size = boundingBox.maximum.subtract(boundingBox.minimum);
        const maxDimension = Math.max(size.x, size.y, size.z);

        camera.setTarget(center);
        camera.radius = maxDimension * 2;
        camera.alpha = Math.PI / 4;
        camera.beta = Math.PI / 3;
    };

    useEffect(() => {
        return () => {
            if (scene) {
                scene.dispose();
            }
            if (engine) {
                engine.dispose();
            }
        };
    }, []);

    return (
        <div className="relative">
            <button
                onClick={loadFromIndexedDB}
                className="absolute top-4 left-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Load Model
            </button>
            <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
                <p>{status}</p>
            </div>
            <canvas ref={canvasRef} style={{ width: '100%', height: '70vh' }} />
        </div>
    );
};

export default Loadindexdb;