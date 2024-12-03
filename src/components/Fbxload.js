// import React, { useEffect, useRef, useState } from 'react';
// import { calculateBoundingBoxes, createBoundingBoxMesh } from './Bbload';
// import { createCustomOctree, visualizeCustomOctree, initializeScene, positionCameraToFitBoundingBox } from './Octreecreation';
// import * as BABYLON from '@babylonjs/core';
// import Octreestorage from './Octreestorage';
// import CameraControls from './CameraControls';
// import { GLTF2Export } from '@babylonjs/serializers/glTF';
// import Loadindexdb from './Loadindexdb';
// function Fbxload() {
//     let nodesAtDepth;
//     const maxDepth = 4;
//     const minSize = 0; // Minimum size for subdivision
//     let nodeNumbersByDepth;
//     let nodesAtDepthWithBoxes;
//     let boxesAtDepth;
//     let nodeContents;
//     let nodeDepths;
//     let nodeParents;
//     let nodeCounter;
//     let camera;
//     let maxDistance;
//     let initialMaxCoverage = -Infinity;
//     let lodOne = [];
//     let lodTwo = [];
//     let lodThree = [];
//     const [downloadMeshes, setDownloadMeshes] = useState({
//         mesh1: [],
//         mesh2: [],
//         mesh3: []
//     });
//     let scene;
//     let engine;
//     // Add these constants at the top with other state tracking variables
//     const FACE_LIMIT1 = 30000;
//     let greenMaterial;
//     let redMaterial;
//     let blueMaterial;
//     let yellowMaterial;

//     const [boundingBoxes, setBoundingBoxes] = useState([]);
//     const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
//     const [mergemeshdatas, setmergemeshdatas] = useState([])
//     const [orimeshdatas, setorimeshdatas] = useState([])
//     const [octreedatas, setoctreedatas] = useState({})
//     const [sceneInstance, setSceneInstance] = useState(null);
//     const [cameraInstance, setCameraInstance] = useState(null);
//     let loadedMeshes = [];
//     let allLoadedMeshes = [];
//     let Fullmeshes = [];

//     const canvasRef = useRef(null);
//     const sceneRef = useRef(null);

//     const handleFileSelect = () => {
//         window.api.send('open-file-dialog');
//     };

//     const createWireframeBox = (scene, minimum, maximum, depth = 0) => {
//         if (!scene) return null;

//         const size = new BABYLON.Vector3(
//             maximum.x - minimum.x,
//             maximum.y - minimum.y,
//             maximum.z - minimum.z
//         );
//         const center = new BABYLON.Vector3(
//             (maximum.x + minimum.x) / 2,
//             (maximum.y + minimum.y) / 2,
//             (maximum.z + minimum.z) / 2
//         );

//         const box = BABYLON.MeshBuilder.CreateBox("octreeVisBox_" + nodeCounter, {
//             width: size.x,
//             height: size.y,
//             depth: size.z
//         }, scene);

//         box.position = center;
//         const material = new BABYLON.StandardMaterial("wireframeMat" + depth, scene);
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

//     const shouldSubdivide = (meshes, size) => {
//         // Add subdivision criteria based on mesh count or size
//         return meshes.length > 1 && size.x > minSize && size.y > minSize && size.z > minSize;
//     };

//     const createOctreeBlock = (scene, minimum, maximum, meshes, depth = 0, parent = null) => {
//         console.log('Entered createOctreeBlock');

//         // Ensure minimum and maximum are BABYLON.Vector3
//         const min = minimum instanceof BABYLON.Vector3 ? minimum : new BABYLON.Vector3(minimum.x, minimum.y, minimum.z);
//         const max = maximum instanceof BABYLON.Vector3 ? maximum : new BABYLON.Vector3(maximum.x, maximum.y, maximum.z);

//         // Calculate size
//         const size = max.subtract(min);

//         // Filter meshes based on their center points
//         const meshesInBlock = meshes.filter(mesh => {
//             if (!mesh || !mesh.getBoundingInfo) return false;

//             const boundingInfo = mesh.getBoundingInfo();
//             const center = boundingInfo.boundingBox.centerWorld;

//             return (center.x >= min.x && center.x <= max.x &&
//                 center.y >= min.y && center.y <= max.y &&
//                 center.z >= min.z && center.z <= max.z);
//         });

//         if (depth > 1 && meshesInBlock.length === 0) {
//             return null;
//         }

//         // Create OctreeBlock with meshes
//         const block = new BABYLON.OctreeBlock(min, max, meshesInBlock, parent);

//         // Add custom properties without modifying read-only properties
//         block.depth = depth;
//         block.nodeNumber = nodeCounter++;
//         block.customCapacity = meshesInBlock.length;

//         if (parent) {
//             nodeParents.set(block.nodeNumber, parent.nodeNumber);
//         }

//         // // Create visualization
//         // createWireframeBox(scene, min, max, depth);

//         // Update tracking data
//         nodesAtDepth[depth]++;
//         nodeNumbersByDepth[depth].push(block.nodeNumber);
//         nodeDepths.set(block.nodeNumber, depth);
//         nodeContents.set(block.nodeNumber, meshesInBlock);

//         if (meshesInBlock.length > 0) {
//             nodesAtDepthWithBoxes[depth]++;
//             meshesInBlock.forEach(mesh => {
//                 boxesAtDepth[depth].add(mesh.name);
//             });
//         }

//         // Subdivide if needed
//         if (depth < maxDepth && shouldSubdivide(meshesInBlock, size)) {
//             const center = new BABYLON.Vector3(
//                 (min.x + max.x) / 2,
//                 (min.y + max.y) / 2,
//                 (min.z + max.z) / 2
//             );

//             block.blocks = [];

//             for (let x = 0; x < 2; x++) {
//                 for (let y = 0; y < 2; y++) {
//                     for (let z = 0; z < 2; z++) {
//                         const childMin = new BABYLON.Vector3(
//                             x === 0 ? min.x : center.x,
//                             y === 0 ? min.y : center.y,
//                             z === 0 ? min.z : center.z
//                         );
//                         const childMax = new BABYLON.Vector3(
//                             x === 0 ? center.x : max.x,
//                             y === 0 ? center.y : max.y,
//                             z === 0 ? center.z : max.z
//                         );

//                         const childBlock = createOctreeBlock(scene, childMin, childMax, meshesInBlock, depth + 1, block);
//                         if (childBlock !== null) {
//                             block.blocks.push(childBlock);
//                         }
//                     }
//                 }
//             }
//         }

//         return block;
//     };

//     // Function to position camera
//     const positionCameraForBoundingBox = (minimum, maximum) => {
//         // Convert to Vector3 if not already
//         const min = minimum instanceof BABYLON.Vector3
//             ? minimum
//             : new BABYLON.Vector3(minimum.x, minimum.y, minimum.z);

//         const max = maximum instanceof BABYLON.Vector3
//             ? maximum
//             : new BABYLON.Vector3(maximum.x, maximum.y, maximum.z);

//         const center = BABYLON.Vector3.Center(min, max);  // Calculate the center of the bounding box
//         const size = max.subtract(min);                   // Get the size vector (width, height, depth)
//         const maxDimension = Math.max(size.x, size.y, size.z);    // Find the largest dimension of the bounding box

//         camera.setTarget(center);                                 // Center the camera's target on the bounding box center

//         // Calculate distance needed to fit bounding box into view
//         const fovRadians = camera.fov || (Math.PI / 4); // Camera field of view (default to 45 degrees if undefined)
//         const distanceToFit = maxDimension / (2 * Math.tan(fovRadians / 2)); // Distance calculation based on FOV

//         // Set camera properties to ensure it fits the bounding box in view
//         camera.radius = distanceToFit * 1.5; // Added 1.5 multiplier for better view
//         console.log('Camera distance:', distanceToFit);

//         // Set initial camera angles
//         camera.alpha = Math.PI / 4;           // Set initial camera angle horizontally
//         camera.beta = Math.PI / 3;            // Set initial camera angle vertically

//         maxDistance = distanceToFit;

//         // Fine-tune camera controls
//         camera.wheelPrecision = 50;                    // Adjust zoom speed with mouse wheel
//         camera.minZ = maxDimension * 0.01;            // Near clipping plane
//         camera.maxZ = maxDimension * 1000;            // Far clipping plane
//     };

//     const calculateScreenCoverage = (mesh, camera, engine) => {
//         const boundingBox = mesh.getBoundingInfo().boundingBox;
//         const centerWorld = boundingBox.centerWorld;
//         const size = boundingBox.maximumWorld.subtract(boundingBox.minimumWorld);
//         console.log(size);

//         // // Project the center of the bounding box to screen coordinates
//         // const centerScreen = BABYLON.Vector3.Project(
//         //     centerWorld,
//         //     BABYLON.Matrix.Identity(),
//         //     scene.getTransformMatrix(),
//         //     camera.viewport.toGlobal(
//         //         engine.getRenderWidth(),
//         //         engine.getRenderHeight()
//         //     )
//         // );

//         // Find the max dimension and take the average of the other two
//         const dimensions = [size.x, size.y, size.z];
//         const maxDimension = Math.max(...dimensions);
//         const otherDimensions = dimensions.filter(dim => dim !== maxDimension);
//         const averageOfOthers = otherDimensions.reduce((a, b) => a + b, 0) / otherDimensions.length;

//         // Calculate radius in screen space
//         const radiusScreen = averageOfOthers / camera.radius;
//         return radiusScreen * engine.getRenderWidth();
//     };

//     const simplifyMesh = (mesh, angleThreshold) => {
//         console.log(mesh);
//         if (!mesh) return null;

//         const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
//         const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
//         const indices = mesh.getIndices();

//         if (!positions || !normals || !indices) {
//             console.error("Invalid mesh data");
//             return mesh;
//         }

//         // Calculate face normals and centers
//         const faceNormals = [];
//         const faceCenters = [];
//         const worldMatrix = mesh.computeWorldMatrix(true);

//         for (let i = 0; i < indices.length; i += 3) {
//             const p1 = BABYLON.Vector3.TransformCoordinates(
//                 new BABYLON.Vector3(
//                     positions[indices[i] * 3],
//                     positions[indices[i] * 3 + 1],
//                     positions[indices[i] * 3 + 2]
//                 ),
//                 worldMatrix
//             );
//             const p2 = BABYLON.Vector3.TransformCoordinates(
//                 new BABYLON.Vector3(
//                     positions[indices[i + 1] * 3],
//                     positions[indices[i + 1] * 3 + 1],
//                     positions[indices[i + 1] * 3 + 2]
//                 ),
//                 worldMatrix
//             );
//             const p3 = BABYLON.Vector3.TransformCoordinates(
//                 new BABYLON.Vector3(
//                     positions[indices[i + 2] * 3],
//                     positions[indices[i + 2] * 3 + 1],
//                     positions[indices[i + 2] * 3 + 2]
//                 ),
//                 worldMatrix
//             );

//             // Calculate face normal
//             const v1 = p2.subtract(p1);
//             const v2 = p3.subtract(p1);
//             const normal = BABYLON.Vector3.Cross(v1, v2).normalize();
//             faceNormals.push(normal);

//             // Calculate face center
//             const center = p1.add(p2).add(p3).scale(1 / 3);
//             faceCenters.push(center);
//         }

//         // Calculate average distance between adjacent faces with similar normals
//         let totalDistance = 0;
//         let validPairCount = 0;
//         const angleThresholdRad = (angleThreshold * Math.PI) / 180;

//         for (let i = 0; i < faceNormals.length; i++) {
//             for (let j = i + 1; j < faceNormals.length; j++) {
//                 const normalAngle = Math.acos(
//                     BABYLON.Vector3.Dot(faceNormals[i], faceNormals[j])
//                 );

