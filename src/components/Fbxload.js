import React, { useEffect, useRef, useState } from 'react';
import { calculateBoundingBoxes, createBoundingBoxMesh } from './Bbload';
import { createCustomOctree, visualizeCustomOctree, initializeScene, positionCameraToFitBoundingBox } from './Octreecreation';
import * as BABYLON from '@babylonjs/core';
import Octreestorage from './Octreestorage';
import CameraControls from './CameraControls';
import { GLTF2Export } from '@babylonjs/serializers/glTF';
import Loadindexdb from './Loadindexdb';
import PerformanceMonitor from './PerformanceMonitor'
import { v4 as uuidv4 } from 'uuid';
function Fbxload() {
    let nodesAtDepth;
    const maxDepth = 4;
    const minSize = 0; // Minimum size for subdivision
    let nodeNumbersByDepth;
    let nodesAtDepthWithBoxes;
    let boxesAtDepth;
    let nodeContents;
    let nodeDepths;
    let nodeParents;
    let nodeCounter;
    let camera;
    let maxDistance;
    let initialMaxCoverage = -Infinity;
    let lodOne = [];
    let lodTwo = [];
    let lodThree = [];
    const [downloadMeshes, setDownloadMeshes] = useState({
        mesh1: [],
        mesh2: [],
        mesh3: []
    });
    let scene;
    let engine;
    // Add these constants at the top with other state tracking variables
    const FACE_LIMIT1 = 30000;
    let greenMaterial;
    let redMaterial;
    let blueMaterial;
    let yellowMaterial;

    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [AllCumulativeBoundingBox, setCumulativeBoundingBox] = useState({});
    const [mergemeshdatas, setmergemeshdatas] = useState([])
    const [orimeshdatas, setorimeshdatas] = useState([])
    const [lpolymeshdatas, setlpolymeshdatas] = useState([])
    const [octreedatas, setoctreedatas] = useState({})
    const [currentScene, setCurrentScene] = useState(null);
    const [buttonState, setButtonState] = useState({
        text: 'Download Model',
        disabled: false
    });
    let loadedMeshes = [];
    const [allLoadedMeshes, setAllLoadedMeshes] = useState([]);
    const [alllpolyMeshes, setalllpolymeshes] = useState([]);

    const [engineState, setEngineState] = useState(null);
    const [sceneState, setSceneState] = useState(null);


    let Fullmeshes = [];

    const canvasRef = useRef(null);
    const sceneRef = useRef(null);

    const handleFileSelect = () => {
        window.api.send('open-file-dialog');
    };

    const handleglbSelect = () => {
        window.api.send('open-glbfile-dialog');
    };

    const handlemeshfile = () => {
        window.api.send('open-glbfile-mesh');
        // e.preventDefault();
        // const selectedFiles = Array.from(e.target.files);
        // console.log(selectedFiles);

    };

    // const createWireframeBox = (scene, minimum, maximum, depth = 0) => {
    //     if (!scene) return null;

    //     const size = new BABYLON.Vector3(
    //         maximum.x - minimum.x,
    //         maximum.y - minimum.y,
    //         maximum.z - minimum.z
    //     );
    //     const center = new BABYLON.Vector3(
    //         (maximum.x + minimum.x) / 2,
    //         (maximum.y + minimum.y) / 2,
    //         (maximum.z + minimum.z) / 2
    //     );

    //     const box = BABYLON.MeshBuilder.CreateBox("octreeVisBox_" + nodeCounter, {
    //         width: size.x,
    //         height: size.y,
    //         depth: size.z
    //     }, scene);

    //     box.position = center;
    //     const material = new BABYLON.StandardMaterial("wireframeMat" + depth, scene);
    //     material.wireframe = true;

    //     switch (depth) {
    //         case 0: material.emissiveColor = new BABYLON.Color3(1, 0, 0); break;
    //         case 1: material.emissiveColor = new BABYLON.Color3(0, 1, 0); break;
    //         case 2: material.emissiveColor = new BABYLON.Color3(0, 0, 1); break;
    //         case 3: material.emissiveColor = new BABYLON.Color3(1, 1, 0); break;
    //         default: material.emissiveColor = new BABYLON.Color3(1, 1, 1);
    //     }

    //     box.material = material;
    //     box.isPickable = false;
    //     return box;
    // };

    const shouldSubdivide = (meshInfos, size, depth) => {
        // Always subdivide until max depth if there are any meshes
        return depth < maxDepth;
    };

    const createOctreeBlock = (scene, minimum, maximum, meshInfos, depth = 0, parent = null) => {
        console.log(`Creating block at depth ${depth} with ${meshInfos.length} meshes`);

        // Convert bounds to BABYLON.Vector3
        const min = minimum instanceof BABYLON.Vector3 ? minimum : new BABYLON.Vector3(minimum.x, minimum.y, minimum.z);
        const max = maximum instanceof BABYLON.Vector3 ? maximum : new BABYLON.Vector3(maximum.x, maximum.y, maximum.z);

        console.log('Block bounds:', {
            min: { x: min.x, y: min.y, z: min.z },
            max: { x: max.x, y: max.y, z: max.z }
        });

        // Filter meshes that intersect with this block
        const meshInfosInBlock = meshInfos.filter(meshInfo => {
            if (!meshInfo || !meshInfo.boundingInfo) return false;

            // Get mesh's world position from transforms
            const position = meshInfo.transforms.position;
            const scaling = meshInfo.transforms.scaling;
            const worldMatrix = meshInfo.transforms.worldMatrix;

            // Transform mesh's bounding box to world space
            const localMin = meshInfo.boundingInfo.minimum;
            const localMax = meshInfo.boundingInfo.maximum;

            // Create transformation matrix
            const transformMatrix = BABYLON.Matrix.FromArray(worldMatrix);

            // Transform bounds to world space
            const worldMin = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(localMin.x, localMin.y, localMin.z),
                transformMatrix
            );
            const worldMax = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(localMax.x, localMax.y, localMax.z),
                transformMatrix
            );

            // Check intersection
            const intersects = !(
                worldMax.x < min.x || worldMin.x > max.x ||
                worldMax.y < min.y || worldMin.y > max.y ||
                worldMax.z < min.z || worldMin.z > max.z
            );

            if (intersects) {
                console.log(`Mesh ${meshInfo.metadata.id} intersects block at depth ${depth}`);
                console.log('Mesh bounds:', {
                    worldMin: { x: worldMin.x, y: worldMin.y, z: worldMin.z },
                    worldMax: { x: worldMax.x, y: worldMax.y, z: worldMax.z }
                });
            }

            return intersects;
        });

        console.log(`Found ${meshInfosInBlock.length} meshes in block at depth ${depth}`);

        // Create block
        const block = new BABYLON.OctreeBlock(min, max, [], parent);

        // Store mesh info
        block.meshInfos = meshInfosInBlock.map(info => ({
            id: info.metadata.id,
            boundingBox: info.boundingInfo
        }));

        // Add properties
        block.depth = depth;
        block.nodeNumber = nodeCounter++;
        block.customCapacity = meshInfosInBlock.length;

        if (parent) {
            nodeParents.set(block.nodeNumber, parent.nodeNumber);
        }

        // Update tracking
        nodesAtDepth[depth]++;
        nodeNumbersByDepth[depth].push(block.nodeNumber);
        nodeDepths.set(block.nodeNumber, block.meshInfos);
        nodeContents.set(block.nodeNumber, block.meshInfos);

        if (meshInfosInBlock.length > 0) {
            nodesAtDepthWithBoxes[depth]++;
            if (!boxesAtDepth[depth]) {
                boxesAtDepth[depth] = new Set();
            }
            meshInfosInBlock.forEach(meshInfo => {
                boxesAtDepth[depth].add(meshInfo.metadata.id);
            });

            // // Create visualization
            // createWireframeBox(scene, min, max, depth);

            // Subdivide if we haven't reached max depth
            if (depth < maxDepth) {
                const center = new BABYLON.Vector3(
                    (min.x + max.x) / 2,
                    (min.y + max.y) / 2,
                    (min.z + max.z) / 2
                );

                block.blocks = [];

                for (let x = 0; x < 2; x++) {
                    for (let y = 0; y < 2; y++) {
                        for (let z = 0; z < 2; z++) {
                            const childMin = new BABYLON.Vector3(
                                x === 0 ? min.x : center.x,
                                y === 0 ? min.y : center.y,
                                z === 0 ? min.z : center.z
                            );
                            const childMax = new BABYLON.Vector3(
                                x === 0 ? center.x : max.x,
                                y === 0 ? center.y : max.y,
                                z === 0 ? center.z : max.z
                            );

                            const childBlock = createOctreeBlock(
                                scene,
                                childMin,
                                childMax,
                                meshInfosInBlock,
                                depth + 1,
                                block
                            );

                            if (childBlock !== null) {
                                block.blocks.push(childBlock);
                            }
                        }
                    }
                }
            }
        }

        return block;
    };


    const exportGLB = async (meshes) => {
        if (!meshes || meshes.length === 0) return null;

        try {
            // Create a temporary scene for export
            const tempScene = new BABYLON.Scene(engine);
            const camera = new BABYLON.Camera("camera", BABYLON.Vector3.Zero(), tempScene);

            // Process each mesh
            const exportMeshes = meshes.map((mesh, index) => {
                // Validate input mesh
                if (!mesh || !mesh.geometry) {
                    console.warn(`Invalid mesh at index ${index}`);
                    return null;
                }

                // Get vertex data
                const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
                const indices = mesh.getIndices();

                // Validate vertex data
                if (!positions || positions.length === 0) {
                    console.warn(`Mesh ${mesh.name} has no position data`);
                    return null;
                }
                if (!indices || indices.length === 0) {
                    console.warn(`Mesh ${mesh.name} has no indices`);
                    return null;
                }

                console.log(`Processing mesh ${mesh.name}:`, {
                    positions: positions.length,
                    normals: normals?.length,
                    indices: indices.length
                });

                // Create new mesh
                let exportMesh;


                exportMesh = new BABYLON.Mesh(`lpoly_${index}_${mesh.name}`, tempScene);
                // Create vertex data
                const vertexData = new BABYLON.VertexData();

                // Direct copy of vertex data without optimization
                vertexData.positions = new Float32Array(positions);
                if (normals && normals.length > 0) {
                    vertexData.normals = new Float32Array(normals);
                }
                vertexData.indices = new Uint32Array(indices);

                try {
                    // Validate data before applying
                    if (vertexData.positions.length === 0) {
                        console.error(`Empty positions array for mesh ${mesh.name}`);
                        return null;
                    }
                    if (vertexData.indices.length % 3 !== 0) {
                        console.error(`Invalid number of indices for mesh ${mesh.name}`);
                        return null;
                    }

                    // Apply vertex data to mesh
                    vertexData.applyToMesh(exportMesh);

                    // Copy transforms
                    exportMesh.position.copyFrom(mesh.position);
                    exportMesh.rotation.copyFrom(mesh.rotation);
                    exportMesh.scaling.copyFrom(mesh.scaling);

                    // Apply material
                    const material = new BABYLON.StandardMaterial(`material_${index}`, tempScene);
                    material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                    material.metallic = 0.1;
                    material.roughness = 0.8;
                    exportMesh.material = material;

                    return exportMesh;
                } catch (error) {
                    console.error(`Error creating export mesh ${mesh.name}:`, error);
                    return null;
                }
            }).filter(mesh => mesh !== null);

            if (exportMeshes.length === 0) {
                throw new Error("No valid meshes to export");
            }

            console.log(`Successfully processed ${exportMeshes.length} meshes for export`);

            await tempScene.whenReadyAsync();

            // Export options
            const options = {
                shouldExportNode: (node) => exportMeshes.includes(node),
                exportWithoutWaitingForScene: true,
                includeCoordinateSystemConversionNodes: false,
                exportTextures: false,
                truncateDrawRange: true,
                binary: true,
                preserveIndices: true,
                compressVertices: true
            };

            const serializedGLB = await GLTF2Export.GLBAsync(tempScene, "reduced_model", options);
            const glbBlob = serializedGLB.glTFFiles['reduced_model.glb'];

            if (!glbBlob || !(glbBlob instanceof Blob)) {
                throw new Error("Export failed: Invalid blob data");
            }

            // Cleanup
            tempScene.dispose();

            return {
                blob: glbBlob,
                size: glbBlob.size
            };
        } catch (error) {
            console.error("Error during export:", error);
            throw error;
        }
    };

    let meshIdCounter = 1;
    // Function to collect information about original meshes in depth 4
    const collectOriginalMeshInfo = (loadedMeshes) => {
        const meshInfoArray = [];

        // Helper function to collect vertex data from a mesh
        const collectVertexData = (mesh) => {
            if (!mesh || !mesh.geometry) return null;

            return {
                positions: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind) || []),
                normals: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind) || []),
                indices: Array.from(mesh.getIndices() || []),
                uvs: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.UVKind) || [])
            };
        };

        // Helper function to collect transform data
        const collectTransformData = (mesh) => {
            return {
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
            };
        };

        // Helper function to collect bounding box information
        const collectBoundingInfo = (mesh) => {
            const boundingInfo = mesh.getBoundingInfo();
            return {
                minimum: {
                    x: boundingInfo.minimum.x,
                    y: boundingInfo.minimum.y,
                    z: boundingInfo.minimum.z
                },
                maximum: {
                    x: boundingInfo.maximum.x,
                    y: boundingInfo.maximum.y,
                    z: boundingInfo.maximum.z
                },
                boundingSphere: {
                    center: {
                        x: boundingInfo.boundingSphere.centerWorld.x,
                        y: boundingInfo.boundingSphere.centerWorld.y,
                        z: boundingInfo.boundingSphere.centerWorld.z
                    },
                    radius: boundingInfo.boundingSphere.radiusWorld
                }
            };
        };

        // // Generate unique ID
        // const uuid = uuidv4().substring(0, 7);
        // const meshId = `mesh-${uuid}`;

        // Filter and process meshes
        const originalMeshes = loadedMeshes.filter(mesh =>
            mesh && mesh.name && !mesh.name.startsWith('merged_node_')
        );

        for (const mesh of originalMeshes) {
            try {
                // Generate unique ID
                const paddedNumber = meshIdCounter.toString().padStart(7, '0');
                const meshId = `ori${paddedNumber}`;
                meshIdCounter++;
                const meshInfo = {
                    name: mesh.name,
                    vertexData: collectVertexData(mesh),
                    transforms: collectTransformData(mesh),
                    boundingInfo: collectBoundingInfo(mesh),
                    metadata: {
                        id: meshId,
                        // isVisible: mesh.isVisible,
                        // isEnabled: mesh.isEnabled,
                        // renderingGroupId: mesh.renderingGroupId,
                        material: mesh.material ? {
                            name: mesh.material.name,
                            id: mesh.material.uniqueId,
                            diffuseColor: mesh.material.diffuseColor ? {
                                r: mesh.material.diffuseColor.r,
                                g: mesh.material.diffuseColor.g,
                                b: mesh.material.diffuseColor.b
                            } : null
                        } : null,
                        geometryInfo: {
                            totalVertices: mesh.getTotalVertices(),
                            totalIndices: mesh.getTotalIndices(),
                            faceCount: mesh.getTotalIndices() / 3
                        }
                    }
                };

                meshInfoArray.push(meshInfo);
            } catch (error) {
                console.error(`Error collecting info for mesh ${mesh.name}:`, error);
            }
        }

        return {
            meshes: meshInfoArray,
            summary: {
                totalMeshes: meshInfoArray.length,
                totalVertices: meshInfoArray.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.totalVertices, 0),
                totalFaces: meshInfoArray.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.faceCount, 0)
            }
        };
    };
    let LmeshIdCounter = 1
    const collectLpolyMeshInfo = (loadedMeshes) => {
        const meshInfoArray = [];

        // Helper function to collect vertex data from a mesh
        const collectVertexData = (mesh) => {
            if (!mesh || !mesh.geometry) return null;

            return {
                positions: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind) || []),
                normals: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind) || []),
                indices: Array.from(mesh.getIndices() || []),
                uvs: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.UVKind) || [])
            };
        };

        // Helper function to collect transform data
        const collectTransformData = (mesh) => {
            return {
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
            };
        };

        // Helper function to collect bounding box information
        const collectBoundingInfo = (mesh) => {
            const boundingInfo = mesh.getBoundingInfo();
            return {
                minimum: {
                    x: boundingInfo.minimum.x,
                    y: boundingInfo.minimum.y,
                    z: boundingInfo.minimum.z
                },
                maximum: {
                    x: boundingInfo.maximum.x,
                    y: boundingInfo.maximum.y,
                    z: boundingInfo.maximum.z
                },
                boundingSphere: {
                    center: {
                        x: boundingInfo.boundingSphere.centerWorld.x,
                        y: boundingInfo.boundingSphere.centerWorld.y,
                        z: boundingInfo.boundingSphere.centerWorld.z
                    },
                    radius: boundingInfo.boundingSphere.radiusWorld
                }
            };
        };

        // // Generate unique ID
        // const uuid = uuidv4().substring(0, 7);
        // const meshId = `mesh-${uuid}`;

        // Filter and process meshes
        const originalMeshes = loadedMeshes.filter(mesh =>
            mesh && mesh.name && !mesh.name.startsWith('merged_node_')
        );

        for (const mesh of originalMeshes) {
            try {
                // Generate unique ID
                const paddedNumber = LmeshIdCounter.toString().padStart(7, '0');
                const meshId = `lpolyori${paddedNumber}`;
                LmeshIdCounter++;
                const meshInfo = {
                    name: mesh.name,
                    vertexData: collectVertexData(mesh),
                    transforms: collectTransformData(mesh),
                    boundingInfo: collectBoundingInfo(mesh),
                    metadata: {
                        id: meshId,
                        // isVisible: mesh.isVisible,
                        // isEnabled: mesh.isEnabled,
                        // renderingGroupId: mesh.renderingGroupId,
                        material: mesh.material ? {
                            name: mesh.material.name,
                            id: mesh.material.uniqueId,
                            diffuseColor: mesh.material.diffuseColor ? {
                                r: mesh.material.diffuseColor.r,
                                g: mesh.material.diffuseColor.g,
                                b: mesh.material.diffuseColor.b
                            } : null
                        } : null,
                        geometryInfo: {
                            totalVertices: mesh.getTotalVertices(),
                            totalIndices: mesh.getTotalIndices(),
                            faceCount: mesh.getTotalIndices() / 3
                        }
                    }
                };

                meshInfoArray.push(meshInfo);
            } catch (error) {
                console.error(`Error collecting info for mesh ${mesh.name}:`, error);
            }
        }

        return {
            meshes: meshInfoArray,
            summary: {
                totalMeshes: meshInfoArray.length,
                totalVertices: meshInfoArray.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.totalVertices, 0),
                totalFaces: meshInfoArray.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.faceCount, 0)
            }
        };
    };


    useEffect(() => {
        console.log(AllCumulativeBoundingBox);
    }, [AllCumulativeBoundingBox])

    useEffect(() => {
        console.log(allLoadedMeshes);
    }, [allLoadedMeshes])

    useEffect(() => {
        console.log(alllpolyMeshes);

    }, [alllpolyMeshes])



    const handleDownload = async () => {
        console.log('Total meshes to export:', allLoadedMeshes.length);

        if (allLoadedMeshes && allLoadedMeshes.length > 0) {
            setButtonState({ text: 'Exporting...', disabled: true });

            try {
                // Filter valid meshes
                const validMeshes = allLoadedMeshes.filter(mesh =>
                    mesh && mesh.geometry && mesh.isEnabled !== false
                );

                console.log('Valid meshes for export:', validMeshes.length);

                if (validMeshes.length === 0) {
                    throw new Error("No valid meshes to export");
                }

                const glbData = await exportGLB(validMeshes);

                if (glbData && glbData.blob) {
                    const url = URL.createObjectURL(glbData.blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'all_lpoly.glb';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log(`Successfully exported ${validMeshes.length} meshes, total size: ${(glbData.size / 1024 / 1024).toFixed(2)}MB`);

                    setButtonState({ text: 'Download Complete', disabled: true });
                    setTimeout(() => {
                        setButtonState({ text: 'Download Model', disabled: false });
                    }, 2000);
                }
            } catch (error) {
                console.error("Download failed:", error);
                setButtonState({ text: 'Export Failed', disabled: true });
                setTimeout(() => {
                    setButtonState({ text: 'Download Model', disabled: false });
                }, 2000);
            }
        } else {
            console.warn("No meshes available to download");
        }
    };

    const disposeMaterialTextures = (material) => {
        const textureTypes = ['diffuse', 'bump', 'ambient', 'opacity', 'specular', 'emissive'];
        textureTypes.forEach(type => {
            if (material[`${type}Texture`]) {
                material[`${type}Texture`].dispose();
            }
        });

        if (material instanceof BABYLON.PBRMaterial) {
            ['albedo', 'metallic', 'roughness', 'normal', 'ao'].forEach(type => {
                if (material[`${type}Texture`]) {
                    material[`${type}Texture`].dispose();
                }
            });
        }
    };

    const isPerfectCylinder = (mesh) => {
        if (!mesh || !mesh.getVerticesData || !mesh.name) return false;
        if (!mesh.name.toLowerCase().includes('cylinder')) return false;

        // Get mesh's bounding box in world space
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        const dimensions = {
            x: Math.abs(boundingBox.maximumWorld.x - boundingBox.minimumWorld.x),
            y: Math.abs(boundingBox.maximumWorld.y - boundingBox.minimumWorld.y),
            z: Math.abs(boundingBox.maximumWorld.z - boundingBox.minimumWorld.z)
        };

        // Sort dimensions from smallest to largest
        const sortedDimensions = Object.entries(dimensions)
            .sort((a, b) => a[1] - b[1])
            .map(entry => ({
                axis: entry[0],
                length: entry[1]
            }));

        const dim1 = sortedDimensions[0];
        const dim2 = sortedDimensions[1];
        const height = sortedDimensions[2];

        // Check if mesh has enough faces
        const faceCount = mesh.getTotalIndices() / 3;
        if (faceCount < 10) {
            return false;
        }

        const diameterRatio = dim1.length / dim2.length;
        const heightToDiameterRatio = height.length / dim1.length;
        const EQUAL_TOLERANCE = 0.1;
        const MIN_HEIGHT_RATIO = 1.5;

        const isCylinder = Math.abs(1 - diameterRatio) <= EQUAL_TOLERANCE &&
            heightToDiameterRatio >= MIN_HEIGHT_RATIO;

        if (isCylinder) {
            mesh.cylinderParams = {
                diameter: (dim1.length + dim2.length) / 2,
                height: height.length,
                mainAxis: height.axis,
                crossSectionAxes: [dim1.axis, dim2.axis],
                center: boundingBox.centerWorld.clone()
            };
        }

        return isCylinder;
    };

    const simplifyMesh = (mesh, angleThreshold) => {
        if (!mesh) return null;

        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        const indices = mesh.getIndices();

        if (!positions || !normals || !indices) {
            console.error("Invalid mesh data");
            return mesh;
        }

        const initialFaceCount = mesh.getTotalIndices() / 3;
        console.log("Initial face count:", initialFaceCount);

        if (initialFaceCount <= 64) {
            console.warn('Skip simplify mesh - initial face count less than 64');
            const retainedMesh = mesh.clone("retained_" + mesh.name);
            if (mesh.material) {
                retainedMesh.material = mesh.material.clone("retained_material_" + mesh.material.name);
            }
            retainedMesh.position = mesh.position.clone();
            retainedMesh.rotation = mesh.rotation.clone();
            retainedMesh.scaling = mesh.scaling.clone();
            return retainedMesh;
        }
        // Calculate face normals and centers
        const faceNormals = [];
        const faceCenters = [];
        const worldMatrix = mesh.computeWorldMatrix(true);

        for (let i = 0; i < indices.length; i += 3) {
            const p1 = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(
                    positions[indices[i] * 3],
                    positions[indices[i] * 3 + 1],
                    positions[indices[i] * 3 + 2]
                ),
                worldMatrix
            );
            const p2 = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(
                    positions[indices[i + 1] * 3],
                    positions[indices[i + 1] * 3 + 1],
                    positions[indices[i + 1] * 3 + 2]
                ),
                worldMatrix
            );
            const p3 = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(
                    positions[indices[i + 2] * 3],
                    positions[indices[i + 2] * 3 + 1],
                    positions[indices[i + 2] * 3 + 2]
                ),
                worldMatrix
            );

            // Calculate face normal
            const v1 = p2.subtract(p1);
            const v2 = p3.subtract(p1);
            const normal = BABYLON.Vector3.Cross(v1, v2).normalize();
            faceNormals.push(normal);

            // Calculate face center
            const center = p1.add(p2).add(p3).scale(1 / 3);
            faceCenters.push(center);
        }

        // Calculate average distance between adjacent faces with similar normals
        let totalDistance = 0;
        let validPairCount = 0;
        const angleThresholdRad = (angleThreshold * Math.PI) / 180;

        for (let i = 0; i < faceNormals.length; i++) {
            for (let j = i + 1; j < faceNormals.length; j++) {
                const normalAngle = Math.acos(
                    BABYLON.Vector3.Dot(faceNormals[i], faceNormals[j])
                );

                if (normalAngle <= angleThresholdRad) {
                    const distance = BABYLON.Vector3.Distance(
                        faceCenters[i],
                        faceCenters[j]
                    );
                    totalDistance += distance;
                    validPairCount++;
                }
            }
        }



        // Calculate position precision based on average distance
        const averageDistance = validPairCount > 0 ? totalDistance / validPairCount : 0.001;
        const angleFactor = Math.max(0.001, angleThreshold / 180);

        // Calculate maximum allowed distance based on angle threshold
        const maxAllowedDistance = averageDistance * Math.tan(angleThresholdRad);
        let positionPrecision;
        positionPrecision = maxAllowedDistance + (angleFactor * 0.1);

        // Structure to hold vertex data
        class VertexData {
            constructor(position, normal, originalIndex) {
                this.position = position;
                this.normal = normal;
                this.originalIndex = originalIndex;
                this.mergedIndices = new Set([originalIndex]);
            }
        }

        // Convert positions to world space and create vertex data
        const vertices = [];
        const vertexMap = new Map();

        for (let i = 0; i < positions.length; i += 3) {
            const worldPos = BABYLON.Vector3.TransformCoordinates(
                new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]),
                worldMatrix
            );

            const worldNormal = BABYLON.Vector3.TransformNormal(
                new BABYLON.Vector3(normals[i], normals[i + 1], normals[i + 2]),
                worldMatrix
            ).normalize();

            vertices.push(new VertexData(worldPos, worldNormal, i / 3));
        }

        // Merge vertices
        const mergedVertices = [];
        const indexMap = new Map();
        // const angleThresholdRad = (angleThreshold * Math.PI) / 180;

        for (const vertex of vertices) {
            let merged = false;

            // Check against existing merged vertices
            for (const mergedVertex of mergedVertices) {
                const posDist = BABYLON.Vector3.Distance(vertex.position, mergedVertex.position);

                if (posDist <= positionPrecision) {
                    const normalAngle = Math.acos(
                        BABYLON.Vector3.Dot(vertex.normal, mergedVertex.normal)
                    );

                    if (normalAngle <= angleThresholdRad) {
                        // Merge this vertex
                        mergedVertex.position = mergedVertex.position.scale(0.5).add(vertex.position.scale(0.5));
                        mergedVertex.normal = mergedVertex.normal.add(vertex.normal).normalize();
                        mergedVertex.mergedIndices.add(vertex.originalIndex);
                        indexMap.set(vertex.originalIndex, mergedVertices.indexOf(mergedVertex));
                        merged = true;
                        break;
                    }
                }
            }

            if (!merged) {
                indexMap.set(vertex.originalIndex, mergedVertices.length);
                mergedVertices.push(vertex);
            }
        }

        // Create new buffers
        const newPositions = [];
        const newNormals = [];
        const newIndices = [];
        const processedFaces = new Set();

        // Add merged vertices to buffers
        mergedVertices.forEach(vertex => {
            newPositions.push(vertex.position.x, vertex.position.y, vertex.position.z);
            newNormals.push(vertex.normal.x, vertex.normal.y, vertex.normal.z);
        });

        // Process faces
        for (let i = 0; i < indices.length; i += 3) {
            const idx1 = indexMap.get(indices[i]);
            const idx2 = indexMap.get(indices[i + 1]);
            const idx3 = indexMap.get(indices[i + 2]);

            if (idx1 === undefined || idx2 === undefined || idx3 === undefined) continue;
            if (idx1 === idx2 || idx2 === idx3 || idx3 === idx1) continue;

            // Calculate face normal and area
            const p1 = new BABYLON.Vector3(
                newPositions[idx1 * 3],
                newPositions[idx1 * 3 + 1],
                newPositions[idx1 * 3 + 2]
            );
            const p2 = new BABYLON.Vector3(
                newPositions[idx2 * 3],
                newPositions[idx2 * 3 + 1],
                newPositions[idx2 * 3 + 2]
            );
            const p3 = new BABYLON.Vector3(
                newPositions[idx3 * 3],
                newPositions[idx3 * 3 + 1],
                newPositions[idx3 * 3 + 2]
            );

            const v1 = p2.subtract(p1);
            const v2 = p3.subtract(p1);
            const normal = BABYLON.Vector3.Cross(v1, v2);
            const area = normal.length() / 2;

            if (area < 0.000001) continue;

            const faceKey = [idx1, idx2, idx3].sort().join(',');
            if (!processedFaces.has(faceKey)) {
                newIndices.push(idx1, idx2, idx3);
                processedFaces.add(faceKey);
            }
        }

        // Create new mesh
        const simplified = new BABYLON.Mesh("simplified", mesh.getScene());
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = new Float32Array(newPositions);
        vertexData.normals = new Float32Array(newNormals);
        vertexData.indices = new Uint32Array(newIndices);
        vertexData.applyToMesh(simplified);

        // Copy transforms
        simplified.position.copyFrom(mesh.position);
        simplified.rotation.copyFrom(mesh.rotation);
        simplified.scaling.copyFrom(mesh.scaling);

        return simplified;
    };

    const collectOctreeInfo = (rootBlock, convertedBoundingBox) => {
        const collectBlockInfo = (block) => {
            if (!block) return null;

            return {
                // Block boundaries
                bounds: {
                    min: {
                        x: block.minPoint.x,
                        y: block.minPoint.y,
                        z: block.minPoint.z
                    },
                    max: {
                        x: block.maxPoint.x,
                        y: block.maxPoint.y,
                        z: block.maxPoint.z
                    }
                },
                // Block properties
                properties: {
                    depth: block.depth,
                    nodeNumber: block.nodeNumber,
                    capacity: block.customCapacity
                },
                // Mesh information stored in this block
                meshInfos: block.meshInfos.map(info => ({
                    id: info.id,
                    boundingBox: info.boundingBox
                })),
                // Parent-child relationships
                relationships: {
                    parentNode: nodeParents.get(block.nodeNumber) || null,
                    childBlocks: block.blocks ? block.blocks.map(childBlock =>
                        collectBlockInfo(childBlock)
                    ).filter(child => child !== null) : []
                }
            };
        };

        return {
            // Overall octree properties
            properties: {
                maxDepth: maxDepth,
                minSize: minSize,
                totalNodes: nodeCounter,
                nodesPerLevel: nodesAtDepth,
                nodesWithBoxes: nodesAtDepthWithBoxes
            },
            // Overall bounding box
            bounds: {
                min: {
                    x: convertedBoundingBox.min.x,
                    y: convertedBoundingBox.min.y,
                    z: convertedBoundingBox.min.z
                },
                max: {
                    x: convertedBoundingBox.max.x,
                    y: convertedBoundingBox.max.y,
                    z: convertedBoundingBox.max.z
                }
            },
            // Node statistics
            statistics: {
                totalMeshes: Object.values(boxesAtDepth).reduce((total, set) => total + set.size, 0),
                meshesPerLevel: Object.fromEntries(
                    Object.entries(boxesAtDepth).map(([depth, set]) => [depth, set.size])
                ),
                nodeDistribution: nodesAtDepthWithBoxes.map((count, depth) => ({
                    depth,
                    totalNodes: nodesAtDepth[depth],
                    nodesWithContent: count
                }))
            },
            // Detailed block hierarchy
            blockHierarchy: collectBlockInfo(rootBlock)
        };
    };


    useEffect(() => {
        console.log(orimeshdatas);

    }, [orimeshdatas])

    useEffect(() => {
        // Reset tracking structures
        nodesAtDepth = new Array(maxDepth + 1).fill(0);
        nodesAtDepthWithBoxes = new Array(maxDepth + 1).fill(0);
        boxesAtDepth = Array.from({ length: maxDepth + 1 }, () => new Set());
        nodeNumbersByDepth = Array.from({ length: maxDepth + 1 }, () => []);
        nodeContents = new Map();
        nodeDepths = new Map();
        nodeParents = new Map();
        nodeCounter = 1;
        if (canvasRef.current && !sceneRef.current) {



            const newEngine = new BABYLON.Engine(canvasRef.current, true);
            const newScene = new BABYLON.Scene(newEngine);

            setEngineState(newEngine);
            setSceneState(newScene);

            engine = newEngine;  // If you need to keep the existing reference
            scene = newScene;    // If you need to keep the existing reference
            sceneRef.current = newScene;
            greenMaterial = new BABYLON.StandardMaterial("greenMaterial", scene);
            greenMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);

            redMaterial = new BABYLON.StandardMaterial("redMaterial", scene);
            redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);

            blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
            blueMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1);

            yellowMaterial = new BABYLON.StandardMaterial("yellowMaterial", scene);
            yellowMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);

            // Initialize camera
            camera = new BABYLON.ArcRotateCamera(
                "camera",
                Math.PI / 4,
                Math.PI / 3,
                1000,
                BABYLON.Vector3.Zero(),
                scene
            );
            camera.attachControl(canvasRef.current, true);
            camera.minZ = 0.001;
            camera.wheelDeltaPercentage = 0.01;
            camera.pinchDeltaPercentage = 0.01;
            camera.wheelPrecision = 50;
            camera.panningSensibility = 100;
            camera.angularSensibilityX = 500;
            camera.angularSensibilityY = 500;

            // Add basic light
            new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

            engine.runRenderLoop(() => {
                scene.render();
            });

            window.addEventListener('resize', () => {
                engine.resize();
            });


        }



        window.api.receive('gbl-file-content', (fileInfoArray) => {
            if (fileInfoArray && fileInfoArray.length > 0) {
                console.log('Selected files:', fileInfoArray);
                window.api.send('fbx-gltf-converter', fileInfoArray);
            }
        });

        window.api.receive('gbl-file-value', async (fileInfoArray) => {
            if (fileInfoArray && fileInfoArray.length > 0) {
                console.log('Selected files:', fileInfoArray);
                const batchResults = [];
                // Before the batch processing loop, initialize overall bounds
                let overallMin = new BABYLON.Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
                let overallMax = new BABYLON.Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
                // window.api.send('fbx-gltf-converter', fileInfoArray);
                try {
                    // Initial memory tracking call
                    // await loadMeshesWithMemoryTracking(fileInfoArray);
                    for (const batch of fileInfoArray) {
                        console.log(batch);
                        const { individualResults, cumulativeBoundingBox } = await calculateBoundingBoxes(batch, canvasRef.current);
                        batchResults.push(cumulativeBoundingBox);
                        // Update overall bounds with this batch's bounds
                        overallMin = BABYLON.Vector3.Minimize(
                            overallMin,
                            new BABYLON.Vector3(
                                cumulativeBoundingBox.min.x,
                                cumulativeBoundingBox.min.y,
                                cumulativeBoundingBox.min.z
                            )
                        );

                        overallMax = BABYLON.Vector3.Maximize(
                            overallMax,
                            new BABYLON.Vector3(
                                cumulativeBoundingBox.max.x,
                                cumulativeBoundingBox.max.y,
                                cumulativeBoundingBox.max.z
                            )
                        );
                    }

                    // Calculate overall bounding box
                    // const overallBoundingBox = calculateOverallBoundingBox(batchResults);
                    // console.log('Overall bounding box:', overallBoundingBox);
                    const convertedBoundingBox = {
                        min: {
                            x: overallMin.x,
                            y: overallMin.y,
                            z: overallMin.z
                        },
                        max: {
                            x: overallMax.x,
                            y: overallMax.y,
                            z: overallMax.z
                        }
                    };
                    // setBoundingBoxes(individualResults);
                    setCumulativeBoundingBox(convertedBoundingBox);
                    console.log("conversion end");

                    if (scene) {
                        // let allLoadedMeshes = []; // To store all meshes from all files

                        // Loop through individualResults and load each file
                        let allPerfectCylinders = [];
                        let allNonCylinderMeshes = [];
                        let allReplacementCylinders = [];
                        const cylinderReplacements = [];
                        const nonCylinderMeshes = [];
                        let orimeshdata = {}
                        let lpolymeshdata = {}
                        for (const batch of fileInfoArray) {
                            for (const { convertedFilePath } of batch) {
                                console.log(convertedFilePath);

                                const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", convertedFilePath, scene);

                                // Option 2: Set meshes invisible after loading
                                loadedMeshes = result.meshes.filter(mesh =>
                                    mesh.name !== "__root__" &&
                                    mesh.geometry
                                );
                                console.log(loadedMeshes);
                                loadedMeshes.forEach(mesh => {
                                    mesh.isVisible = false;
                                    mesh.setEnabled(false);
                                });

                                // Clean up animations and materials
                                scene.animationGroups.forEach(group => group.dispose());

                                loadedMeshes.forEach(mesh => {
                                    // Clean up materials
                                    if (mesh.material) {
                                        disposeMaterialTextures(mesh.material);
                                        mesh.material.dispose();
                                    }
                                    if (isPerfectCylinder(mesh)) {
                                        // const replacement = createReplacementCylinder(mesh);

                                        // Calculate exact bounds and dimensions for cylinder
                                        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                                        const worldMatrix = mesh.computeWorldMatrix(true);

                                        // Transform vertices to world space
                                        const worldPositions = [];
                                        for (let i = 0; i < positions.length; i += 3) {
                                            const worldPos = BABYLON.Vector3.TransformCoordinates(
                                                new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]),
                                                worldMatrix
                                            );
                                            worldPositions.push(worldPos);
                                        }

                                        // Calculate axis-aligned bounding box
                                        let minX = Infinity, maxX = -Infinity;
                                        let minY = Infinity, maxY = -Infinity;
                                        let minZ = Infinity, maxZ = -Infinity;
                                        let centerSum = BABYLON.Vector3.Zero();

                                        worldPositions.forEach(pos => {
                                            minX = Math.min(minX, pos.x);
                                            maxX = Math.max(maxX, pos.x);
                                            minY = Math.min(minY, pos.y);
                                            maxY = Math.max(maxY, pos.y);
                                            minZ = Math.min(minZ, pos.z);
                                            maxZ = Math.max(maxZ, pos.z);
                                            centerSum = centerSum.add(pos);
                                        });

                                        // Calculate cylinder dimensions
                                        const xLength = maxX - minX;
                                        const yLength = maxY - minY;
                                        const zLength = maxZ - minZ;
                                        const centerPoint = centerSum.scale(1.0 / worldPositions.length);

                                        // Determine orientation and dimensions
                                        let cylinderHeight, cylinderDiameter;
                                        let rotationAxis = BABYLON.Vector3.Zero();
                                        let rotationAngle = 0;

                                        // Check which axis is longest to determine cylinder orientation
                                        if (xLength > yLength && xLength > zLength) {
                                            // X-axis oriented cylinder
                                            cylinderHeight = xLength;
                                            cylinderDiameter = Math.max(yLength, zLength);
                                            rotationAxis = new BABYLON.Vector3(0, 0, 1);
                                            rotationAngle = Math.PI / 2;
                                        } else if (zLength > yLength && zLength > xLength) {
                                            // Z-axis oriented cylinder
                                            cylinderHeight = zLength;
                                            cylinderDiameter = Math.max(xLength, yLength);
                                            rotationAxis = new BABYLON.Vector3(1, 0, 0);
                                            rotationAngle = Math.PI / 2;
                                        } else {
                                            // Y-axis oriented cylinder
                                            cylinderHeight = yLength;
                                            cylinderDiameter = Math.max(xLength, zLength);
                                            // No rotation needed for Y-axis
                                        }

                                        // Create cylinder with correct dimensions
                                        const cylinder = BABYLON.MeshBuilder.CreateCylinder(mesh.name, {
                                            height: cylinderHeight,
                                            diameter: cylinderDiameter,
                                            tessellation: 32
                                        }, scene);
                                        console.log(mesh.name);
                                        console.log(cylinder.name);



                                        // Apply rotation if needed
                                        if (rotationAxis && rotationAngle) {
                                            cylinder.rotate(rotationAxis, rotationAngle);
                                        }
                                        // Position cylinder
                                        cylinder.position = centerPoint;

                                        mesh.dispose();


                                        // Create material for replacement cylinder
                                        const cylinderMaterial = new BABYLON.StandardMaterial("cylinderMat", scene);
                                        cylinderMaterial.diffuseColor = new BABYLON.Color3(0, 0.8, 0);
                                        cylinderMaterial.alpha = 0.7;
                                        cylinderMaterial.backFaceCulling = false;
                                        cylinder.material = cylinderMaterial;

                                        // Enable transparency
                                        cylinderMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
                                        cylinderReplacements.push(cylinder);
                                        // mesh.setEnabled(false); // Disable original cylinder
                                    } else {
                                        nonCylinderMeshes.push(mesh);
                                    }


                                });
                                const newAllMeshes = [...cylinderReplacements, ...nonCylinderMeshes];
                                console.log(newAllMeshes);
                                setAllLoadedMeshes(prevMeshes => [...prevMeshes, ...newAllMeshes])
                                orimeshdata = await collectOriginalMeshInfo(newAllMeshes);
                                console.log(orimeshdata);
                                setorimeshdatas(orimeshdata.meshes)
                                // for (const mesh of newAllMeshes) {
                                //     try {
                                //         const lod1 = await simplifyMesh(mesh, 3);
                                //         console.log(lod1)
                                //         lod1.isVisible = false;
                                //         lod1.setEnabled(false);
                                //         const lod2 = await simplifyMesh(lod1, 10);
                                //         console.log(lod2)
                                //         lod2.isVisible = false;
                                //         lod2.setEnabled(false);
                                //         const lod3 = await simplifyMesh(lod2, 20);
                                //         console.log(lod3)

                                //         let newMeshes = [];

                                //         if (lod3) {
                                //             lod3.name = `${mesh.name}_lpoly_angle20`;
                                //             lod3.isVisible = false;
                                //             lod3.setEnabled(false);
                                //             newMeshes.push(lod3);
                                //         }

                                //         setalllpolymeshes(prevMeshes => [...prevMeshes, ...newMeshes]);

                                //     } catch (error) {
                                //         console.error(`Error simplifying mesh ${mesh.name}:`, error);
                                //     }
                                // }
                                for (const mesh of newAllMeshes) {
                                    try {
                                        // Create LOD1
                                        const lod1 = await simplifyMesh(mesh, 3);
                                        if (!lod1) continue;

                                        // Create LOD2
                                        const lod2 = await simplifyMesh(lod1, 10);
                                        // Dispose LOD1 immediately since we don't need it anymore
                                        lod1.dispose();
                                        if (!lod2) continue;

                                        // Create LOD3
                                        const lod3 = await simplifyMesh(lod2, 20);
                                        // Dispose LOD2 immediately
                                        lod2.dispose();
                                        if (!lod3) continue;

                                        // Set final LOD3 properties
                                        lod3.name = `${mesh.name}_lpoly_angle20`;
                                        lod3.isVisible = false;
                                        lod3.setEnabled(false);

                                        // Add to all low poly meshes
                                        setalllpolymeshes(prevMeshes => [...prevMeshes, lod3]);

                                    } catch (error) {
                                        console.error(`Error simplifying mesh ${mesh.name}:`, error);
                                    }
                                }
                                console.log(`all meshes to load : ${alllpolyMeshes}`);
                                lpolymeshdata = await collectLpolyMeshInfo(newAllMeshes);
                                console.log(lpolymeshdata);
                                setlpolymeshdatas(lpolymeshdata.meshes)
                            }

                            // // const rootBlock = createOctreeBlock(
                            // //     scene,
                            // //     convertedBoundingBox.min,
                            // //     convertedBoundingBox.max,
                            // //     allLoadedMeshes,
                            // //     0,
                            // //     null
                            // // );
                            // // console.log(rootBlock);
                            console.log('Overall bounds:', convertedBoundingBox);
                            console.log('First mesh transforms:', orimeshdata.meshes[0].transforms);
                            console.log('First mesh world matrix:', BABYLON.Matrix.FromArray(orimeshdata.meshes[0].transforms.worldMatrix));

                            const rootBlockbound = createOctreeBlock(
                                scene,
                                convertedBoundingBox.min,
                                convertedBoundingBox.max,
                                orimeshdata.meshes,  // Pass mesh info array instead of actual meshes
                                0,
                                null
                            );
                            // console.log('Created octree:', {
                            //     totalNodes: nodeCounter - 1,
                            //     nodesAtDepth,
                            //     nodesAtDepthWithBoxes,
                            //     meshesAtDepth: Array.from({ length: maxDepth + 1 }, (_, i) =>
                            //         boxesAtDepth[i] ? boxesAtDepth[i].size : 0
                            //     )
                            // });
                            // console.log(rootBlockbound);
                            const octreedata = await collectOctreeInfo(rootBlockbound, convertedBoundingBox)
                            console.log(octreedata);
                            setoctreedatas(octreedata)
                        }

                    }
                } catch (error) {
                    console.error('Error processing meshes:', error);
                }
            }
        });

        window.api.receive('gbl-file-mesh', async (fileInfoArray) => {
            if (fileInfoArray && fileInfoArray.length > 0) {
                console.log('Selected files:', fileInfoArray);
                try {
                    const { individualResults, cumulativeBoundingBox } =
                        await calculateBoundingBoxes(fileInfoArray, canvasRef.current);
                    console.log(individualResults);
                    console.log(cumulativeBoundingBox);
                    // Convert bounding box vectors to BABYLON.Vector3 objects
                    const convertedBoundingBox = {
                        min: new BABYLON.Vector3(
                            cumulativeBoundingBox.min.x,
                            cumulativeBoundingBox.min.y,
                            cumulativeBoundingBox.min.z
                        ),
                        max: new BABYLON.Vector3(
                            cumulativeBoundingBox.max.x,
                            cumulativeBoundingBox.max.y,
                            cumulativeBoundingBox.max.z
                        )
                    };

                    setBoundingBoxes(individualResults);
                    setCumulativeBoundingBox(convertedBoundingBox);
                    console.log("all bounding box calculated");


                } catch (error) {
                    console.error('Error processing meshes:', error);
                }
            }
        });

        window.api.receive('fbx-conversion-success', async (results) => {
            try {
                const { individualResults, cumulativeBoundingBox } =
                    await calculateBoundingBoxes(results, canvasRef.current);
                console.log(individualResults);
                console.log(cumulativeBoundingBox);
                // Convert bounding box vectors to BABYLON.Vector3 objects
                const convertedBoundingBox = {
                    min: new BABYLON.Vector3(
                        cumulativeBoundingBox.min.x,
                        cumulativeBoundingBox.min.y,
                        cumulativeBoundingBox.min.z
                    ),
                    max: new BABYLON.Vector3(
                        cumulativeBoundingBox.max.x,
                        cumulativeBoundingBox.max.y,
                        cumulativeBoundingBox.max.z
                    )
                };

                setBoundingBoxes(individualResults);
                setCumulativeBoundingBox(convertedBoundingBox);
                console.log("conversion end");


            } catch (error) {
                console.error('Error processing meshes:', error);
            }
        });

        return () => {
            if (sceneRef.current) {
                sceneRef.current.dispose();
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

            <button
                onClick={handleglbSelect}
                className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Process Model
            </button>

            <button
                onClick={handlemeshfile}
                className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Select glb mesh File
            </button>
            {/* <input id="bulkImportFiles"  type="file" multiple  onChange={handlemeshfile}  accept=".glb"/> */}

            <button
                onClick={handleDownload}
                disabled={buttonState.disabled}
                className={`mb-4 mr-4 p-2 ${buttonState.disabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                    } text-white rounded`}
            >
                {buttonState.text}
            </button>


            {/* {sceneState && engineState &&
                <PerformanceMonitor
                    scene={sceneState}
                    engine={engineState}
                />
            } */}

            <canvas ref={canvasRef} style={{ width: '100%', height: '35%' }} />

            {octreedatas && orimeshdatas.length > 0 && lpolymeshdatas.length > 0 && (
                <Octreestorage
                    convertedModels={[
                        ...orimeshdatas.map(data => ({
                            fileName: data.metadata.id,
                            data: data
                        }))
                    ]}
                    lpolyModels={[
                        ...lpolymeshdatas.map(data => ({
                            fileName: data.metadata.id,
                            data: data
                        }))
                    ]}
                    octree={octreedatas}
                    scene={sceneState}
                />
            )}
            {sceneState && engineState && (
                <Loadindexdb
                    engine={engineState}
                    scene={sceneState}
                />
            )}
        </div>
    );
}
export default Fbxload;
