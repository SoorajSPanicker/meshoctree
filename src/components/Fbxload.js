import React, { useEffect, useRef, useState } from 'react';
import { calculateBoundingBoxes, createBoundingBoxMesh } from './Bbload';
import { createCustomOctree, visualizeCustomOctree, initializeScene, positionCameraToFitBoundingBox } from './Octreecreation';
import * as BABYLON from '@babylonjs/core';
import Octreestorage from './Octreestorage';
import CameraControls from './CameraControls';
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
    let scene;
    let engine;
    // Add these constants at the top with other state tracking variables
    const FACE_LIMIT1 = 30000;
    let greenMaterial;
    let redMaterial;
    let blueMaterial;
    let yellowMaterial;

    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
    let loadedMeshes = [];
    let allLoadedMeshes = [];
    let Fullmeshes = [];

    const canvasRef = useRef(null);
    const sceneRef = useRef(null);

    const handleFileSelect = () => {
        window.api.send('open-file-dialog');
    };

    const createWireframeBox = (scene, minimum, maximum, depth = 0) => {
        if (!scene) return null;

        const size = new BABYLON.Vector3(
            maximum.x - minimum.x,
            maximum.y - minimum.y,
            maximum.z - minimum.z
        );
        const center = new BABYLON.Vector3(
            (maximum.x + minimum.x) / 2,
            (maximum.y + minimum.y) / 2,
            (maximum.z + minimum.z) / 2
        );

        const box = BABYLON.MeshBuilder.CreateBox("octreeVisBox_" + nodeCounter, {
            width: size.x,
            height: size.y,
            depth: size.z
        }, scene);

        box.position = center;
        const material = new BABYLON.StandardMaterial("wireframeMat" + depth, scene);
        material.wireframe = true;

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
    };

    const shouldSubdivide = (meshes, size) => {
        // Add subdivision criteria based on mesh count or size
        return meshes.length > 1 && size.x > minSize && size.y > minSize && size.z > minSize;
    };

    const createOctreeBlock = (scene, minimum, maximum, meshes, depth = 0, parent = null) => {
        console.log('Entered createOctreeBlock');

        // Ensure minimum and maximum are BABYLON.Vector3
        const min = minimum instanceof BABYLON.Vector3 ? minimum : new BABYLON.Vector3(minimum.x, minimum.y, minimum.z);
        const max = maximum instanceof BABYLON.Vector3 ? maximum : new BABYLON.Vector3(maximum.x, maximum.y, maximum.z);

        // Calculate size
        const size = max.subtract(min);

        // Filter meshes based on their center points
        const meshesInBlock = meshes.filter(mesh => {
            if (!mesh || !mesh.getBoundingInfo) return false;

            const boundingInfo = mesh.getBoundingInfo();
            const center = boundingInfo.boundingBox.centerWorld;

            return (center.x >= min.x && center.x <= max.x &&
                center.y >= min.y && center.y <= max.y &&
                center.z >= min.z && center.z <= max.z);
        });

        if (depth > 1 && meshesInBlock.length === 0) {
            return null;
        }

        // Create OctreeBlock with meshes
        const block = new BABYLON.OctreeBlock(min, max, meshesInBlock, parent);

        // Add custom properties without modifying read-only properties
        block.depth = depth;
        block.nodeNumber = nodeCounter++;
        block.customCapacity = meshesInBlock.length;

        if (parent) {
            nodeParents.set(block.nodeNumber, parent.nodeNumber);
        }

        // // Create visualization
        // createWireframeBox(scene, min, max, depth);

        // Update tracking data
        nodesAtDepth[depth]++;
        nodeNumbersByDepth[depth].push(block.nodeNumber);
        nodeDepths.set(block.nodeNumber, depth);
        nodeContents.set(block.nodeNumber, meshesInBlock);

        if (meshesInBlock.length > 0) {
            nodesAtDepthWithBoxes[depth]++;
            meshesInBlock.forEach(mesh => {
                boxesAtDepth[depth].add(mesh.name);
            });
        }

        // Subdivide if needed
        if (depth < maxDepth && shouldSubdivide(meshesInBlock, size)) {
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

                        const childBlock = createOctreeBlock(scene, childMin, childMax, meshesInBlock, depth + 1, block);
                        if (childBlock !== null) {
                            block.blocks.push(childBlock);
                        }
                    }
                }
            }
        }

        return block;
    };

    // Function to position camera
    const positionCameraForBoundingBox = (minimum, maximum) => {
        // Convert to Vector3 if not already
        const min = minimum instanceof BABYLON.Vector3
            ? minimum
            : new BABYLON.Vector3(minimum.x, minimum.y, minimum.z);

        const max = maximum instanceof BABYLON.Vector3
            ? maximum
            : new BABYLON.Vector3(maximum.x, maximum.y, maximum.z);

        const center = BABYLON.Vector3.Center(min, max);  // Calculate the center of the bounding box
        const size = max.subtract(min);                   // Get the size vector (width, height, depth)
        const maxDimension = Math.max(size.x, size.y, size.z);    // Find the largest dimension of the bounding box

        camera.setTarget(center);                                 // Center the camera's target on the bounding box center

        // Calculate distance needed to fit bounding box into view
        const fovRadians = camera.fov || (Math.PI / 4); // Camera field of view (default to 45 degrees if undefined)
        const distanceToFit = maxDimension / (2 * Math.tan(fovRadians / 2)); // Distance calculation based on FOV

        // Set camera properties to ensure it fits the bounding box in view
        camera.radius = distanceToFit * 1.5; // Added 1.5 multiplier for better view
        console.log('Camera distance:', distanceToFit);

        // Set initial camera angles
        camera.alpha = Math.PI / 4;           // Set initial camera angle horizontally
        camera.beta = Math.PI / 3;            // Set initial camera angle vertically

        maxDistance = distanceToFit;

        // Fine-tune camera controls
        camera.wheelPrecision = 50;                    // Adjust zoom speed with mouse wheel
        camera.minZ = maxDimension * 0.01;            // Near clipping plane
        camera.maxZ = maxDimension * 1000;            // Far clipping plane
    };

    const calculateScreenCoverage = (mesh, camera, engine) => {
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        const centerWorld = boundingBox.centerWorld;
        const size = boundingBox.maximumWorld.subtract(boundingBox.minimumWorld);
        console.log(size);

        // // Project the center of the bounding box to screen coordinates
        // const centerScreen = BABYLON.Vector3.Project(
        //     centerWorld,
        //     BABYLON.Matrix.Identity(),
        //     scene.getTransformMatrix(),
        //     camera.viewport.toGlobal(
        //         engine.getRenderWidth(),
        //         engine.getRenderHeight()
        //     )
        // );

        // Find the max dimension and take the average of the other two
        const dimensions = [size.x, size.y, size.z];
        const maxDimension = Math.max(...dimensions);
        const otherDimensions = dimensions.filter(dim => dim !== maxDimension);
        const averageOfOthers = otherDimensions.reduce((a, b) => a + b, 0) / otherDimensions.length;

        // Calculate radius in screen space
        const radiusScreen = averageOfOthers / camera.radius;
        return radiusScreen * engine.getRenderWidth();
    };

    const simplifyMesh = (mesh, angleThreshold) => {
        console.log(mesh);
        if (!mesh) return null;

        const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        const indices = mesh.getIndices();

        if (!positions || !normals || !indices) {
            console.error("Invalid mesh data");
            return mesh;
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

    // Add function to handle LOD merging
    const processLODMerging = async () => {
        console.log('Initial max coverage:', initialMaxCoverage);

        // Create array with coverage data and sort
        const sortedMeshData = Fullmeshes
            .filter(mesh => mesh && mesh.geometry)
            .map(mesh => {
                try {
                    const coverage = calculateScreenCoverage(mesh, camera, engine);
                    return { mesh, coverage };
                } catch (error) {
                    console.error(`Error calculating coverage for mesh ${mesh.name}:`, error);
                    return null;
                }
            })
            .filter(data => data !== null)
            .sort((a, b) => b.coverage - a.coverage); // Sort by coverage high to low

        console.log('Total valid meshes for LOD:', sortedMeshData.length);

        // Calculate splits based on percentages
        const totalMeshes = sortedMeshData.length;
        const lod1Count = Math.floor(totalMeshes * 0.35);
        const lod2Count = Math.floor(totalMeshes * 0.35);
        const lod3Count = totalMeshes - lod1Count - lod2Count; // Remaining ~30%

        console.log('LOD Distribution:', {
            lod1: lod1Count,
            lod2: lod2Count,
            lod3: lod3Count
        });

        // Clear existing LOD arrays
        lodOne.length = 0;
        lodTwo.length = 0;
        lodThree.length = 0;

        // Distribute meshes into LOD arrays
        sortedMeshData.forEach((data, index) => {
            if (index < lod1Count) {
                lodOne.push(data.mesh);
                console.log(`Mesh ${data.mesh.name} added to LOD1 (coverage: ${data.coverage})`);
            } else if (index < lod1Count + lod2Count) {
                lodTwo.push(data.mesh);
                console.log(`Mesh ${data.mesh.name} added to LOD2 (coverage: ${data.coverage})`);
            } else {
                lodThree.push(data.mesh);
                console.log(`Mesh ${data.mesh.name} added to LOD3 (coverage: ${data.coverage})`);
            }
        });

        // Process depth 1 nodes with LOD1 meshes
        const processDepthNodes = (depth, lodArray, prefix) => {
            const nodesAtDepth = nodeNumbersByDepth[depth] || [];

            for (const nodeNum of nodesAtDepth) {
                const nodeMeshes = nodeContents.get(nodeNum) || [];

                // Filter meshes that are in the current LOD array
                const meshesToProcess = nodeMeshes.filter(mesh =>
                    lodArray.includes(mesh)
                );

                if (meshesToProcess.length === 0) continue;

                console.log(`Processing ${meshesToProcess.length} meshes in node ${nodeNum} at depth ${depth}`);

                // Create simplified versions for each mesh
                for (const mesh of meshesToProcess) {
                    try {
                        // Create three LOD versions with different angle thresholds
                        const lod1 = simplifyMesh(mesh, 20);
                        const lod2 = simplifyMesh(mesh, 10);
                        const lod3 = simplifyMesh(mesh, 3);

                        if (lod1) {
                            lod1.name = `${prefix}_${mesh.name}_angle20`;
                            lod1.setEnabled(false);
                            console.log(lod1.name)
                            nodeContents.get(nodeNum).push(lod1);
                        }

                        if (lod2) {
                            lod2.name = `${prefix}_${mesh.name}_angle10`;
                            lod2.setEnabled(false);
                            console.log(lod2.name)
                            nodeContents.get(nodeNum).push(lod2);
                        }

                        if (lod3) {
                            lod3.name = `${prefix}_${mesh.name}_angle5`;
                            lod3.setEnabled(false);
                            console.log(lod3.name)
                            nodeContents.get(nodeNum).push(lod3);
                        }

                        // Disable original mesh
                        mesh.setEnabled(false);

                    } catch (error) {
                        console.error(`Error processing mesh ${mesh.name}:`, error);
                    }
                }
            }
        };

        // Process nodes at each depth with their corresponding LOD meshes
        console.log('Processing depth 1 nodes with LOD1 meshes...');
        processDepthNodes(1, lodOne, 'lod1');

        console.log('Processing depth 2 nodes with LOD2 meshes...');
        processDepthNodes(2, lodTwo, 'lod2');

        console.log('Processing depth 3 nodes with LOD3 meshes...');
        processDepthNodes(3, lodThree, 'lod3');

        // Log summary
        console.log('\nProcessing Summary:');
        console.log(`LOD1 meshes: ${lodOne.length}`);
        console.log(`LOD2 meshes: ${lodTwo.length}`);
        console.log(`LOD3 meshes: ${lodThree.length}`);

        let totalSimplified = 0;
        for (const nodeContent of nodeContents.values()) {
            totalSimplified += nodeContent.filter(mesh =>
                mesh.name.startsWith('lod1_') ||
                mesh.name.startsWith('lod2_') ||
                mesh.name.startsWith('lod3_')
            ).length;
        }
        console.log(`Total simplified meshes created: ${totalSimplified}`);
    };

    // Function to merge meshes by angle threshold within a node
    const mergeMeshesByAngle = async () => {
        // Process each depth level
        for (let depth = 1; depth <= 3; depth++) {
            const nodesAtDepth = nodeNumbersByDepth[depth] || [];

            for (const nodeNum of nodesAtDepth) {
                const nodeMeshes = nodeContents.get(nodeNum) || [];

                // Process angle20 meshes
                const angle20Meshes = nodeMeshes.filter(mesh =>
                    mesh && mesh.name.endsWith('_angle20')
                );
                if (angle20Meshes.length > 0) {
                    const mergedMesh = BABYLON.Mesh.MergeMeshes(
                        angle20Meshes,
                        true,
                        true,
                        undefined,
                        false,
                        true
                    );
                    if (mergedMesh) {
                        mergedMesh.name = `merged_node_${nodeNum}_angle20`;

                        // Remove original meshes from node contents
                        const updatedNodeMeshes = nodeMeshes.filter(mesh =>
                            !mesh.name.endsWith('_angle20')
                        );

                        // Add merged mesh to node contents
                        updatedNodeMeshes.push(mergedMesh);
                        nodeContents.set(nodeNum, updatedNodeMeshes);

                        // Dispose original meshes
                        angle20Meshes.forEach(mesh => {
                            mesh.dispose();
                        });
                    }
                }

                // Process angle10 meshes
                const angle10Meshes = nodeMeshes.filter(mesh =>
                    mesh && mesh.name.endsWith('_angle10')
                );
                if (angle10Meshes.length > 0) {
                    const mergedMesh = BABYLON.Mesh.MergeMeshes(
                        angle10Meshes,
                        true,
                        true,
                        undefined,
                        false,
                        true
                    );
                    if (mergedMesh) {
                        mergedMesh.name = `merged_node_${nodeNum}_angle10`;

                        // Remove original meshes from node contents
                        const updatedNodeMeshes = nodeContents.get(nodeNum).filter(mesh =>
                            !mesh.name.endsWith('_angle10')
                        );

                        // Add merged mesh to node contents
                        updatedNodeMeshes.push(mergedMesh);
                        nodeContents.set(nodeNum, updatedNodeMeshes);

                        // Dispose original meshes
                        angle10Meshes.forEach(mesh => {
                            mesh.dispose();
                        });
                    }
                }

                // Process angle5 meshes
                const angle5Meshes = nodeMeshes.filter(mesh =>
                    mesh && mesh.name.endsWith('_angle5')
                );
                if (angle5Meshes.length > 0) {
                    const mergedMesh = BABYLON.Mesh.MergeMeshes(
                        angle5Meshes,
                        true,
                        true,
                        undefined,
                        false,
                        true
                    );
                    if (mergedMesh) {
                        mergedMesh.name = `merged_node_${nodeNum}_angle5`;

                        // Remove original meshes from node contents
                        const updatedNodeMeshes = nodeContents.get(nodeNum).filter(mesh =>
                            !mesh.name.endsWith('_angle5')
                        );

                        // Add merged mesh to node contents
                        updatedNodeMeshes.push(mergedMesh);
                        nodeContents.set(nodeNum, updatedNodeMeshes);

                        // Dispose original meshes
                        angle5Meshes.forEach(mesh => {
                            mesh.dispose();
                        });
                    }
                }
            }
        }
    };

    const calculateNodeCenter = (nodeNum) => {
        const nodeMeshes = nodeContents.get(nodeNum);
        if (!nodeMeshes || nodeMeshes.length === 0) return null;

        let center = new BABYLON.Vector3(0, 0, 0);
        let count = 0;

        // Calculate center from mesh bounding boxes
        nodeMeshes.forEach(mesh => {
            if (mesh && mesh.getBoundingInfo) {
                center.addInPlace(mesh.getBoundingInfo().boundingBox.centerWorld);
                count++;
            }
        });

        if (count === 0) return null;
        return center.scaleInPlace(1 / count);
    };

    const calculateDistanceToNode = (nodeNum, camera) => {
        const center = calculateNodeCenter(nodeNum);
        if (!center) return Infinity;

        return BABYLON.Vector3.Distance(camera.position, center);
    };

    const updateLODVisibility = () => {
        let currentTotalFaces = 0;
        let meshesToDisplay = new Set();

        // First pass: Calculate total faces and collect eligible meshes for depths 1-3
        const processMeshesForFaceCount = (depth) => {
            const nodesAtDepth = nodeNumbersByDepth[depth] || [];
            let canAddMore = true;

            for (const nodeNum of nodesAtDepth) {
                if (!canAddMore) break;

                const nodeMeshes = nodeContents.get(nodeNum) || [];
                const mergedAngle20Meshes = nodeMeshes.filter(mesh =>
                    mesh.name.startsWith('merged_node_') &&
                    mesh.name.endsWith('_angle20')
                );

                for (const mesh of mergedAngle20Meshes) {
                    const meshFaces = mesh.getTotalVertices() / 3;
                    if (currentTotalFaces + meshFaces <= FACE_LIMIT1) {
                        meshesToDisplay.add({
                            nodeNum,
                            mesh,
                            faces: meshFaces
                        });
                        currentTotalFaces += meshFaces;
                    } else {
                        canAddMore = false;
                        break;
                    }
                }
            }

            return currentTotalFaces < FACE_LIMIT1;
        };

        // Process depths 1-3 for face count
        let canContinue = processMeshesForFaceCount(1);
        if (canContinue) canContinue = processMeshesForFaceCount(2);
        if (canContinue) processMeshesForFaceCount(3);

        console.log(`Final face count: ${currentTotalFaces}`);
        console.log(`Number of meshes to process: ${meshesToDisplay.size}`);

        // Hide all meshes first
        scene.meshes.forEach(mesh => {
            if (!mesh.name.startsWith("octreeVisBox_")) {
                mesh.isVisible = false;
                mesh.setEnabled(false);
            }
        });

        // Process all nodes regardless of depth for high-detail (angle5) meshes
        for (let depth = 1; depth <= 3; depth++) {
            const nodesAtDepth = nodeNumbersByDepth[depth] || [];
            for (const nodeNum of nodesAtDepth) {
                const distance = calculateDistanceToNode(nodeNum, camera);

                // Check if this node is close enough for high detail
                if (distance <= maxDistance * 0.5 && distance > 0) {
                    const nodeMeshes = nodeContents.get(nodeNum) || [];
                    const highDetailMeshes = nodeMeshes.filter(mesh =>
                        mesh.name.startsWith('merged_node_') &&
                        mesh.name.endsWith('_angle5')
                    );

                    // Show all high detail meshes in range
                    highDetailMeshes.forEach(mesh => {
                        mesh.material = yellowMaterial;
                        mesh.isVisible = true;
                        mesh.setEnabled(true);
                        console.log(`Showing high detail mesh ${mesh.name} at distance ${distance.toFixed(2)}`);
                    });
                }
            }
        }

        // Process depths 1-3 based on distance for medium and low detail
        for (const { nodeNum } of meshesToDisplay) {
            const distance = calculateDistanceToNode(nodeNum, camera);
            const nodeMeshes = nodeContents.get(nodeNum) || [];

            // Skip high detail range
            if (distance <= maxDistance * 0.5 && distance > 0) {
                continue;
            }

            // Hide all meshes in this node first
            nodeMeshes.forEach(mesh => {
                mesh.isVisible = false;
                mesh.setEnabled(false);
            });

            let meshToShow = null;
            let materialToUse = null;

            // Distance-based LOD selection with material for medium and low detail
            if (distance > maxDistance * 0.75) {
                meshToShow = nodeMeshes.find(m =>
                    m.name.startsWith('merged_node_') &&
                    m.name.endsWith('_angle20')
                );
                materialToUse = redMaterial;
            } else if (distance <= maxDistance * 0.75 && distance > maxDistance * 0.5) {
                meshToShow = nodeMeshes.find(m =>
                    m.name.startsWith('merged_node_') &&
                    m.name.endsWith('_angle10')
                );
                materialToUse = greenMaterial;
            }

            if (meshToShow) {
                meshToShow.material = materialToUse;
                meshToShow.isVisible = true;
                meshToShow.setEnabled(true);
                console.log(`Showing ${meshToShow.name} at distance ${distance.toFixed(2)} with ${materialToUse.name}`);
            }
        }
    };

    // const handleOrbitCamera = () => {
    //     if (!scene || !scene.activeCamera) return;

    //     // Store current camera position and target
    //     const cameraPosition = scene.activeCamera.position.clone();
    //     const cameraTarget = scene.activeCamera.target ?
    //         scene.activeCamera.target.clone() :
    //         scene.activeCamera.getTarget().clone();

    //     // Remove old camera
    //     scene.activeCamera.dispose();

    //     // Create new ArcRotate camera
    //     camera = new BABYLON.ArcRotateCamera(
    //         "arcCamera",
    //         Math.PI / 4, // alpha
    //         Math.PI / 3, // beta
    //         camera.radius || maxDistance, // radius
    //         cameraTarget,
    //         scene
    //     );

    //     // Configure camera
    //     camera.setPosition(cameraPosition);
    //     camera.minZ = 0.001;
    //     camera.wheelDeltaPercentage = 0.01;
    //     camera.pinchDeltaPercentage = 0.01;
    //     camera.wheelPrecision = 50;
    //     camera.panningSensibility = 100;
    //     camera.angularSensibilityX = 500;
    //     camera.angularSensibilityY = 500;
    //     camera.useBouncingBehavior = true;
    //     camera.useAutoRotationBehavior = false;
    //     camera.panningAxis = new BABYLON.Vector3(1, 1, 0);
    //     camera.pinchToPanMaxDistance = 100;

    //     camera.attachControl(canvasRef.current, true);
    //     scene.activeCamera = camera;

    //     // Add observer for LOD updates
    //     camera.onViewMatrixChangedObservable.add(() => {
    //         updateLODVisibility();
    //     });
    // };

    // const handleFlyCamera = () => {
    //     if (!scene || !scene.activeCamera) return;

    //     // Store current camera position and target
    //     const cameraPosition = scene.activeCamera.position.clone();
    //     const cameraTarget = scene.activeCamera.target ?
    //         scene.activeCamera.target.clone() :
    //         scene.activeCamera.getTarget().clone();

    //     // Remove old camera
    //     scene.activeCamera.dispose();

    //     // Create new Free camera
    //     camera = new BABYLON.FreeCamera("flyCamera", cameraPosition, scene);
    //     camera.setTarget(cameraTarget);

    //     // Camera settings
    //     camera.speed = 0.5;
    //     camera.inertia = 0.9;
    //     camera.angularSensibility = 1000;
    //     camera.minZ = 0.001;

    //     camera.attachControl(canvasRef.current, true);
    //     scene.activeCamera = camera;

    //     // Add observer for LOD updates
    //     camera.onViewMatrixChangedObservable.add(() => {
    //         updateLODVisibility();
    //     });
    // };


    useEffect(() => {

        if (canvasRef.current && !sceneRef.current) {
            engine = new BABYLON.Engine(canvasRef.current, true);
            scene = new BABYLON.Scene(engine);
            sceneRef.current = scene;

            // Initialize materials after scene creation
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
            camera.onViewMatrixChangedObservable.add(() => {
                updateLODVisibility();
            });

            // // Initialize UI
            // const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            // const filePanel = new BABYLON.GUI.StackPanel();
            // filePanel.width = "200px";
            // filePanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            // filePanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            // filePanel.top = "10px";
            // filePanel.left = "10px";
            // advancedTexture.addControl(filePanel);
            // // Add camera control buttons to the file panel
            // const buttonOrbit = BABYLON.GUI.Button.CreateSimpleButton("orbit", "Orbit Camera");
            // buttonOrbit.width = "150px";
            // buttonOrbit.height = "40px";
            // buttonOrbit.color = "white";
            // buttonOrbit.cornerRadius = 20;
            // buttonOrbit.background = "green";
            // filePanel.addControl(buttonOrbit);
        }

        // Reset tracking structures
        nodesAtDepth = new Array(maxDepth + 1).fill(0);
        nodesAtDepthWithBoxes = new Array(maxDepth + 1).fill(0);
        boxesAtDepth = Array.from({ length: maxDepth + 1 }, () => new Set());
        nodeNumbersByDepth = Array.from({ length: maxDepth + 1 }, () => []);
        nodeContents = new Map();
        nodeDepths = new Map();
        nodeParents = new Map();
        nodeCounter = 1;

        window.api.receive('gbl-file-content', (fileInfoArray) => {
            if (fileInfoArray && fileInfoArray.length > 0) {
                console.log('Selected files:', fileInfoArray);
                window.api.send('fbx-gltf-converter', fileInfoArray);
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

                if (scene && convertedBoundingBox) {
                    // let allLoadedMeshes = []; // To store all meshes from all files

                    // Loop through individualResults and load each file
                    for (const { filePath } of individualResults) {
                        console.log(`Loading file: ${filePath}`);
                        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", filePath, scene);

                        // Filter and process loaded meshes
                        loadedMeshes = result.meshes.filter(mesh =>
                            mesh.name !== "__root__" &&
                            mesh.isVisible &&
                            mesh.geometry
                        );

                        // Clean up animations and materials
                        scene.animationGroups.forEach(group => group.dispose());
                        loadedMeshes.forEach(mesh => {
                            if (mesh.material) {
                                mesh.material.dispose();
                                const simpleMaterial = new BABYLON.StandardMaterial("simpleMat", scene);
                                simpleMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                                simpleMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                mesh.material = simpleMaterial;
                            }
                        });

                        // Add the loaded meshes to the main array
                        allLoadedMeshes.push(...loadedMeshes);
                        Fullmeshes.push(...loadedMeshes)
                    }

                    // Create octree structure
                    if (allLoadedMeshes.length > 0) {
                        scene.meshes
                            .filter(mesh => mesh.name.startsWith("octreeVisBox_"))
                            .forEach(mesh => mesh.dispose());
                        console.log("Creating octree structure");
                        const rootBlock = createOctreeBlock(
                            scene,
                            convertedBoundingBox.min,
                            convertedBoundingBox.max,
                            allLoadedMeshes,
                            0,
                            null
                        );
                        console.log('Octree created:', rootBlock);

                        // Position camera after octree creation
                        positionCameraForBoundingBox(
                            convertedBoundingBox.min,
                            convertedBoundingBox.max
                        );

                        // Process LOD merging
                        await processLODMerging();
                        await mergeMeshesByAngle();
                        // Update UI and visualizations
                        updateLODVisibility();
                    }
                }
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
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
            {/* <CameraControls
                scene={scene}
                canvas={canvasRef.current}
                updateLODVisibility={updateLODVisibility}
                maxDistance={maxDistance}
            /> */}
            {/* <div id='rightopt' style={{ right: '0px' }} >
                <i class="fa-solid fa-circle-info  button " title='Tag Info' onClick={handleOrbitCamera} ></i>
                <i class="fa fa-search-plus button" title='Zoomin' onClick={handleFlyCamera}></i>
            </div> */}
            {/* {cumulativeBoundingBox && (
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
            )} */}

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