//                 if (normalAngle <= angleThresholdRad) {
//                     const distance = BABYLON.Vector3.Distance(
//                         faceCenters[i],
//                         faceCenters[j]
//                     );
//                     totalDistance += distance;
//                     validPairCount++;
//                 }
//             }
//         }

//         // Calculate position precision based on average distance
//         const averageDistance = validPairCount > 0 ? totalDistance / validPairCount : 0.001;
//         const angleFactor = Math.max(0.001, angleThreshold / 180);

//         // Calculate maximum allowed distance based on angle threshold
//         const maxAllowedDistance = averageDistance * Math.tan(angleThresholdRad);
//         let positionPrecision;
//         positionPrecision = maxAllowedDistance + (angleFactor * 0.1);

//         // Structure to hold vertex data
//         class VertexData {
//             constructor(position, normal, originalIndex) {
//                 this.position = position;
//                 this.normal = normal;
//                 this.originalIndex = originalIndex;
//                 this.mergedIndices = new Set([originalIndex]);
//             }
//         }

//         // Convert positions to world space and create vertex data
//         const vertices = [];
//         const vertexMap = new Map();

//         for (let i = 0; i < positions.length; i += 3) {
//             const worldPos = BABYLON.Vector3.TransformCoordinates(
//                 new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]),
//                 worldMatrix
//             );

//             const worldNormal = BABYLON.Vector3.TransformNormal(
//                 new BABYLON.Vector3(normals[i], normals[i + 1], normals[i + 2]),
//                 worldMatrix
//             ).normalize();

//             vertices.push(new VertexData(worldPos, worldNormal, i / 3));
//         }

//         // Merge vertices
//         const mergedVertices = [];
//         const indexMap = new Map();
//         // const angleThresholdRad = (angleThreshold * Math.PI) / 180;

//         for (const vertex of vertices) {
//             let merged = false;

//             // Check against existing merged vertices
//             for (const mergedVertex of mergedVertices) {
//                 const posDist = BABYLON.Vector3.Distance(vertex.position, mergedVertex.position);

//                 if (posDist <= positionPrecision) {
//                     const normalAngle = Math.acos(
//                         BABYLON.Vector3.Dot(vertex.normal, mergedVertex.normal)
//                     );

//                     if (normalAngle <= angleThresholdRad) {
//                         // Merge this vertex
//                         mergedVertex.position = mergedVertex.position.scale(0.5).add(vertex.position.scale(0.5));
//                         mergedVertex.normal = mergedVertex.normal.add(vertex.normal).normalize();
//                         mergedVertex.mergedIndices.add(vertex.originalIndex);
//                         indexMap.set(vertex.originalIndex, mergedVertices.indexOf(mergedVertex));
//                         merged = true;
//                         break;
//                     }
//                 }
//             }

//             if (!merged) {
//                 indexMap.set(vertex.originalIndex, mergedVertices.length);
//                 mergedVertices.push(vertex);
//             }
//         }

//         // Create new buffers
//         const newPositions = [];
//         const newNormals = [];
//         const newIndices = [];
//         const processedFaces = new Set();

//         // Add merged vertices to buffers
//         mergedVertices.forEach(vertex => {
//             newPositions.push(vertex.position.x, vertex.position.y, vertex.position.z);
//             newNormals.push(vertex.normal.x, vertex.normal.y, vertex.normal.z);
//         });

//         // Process faces
//         for (let i = 0; i < indices.length; i += 3) {
//             const idx1 = indexMap.get(indices[i]);
//             const idx2 = indexMap.get(indices[i + 1]);
//             const idx3 = indexMap.get(indices[i + 2]);

//             if (idx1 === undefined || idx2 === undefined || idx3 === undefined) continue;
//             if (idx1 === idx2 || idx2 === idx3 || idx3 === idx1) continue;

//             // Calculate face normal and area
//             const p1 = new BABYLON.Vector3(
//                 newPositions[idx1 * 3],
//                 newPositions[idx1 * 3 + 1],
//                 newPositions[idx1 * 3 + 2]
//             );
//             const p2 = new BABYLON.Vector3(
//                 newPositions[idx2 * 3],
//                 newPositions[idx2 * 3 + 1],
//                 newPositions[idx2 * 3 + 2]
//             );
//             const p3 = new BABYLON.Vector3(
//                 newPositions[idx3 * 3],
//                 newPositions[idx3 * 3 + 1],
//                 newPositions[idx3 * 3 + 2]
//             );

//             const v1 = p2.subtract(p1);
//             const v2 = p3.subtract(p1);
//             const normal = BABYLON.Vector3.Cross(v1, v2);
//             const area = normal.length() / 2;

//             if (area < 0.000001) continue;

//             const faceKey = [idx1, idx2, idx3].sort().join(',');
//             if (!processedFaces.has(faceKey)) {
//                 newIndices.push(idx1, idx2, idx3);
//                 processedFaces.add(faceKey);
//             }
//         }

//         // Create new mesh
//         const simplified = new BABYLON.Mesh("simplified", mesh.getScene());
//         const vertexData = new BABYLON.VertexData();
//         vertexData.positions = new Float32Array(newPositions);
//         vertexData.normals = new Float32Array(newNormals);
//         vertexData.indices = new Uint32Array(newIndices);
//         vertexData.applyToMesh(simplified);

//         // Copy transforms
//         simplified.position.copyFrom(mesh.position);
//         simplified.rotation.copyFrom(mesh.rotation);
//         simplified.scaling.copyFrom(mesh.scaling);

//         return simplified;
//     };

//     // Add function to handle LOD merging
//     const processLODMerging = async () => {
//         console.log('Initial max coverage:', initialMaxCoverage);

//         // Create array with coverage data and sort
//         const sortedMeshData = Fullmeshes
//             .filter(mesh => mesh && mesh.geometry)
//             .map(mesh => {
//                 try {
//                     const coverage = calculateScreenCoverage(mesh, camera, engine);
//                     return { mesh, coverage };
//                 } catch (error) {
//                     console.error(`Error calculating coverage for mesh ${mesh.name}:`, error);
//                     return null;
//                 }
//             })
//             .filter(data => data !== null)
//             .sort((a, b) => b.coverage - a.coverage); // Sort by coverage high to low

//         console.log('Total valid meshes for LOD:', sortedMeshData.length);

//         // Calculate splits based on percentages
//         const totalMeshes = sortedMeshData.length;
//         const lod1Count = Math.floor(totalMeshes * 0.35);
//         const lod2Count = Math.floor(totalMeshes * 0.35);
//         const lod3Count = totalMeshes - lod1Count - lod2Count; // Remaining ~30%

//         console.log('LOD Distribution:', {
//             lod1: lod1Count,
//             lod2: lod2Count,
//             lod3: lod3Count
//         });

//         // Clear existing LOD arrays
//         lodOne.length = 0;
//         lodTwo.length = 0;
//         lodThree.length = 0;

//         // Distribute meshes into LOD arrays
//         sortedMeshData.forEach((data, index) => {
//             if (index < lod1Count) {
//                 lodOne.push(data.mesh);
//                 console.log(`Mesh ${data.mesh.name} added to LOD1 (coverage: ${data.coverage})`);
//             } else if (index < lod1Count + lod2Count) {
//                 lodTwo.push(data.mesh);
//                 console.log(`Mesh ${data.mesh.name} added to LOD2 (coverage: ${data.coverage})`);
//             } else {
//                 lodThree.push(data.mesh);
//                 console.log(`Mesh ${data.mesh.name} added to LOD3 (coverage: ${data.coverage})`);
//             }
//         });

//         // Process depth 1 nodes with LOD1 meshes
//         const processDepthNodes = (depth, lodArray, prefix) => {
//             const nodesAtDepth = nodeNumbersByDepth[depth] || [];

//             for (const nodeNum of nodesAtDepth) {
//                 const nodeMeshes = nodeContents.get(nodeNum) || [];

//                 // Filter meshes that are in the current LOD array
//                 const meshesToProcess = nodeMeshes.filter(mesh =>
//                     lodArray.includes(mesh)
//                 );

//                 if (meshesToProcess.length === 0) continue;

//                 console.log(`Processing ${meshesToProcess.length} meshes in node ${nodeNum} at depth ${depth}`);

//                 // Create simplified versions for each mesh
//                 for (const mesh of meshesToProcess) {
//                     try {
//                         // Create three LOD versions with different angle thresholds
//                         const lod1 = simplifyMesh(mesh, 20);
//                         const lod2 = simplifyMesh(mesh, 10);
//                         const lod3 = simplifyMesh(mesh, 3);

//                         if (lod1) {
//                             lod1.name = `${prefix}_${mesh.name}_angle20`;
//                             lod1.setEnabled(false);
//                             console.log(lod1.name)
//                             nodeContents.get(nodeNum).push(lod1);
//                         }

//                         if (lod2) {
//                             lod2.name = `${prefix}_${mesh.name}_angle10`;
//                             lod2.setEnabled(false);
//                             console.log(lod2.name)
//                             nodeContents.get(nodeNum).push(lod2);
//                         }

//                         if (lod3) {
//                             lod3.name = `${prefix}_${mesh.name}_angle5`;
//                             lod3.setEnabled(false);
//                             console.log(lod3.name)
//                             nodeContents.get(nodeNum).push(lod3);
//                         }

//                         // Disable original mesh
//                         mesh.setEnabled(false);

//                     } catch (error) {
//                         console.error(`Error processing mesh ${mesh.name}:`, error);
//                     }
//                 }
//             }
//         };

//         // Process nodes at each depth with their corresponding LOD meshes
//         console.log('Processing depth 1 nodes with LOD1 meshes...');
//         processDepthNodes(1, lodOne, 'lod1');

//         console.log('Processing depth 2 nodes with LOD2 meshes...');
//         processDepthNodes(2, lodTwo, 'lod2');

//         console.log('Processing depth 3 nodes with LOD3 meshes...');
//         processDepthNodes(3, lodThree, 'lod3');

//         // Log summary
//         console.log('\nProcessing Summary:');
//         console.log(`LOD1 meshes: ${lodOne.length}`);
//         console.log(`LOD2 meshes: ${lodTwo.length}`);
//         console.log(`LOD3 meshes: ${lodThree.length}`);

//         let totalSimplified = 0;
//         for (const nodeContent of nodeContents.values()) {
//             totalSimplified += nodeContent.filter(mesh =>
//                 mesh.name.startsWith('lod1_') ||
//                 mesh.name.startsWith('lod2_') ||
//                 mesh.name.startsWith('lod3_')
//             ).length;
//         }
//         console.log(`Total simplified meshes created: ${totalSimplified}`);
//     };

//     // Function to merge meshes by angle threshold within a node
//     const mergeMeshesByAngle = async () => {
//         let tempMesh1 = [];
//         let tempMesh2 = [];
//         let tempMesh3 = [];
//         // Process each depth level
//         for (let depth = 1; depth <= 3; depth++) {
//             const nodesAtDepth = nodeNumbersByDepth[depth] || [];

//             for (const nodeNum of nodesAtDepth) {
//                 const nodeMeshes = nodeContents.get(nodeNum) || [];

//                 // Process angle20 meshes
//                 const angle20Meshes = nodeMeshes.filter(mesh =>
//                     mesh && mesh.name.endsWith('_angle20')
//                 );
//                 if (angle20Meshes.length > 0) {
//                     const mergedMesh = BABYLON.Mesh.MergeMeshes(
//                         angle20Meshes,
//                         true,
//                         true,
//                         undefined,
//                         false,
//                         true
//                     );
//                     if (mergedMesh) {
//                         mergedMesh.name = `merged_node_${nodeNum}_angle20`;

