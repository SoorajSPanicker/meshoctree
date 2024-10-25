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
                        console.log(collectMergedMeshData);
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
                            data: {
                                ...data,
                                meshType: 'original'  // Add type identifier
                            }
                        })),
                        ...mergedMeshesData.map(data => ({
                            fileName: `merged_${data.name}`,
                            data: {
                                ...data,
                                meshType: 'merged'    // Add type identifier
                            }
                        }))
                    ]}
                    octree={octreeData}
                />
            )}
 */}

            {octreeData && originalMeshesData.length > 0 && (
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
            )}
        </div>
    );
}
export default Fbxload;