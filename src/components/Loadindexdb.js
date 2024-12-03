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

import React, { useEffect, useRef, useState } from 'react';
import { openDB } from 'idb';
import * as BABYLON from '@babylonjs/core';

const Loadindexdb = () => {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState('');
    let scene;
    let engine;
    let camera;
    const [isWireframe, setIsWireframe] = useState(false);

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
        try {
            const mesh = new BABYLON.Mesh(meshData.data.name, scene);

            // Create vertex data
            const vertexData = new BABYLON.VertexData();
            vertexData.positions = new Float32Array(meshData.data.vertexData.positions);
            vertexData.indices = new Uint32Array(meshData.data.vertexData.indices);

            if (meshData.data.vertexData.normals && meshData.data.vertexData.normals.length > 0) {
                vertexData.normals = new Float32Array(meshData.data.vertexData.normals);
            }

            if (meshData.data.vertexData.uvs && meshData.data.vertexData.uvs.length > 0) {
                vertexData.uvs = new Float32Array(meshData.data.vertexData.uvs);
            }

            // Apply vertex data to mesh
            vertexData.applyToMesh(mesh);

            // Set transforms
            mesh.position = new BABYLON.Vector3(
                meshData.data.transforms.position.x,
                meshData.data.transforms.position.y,
                meshData.data.transforms.position.z
            );

            mesh.rotation = new BABYLON.Vector3(
                meshData.data.transforms.rotation.x,
                meshData.data.transforms.rotation.y,
                meshData.data.transforms.rotation.z
            );

            mesh.scaling = new BABYLON.Vector3(
                meshData.data.transforms.scaling.x,
                meshData.data.transforms.scaling.y,
                meshData.data.transforms.scaling.z
            );

            // Create and apply material
            const material = new BABYLON.StandardMaterial(`material_${mesh.name}`, scene);
            material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
            material.backFaceCulling = false;
            material.wireframe = false; // Ensure wireframe is off
            mesh.material = material;

            // Set metadata
            mesh.nodeNumber = meshData.data.nodeNumber;
            mesh.depth = meshData.data.depth;
            mesh.parentNode = meshData.data.parentNode;

            // Ensure the mesh is not showing its bounding box
            mesh.showBoundingBox = false;

            return mesh;
        } catch (error) {
            console.error('Error creating mesh:', error);
            return null;
        }
    };

    const createWireframeBox = (scene, minimum, maximum, depth = 0) => {
        if (!scene) {
            console.error('No scene provided to createWireframeBox');
            return null;
        }

        try {
            const size = maximum.subtract(minimum);
            const center = BABYLON.Vector3.Center(minimum, maximum);

            const box = BABYLON.MeshBuilder.CreateBox(
                `octreeVisBox_${depth}_${Math.random()}`,
                {
                    width: Math.max(0.001, size.x),
                    height: Math.max(0.001, size.y),
                    depth: Math.max(0.001, size.z)
                },
                scene
            );

            box.position = center;
            const material = new BABYLON.StandardMaterial(`wireframeMat_${depth}_${Math.random()}`, scene);
            material.wireframe = true;
            material.alpha = 1;

            switch (depth) {
                case 0: material.emissiveColor = new BABYLON.Color3(1, 0, 0); break;
                case 1: material.emissiveColor = new BABYLON.Color3(0, 1, 0); break;
                case 2: material.emissiveColor = new BABYLON.Color3(0, 0, 1); break;
                case 3: material.emissiveColor = new BABYLON.Color3(1, 1, 0); break;
                default: material.emissiveColor = new BABYLON.Color3(1, 1, 1);
            }

            box.material = material;
            box.isPickable = false;
            return box;
        } catch (error) {
            console.error('Error creating wireframe box:', error);
            return null;
        }
    };



    const visualizeOctree = async (scene, octree) => {
        if (!scene || !octree) {
            console.error('Missing scene or octree for visualization');
            return;
        }

        console.log('Starting octree visualization');

        // Create root bounding box
        const boundingBox = octree.metadata.boundingBox;
        if (boundingBox) {
            console.log('Creating root bounding box');
            // Ensure min and max are BABYLON.Vector3 objects
            const minVector = new BABYLON.Vector3(
                boundingBox.min.x,
                boundingBox.min.y,
                boundingBox.min.z
            );
            const maxVector = new BABYLON.Vector3(
                boundingBox.max.x,
                boundingBox.max.y,
                boundingBox.max.z
            );

            const rootBox = createWireframeBox(scene, minVector, maxVector, 0);
            if (rootBox) {
                console.log('Root box created');
            }
        }

        // // Visualize each node
        // let nodeCount = 0;
        // for (const node of octree.structure) {
        //     if (node.bounds) {
        //         try {
        //             // Ensure minimum and maximum are BABYLON.Vector3 objects
        //             const minimum = new BABYLON.Vector3(
        //                 node.bounds.minimum.x,
        //                 node.bounds.minimum.y,
        //                 node.bounds.minimum.z
        //             );
        //             const maximum = new BABYLON.Vector3(
        //                 node.bounds.maximum.x,
        //                 node.bounds.maximum.y,
        //                 node.bounds.maximum.z
        //             );

        //             const box = createWireframeBox(
        //                 scene,
        //                 minimum,
        //                 maximum,
        //                 node.depth
        //             );
        //             if (box) nodeCount++;
        //         } catch (error) {
        //             console.error('Error creating node box:', error);
        //         }
        //     }
        // }
        // console.log(`Created ${nodeCount} node boxes`);
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
        camera.wheelPrecision = 50;
        camera.pinchPrecision = 50;

        // Add lights
        const hemisphericLight = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );
        hemisphericLight.intensity = 0.7;

        const pointLight = new BABYLON.PointLight(
            "pointLight",
            new BABYLON.Vector3(0, 10, 0),
            scene
        );
        pointLight.intensity = 0.5;

        engine.runRenderLoop(() => {
            scene.render();
        });

        window.addEventListener('resize', () => {
            engine.resize();
        });

        return scene;
    };

    const filterMeshVisibility = (scene) => {
        if (!scene) return;

        // Hide all meshes first
        scene.meshes.forEach(mesh => {
            // Skip octree wireframe boxes
            if (mesh.name.startsWith('octreeVisBox_')) {
                return;
            }

            // Check if mesh name ends with '_angle20'
            if (mesh.name.endsWith('_angle20')) {
                mesh.isVisible = true;
                mesh.setEnabled(true);
            } else {
                mesh.isVisible = false;
                mesh.setEnabled(false);
            }
        });
    };
    // const showwireframe = () => {
    //     setIsWireframe(prev => !prev);
    //     console.log("Entered wireframe");

    //     if (scene) {
    //         const visibleMeshes = scene.meshes.filter(mesh =>
    //             mesh.isVisible &&
    //             !mesh.name.startsWith("octreeVisBox_") &&
    //             mesh.material
    //         );

    //         visibleMeshes.forEach(mesh => {
    //             if (isWireframe) {
    //                 // Restore original material settings if they exist
    //                 if (mesh._originalMaterialSettings) {
    //                     mesh.material.wireframe = mesh._originalMaterialSettings.wireframe;
    //                     mesh.material.backFaceCulling = mesh._originalMaterialSettings.backFaceCulling;
    //                     if (mesh._originalMaterialSettings.emissiveColor) {
    //                         mesh.material.emissiveColor = mesh._originalMaterialSettings.emissiveColor;
    //                     }
    //                     if (mesh._originalMaterialSettings.diffuseColor) {
    //                         mesh.material.diffuseColor = mesh._originalMaterialSettings.diffuseColor;
    //                     }
    //                 }
    //             } else {
    //                 // Store original material settings
    //                 if (!mesh._originalMaterialSettings) {
    //                     mesh._originalMaterialSettings = {
    //                         wireframe: mesh.material.wireframe,
    //                         backFaceCulling: mesh.material.backFaceCulling,
    //                         emissiveColor: mesh.material.emissiveColor ? mesh.material.emissiveColor.clone() : null,
    //                         diffuseColor: mesh.material.diffuseColor ? mesh.material.diffuseColor.clone() : null,
    //                     };
    //                 }

    //                 // Apply wireframe settings
    //                 mesh.material.wireframe = true;
    //                 mesh.material.backFaceCulling = false;
    //                 mesh.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    //                 mesh.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
    //             }
    //         });
    //     }
    // };

    // const showwireframe = () => {
    //     setIsWireframe(prev => !prev);
    //     console.log("Toggling wireframe mode");

    //     if (scene) {
    //         // Get only visible meshes that aren't octree boxes
    //         const visibleMeshes = scene.meshes.filter(mesh =>
    //             mesh.isVisible &&
    //             !mesh.name.startsWith("octreeVisBox_") &&
    //             mesh.name.endsWith("_angle20") &&
    //             mesh.material
    //         );

    //         visibleMeshes.forEach(mesh => {
    //             if (mesh.material) {
    //                 if (!isWireframe) {
    //                     // Store original material settings before switching to wireframe
    //                     if (!mesh._originalMaterialSettings) {
    //                         mesh._originalMaterialSettings = {
    //                             wireframe: mesh.material.wireframe,
    //                             backFaceCulling: mesh.material.backFaceCulling,
    //                             diffuseColor: mesh.material.diffuseColor.clone(),
    //                             emissiveColor: mesh.material.emissiveColor ?
    //                                 mesh.material.emissiveColor.clone() : null
    //                         };
    //                     }

    //                     // Apply wireframe settings
    //                     mesh.material.wireframe = true;
    //                     mesh.material.backFaceCulling = false;
    //                     mesh.material.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    //                 } else {
    //                     // Restore original material settings
    //                     if (mesh._originalMaterialSettings) {
    //                         mesh.material.wireframe = mesh._originalMaterialSettings.wireframe;
    //                         mesh.material.backFaceCulling = mesh._originalMaterialSettings.backFaceCulling;
    //                         mesh.material.diffuseColor = mesh._originalMaterialSettings.diffuseColor;
    //                         if (mesh._originalMaterialSettings.emissiveColor) {
    //                             mesh.material.emissiveColor = mesh._originalMaterialSettings.emissiveColor;
    //                         }
    //                     }
    //                 }
    //             }
    //         });
    //     }
    // };

    const showwireframe = () => {
        // Toggle wireframe state and use the new value immediately
        setIsWireframe(prevState => {
            const newWireframeState = !prevState;
            console.log("Toggling wireframe mode:", newWireframeState);

            if (scene) {
                // Get only visible meshes that aren't octree boxes
                const visibleMeshes = scene.meshes.filter(mesh =>
                    mesh.isVisible &&
                    !mesh.name.startsWith("octreeVisBox_") &&
                    mesh.name.endsWith("_angle20") &&
                    mesh.material
                );

                visibleMeshes.forEach(mesh => {
                    if (mesh.material) {
                        if (newWireframeState) { // Using new state value instead of !isWireframe
                            // Store original material settings before switching to wireframe
                            if (!mesh._originalMaterialSettings) {
                                mesh._originalMaterialSettings = {
                                    wireframe: mesh.material.wireframe,
                                    backFaceCulling: mesh.material.backFaceCulling,
                                    diffuseColor: mesh.material.diffuseColor.clone(),
                                    emissiveColor: mesh.material.emissiveColor ?
                                        mesh.material.emissiveColor.clone() : null
                                };
                            }

                            // Apply wireframe settings
                            mesh.material.wireframe = true;
                            mesh.material.backFaceCulling = false;
                            mesh.material.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                        } else {
                            // Restore original material settings
                            if (mesh._originalMaterialSettings) {
                                mesh.material.wireframe = mesh._originalMaterialSettings.wireframe;
                                mesh.material.backFaceCulling = mesh._originalMaterialSettings.backFaceCulling;
                                mesh.material.diffuseColor = mesh._originalMaterialSettings.diffuseColor;
                                if (mesh._originalMaterialSettings.emissiveColor) {
                                    mesh.material.emissiveColor = mesh._originalMaterialSettings.emissiveColor;
                                }
                            }
                        }
                    }
                });
            }

            return newWireframeState;
        });
    };

    const loadFromIndexedDB = async () => {
        try {
            setStatus('Opening database...');
            const db = await openDB('ModelStorage', 1);

            // Load octree data
            setStatus('Loading octree data...');
            const octreeData = await db.get('octrees', 'mainOctree');
            if (!octreeData || !octreeData.data) {
                throw new Error('No octree data found');
            }

            // Load mesh data
            setStatus('Loading mesh data...');
            const meshesData = await db.getAll('models');
            if (!meshesData || meshesData.length === 0) {
                throw new Error('No mesh data found');
            }

            // Setup scene
            const scene = setupScene();

            // Create meshes
            setStatus('Creating meshes...');
            const loadedMeshes = [];
            for (const meshData of meshesData) {
                const mesh = createMeshFromData(meshData, scene);
                if (mesh) {
                    loadedMeshes.push(mesh);
                }
            }

            // Deserialize and visualize octree
            setStatus('Visualizing octree...');
            const octree = deserializeOctree(octreeData.data);
            visualizeOctree(scene, octree);

            // Filter mesh visibility
            setStatus('Filtering meshes...');
            filterMeshVisibility(scene);

            // Position camera to view all content
            setStatus('Positioning camera...');
            if (octreeData.data.metadata.boundingBox) {
                const min = new BABYLON.Vector3(
                    octreeData.data.metadata.boundingBox.min.x,
                    octreeData.data.metadata.boundingBox.min.y,
                    octreeData.data.metadata.boundingBox.min.z
                );
                const max = new BABYLON.Vector3(
                    octreeData.data.metadata.boundingBox.max.x,
                    octreeData.data.metadata.boundingBox.max.y,
                    octreeData.data.metadata.boundingBox.max.z
                );

                const center = BABYLON.Vector3.Center(min, max);
                const size = max.subtract(min);
                const maxDimension = Math.max(size.x, size.y, size.z);

                camera.setTarget(center);
                camera.radius = maxDimension * 2;
                camera.alpha = Math.PI / 4;
                camera.beta = Math.PI / 3;
            }

            setStatus(`Loaded ${loadedMeshes.length} meshes and ${octree.structure.length} octree nodes`);

        } catch (error) {
            console.error('Load error:', error);
            setStatus(`Error: ${error.message}`);
        }
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
            <div id='rightopt' style={{ right: '0px' }} >
                <i class="fa-solid fa-circle-info  button " title='Tag Info'  ></i>
                <i class="fa fa-search-plus button" title='Zoomin' ></i>
                <i class="fa fa-search-plus button" title='Download' ></i>
                <i
                    className="fa-solid fa-circle-info button"
                    title={`Wireframe ${isWireframe ? 'Off' : 'On'}`}
                    onClick={showwireframe}
                    style={{
                        cursor: 'pointer',
                        color: isWireframe ? '#4CAF50' : '#000000'
                    }}
                ></i>
            </div>
        </div>
    );
};

export default Loadindexdb;