//                         // Remove original meshes from node contents
//                         const updatedNodeMeshes = nodeMeshes.filter(mesh =>
//                             !mesh.name.endsWith('_angle20')
//                         );
//                         tempMesh1.push(mergedMesh);
//                         // Add merged mesh to node contents
//                         updatedNodeMeshes.push(mergedMesh);
//                         nodeContents.set(nodeNum, updatedNodeMeshes);

//                         // Dispose original meshes
//                         angle20Meshes.forEach(mesh => {
//                             mesh.dispose();
//                         });
//                     }
//                 }

//                 // Process angle10 meshes
//                 const angle10Meshes = nodeMeshes.filter(mesh =>
//                     mesh && mesh.name.endsWith('_angle10')
//                 );
//                 if (angle10Meshes.length > 0) {
//                     const mergedMesh = BABYLON.Mesh.MergeMeshes(
//                         angle10Meshes,
//                         true,
//                         true,
//                         undefined,
//                         false,
//                         true
//                     );
//                     if (mergedMesh) {
//                         mergedMesh.name = `merged_node_${nodeNum}_angle10`;

//                         // Remove original meshes from node contents
//                         const updatedNodeMeshes = nodeContents.get(nodeNum).filter(mesh =>
//                             !mesh.name.endsWith('_angle10')
//                         );
//                         console.log(`merge mesh name ${mergedMesh.name}`)
//                         tempMesh2.push(mergedMesh);
//                         // Add merged mesh to node contents
//                         updatedNodeMeshes.push(mergedMesh);
//                         nodeContents.set(nodeNum, updatedNodeMeshes);

//                         // Dispose original meshes
//                         angle10Meshes.forEach(mesh => {
//                             mesh.dispose();
//                         });
//                     }
//                 }

//                 // Process angle5 meshes
//                 const angle5Meshes = nodeMeshes.filter(mesh =>
//                     mesh && mesh.name.endsWith('_angle5')
//                 );
//                 if (angle5Meshes.length > 0) {
//                     const mergedMesh = BABYLON.Mesh.MergeMeshes(
//                         angle5Meshes,
//                         true,
//                         true,
//                         undefined,
//                         false,
//                         true
//                     );
//                     if (mergedMesh) {
//                         mergedMesh.name = `merged_node_${nodeNum}_angle5`;

//                         // Remove original meshes from node contents
//                         const updatedNodeMeshes = nodeContents.get(nodeNum).filter(mesh =>
//                             !mesh.name.endsWith('_angle5')
//                         );
//                         tempMesh3.push(mergedMesh);
//                         // Add merged mesh to node contents
//                         updatedNodeMeshes.push(mergedMesh);
//                         nodeContents.set(nodeNum, updatedNodeMeshes);

//                         // Dispose original meshes
//                         angle5Meshes.forEach(mesh => {
//                             mesh.dispose();
//                         });
//                     }
//                 }
//             }
//         }
//         setDownloadMeshes({
//             mesh1: tempMesh1,
//             mesh2: tempMesh2,
//             mesh3: tempMesh3
//         });
//     };


//     const calculateNodeCenter = (nodeNum) => {
//         const nodeMeshes = nodeContents.get(nodeNum);
//         if (!nodeMeshes || nodeMeshes.length === 0) return null;

//         let center = new BABYLON.Vector3(0, 0, 0);
//         let count = 0;

//         // Calculate center from mesh bounding boxes
//         nodeMeshes.forEach(mesh => {
//             if (mesh && mesh.getBoundingInfo) {
//                 center.addInPlace(mesh.getBoundingInfo().boundingBox.centerWorld);
//                 count++;
//             }
//         });

//         if (count === 0) return null;
//         return center.scaleInPlace(1 / count);
//     };

//     const calculateDistanceToNode = (nodeNum, camera) => {
//         const center = calculateNodeCenter(nodeNum);
//         if (!center) return Infinity;

//         return BABYLON.Vector3.Distance(camera.position, center);
//     };

//     const updateLODVisibility = () => {
//         let currentTotalFaces = 0;
//         let meshesToDisplay = new Set();

//         // Modified function to process meshes based on coverage
//         const processMeshesForFaceCount = (depth) => {
//             const nodesAtDepth = nodeNumbersByDepth[depth] || [];

//             // Create array of all eligible meshes with their coverage values
//             let meshesWithCoverage = [];

//             for (const nodeNum of nodesAtDepth) {
//                 const nodeMeshes = nodeContents.get(nodeNum) || [];
//                 const mergedAngle20Meshes = nodeMeshes.filter(mesh =>
//                     mesh.name.startsWith('merged_node_') &&
//                     mesh.name.endsWith('_angle20')
//                 );

//                 // Calculate coverage for each mesh and store with mesh info
//                 mergedAngle20Meshes.forEach(mesh => {
//                     const coverage = calculateScreenCoverage(mesh, camera, engine);
//                     meshesWithCoverage.push({
//                         nodeNum,
//                         mesh,
//                         coverage,
//                         faces: mesh.getTotalVertices() / 3
//                     });
//                 });
//             }

//             // Sort meshes by coverage (highest first)
//             meshesWithCoverage.sort((a, b) => b.coverage - a.coverage);

//             // Process meshes in order of coverage
//             for (const meshInfo of meshesWithCoverage) {
//                 if (currentTotalFaces + meshInfo.faces <= FACE_LIMIT1) {
//                     meshesToDisplay.add({
//                         nodeNum: meshInfo.nodeNum,
//                         mesh: meshInfo.mesh,
//                         faces: meshInfo.faces
//                     });
//                     currentTotalFaces += meshInfo.faces;
//                 } else {
//                     break;
//                 }
//             }

//             return currentTotalFaces < FACE_LIMIT1;
//         };

//         // Process depths 1-3 for face count
//         let canContinue = processMeshesForFaceCount(1);
//         if (canContinue) canContinue = processMeshesForFaceCount(2);
//         if (canContinue) processMeshesForFaceCount(3);

//         console.log(`Final face count: ${currentTotalFaces}`);
//         console.log(`Number of meshes to process: ${meshesToDisplay.size}`);

//         // Rest of the function remains the same...
//         // Hide all meshes first
//         scene.meshes.forEach(mesh => {
//             if (!mesh.name.startsWith("octreeVisBox_")) {
//                 mesh.isVisible = false;
//                 mesh.setEnabled(false);
//             }
//         });

//         // Process all nodes regardless of depth for high-detail (angle5) meshes
//         for (let depth = 1; depth <= 3; depth++) {
//             const nodesAtDepth = nodeNumbersByDepth[depth] || [];
//             for (const nodeNum of nodesAtDepth) {
//                 const distance = calculateDistanceToNode(nodeNum, camera);

//                 if (distance <= maxDistance * 0.5 && distance > 0) {
//                     const nodeMeshes = nodeContents.get(nodeNum) || [];
//                     const highDetailMeshes = nodeMeshes.filter(mesh =>
//                         mesh.name.startsWith('merged_node_') &&
//                         mesh.name.endsWith('_angle5')
//                     );

//                     highDetailMeshes.forEach(mesh => {
//                         mesh.material = yellowMaterial;
//                         mesh.isVisible = true;
//                         mesh.setEnabled(true);
//                         console.log(`Showing high detail mesh ${mesh.name} at distance ${distance.toFixed(2)}`);
//                     });
//                 }
//             }
//         }

//         // Process depths 1-3 based on distance for medium and low detail
//         for (const { nodeNum } of meshesToDisplay) {
//             const distance = calculateDistanceToNode(nodeNum, camera);
//             const nodeMeshes = nodeContents.get(nodeNum) || [];

//             if (distance <= maxDistance * 0.5 && distance > 0) {
//                 continue;
//             }

//             nodeMeshes.forEach(mesh => {
//                 mesh.isVisible = false;
//                 mesh.setEnabled(false);
//             });

//             let meshToShow = null;
//             let materialToUse = null;

//             if (distance > maxDistance * 0.75) {
//                 meshToShow = nodeMeshes.find(m =>
//                     m.name.startsWith('merged_node_') &&
//                     m.name.endsWith('_angle20')
//                 );
//                 materialToUse = redMaterial;
//             } else if (distance <= maxDistance * 0.75 && distance > maxDistance * 0.5) {
//                 meshToShow = nodeMeshes.find(m =>
//                     m.name.startsWith('merged_node_') &&
//                     m.name.endsWith('_angle10')
//                 );
//                 materialToUse = greenMaterial;
//             }

//             if (meshToShow) {
//                 meshToShow.material = materialToUse;
//                 meshToShow.isVisible = true;
//                 meshToShow.setEnabled(true);
//                 console.log(`Showing ${meshToShow.name} at distance ${distance.toFixed(2)} with ${materialToUse.name}`);
//             }
//         }
//     };
//     const exportGLB = async (meshes) => {
//         if (!meshes || meshes.length === 0) return null;

//         try {
//             // Create a temporary scene for export
//             const tempScene = new BABYLON.Scene(engine);
//             const camera = new BABYLON.Camera("camera", BABYLON.Vector3.Zero(), tempScene);

//             // Process each mesh
//             const exportMeshes = meshes.map((mesh, index) => {
//                 // Validate input mesh
//                 if (!mesh || !mesh.geometry) {
//                     console.warn(`Invalid mesh at index ${index}`);
//                     return null;
//                 }

//                 // Get vertex data
//                 const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
//                 const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
//                 const indices = mesh.getIndices();

//                 // Validate vertex data
//                 if (!positions || positions.length === 0) {
//                     console.warn(`Mesh ${mesh.name} has no position data`);
//                     return null;
//                 }
//                 if (!indices || indices.length === 0) {
//                     console.warn(`Mesh ${mesh.name} has no indices`);
//                     return null;
//                 }

//                 console.log(`Processing mesh ${mesh.name}:`, {
//                     positions: positions.length,
//                     normals: normals?.length,
//                     indices: indices.length
//                 });

//                 // Create new mesh
//                 let exportMesh;
//                 if (mesh.name.endsWith('_angle5')) {
//                     exportMesh = new BABYLON.Mesh(`hpoly_mesh_${index}`, tempScene);
//                 }
//                 else if (mesh.name.endsWith('_angle10')) {
//                     exportMesh = new BABYLON.Mesh(`mpoly_mesh_${index}`, tempScene);
//                 }
//                 else {
//                     exportMesh = new BABYLON.Mesh(`lpoly_mesh_${index}`, tempScene);
//                 }

//                 // Create vertex data
//                 const vertexData = new BABYLON.VertexData();

//                 // Direct copy of vertex data without optimization
//                 vertexData.positions = new Float32Array(positions);
//                 if (normals && normals.length > 0) {
//                     vertexData.normals = new Float32Array(normals);
//                 }
//                 vertexData.indices = new Uint32Array(indices);

//                 try {
//                     // Validate data before applying
//                     if (vertexData.positions.length === 0) {
//                         console.error(`Empty positions array for mesh ${mesh.name}`);
//                         return null;
//                     }
//                     if (vertexData.indices.length % 3 !== 0) {
//                         console.error(`Invalid number of indices for mesh ${mesh.name}`);
//                         return null;
//                     }

//                     // Apply vertex data to mesh
//                     vertexData.applyToMesh(exportMesh);

//                     // Copy transforms
//                     exportMesh.position.copyFrom(mesh.position);
//                     exportMesh.rotation.copyFrom(mesh.rotation);
//                     exportMesh.scaling.copyFrom(mesh.scaling);

//                     // Apply material
//                     const material = new BABYLON.StandardMaterial(`material_${index}`, tempScene);
//                     material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//                     material.metallic = 0.1;
//                     material.roughness = 0.8;
//                     exportMesh.material = material;

//                     return exportMesh;
//                 } catch (error) {
//                     console.error(`Error creating export mesh ${mesh.name}:`, error);
//                     return null;
//                 }
//             }).filter(mesh => mesh !== null);

//             if (exportMeshes.length === 0) {
//                 throw new Error("No valid meshes to export");
//             }

//             console.log(`Successfully processed ${exportMeshes.length} meshes for export`);

//             await tempScene.whenReadyAsync();

//             // Export options
//             const options = {
//                 shouldExportNode: (node) => exportMeshes.includes(node),
//                 exportWithoutWaitingForScene: true,
//                 includeCoordinateSystemConversionNodes: false,
//                 exportTextures: false,
//                 truncateDrawRange: true,
//                 binary: true,
//                 preserveIndices: true,
//                 compressVertices: true
//             };

//             const serializedGLB = await GLTF2Export.GLBAsync(tempScene, "reduced_model", options);
//             const glbBlob = serializedGLB.glTFFiles['reduced_model.glb'];

//             if (!glbBlob || !(glbBlob instanceof Blob)) {
//                 throw new Error("Export failed: Invalid blob data");
//             }

//             // Cleanup
//             tempScene.dispose();

//             return {
//                 blob: glbBlob,
//                 size: glbBlob.size
//             };
//         } catch (error) {
//             console.error("Error during export:", error);
//             throw error;
//         }
//     };

//     const downloadmesh = async () => {
//         console.log('Total lpoly meshes to export:', downloadMeshes.mesh1.length);
//         console.log('Total mpoly meshes to export:', downloadMeshes.mesh2.length);
//         console.log('Total hpoly meshes to export:', downloadMeshes.mesh3.length);

//         if (downloadMeshes.mesh1 && downloadMeshes.mesh1.length > 0) {
//             try {
//                 const validMeshes = downloadMeshes.mesh1.filter(mesh =>
//                     mesh && mesh.geometry && mesh.isEnabled !== false
//                 );

//                 console.log('Valid meshes for export:', validMeshes.length);

//                 if (validMeshes.length === 0) {
//                     throw new Error("No valid meshes to export");
//                 }

//                 const glbData = await exportGLB(validMeshes);

//                 if (glbData && glbData.blob) {
//                     const url = URL.createObjectURL(glbData.blob);
//                     const a = document.createElement('a');
//                     a.href = url;
//                     a.download = 'lpoly_multiple_meshes.glb';
//                     document.body.appendChild(a);
//                     a.click();
//                     document.body.removeChild(a);
//                     URL.revokeObjectURL(url);

//                     console.log(`Successfully exported ${validMeshes.length} meshes, total size: ${(glbData.size / 1024 / 1024).toFixed(2)}MB`);

//                     // downloadButton.textContent = 'Download Complete';
//                     // setTimeout(() => {
//                     //     downloadButton.textContent = 'Download Model';
//                     //     downloadButton.disabled = false;
//                     // }, 2000);
//                 }
//             } catch (error) {
//                 console.error("Download failed:", error);
//                 // downloadButton.textContent = 'Export Failed';
//                 // setTimeout(() => {
//                 //     downloadButton.textContent = 'Download Model';
//                 //     downloadButton.disabled = false;
//                 // }, 2000);
//             }
//         } else {
//             console.warn("No meshes available to download");
//         }

//         if (downloadMeshes.mesh2 && downloadMeshes.mesh2.length > 0) {
//             try {
//                 const validMeshes = downloadMeshes.mesh2.filter(mesh =>
//                     mesh && mesh.geometry && mesh.isEnabled !== false
//                 );

//                 console.log('Valid meshes for export:', validMeshes.length);

//                 if (validMeshes.length === 0) {
//                     throw new Error("No valid meshes to export");
//                 }

//                 const glbData = await exportGLB(validMeshes);

//                 if (glbData && glbData.blob) {
//                     const url = URL.createObjectURL(glbData.blob);
//                     const a = document.createElement('a');
//                     a.href = url;
//                     a.download = 'mpoly_multiple_meshes.glb';
//                     document.body.appendChild(a);
//                     a.click();
//                     document.body.removeChild(a);
//                     URL.revokeObjectURL(url);

//                     console.log(`Successfully exported ${validMeshes.length} meshes, total size: ${(glbData.size / 1024 / 1024).toFixed(2)}MB`);

//                     // downloadButton.textContent = 'Download Complete';
//                     // setTimeout(() => {
//                     //     downloadButton.textContent = 'Download Model';
//                     //     downloadButton.disabled = false;
//                     // }, 2000);
//                 }
//             } catch (error) {
//                 console.error("Download failed:", error);
//                 // downloadButton.textContent = 'Export Failed';
//                 // setTimeout(() => {
//                 //     downloadButton.textContent = 'Download Model';
//                 //     downloadButton.disabled = false;
//                 // }, 2000);
//             }
//         } else {
//             console.warn("No meshes available to download");
//         }

//         if (downloadMeshes.mesh3 && downloadMeshes.mesh3.length > 0) {
//             try {
//                 const validMeshes = downloadMeshes.mesh3.filter(mesh =>
//                     mesh && mesh.geometry && mesh.isEnabled !== false
//                 );

//                 console.log('Valid meshes for export:', validMeshes.length);

//                 if (validMeshes.length === 0) {
//                     throw new Error("No valid meshes to export");
//                 }

//                 const glbData = await exportGLB(validMeshes);

//                 if (glbData && glbData.blob) {
//                     const url = URL.createObjectURL(glbData.blob);
//                     const a = document.createElement('a');
//                     a.href = url;
//                     a.download = 'hpoly_multiple_meshes.glb';
//                     document.body.appendChild(a);
//                     a.click();
//                     document.body.removeChild(a);
//                     URL.revokeObjectURL(url);

//                     console.log(`Successfully exported ${validMeshes.length} meshes, total size: ${(glbData.size / 1024 / 1024).toFixed(2)}MB`);

//                     // downloadButton.textContent = 'Download Complete';
//                     // setTimeout(() => {
//                     //     downloadButton.textContent = 'Download Model';
//                     //     downloadButton.disabled = false;
//                     // }, 2000);
//                 }
//             } catch (error) {
//                 console.error("Download failed:", error);
//                 // downloadButton.textContent = 'Export Failed';
//                 // setTimeout(() => {
//                 //     downloadButton.textContent = 'Download Model';
//                 //     downloadButton.disabled = false;
//                 // }, 2000);
//             }
//         } else {
//             console.warn("No meshes available to download");
//         }
//     }


//     // Function to collect information about original meshes in depth 4
//     const collectOriginalMeshInfo = () => {
//         const depth4MeshInfo = [];

//         // Get all nodes at depth 4
//         const nodesAtDepth4 = nodeNumbersByDepth[4] || [];

//         // Helper function to collect vertex data from a mesh
//         const collectVertexData = (mesh) => {
//             if (!mesh || !mesh.geometry) return null;

//             return {
//                 positions: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind) || []),
//                 normals: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind) || []),
//                 indices: Array.from(mesh.getIndices() || []),
//                 uvs: Array.from(mesh.getVerticesData(BABYLON.VertexBuffer.UVKind) || [])
//             };
//         };

//         // Helper function to collect transform data
//         const collectTransformData = (mesh) => {
//             return {
//                 position: {
//                     x: mesh.position.x,
//                     y: mesh.position.y,
//                     z: mesh.position.z
//                 },
//                 rotation: {
//                     x: mesh.rotation.x,
//                     y: mesh.rotation.y,
//                     z: mesh.rotation.z
//                 },
//                 scaling: {
//                     x: mesh.scaling.x,
//                     y: mesh.scaling.y,
//                     z: mesh.scaling.z
//                 },
//                 worldMatrix: Array.from(mesh.getWorldMatrix().toArray())
//             };
//         };

//         // Helper function to collect bounding box information
//         const collectBoundingInfo = (mesh) => {
//             const boundingInfo = mesh.getBoundingInfo();
//             return {
//                 minimum: {
//                     x: boundingInfo.minimum.x,
//                     y: boundingInfo.minimum.y,
//                     z: boundingInfo.minimum.z
//                 },
//                 maximum: {
//                     x: boundingInfo.maximum.x,
//                     y: boundingInfo.maximum.y,
//                     z: boundingInfo.maximum.z
//                 },
//                 boundingSphere: {
//                     center: {
//                         x: boundingInfo.boundingSphere.centerWorld.x,
//                         y: boundingInfo.boundingSphere.centerWorld.y,
//                         z: boundingInfo.boundingSphere.centerWorld.z
//                     },
//                     radius: boundingInfo.boundingSphere.radiusWorld
//                 }
//             };
//         };

//         // Process each node at depth 4
//         for (const nodeNum of nodesAtDepth4) {
//             const nodeMeshes = nodeContents.get(nodeNum) || [];

//             // Filter for original meshes (those that don't start with 'merged_node_')
//             const originalMeshes = nodeMeshes.filter(mesh =>
//                 mesh && mesh.name && !mesh.name.startsWith('merged_node_')
//             );

//             for (const mesh of originalMeshes) {
//                 try {
//                     const meshInfo = {
//                         name: mesh.name,
//                         nodeNumber: nodeNum,
//                         depth: 4,
//                         parentNode: nodeParents.get(nodeNum),
//                         vertexData: collectVertexData(mesh),
//                         transforms: collectTransformData(mesh),
//                         boundingInfo: collectBoundingInfo(mesh),
//                         metadata: {
//                             id: mesh.uniqueId,
//                             isVisible: mesh.isVisible,
//                             isEnabled: mesh.isEnabled,
//                             renderingGroupId: mesh.renderingGroupId,
//                             material: mesh.material ? {
//                                 name: mesh.material.name,
//                                 id: mesh.material.uniqueId,
//                                 diffuseColor: mesh.material.diffuseColor ? {
//                                     r: mesh.material.diffuseColor.r,
//                                     g: mesh.material.diffuseColor.g,
//                                     b: mesh.material.diffuseColor.b
//                                 } : null
//                             } : null,
//                             geometryInfo: {
//                                 totalVertices: mesh.getTotalVertices(),
//                                 totalIndices: mesh.getTotalIndices(),
//                                 faceCount: mesh.getTotalIndices() / 3
//                             }
//                         }
//                     };

//                     depth4MeshInfo.push(meshInfo);
//                 } catch (error) {
//                     console.error(`Error collecting info for mesh ${mesh.name}:`, error);
//                 }
//             }
//         }

//         return {
//             meshes: depth4MeshInfo,
//             summary: {
//                 totalMeshes: depth4MeshInfo.length,
//                 totalVertices: depth4MeshInfo.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.totalVertices, 0),
//                 totalFaces: depth4MeshInfo.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.faceCount, 0)
//             }
//         };
//     };

//     // // Function to collect octree information
//     // const collectOctreeInfo = () => {
//     //     const octreeInfo = {
//     //         structure: [],
//     //         metadata: {
//     //             maxDepth: maxDepth,
//     //             minSize: minSize,
//     //             totalNodes: 0,
//     //             nodesByDepth: {}
//     //         }
//     //     };

//     //     // Helper function to collect node information recursively
//     //     const collectNodeInfo = (nodeNum) => {
//     //         const depth = nodeDepths.get(nodeNum);
//     //         const parentNodeNum = nodeParents.get(nodeNum);
//     //         const nodeMeshes = nodeContents.get(nodeNum) || [];

//     //         // Get block bounds from a mesh in the node
//     //         let blockBounds = null;
//     //         for (const mesh of nodeMeshes) {
//     //             if (mesh && mesh.getBoundingInfo) {
//     //                 const boundingInfo = mesh.getBoundingInfo();
//     //                 blockBounds = {
//     //                     minimum: {
//     //                         x: boundingInfo.minimum.x,
//     //                         y: boundingInfo.minimum.y,
//     //                         z: boundingInfo.minimum.z
//     //                     },
//     //                     maximum: {
//     //                         x: boundingInfo.maximum.x,
//     //                         y: boundingInfo.maximum.y,
//     //                         z: boundingInfo.maximum.z
//     //                     }
//     //                 };
//     //                 break;
//     //             }
//     //         }

//     //         // Collect node information
//     //         const nodeInfo = {
//     //             nodeNumber: nodeNum,
//     //             depth: depth,
//     //             parentNode: parentNodeNum,
//     //             bounds: blockBounds,
//     //             meshCount: nodeMeshes.length,
//     //             meshTypes: {
//     //                 original: nodeMeshes.filter(m => !m.name.startsWith('merged_node_')).length
//     //             },
//     //             childNodes: nodeNumbersByDepth[depth + 1]?.filter(childNum =>
//     //                 nodeParents.get(childNum) === nodeNum
//     //             ) || []
//     //         };

//     //         // Add to structure array
//     //         octreeInfo.structure.push(nodeInfo);

//     //         // Update metadata
//     //         octreeInfo.metadata.totalNodes++;
//     //         octreeInfo.metadata.nodesByDepth[depth] =
//     //             (octreeInfo.metadata.nodesByDepth[depth] || 0) + 1;

//     //         // Process child nodes
//     //         nodeInfo.childNodes.forEach(childNum => {
//     //             collectNodeInfo(childNum);
//     //         });
//     //     };

//     //     // Start collection from root node (nodeNumber 1)
//     //     collectNodeInfo(1);

//     //     // Add additional metadata
//     //     octreeInfo.metadata.averageMeshesPerNode =
//     //         octreeInfo.structure.reduce((sum, node) => sum + node.meshCount, 0) /
//     //         octreeInfo.metadata.totalNodes;

//     //     return octreeInfo;
//     // };

//     const collectOctreeInfo = () => {
//         const octreeInfo = {
//             structure: [],
//             metadata: {
//                 maxDepth: maxDepth,
//                 minSize: minSize,
//                 totalNodes: 0,
//                 nodesByDepth: {},
//                 boundingBox: {
//                     min: cumulativeBoundingBox.min,
//                     max: cumulativeBoundingBox.max
//                 }
//             }
//         };

//         // Helper function to collect node information recursively
//         const collectNodeInfo = (nodeNum) => {
//             const depth = nodeDepths.get(nodeNum);
//             const parentNodeNum = nodeParents.get(nodeNum);
//             const nodeMeshes = nodeContents.get(nodeNum) || [];

//             // Get block bounds from a mesh in the node
//             let blockBounds = null;
//             for (const mesh of nodeMeshes) {
//                 if (mesh && mesh.getBoundingInfo) {
//                     const boundingInfo = mesh.getBoundingInfo();
//                     blockBounds = {
//                         minimum: {
//                             x: boundingInfo.minimum.x,
//                             y: boundingInfo.minimum.y,
//                             z: boundingInfo.minimum.z
//                         },
//                         maximum: {
//                             x: boundingInfo.maximum.x,
//                             y: boundingInfo.maximum.y,
//                             z: boundingInfo.maximum.z
//                         }
//                     };
//                     break;
//                 }
//             }

//             // Count meshes by type
//             const meshCounts = {
//                 total: nodeMeshes.length,
//                 simplified: {
//                     angle20: nodeMeshes.filter(m => m.name.includes('_angle20')).length,
//                     angle10: nodeMeshes.filter(m => m.name.includes('_angle10')).length,
//                     angle5: nodeMeshes.filter(m => m.name.includes('_angle5')).length
//                 }
//             };

//             // Collect node information
//             const nodeInfo = {
//                 nodeNumber: nodeNum,
//                 depth: depth,
//                 parentNode: parentNodeNum,
//                 bounds: blockBounds,
//                 meshCounts: meshCounts,
//                 childNodes: nodeNumbersByDepth[depth + 1]?.filter(childNum =>
//                     nodeParents.get(childNum) === nodeNum
//                 ) || []
//             };

//             // Add to structure array
//             octreeInfo.structure.push(nodeInfo);

//             // Update metadata
//             octreeInfo.metadata.totalNodes++;
//             octreeInfo.metadata.nodesByDepth[depth] =
//                 (octreeInfo.metadata.nodesByDepth[depth] || 0) + 1;

//             // Process child nodes
//             nodeInfo.childNodes.forEach(childNum => {
//                 collectNodeInfo(childNum);
//             });
//         };

//         // Start collection from root node (nodeNumber 1)
//         collectNodeInfo(1);

//         // Add additional metadata
//         octreeInfo.metadata.meshDistribution = {
//             totalMeshes: octreeInfo.structure.reduce((sum, node) => sum + node.meshCounts.total, 0),
//             byLOD: {
//                 angle20: octreeInfo.structure.reduce((sum, node) => sum + node.meshCounts.simplified.angle20, 0),
//                 angle10: octreeInfo.structure.reduce((sum, node) => sum + node.meshCounts.simplified.angle10, 0),
//                 angle5: octreeInfo.structure.reduce((sum, node) => sum + node.meshCounts.simplified.angle5, 0)
//             }
//         };

//         return octreeInfo;
//     };
//     useEffect(() => {

//         if (canvasRef.current && !sceneRef.current) {
//             engine = new BABYLON.Engine(canvasRef.current, true);
//             scene = new BABYLON.Scene(engine);
//             sceneRef.current = scene;
//             setSceneInstance(scene);  // Add this line

//             // Initialize camera
//             camera = new BABYLON.ArcRotateCamera(
//                 "camera",
//                 Math.PI / 4,
//                 Math.PI / 3,
//                 1000,
//                 BABYLON.Vector3.Zero(),
//                 scene
//             );
//             camera.attachControl(canvasRef.current, true);
//             camera.minZ = 0.001;
//             camera.wheelDeltaPercentage = 0.01;
//             camera.pinchDeltaPercentage = 0.01;
//             camera.wheelPrecision = 50;
//             camera.panningSensibility = 100;
//             camera.angularSensibilityX = 500;
//             camera.angularSensibilityY = 500;
//             setCameraInstance(camera);  // Add this line
//             // Add basic light
//             new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

//             engine.runRenderLoop(() => {
//                 scene.render();
//             });

//             window.addEventListener('resize', () => {
//                 engine.resize();
//             });
//             camera.onViewMatrixChangedObservable.add(() => {
//                 updateLODVisibility();
//             });


//         }

//         // Reset tracking structures
//         nodesAtDepth = new Array(maxDepth + 1).fill(0);
//         nodesAtDepthWithBoxes = new Array(maxDepth + 1).fill(0);
//         boxesAtDepth = Array.from({ length: maxDepth + 1 }, () => new Set());
//         nodeNumbersByDepth = Array.from({ length: maxDepth + 1 }, () => []);
//         nodeContents = new Map();
//         nodeDepths = new Map();
//         nodeParents = new Map();
//         nodeCounter = 1;

//         window.api.receive('gbl-file-content', (fileInfoArray) => {
//             if (fileInfoArray && fileInfoArray.length > 0) {
//                 console.log('Selected files:', fileInfoArray);
//                 window.api.send('fbx-gltf-converter', fileInfoArray);
//             }
//         });

//         window.api.receive('fbx-conversion-success', async (results) => {
//             // try {
//                 const { individualResults, cumulativeBoundingBox } =
//                     await calculateBoundingBoxes(results, canvasRef.current);
//                 console.log(individualResults);
//                 console.log(cumulativeBoundingBox);
//                 // Convert bounding box vectors to BABYLON.Vector3 objects
//                 const convertedBoundingBox = {
//                     min: new BABYLON.Vector3(
//                         cumulativeBoundingBox.min.x,
//                         cumulativeBoundingBox.min.y,
//                         cumulativeBoundingBox.min.z
//                     ),
//                     max: new BABYLON.Vector3(
//                         cumulativeBoundingBox.max.x,
//                         cumulativeBoundingBox.max.y,
//                         cumulativeBoundingBox.max.z
//                     )
//                 };
//                 console.log(convertedBoundingBox);

//                 setBoundingBoxes(individualResults);
//                 setCumulativeBoundingBox(convertedBoundingBox);

//                 if (scene && convertedBoundingBox && convertedBoundingBox.min && convertedBoundingBox.max) {
//                     // let allLoadedMeshes = []; // To store all meshes from all files

//                     // Loop through individualResults and load each file
//                     for (const { filePath } of individualResults) {
//                         console.log(`Loading file: ${filePath}`);
//                         const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", filePath, scene, (evt) => {
//                             // This callback runs while loading
//                             if (evt.meshes) {
//                                 evt.meshes.forEach(mesh => {
//                                     mesh.isVisible = false;
//                                     mesh.setEnabled(false);
//                                 });
//                             }
//                         });

//                         // Option 2: Set meshes invisible after loading
//                         loadedMeshes = result.meshes.filter(mesh =>
//                             mesh.name !== "__root__" &&
//                             mesh.geometry
//                         );

//                         // Clean up animations and materials
//                         scene.animationGroups.forEach(group => group.dispose());
//                         loadedMeshes.forEach(mesh => {
//                             // Set mesh invisible
//                             mesh.isVisible = false;
//                             mesh.setEnabled(false);

//                             if (mesh.material) {
//                                 mesh.material.dispose();
//                                 const simpleMaterial = new BABYLON.StandardMaterial("simpleMat", scene);
//                                 simpleMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
//                                 simpleMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
//                                 mesh.material = simpleMaterial;
//                             }
//                         });

//                         // // Add the loaded meshes to the main array
//                         // allLoadedMeshes.push(...loadedMeshes);
//                         Fullmeshes.push(...loadedMeshes);
//                         // Create simplified versions of each mesh
//                         for (const mesh of loadedMeshes) {
//                             try {
//                                 // Create LOD versions with different angle thresholds
//                                 const lod1 = simplifyMesh(mesh, 20);
//                                 const lod2 = simplifyMesh(mesh, 10);
//                                 const lod3 = simplifyMesh(mesh, 5);

//                                 if (lod1) {
//                                     lod1.name = `${mesh.name}_lpoly_angle20`;
//                                     lod1.isVisible = false;
//                                     lod1.setEnabled(false);
//                                     allLoadedMeshes.push(lod1);
//                                 }

//                                 if (lod2) {
//                                     lod2.name = `${mesh.name}_mpoly_angle10`;
//                                     lod2.isVisible = false;
//                                     lod2.setEnabled(false);
//                                     allLoadedMeshes.push(lod2);
//                                 }

//                                 if (lod3) {
//                                     lod3.name = `${mesh.name}_hpoly_angle5`;
//                                     lod3.isVisible = false;
//                                     lod3.setEnabled(false);
//                                     allLoadedMeshes.push(lod3);
//                                 }

//                                 // // Add original mesh to allLoadedMeshes as well
//                                 // allLoadedMeshes.push(mesh);

//                             } catch (error) {
//                                 console.error(`Error simplifying mesh ${mesh.name}:`, error);
//                             }
//                         }
//                         console.log(`all meshes to load : ${allLoadedMeshes}`);

//                     }

//                     // Create octree structure
//                     if (allLoadedMeshes.length > 0) {
//                         scene.meshes
//                             .filter(mesh => mesh.name.startsWith("octreeVisBox_"))
//                             .forEach(mesh => mesh.dispose());
//                         console.log("Creating octree structure");
//                         const rootBlock = createOctreeBlock(
//                             scene,
//                             convertedBoundingBox.min,
//                             convertedBoundingBox.max,
//                             allLoadedMeshes,
//                             0,
//                             null
//                         );
//                         console.log('Octree created:', rootBlock);

//                         // Position camera after octree creation
//                         positionCameraForBoundingBox(
//                             convertedBoundingBox.min,
//                             convertedBoundingBox.max
//                         );

//                         //         // Process LOD merging
//                         //         await processLODMerging();
//                         // await mergeMeshesByAngle();
//                         // // Update UI and visualizations
//                         // updateLODVisibility();
//                         //         const mergemeshdata = collectMergedMeshInfo()
//                         //         console.log(mergemeshdata);
//                         //         setmergemeshdatas(mergemeshdata.meshes)
//                         const orimeshdata = collectOriginalMeshInfo()
//                         console.log(orimeshdata);
//                         setorimeshdatas(orimeshdata.meshes)
//                         const octreedata = collectOctreeInfo()
//                         console.log(octreedata);
//                         setoctreedatas(octreedata)
//                     }
//                 }
//             // } catch (error) {
//             //     console.error('Error processing meshes:', error);
//             // }
//         });

//         return () => {
//             if (sceneRef.current) {
//                 sceneRef.current.dispose();
//             }
//         };
//     }, []);

//     return (
//         <div>
//             <button
//                 onClick={handleFileSelect}
//                 className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//                 Select FBX File
//             </button>

//             {/* <Loadindexdb /> */}

//             <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
//             {/* <CameraControls
//                 scene={scene}
//                 canvas={canvasRef.current}
//                 updateLODVisibility={updateLODVisibility}
//                 maxDistance={maxDistance}
//             /> */}
//             <div id='rightopt' style={{ right: '0px' }} >
//                 <i class="fa-solid fa-circle-info  button " title='Tag Info'  ></i>
//                 <i class="fa fa-search-plus button" title='Zoomin' ></i>
//                 <i class="fa fa-search-plus button" title='Download' onClick={downloadmesh}></i>
//             </div>
//             {/* {octreedatas && orimeshdatas.length > 0 && (
//                 <Octreestorage
//                     convertedModels={[
//                         ...orimeshdatas.map(data => ({
//                             fileName: data.name,
//                             data: data
//                         }))
//                     ]}
//                     octree={octreedatas}
//                 />
//             )} */}

//         </div>
//     );
// }
// export default Fbxload;






















import React, { useEffect, useRef, useState } from 'react';
import { calculateBoundingBoxes, createBoundingBoxMesh } from './Bbload';
import { createCustomOctree, visualizeCustomOctree, initializeScene, positionCameraToFitBoundingBox } from './Octreecreation';
import * as BABYLON from '@babylonjs/core';
import Octreestorage from './Octreestorage';
import CameraControls from './CameraControls';
import { GLTF2Export } from '@babylonjs/serializers/glTF';
import Loadindexdb from './Loadindexdb';
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
    const [octreedatas, setoctreedatas] = useState({})
    const [currentScene, setCurrentScene] = useState(null);
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
        let tempMesh1 = [];
        let tempMesh2 = [];
        let tempMesh3 = [];
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
                        tempMesh1.push(mergedMesh);
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
                        console.log(`merge mesh name ${mergedMesh.name}`)
                        tempMesh2.push(mergedMesh);
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
                        tempMesh3.push(mergedMesh);
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
        setDownloadMeshes({
            mesh1: tempMesh1,
            mesh2: tempMesh2,
            mesh3: tempMesh3
        });
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

        // Modified function to process meshes based on coverage
        const processMeshesForFaceCount = (depth) => {
            const nodesAtDepth = nodeNumbersByDepth[depth] || [];

            // Create array of all eligible meshes with their coverage values
            let meshesWithCoverage = [];

            for (const nodeNum of nodesAtDepth) {
                const nodeMeshes = nodeContents.get(nodeNum) || [];
                const mergedAngle20Meshes = nodeMeshes.filter(mesh =>
                    mesh.name.startsWith('merged_node_') &&
                    mesh.name.endsWith('_angle20')
                );

                // Calculate coverage for each mesh and store with mesh info
                mergedAngle20Meshes.forEach(mesh => {
                    const coverage = calculateScreenCoverage(mesh, camera, engine);
                    meshesWithCoverage.push({
                        nodeNum,
                        mesh,
                        coverage,
                        faces: mesh.getTotalVertices() / 3
                    });
                });
            }

            // Sort meshes by coverage (highest first)
            meshesWithCoverage.sort((a, b) => b.coverage - a.coverage);

            // Process meshes in order of coverage
            for (const meshInfo of meshesWithCoverage) {
                if (currentTotalFaces + meshInfo.faces <= FACE_LIMIT1) {
                    meshesToDisplay.add({
                        nodeNum: meshInfo.nodeNum,
                        mesh: meshInfo.mesh,
                        faces: meshInfo.faces
                    });
                    currentTotalFaces += meshInfo.faces;
                } else {
                    break;
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

        // Rest of the function remains the same...
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

                if (distance <= maxDistance * 0.5 && distance > 0) {
                    const nodeMeshes = nodeContents.get(nodeNum) || [];
                    const highDetailMeshes = nodeMeshes.filter(mesh =>
                        mesh.name.startsWith('merged_node_') &&
                        mesh.name.endsWith('_angle5')
                    );

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

            if (distance <= maxDistance * 0.5 && distance > 0) {
                continue;
            }

            nodeMeshes.forEach(mesh => {
                mesh.isVisible = false;
                mesh.setEnabled(false);
            });

            let meshToShow = null;
            let materialToUse = null;

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
                if (mesh.name.endsWith('_angle5')) {
                    exportMesh = new BABYLON.Mesh(`hpoly_mesh_${index}`, tempScene);
                }
                else if (mesh.name.endsWith('_angle10')) {
                    exportMesh = new BABYLON.Mesh(`mpoly_mesh_${index}`, tempScene);
                }
                else {
                    exportMesh = new BABYLON.Mesh(`lpoly_mesh_${index}`, tempScene);
                }

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


    // const exportGLB = async (meshes) => {
    //     if (!meshes || meshes.length === 0) return null;

    //     try {
    //         // Create a temporary scene for export
    //         const tempScene = new BABYLON.Scene(engine);

    //         // Set up minimal environment
    //         const camera = new BABYLON.Camera("camera", BABYLON.Vector3.Zero(), tempScene);

    //         // Process each mesh
    //         // const exportMeshes = meshes.map((mesh, index) => {
    //         //     // Create new mesh in temp scene
    //         //     let exportMesh;
    //         //     if (mesh.name.endsWith('_angle5')) {
    //         //         exportMesh = new BABYLON.Mesh(`hpoly_mesh_${index}`, tempScene);
    //         //     }
    //         //     else if (mesh.name.endsWith('_angle10')) {
    //         //         exportMesh = new BABYLON.Mesh(`mpoly_mesh_${index}`, tempScene);
    //         //     }
    //         //     else {
    //         //         exportMesh = new BABYLON.Mesh(`lpoly_mesh_${index}`, tempScene);
    //         //     }


    //         //     // Get vertex data from original mesh
    //         //     const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    //         //     const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    //         //     const indices = mesh.getIndices();

    //         //     if (!positions || !indices) {
    //         //         console.warn(`Skipping invalid mesh at index ${index}`);
    //         //         return null;
    //         //     }

    //         //     // Remove duplicate vertices
    //         //     const uniqueVertices = new Map();
    //         //     const optimizedPositions = [];
    //         //     const optimizedNormals = [];
    //         //     const optimizedIndices = [];

    //         //     // Process vertices
    //         //     for (let i = 0; i < positions.length; i += 3) {
    //         //         const vertexKey = `${positions[i].toFixed(3)},${positions[i + 1].toFixed(3)},${positions[i + 2].toFixed(3)}`;

    //         //         if (!uniqueVertices.has(vertexKey)) {
    //         //             const newIndex = optimizedPositions.length / 3;
    //         //             uniqueVertices.set(vertexKey, newIndex);

    //         //             optimizedPositions.push(positions[i], positions[i + 1], positions[i + 2]);
    //         //             if (normals) {
    //         //                 optimizedNormals.push(normals[i], normals[i + 1], normals[i + 2]);
    //         //             }
    //         //         }
    //         //     }

    //         //     // Update indices
    //         //     for (let i = 0; i < indices.length; i++) {
    //         //         const originalIndex = indices[i];
    //         //         const pos = originalIndex * 3;
    //         //         const vertexKey = `${positions[pos].toFixed(3)},${positions[pos + 1].toFixed(3)},${positions[pos + 2].toFixed(3)}`;
    //         //         optimizedIndices.push(uniqueVertices.get(vertexKey));
    //         //     }

    //         //     // Apply optimized data
    //         //     const vertexData = new BABYLON.VertexData();
    //         //     vertexData.positions = optimizedPositions;
    //         //     if (normals) {
    //         //         vertexData.normals = optimizedNormals;
    //         //     }
    //         //     vertexData.indices = optimizedIndices;
    //         //     vertexData.applyToMesh(exportMesh);

    //         //     // Copy transforms from original mesh
    //         //     exportMesh.position.copyFrom(mesh.position);
    //         //     exportMesh.rotation.copyFrom(mesh.rotation);
    //         //     exportMesh.scaling.copyFrom(mesh.scaling);

    //         //     // Apply material
    //         //     const material = new BABYLON.PBRMaterial(`material_${index}`, tempScene);
    //         //     material.albedoColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    //         //     material.metallic = 0.1;
    //         //     material.roughness = 0.8;
    //         //     material.disableBumpMap = true;
    //         //     material.forceIrradianceInFragment = true;
    //         //     exportMesh.material = material;

    //         //     return exportMesh;
    //         // }).filter(mesh => mesh !== null);
    //         // Inside exportGLB function, modify the mesh processing part:
    //         const exportMeshes = meshes.map((mesh, index) => {
    //             // Create new mesh in temp scene
    //             let exportMesh;
    //             if (mesh.name.endsWith('_angle5')) {
    //                 exportMesh = new BABYLON.Mesh(`hpoly_mesh_${index}`, tempScene);
    //             }
    //             else if (mesh.name.endsWith('_angle10')) {
    //                 exportMesh = new BABYLON.Mesh(`mpoly_mesh_${index}`, tempScene);
    //             }
    //             else {
    //                 exportMesh = new BABYLON.Mesh(`lpoly_mesh_${index}`, tempScene);
    //             }

    //             // Get vertex data from original mesh
    //             const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    //             const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    //             const indices = mesh.getIndices();

    //             if (!positions || !indices) {
    //                 console.warn(`Skipping invalid mesh at index ${index}`);
    //                 return null;
    //             }

    //             // Create a map to track unique vertices
    //             const vertexMap = new Map();
    //             const uniquePositions = [];
    //             const uniqueNormals = [];
    //             const newIndices = [];

    //             // Process each triangle
    //             for (let i = 0; i < indices.length; i += 3) {
    //                 const triangle = [];

    //                 // Process each vertex of the triangle
    //                 for (let j = 0; j < 3; j++) {
    //                     const originalIndex = indices[i + j];
    //                     const px = positions[originalIndex * 3];
    //                     const py = positions[originalIndex * 3 + 1];
    //                     const pz = positions[originalIndex * 3 + 2];

    //                     // Create a unique key for this vertex
    //                     const key = `${px.toFixed(3)},${py.toFixed(3)},${pz.toFixed(3)}`;

    //                     let newIndex;
    //                     if (!vertexMap.has(key)) {
    //                         newIndex = uniquePositions.length / 3;
    //                         vertexMap.set(key, newIndex);

    //                         // Add position
    //                         uniquePositions.push(px, py, pz);

    //                         // Add normal if available
    //                         if (normals) {
    //                             uniqueNormals.push(
    //                                 normals[originalIndex * 3],
    //                                 normals[originalIndex * 3 + 1],
    //                                 normals[originalIndex * 3 + 2]
    //                             );
    //                         }
    //                     } else {
    //                         newIndex = vertexMap.get(key);
    //                     }

    //                     triangle.push(newIndex);
    //                 }

    //                 // Only add valid triangles
    //                 if (triangle[0] !== triangle[1] && triangle[1] !== triangle[2] && triangle[2] !== triangle[0]) {
    //                     newIndices.push(...triangle);
    //                 }
    //             }

    //             // Ensure we have a valid number of indices
    //             if (newIndices.length % 3 !== 0) {
    //                 console.warn(`Invalid number of indices for mesh ${mesh.name}: ${newIndices.length}`);
    //                 return null;
    //             }

    //             // Create vertex data and apply to mesh
    //             const vertexData = new BABYLON.VertexData();
    //             vertexData.positions = new Float32Array(uniquePositions);
    //             if (uniqueNormals.length > 0) {
    //                 vertexData.normals = new Float32Array(uniqueNormals);
    //             }
    //             vertexData.indices = new Uint32Array(newIndices);

    //             try {
    //                 vertexData.applyToMesh(exportMesh);
    //             } catch (error) {
    //                 console.error(`Error applying vertex data to mesh ${mesh.name}:`, error);
    //                 return null;
    //             }

    //             // Copy transforms from original mesh
    //             exportMesh.position.copyFrom(mesh.position);
    //             exportMesh.rotation.copyFrom(mesh.rotation);
    //             exportMesh.scaling.copyFrom(mesh.scaling);

    //             // Apply material
    //             const material = new BABYLON.StandardMaterial(`material_${index}`, tempScene);
    //             material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    //             exportMesh.material = material;

    //             return exportMesh;
    //         }).filter(mesh => mesh !== null);

    //         if (exportMeshes.length === 0) {
    //             throw new Error("No valid meshes to export");
    //         }

    //         await tempScene.whenReadyAsync();

    //         // Export options
    //         const options = {
    //             shouldExportNode: (node) => exportMeshes.includes(node),
    //             exportWithoutWaitingForScene: true,
    //             includeCoordinateSystemConversionNodes: false,
    //             exportTextures: false,
    //             truncateDrawRange: true,
    //             binary: true,
    //             preserveIndices: true,
    //             compressVertices: true
    //         };

    //         // Export all meshes to GLB
    //         const serializedGLB = await GLTF2Export.GLBAsync(tempScene, "reduced_model", options);
    //         const glbBlob = serializedGLB.glTFFiles['reduced_model.glb'];

    //         if (!glbBlob || !(glbBlob instanceof Blob)) {
    //             throw new Error("Export failed: Invalid blob data");
    //         }

    //         // Cleanup
    //         tempScene.dispose();

    //         return {
    //             blob: glbBlob,
    //             size: glbBlob.size
    //         };
    //     } catch (error) {
    //         console.error("Error during export:", error);
    //         throw error;
    //     }
    // };

    const downloadmesh = async () => {
        console.log('Total lpoly meshes to export:', downloadMeshes.mesh1.length);
        console.log('Total mpoly meshes to export:', downloadMeshes.mesh2.length);
        console.log('Total hpoly meshes to export:', downloadMeshes.mesh3.length);

        if (downloadMeshes.mesh1 && downloadMeshes.mesh1.length > 0) {
            try {
                const validMeshes = downloadMeshes.mesh1.filter(mesh =>
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
                    a.download = 'lpoly_multiple_meshes.glb';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log(`Successfully exported ${validMeshes.length} meshes, total size: ${(glbData.size / 1024 / 1024).toFixed(2)}MB`);

                    // downloadButton.textContent = 'Download Complete';
                    // setTimeout(() => {
                    //     downloadButton.textContent = 'Download Model';
                    //     downloadButton.disabled = false;
                    // }, 2000);
                }
            } catch (error) {
                console.error("Download failed:", error);
                // downloadButton.textContent = 'Export Failed';
                // setTimeout(() => {
                //     downloadButton.textContent = 'Download Model';
                //     downloadButton.disabled = false;
                // }, 2000);
            }
        } else {
            console.warn("No meshes available to download");
        }

        if (downloadMeshes.mesh2 && downloadMeshes.mesh2.length > 0) {
            try {
                const validMeshes = downloadMeshes.mesh2.filter(mesh =>
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
                    a.download = 'mpoly_multiple_meshes.glb';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log(`Successfully exported ${validMeshes.length} meshes, total size: ${(glbData.size / 1024 / 1024).toFixed(2)}MB`);

                    // downloadButton.textContent = 'Download Complete';
                    // setTimeout(() => {
                    //     downloadButton.textContent = 'Download Model';
                    //     downloadButton.disabled = false;
                    // }, 2000);
                }
            } catch (error) {
                console.error("Download failed:", error);
                // downloadButton.textContent = 'Export Failed';
                // setTimeout(() => {
                //     downloadButton.textContent = 'Download Model';
                //     downloadButton.disabled = false;
                // }, 2000);
            }
        } else {
            console.warn("No meshes available to download");
        }

        if (downloadMeshes.mesh3 && downloadMeshes.mesh3.length > 0) {
            try {
                const validMeshes = downloadMeshes.mesh3.filter(mesh =>
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
                    a.download = 'hpoly_multiple_meshes.glb';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log(`Successfully exported ${validMeshes.length} meshes, total size: ${(glbData.size / 1024 / 1024).toFixed(2)}MB`);

                    // downloadButton.textContent = 'Download Complete';
                    // setTimeout(() => {
                    //     downloadButton.textContent = 'Download Model';
                    //     downloadButton.disabled = false;
                    // }, 2000);
                }
            } catch (error) {
                console.error("Download failed:", error);
                // downloadButton.textContent = 'Export Failed';
                // setTimeout(() => {
                //     downloadButton.textContent = 'Download Model';
                //     downloadButton.disabled = false;
                // }, 2000);
            }
        } else {
            console.warn("No meshes available to download");
        }
    }
    // const collectMergedMeshInfo = () => {
    //     // Create an object to store mesh information by depth
    //     const meshInfoByDepth = {
    //         depth1: [],
    //         depth2: [],
    //         depth3: []
    //     };

    //     // Helper function to get vertex and index data
    //     const getGeometryData = (mesh) => {
    //         const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    //         const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    //         const indices = mesh.getIndices();

    //         return {
    //             positions: positions ? Array.from(positions) : null,
    //             normals: normals ? Array.from(normals) : null,
    //             indices: indices ? Array.from(indices) : null,
    //             vertexCount: positions ? positions.length / 3 : 0,
    //             faceCount: indices ? indices.length / 3 : 0
    //         };
    //     };

    //     // Helper function to get bounding box information
    //     const getBoundingBoxInfo = (mesh) => {
    //         const boundingBox = mesh.getBoundingInfo().boundingBox;
    //         return {
    //             minimum: {
    //                 x: boundingBox.minimumWorld.x,
    //                 y: boundingBox.minimumWorld.y,
    //                 z: boundingBox.minimumWorld.z
    //             },
    //             maximum: {
    //                 x: boundingBox.maximumWorld.x,
    //                 y: boundingBox.maximumWorld.y,
    //                 z: boundingBox.maximumWorld.z
    //             },
    //             center: {
    //                 x: boundingBox.centerWorld.x,
    //                 y: boundingBox.centerWorld.y,
    //                 z: boundingBox.centerWorld.z
    //             }
    //         };
    //     };

    //     // Process each depth level
    //     for (let depth = 1; depth <= 3; depth++) {
    //         const nodesAtDepth = nodeNumbersByDepth[depth] || [];

    //         for (const nodeNum of nodesAtDepth) {
    //             const nodeMeshes = nodeContents.get(nodeNum) || [];

    //             // Filter for merged meshes only
    //             const mergedMeshes = nodeMeshes.filter(mesh =>
    //                 mesh && mesh.name && mesh.name.startsWith('merged_node_')
    //             );

    //             // Collect information for each merged mesh
    //             mergedMeshes.forEach(mesh => {
    //                 const geometryData = getGeometryData(mesh);
    //                 const boundingBoxInfo = getBoundingBoxInfo(mesh);

    //                 const meshInfo = {
    //                     // Basic information
    //                     id: mesh.id,
    //                     name: mesh.name,
    //                     nodeId: nodeNum,
    //                     depth: depth,

    //                     // Transform information
    //                     position: {
    //                         x: mesh.position.x,
    //                         y: mesh.position.y,
    //                         z: mesh.position.z
    //                     },
    //                     rotation: {
    //                         x: mesh.rotation.x,
    //                         y: mesh.rotation.y,
    //                         z: mesh.rotation.z
    //                     },
    //                     scaling: {
    //                         x: mesh.scaling.x,
    //                         y: mesh.scaling.y,
    //                         z: mesh.scaling.z
    //                     },

    //                     // Geometry information
    //                     geometry: geometryData,
    //                     boundingBox: boundingBoxInfo,

    //                     // Material information
    //                     materialName: mesh.material ? mesh.material.name : null,

    //                     // Mesh properties
    //                     isVisible: mesh.isVisible,
    //                     isEnabled: mesh.isEnabled,

    //                     // Additional metadata
    //                     creationTime: new Date().toISOString(),
    //                     lodLevel: mesh.name.includes('_angle20') ? 'low' :
    //                         mesh.name.includes('_angle10') ? 'medium' : 'high'
    //                 };

    //                 // Add to appropriate depth array
    //                 meshInfoByDepth[`depth${depth}`].push(meshInfo);
    //             });
    //         }
    //     }

    //     // Add summary information
    //     const summary = {
    //         totalMeshes: {
    //             depth1: meshInfoByDepth.depth1.length,
    //             depth2: meshInfoByDepth.depth2.length,
    //             depth3: meshInfoByDepth.depth3.length
    //         },
    //         collectionTimestamp: new Date().toISOString()
    //     };

    //     return {
    //         meshInfoByDepth,
    //         summary
    //     };
    // };

    const collectMergedMeshInfo = () => {
        // Structure to store mesh information by depth
        // const meshInfoByDepth = {
        //     depth1: [],
        //     depth2: [],
        //     depth3: []
        // };
        const meshInfoByDepth = []

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

        // Iterate through each depth
        for (let depth = 1; depth <= 3; depth++) {
            const nodesAtThisDepth = nodeNumbersByDepth[depth] || [];

            for (const nodeNum of nodesAtThisDepth) {
                const nodeMeshes = nodeContents.get(nodeNum) || [];
                const mergedMeshes = nodeMeshes.filter(mesh =>
                    mesh && mesh.name && mesh.name.startsWith('merged_node_')
                );

                for (const mesh of mergedMeshes) {
                    try {
                        const meshInfo = {
                            name: mesh.name,
                            nodeNumber: nodeNum,
                            depth: depth,
                            parentNode: nodeParents.get(nodeNum),
                            vertexData: collectVertexData(mesh),
                            transforms: collectTransformData(mesh),
                            boundingInfo: collectBoundingInfo(mesh),
                            metadata: {
                                id: mesh.uniqueId,
                                isVisible: mesh.isVisible,
                                isEnabled: mesh.isEnabled,
                                renderingGroupId: mesh.renderingGroupId,
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
                        meshInfoByDepth.push(meshInfo);
                    } catch (error) {
                        console.error(`Error collecting info for mesh ${mesh.name}:`, error);
                    }
                }
            }
        }

        // Revised summary calculation
        const summary = {
            totalMeshes: meshInfoByDepth.length,
            totalVertices: meshInfoByDepth.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.totalVertices, 0),
            totalFaces: meshInfoByDepth.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.faceCount, 0)
        };

        return {
            meshes: meshInfoByDepth,
            summary
        };
    };

    // Function to collect information about original meshes in depth 4
    const collectOriginalMeshInfo = () => {
        const depth4MeshInfo = [];

        // Get all nodes at depth 4
        const nodesAtDepth4 = nodeNumbersByDepth[4] || [];

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

        // Process each node at depth 4
        for (const nodeNum of nodesAtDepth4) {
            const nodeMeshes = nodeContents.get(nodeNum) || [];

            // Filter for original meshes (those that don't start with 'merged_node_')
            const originalMeshes = nodeMeshes.filter(mesh =>
                mesh && mesh.name && !mesh.name.startsWith('merged_node_')
            );

            for (const mesh of originalMeshes) {
                try {
                    const meshInfo = {
                        name: mesh.name,
                        nodeNumber: nodeNum,
                        depth: 4,
                        parentNode: nodeParents.get(nodeNum),
                        vertexData: collectVertexData(mesh),
                        transforms: collectTransformData(mesh),
                        boundingInfo: collectBoundingInfo(mesh),
                        metadata: {
                            id: mesh.uniqueId,
                            isVisible: mesh.isVisible,
                            isEnabled: mesh.isEnabled,
                            renderingGroupId: mesh.renderingGroupId,
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

                    depth4MeshInfo.push(meshInfo);
                } catch (error) {
                    console.error(`Error collecting info for mesh ${mesh.name}:`, error);
                }
            }
        }

        return {
            meshes: depth4MeshInfo,
            summary: {
                totalMeshes: depth4MeshInfo.length,
                totalVertices: depth4MeshInfo.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.totalVertices, 0),
                totalFaces: depth4MeshInfo.reduce((sum, mesh) => sum + mesh.metadata.geometryInfo.faceCount, 0)
            }
        };
    };

    // // Function to collect octree information
    // const collectOctreeInfo = () => {
    //     const octreeInfo = {
    //         structure: [],
    //         metadata: {
    //             maxDepth: maxDepth,
    //             minSize: minSize,
    //             totalNodes: 0,
    //             nodesByDepth: {}
    //         }
    //     };

    //     // Helper function to collect node information recursively
    //     const collectNodeInfo = (nodeNum) => {
    //         const depth = nodeDepths.get(nodeNum);
    //         const parentNodeNum = nodeParents.get(nodeNum);
    //         const nodeMeshes = nodeContents.get(nodeNum) || [];

    //         // Get block bounds from a mesh in the node
    //         let blockBounds = null;
    //         for (const mesh of nodeMeshes) {
    //             if (mesh && mesh.getBoundingInfo) {
    //                 const boundingInfo = mesh.getBoundingInfo();
    //                 blockBounds = {
    //                     minimum: {
    //                         x: boundingInfo.minimum.x,
    //                         y: boundingInfo.minimum.y,
    //                         z: boundingInfo.minimum.z
    //                     },
    //                     maximum: {
    //                         x: boundingInfo.maximum.x,
    //                         y: boundingInfo.maximum.y,
    //                         z: boundingInfo.maximum.z
    //                     }
    //                 };
    //                 break;
    //             }
    //         }

    //         // Collect node information
    //         const nodeInfo = {
    //             nodeNumber: nodeNum,
    //             depth: depth,
    //             parentNode: parentNodeNum,
    //             bounds: blockBounds,
    //             meshCount: nodeMeshes.length,
    //             meshTypes: {
    //                 original: nodeMeshes.filter(m => !m.name.startsWith('merged_node_')).length
    //             },
    //             childNodes: nodeNumbersByDepth[depth + 1]?.filter(childNum =>
    //                 nodeParents.get(childNum) === nodeNum
    //             ) || []
    //         };

    //         // Add to structure array
    //         octreeInfo.structure.push(nodeInfo);

    //         // Update metadata
    //         octreeInfo.metadata.totalNodes++;
    //         octreeInfo.metadata.nodesByDepth[depth] =
    //             (octreeInfo.metadata.nodesByDepth[depth] || 0) + 1;

    //         // Process child nodes
    //         nodeInfo.childNodes.forEach(childNum => {
    //             collectNodeInfo(childNum);
    //         });
    //     };

    //     // Start collection from root node (nodeNumber 1)
    //     collectNodeInfo(1);

    //     // Add additional metadata
    //     octreeInfo.metadata.averageMeshesPerNode =
    //         octreeInfo.structure.reduce((sum, node) => sum + node.meshCount, 0) /
    //         octreeInfo.metadata.totalNodes;

    //     return octreeInfo;
    // };

    useEffect(() => {
        console.log(AllCumulativeBoundingBox);
    }, [AllCumulativeBoundingBox])

    const collectOctreeInfo = (convertedBoundingBox) => {
        console.log(convertedBoundingBox);
        const octreeInfo = {
            structure: [],
            metadata: {
                maxDepth: maxDepth,
                minSize: minSize,
                totalNodes: 0,
                nodesByDepth: {},
                boundingBox: {
                    min: convertedBoundingBox.min,
                    max: convertedBoundingBox.max
                }
            }
        };

        // Helper function to collect node information recursively
        const collectNodeInfo = (nodeNum) => {
            const depth = nodeDepths.get(nodeNum);
            const parentNodeNum = nodeParents.get(nodeNum);
            const nodeMeshes = nodeContents.get(nodeNum) || [];

            // Get block bounds from a mesh in the node
            let blockBounds = null;
            for (const mesh of nodeMeshes) {
                if (mesh && mesh.getBoundingInfo) {
                    const boundingInfo = mesh.getBoundingInfo();
                    blockBounds = {
                        minimum: {
                            x: boundingInfo.minimum.x,
                            y: boundingInfo.minimum.y,
                            z: boundingInfo.minimum.z
                        },
                        maximum: {
                            x: boundingInfo.maximum.x,
                            y: boundingInfo.maximum.y,
                            z: boundingInfo.maximum.z
                        }
                    };
                    break;
                }
            }

            // Count meshes by type
            const meshCounts = {
                total: nodeMeshes.length,
                simplified: {
                    angle20: nodeMeshes.filter(m => m.name.includes('_angle20')).length,
                    angle10: nodeMeshes.filter(m => m.name.includes('_angle10')).length,
                    angle5: nodeMeshes.filter(m => m.name.includes('_angle5')).length
                }
            };

            // Collect node information
            const nodeInfo = {
                nodeNumber: nodeNum,
                depth: depth,
                parentNode: parentNodeNum,
                bounds: blockBounds,
                meshCounts: meshCounts,
                childNodes: nodeNumbersByDepth[depth + 1]?.filter(childNum =>
                    nodeParents.get(childNum) === nodeNum
                ) || []
            };

            // Add to structure array
            octreeInfo.structure.push(nodeInfo);

            // Update metadata
            octreeInfo.metadata.totalNodes++;
            octreeInfo.metadata.nodesByDepth[depth] =
                (octreeInfo.metadata.nodesByDepth[depth] || 0) + 1;

            // Process child nodes
            nodeInfo.childNodes.forEach(childNum => {
                collectNodeInfo(childNum);
            });
        };

        // Start collection from root node (nodeNumber 1)
        collectNodeInfo(1);

        // Add additional metadata
        octreeInfo.metadata.meshDistribution = {
            totalMeshes: octreeInfo.structure.reduce((sum, node) => sum + node.meshCounts.total, 0),
            byLOD: {
                angle20: octreeInfo.structure.reduce((sum, node) => sum + node.meshCounts.simplified.angle20, 0),
                angle10: octreeInfo.structure.reduce((sum, node) => sum + node.meshCounts.simplified.angle10, 0),
                angle5: octreeInfo.structure.reduce((sum, node) => sum + node.meshCounts.simplified.angle5, 0)
            }
        };

        return octreeInfo;
    };
    useEffect(() => {

        if (canvasRef.current && !sceneRef.current) {
            engine = new BABYLON.Engine(canvasRef.current, true);
            scene = new BABYLON.Scene(engine);
            sceneRef.current = scene;
            setCurrentScene(scene);
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
                        // const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", filePath, scene, (evt) => {
                        //     // This callback runs while loading
                        //     if (evt.meshes) {
                        //         evt.meshes.forEach(mesh => {
                        //             mesh.isVisible = false;
                        //             mesh.setEnabled(false);
                        //         });
                        //     }
                        // });
                        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", filePath, scene);

                        // Option 2: Set meshes invisible after loading
                        loadedMeshes = result.meshes.filter(mesh =>
                            mesh.name !== "__root__" &&
                            mesh.geometry
                        );

                        // Clean up animations and materials
                        scene.animationGroups.forEach(group => group.dispose());
                        loadedMeshes.forEach(mesh => {
                            // Set mesh invisible
                            mesh.isVisible = false;
                            mesh.setEnabled(false);

                            if (mesh.material) {
                                mesh.material.dispose();
                                const simpleMaterial = new BABYLON.StandardMaterial("simpleMat", scene);
                                simpleMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                                simpleMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                mesh.material = simpleMaterial;
                            }
                        });

                        // // Add the loaded meshes to the main array
                        // allLoadedMeshes.push(...loadedMeshes);
                        Fullmeshes.push(...loadedMeshes);
                        // Create simplified versions of each mesh
                        for (const mesh of loadedMeshes) {
                            try {
                                // Create LOD versions with different angle thresholds
                                const lod1 = simplifyMesh(mesh, 20);
                                const lod2 = simplifyMesh(mesh, 10);
                                const lod3 = simplifyMesh(mesh, 5);

                                if (lod1) {
                                    lod1.name = `${mesh.name}_lpoly_angle20`;
                                    lod1.isVisible = false;
                                    lod1.setEnabled(false);
                                    allLoadedMeshes.push(lod1);
                                }

                                if (lod2) {
                                    lod2.name = `${mesh.name}_mpoly_angle10`;
                                    lod2.isVisible = false;
                                    lod2.setEnabled(false);
                                    allLoadedMeshes.push(lod2);
                                }

                                if (lod3) {
                                    lod3.name = `${mesh.name}_hpoly_angle5`;
                                    lod3.isVisible = false;
                                    lod3.setEnabled(false);
                                    allLoadedMeshes.push(lod3);
                                }

                                // // Add original mesh to allLoadedMeshes as well
                                // allLoadedMeshes.push(mesh);

                            } catch (error) {
                                console.error(`Error simplifying mesh ${mesh.name}:`, error);
                            }
                        }
                        console.log(`all meshes to load : ${allLoadedMeshes}`);

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

                        //         // Process LOD merging
                        //         await processLODMerging();
                        // await mergeMeshesByAngle();
                        // // Update UI and visualizations
                        // updateLODVisibility();
                        //         const mergemeshdata = collectMergedMeshInfo()
                        //         console.log(mergemeshdata);
                        //         setmergemeshdatas(mergemeshdata.meshes)
                        const orimeshdata = await collectOriginalMeshInfo()
                        console.log(orimeshdata);
                        setorimeshdatas(orimeshdata.meshes)
                        const octreedata = await collectOctreeInfo(convertedBoundingBox)
                        console.log(octreedata);
                        setoctreedatas(octreedata)
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
            {/* <Loadindexdb
                scene={currentScene}
                canvasRef={canvasRef}
            /> */}
            {/* <Loadindexdb></Loadindexdb> */}
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
            {/* <CameraControls
                scene={scene}
                canvas={canvasRef.current}
                updateLODVisibility={updateLODVisibility}
                maxDistance={maxDistance}
            /> */}
            {/* <div id='rightopt' style={{ right: '0px' }} >
                <i class="fa-solid fa-circle-info  button " title='Tag Info'  ></i>
                <i class="fa fa-search-plus button" title='Zoomin' ></i>
                <i class="fa fa-search-plus button" title='Download' onClick={downloadmesh}></i>
            </div> */}
            {octreedatas && orimeshdatas.length > 0 && (
                <Octreestorage
                    convertedModels={[
                        ...orimeshdatas.map(data => ({
                            fileName: data.name,
                            data: data
                        }))
                    ]}
                    octree={octreedatas}
                />
            )}
        </div>
    );
}
export default Fbxload;