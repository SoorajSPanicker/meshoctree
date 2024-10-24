// import * as BABYLON from '@babylonjs/core';

// class OctreeNode {
//   constructor(center, size) {
//     this.center = center;
//     this.size = size;
//     this.children = [];
//   }
// }

// export class CustomOctree {
//   constructor(center, size, maxDepth) {
//     this.root = new OctreeNode(center, size);
//     this.maxDepth = maxDepth;
//   }

//   subdivide(node, depth) {
//     if (depth >= this.maxDepth) return;

//     const halfSize = node.size / 2;
//     for (let x = -1; x <= 1; x += 2) {
//       for (let y = -1; y <= 1; y += 2) {
//         for (let z = -1; z <= 1; z += 2) {
//           const childCenter = new BABYLON.Vector3(
//             node.center.x + x * halfSize / 2,
//             node.center.y + y * halfSize / 2,
//             node.center.z + z * halfSize / 2
//           );
//           const child = new OctreeNode(childCenter, halfSize);
//           node.children.push(child);
//           this.subdivide(child, depth + 1);
//         }
//       }
//     }
//   }

//   create() {
//     this.subdivide(this.root, 0);
//   }
// }

// export function createCustomOctree(scene, size, center, maxDepth = 1) {
//   console.log("Creating custom octree with size:", size, "and center:", center);

//   const octree = new CustomOctree(
//     new BABYLON.Vector3(center.x, center.y, center.z),
//     Math.max(size.x, size.y, size.z),
//     maxDepth
//   );
//   octree.create();

//   console.log("Custom octree created successfully");
//   return octree;
// }

// export function visualizeCustomOctree(scene, octree) {
//   const lines = [];

//   function createEdgesForNode(node) {
//     const halfSize = node.size / 2;
//     const corners = [
//       new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z - halfSize),
//       new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z - halfSize),
//       new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z - halfSize),
//       new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z - halfSize),
//       new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z + halfSize),
//       new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z + halfSize),
//       new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z + halfSize),
//       new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z + halfSize)
//     ];

//     // Create edges
//     for (let i = 0; i < 4; i++) {
//       lines.push([corners[i], corners[(i + 1) % 4]]);
//       lines.push([corners[i + 4], corners[((i + 1) % 4) + 4]]);
//       lines.push([corners[i], corners[i + 4]]);
//     }

//     // Recursively create edges for child nodes
//     for (let child of node.children) {
//       createEdgesForNode(child);
//     }
//   }

//   createEdgesForNode(octree.root);

//   const lineSystem = BABYLON.MeshBuilder.CreateLineSystem("octreeLines", { lines: lines }, scene);
//   lineSystem.color = new BABYLON.Color3(0, 1, 0); // Green color for better visibility

//   console.log("Custom octree visualized with edge lines");
// }

// export function initializeScene(canvas) {
//     const engine = new BABYLON.Engine(canvas, true);
//     const scene = new BABYLON.Scene(engine);

//     // Add a camera
//     const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
//     camera.attachControl(canvas, true);

//     // Add a light
//     const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

//     engine.runRenderLoop(() => {
//       scene.render();
//     });

//     window.addEventListener('resize', () => {
//       engine.resize();
//     });

//     return { scene, engine };
//   }






// import * as BABYLON from '@babylonjs/core';

// class OctreeNode {
//     constructor(center, size, nodeId) {
//         this.center = center;
//         this.size = size;
//         this.children = [];
//         this.objects = [];
//         this.nodeId = nodeId;
//         this.mergedMesh = null;
//     }

//     // Check if an object fits within this node
//     containsObject(mesh) {
//         const boundingBox = mesh.getBoundingInfo().boundingBox;
//         const halfSize = this.size / 2;
//         const min = this.center.subtract(new BABYLON.Vector3(halfSize, halfSize, halfSize));
//         const max = this.center.add(new BABYLON.Vector3(halfSize, halfSize, halfSize));

//         return (boundingBox.minimumWorld.x >= min.x && boundingBox.maximumWorld.x <= max.x &&
//                 boundingBox.minimumWorld.y >= min.y && boundingBox.maximumWorld.y <= max.y &&
//                 boundingBox.minimumWorld.z >= min.z && boundingBox.maximumWorld.z <= max.z);
//     }

//     mergeBoundingBoxes(scene) {
//         // Only merge if there are bounding boxes to merge
//         const boundingBoxMeshes = this.objects.filter(obj => obj.name.startsWith('boundingBox_'));

//         if (boundingBoxMeshes.length > 0) {
//             console.log(`Merging ${boundingBoxMeshes.length} bounding boxes in node ${this.nodeId}`);

//             // Create merged mesh using CSG
//             let mergedMesh = boundingBoxMeshes[0].clone(`merged_${this.nodeId}`);
//             let csg = BABYLON.CSG.FromMesh(mergedMesh);

//             for (let i = 1; i < boundingBoxMeshes.length; i++) {
//                 const nextCSG = BABYLON.CSG.FromMesh(boundingBoxMeshes[i]);
//                 csg = csg.union(nextCSG);
//             }

//             // Convert back to mesh
//             this.mergedMesh = csg.toMesh(`merged_node_${this.nodeId}`, null, scene);
//             this.mergedMesh.material = new BABYLON.StandardMaterial(`mat_${this.nodeId}`, scene);
//             this.mergedMesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
//             this.mergedMesh.material.alpha = 0.3;

//             // Hide original bounding boxes
//             boundingBoxMeshes.forEach(mesh => {
//                 mesh.isVisible = false;
//             });

//             console.log(`Created merged mesh for node ${this.nodeId}`);
//         }
//     }
// }

// export class CustomOctree {
//     constructor(center, size, maxDepth) {
//         this.nodeCounter = 0;  // To generate unique node IDs
//         this.root = new OctreeNode(center, size, this.generateNodeId());
//         this.maxDepth = maxDepth;
//     }

//     generateNodeId() {
//         return `node_${this.nodeCounter++}`;
//     }

//     insertMesh(node, mesh, depth) {
//         if (depth >= this.maxDepth) {
//             node.objects.push(mesh);
//             return;
//         }

//         // If this is the first object at this node, subdivide
//         if (node.children.length === 0) {
//             this.subdivide(node, depth);
//         }

//         // Try to insert into children
//         let inserted = false;
//         for (const child of node.children) {
//             if (child.containsObject(mesh)) {
//                 this.insertMesh(child, mesh, depth + 1);
//                 inserted = true;
//                 break;
//             }
//         }

//         // If it doesn't fit in any child, store it at this level
//         if (!inserted) {
//             node.objects.push(mesh);
//         }
//     }

//     subdivide(node, depth) {
//         if (depth >= this.maxDepth) return;

//         const halfSize = node.size / 2;
//         for (let x = -1; x <= 1; x += 2) {
//             for (let y = -1; y <= 1; y += 2) {
//                 for (let z = -1; z <= 1; z += 2) {
//                     const childCenter = new BABYLON.Vector3(
//                         node.center.x + x * halfSize / 2,
//                         node.center.y + y * halfSize / 2,
//                         node.center.z + z * halfSize / 2
//                     );
//                     const child = new OctreeNode(childCenter, halfSize, this.generateNodeId());
//                     node.children.push(child);
//                 }
//             }
//         }
//     }

//     mergeBoundingBoxesInAllNodes(scene) {
//         console.log("Starting to merge bounding boxes in all nodes");
//         this.mergeNodeBoxes(this.root, scene);
//     }

//     mergeNodeBoxes(node, scene) {
//         // Merge boxes in current node
//         node.mergeBoundingBoxes(scene);

//         // Recursively merge boxes in child nodes
//         for (const child of node.children) {
//             this.mergeNodeBoxes(child, scene);
//         }
//     }


//     // Add method to display octree contents
//     printOctreeContents() {
//         console.log("=== Octree Contents ===");
//         this.printNode(this.root, 0);
//     }

//     printNode(node, depth) {
//         const indent = "  ".repeat(depth);
//         console.log(`${indent}Node ${node.nodeId} at depth ${depth}:`);
//         console.log(`${indent}Center: (${node.center.x.toFixed(2)}, ${node.center.y.toFixed(2)}, ${node.center.z.toFixed(2)})`);
//         console.log(`${indent}Size: ${node.size.toFixed(2)}`);
//         console.log(`${indent}Objects: ${node.objects.length}`);
//         console.log(`${indent}Has merged mesh: ${node.mergedMesh !== null}`);

//         if (node.mergedMesh) {
//             console.log(`${indent}Merged mesh name: ${node.mergedMesh.name}`);
//         }

//         node.objects.forEach((obj, index) => {
//             console.log(`${indent}  Object ${index}: ${obj.name}`);
//         });

//         if (node.children.length > 0) {
//             node.children.forEach((child, index) => {
//                 this.printNode(child, depth + 1);
//             });
//         }
//     }

//     // visualizeCustomOctree(scene, octree) {
//     //     const lines = [];

//     //     function createEdgesForNode(node) {
//     //         const halfSize = node.size / 2;
//     //         const corners = [
//     //             new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z - halfSize),
//     //             new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z - halfSize),
//     //             new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z - halfSize),
//     //             new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z - halfSize),
//     //             new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z + halfSize),
//     //             new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z + halfSize),
//     //             new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z + halfSize),
//     //             new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z + halfSize)
//     //         ];

//     //         // Create edges
//     //         for (let i = 0; i < 4; i++) {
//     //             lines.push([corners[i], corners[(i + 1) % 4]]);
//     //             lines.push([corners[i + 4], corners[((i + 1) % 4) + 4]]);
//     //             lines.push([corners[i], corners[i + 4]]);
//     //         }

//     //         // Recursively create edges for child nodes
//     //         for (let child of node.children) {
//     //             createEdgesForNode(child);
//     //         }
//     //     }

//         // createEdgesForNode(octree.root);
//         // const lineSystem = BABYLON.MeshBuilder.CreateLineSystem(
//         //     `octreeLines_${octree.root.nodeId}`, 
//         //     { lines: lines }, 
//         //     scene
//         // );
//         // lineSystem.color = new BABYLON.Color3(0, 1, 0);
//     // }
// }

// export function createCustomOctree(scene, size, center, maxDepth = 3) {
//     console.log("Creating custom octree with size:", size, "and center:", center);

//     const octree = new CustomOctree(
//         new BABYLON.Vector3(center.x, center.y, center.z),
//         Math.max(size.x, size.y, size.z),
//         maxDepth
//     );

//     return octree;
// }

// // export function visualizeCustomOctree(scene, octree) {
// //     const lines = [];

// //     function createEdgesForNode(node) {
// //         const halfSize = node.size / 2;
// //         const corners = [
// //             new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z - halfSize),
// //             new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z - halfSize),
// //             new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z - halfSize),
// //             new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z - halfSize),
// //             new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z + halfSize),
// //             new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z + halfSize),
// //             new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z + halfSize),
// //             new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z + halfSize)
// //         ];

// //         // Create edges
// //         for (let i = 0; i < 4; i++) {
// //             lines.push([corners[i], corners[(i + 1) % 4]]);
// //             lines.push([corners[i + 4], corners[((i + 1) % 4) + 4]]);
// //             lines.push([corners[i], corners[i + 4]]);
// //         }

// //         // Recursively create edges for child nodes
// //         for (let child of node.children) {
// //             createEdgesForNode(child);
// //         }
// //     }

// //     // createEdgesForNode(octree.root);
// //     // const lineSystem = BABYLON.MeshBuilder.CreateLineSystem(
// //     //     `octreeLines_${octree.root.nodeId}`, 
// //     //     { lines: lines }, 
// //     //     scene
// //     // );
// //     // lineSystem.color = new BABYLON.Color3(0, 1, 0);

// //     createEdgesForNode(octree.root);
// //     const lineSystem = BABYLON.MeshBuilder.CreateLineSystem("octreeLines", { lines: lines }, scene);
// //     lineSystem.color = new BABYLON.Color3(0, 1, 0);
// // }

// export function visualizeCustomOctree(scene, octree) {
//     const lines = [];

//     function createEdgesForNode(node) {
//         const halfSize = node.size / 2;
//         const corners = [
//             new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z - halfSize),
//             new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z - halfSize),
//             new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z - halfSize),
//             new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z - halfSize),
//             new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z + halfSize),
//             new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z + halfSize),
//             new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z + halfSize),
//             new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z + halfSize)
//         ];

//         // Create edges
//         for (let i = 0; i < 4; i++) {
//             lines.push([corners[i], corners[(i + 1) % 4]]);
//             lines.push([corners[i + 4], corners[((i + 1) % 4) + 4]]);
//             lines.push([corners[i], corners[i + 4]]);
//         }

//         // Recursively create edges for child nodes
//         for (let child of node.children) {
//             createEdgesForNode(child);
//         }
//     }

//     createEdgesForNode(octree.root);
//     const lineSystem = BABYLON.MeshBuilder.CreateLineSystem("octreeLines", { lines: lines }, scene);
//     lineSystem.color = new BABYLON.Color3(0, 1, 0);
// }

// export function initializeScene(canvas) {
//     const engine = new BABYLON.Engine(canvas, true);
//     const scene = new BABYLON.Scene(engine);

//     const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
//     camera.attachControl(canvas, true);

//     const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

//     engine.runRenderLoop(() => {
//         scene.render();
//     });

//     window.addEventListener('resize', () => {
//         engine.resize();
//     });

//     return { scene, engine };
// }


import * as BABYLON from '@babylonjs/core';

class OctreeNode {
    constructor(center, size, nodeId) {
        this.center = center;
        this.size = size;
        this.children = [];
        this.objects = [];
        this.boundingBoxMeshes = [];
        this.nodeId = nodeId;
        this.mergedMesh = null;
    }
    // Check if an object fits within this node
    containsObject(mesh) {
        if (!mesh || !mesh.getBoundingInfo) {
            console.warn(`Invalid mesh passed to containsObject:`, mesh);
            return false;
        }

        const boundingBox = mesh.getBoundingInfo().boundingBox;
        const halfSize = this.size / 2;
        const min = this.center.subtract(new BABYLON.Vector3(halfSize, halfSize, halfSize));
        const max = this.center.add(new BABYLON.Vector3(halfSize, halfSize, halfSize));

        const fits = (
            boundingBox.minimumWorld.x >= min.x && boundingBox.maximumWorld.x <= max.x &&
            boundingBox.minimumWorld.y >= min.y && boundingBox.maximumWorld.y <= max.y &&
            boundingBox.minimumWorld.z >= min.z && boundingBox.maximumWorld.z <= max.z
        );

        console.log(`Checking if mesh ${mesh.name} fits in node ${this.nodeId}:`, fits);
        return fits;
    }
    shouldSubdivide(mesh) {
        if (!mesh || !mesh.getBoundingInfo) {
            console.warn(`Invalid mesh passed to shouldSubdivide:`, mesh);
            return false;
        }

        try {
            const boundingBox = mesh.getBoundingInfo().boundingBox;
            const meshSize = {
                x: boundingBox.maximumWorld.x - boundingBox.minimumWorld.x,
                y: boundingBox.maximumWorld.y - boundingBox.minimumWorld.y,
                z: boundingBox.maximumWorld.z - boundingBox.minimumWorld.z
            };

            // Only subdivide if mesh is smaller than half the node size
            const shouldSubdivide = (
                meshSize.x < this.size / 2 ||
                meshSize.y < this.size / 2 ||
                meshSize.z < this.size / 2
            );

            console.log(`Checking subdivision for mesh ${mesh.name} in node ${this.nodeId}:`, {
                meshSize,
                nodeSize: this.size,
                shouldSubdivide
            });

            return shouldSubdivide;
        } catch (error) {
            console.error(`Error in shouldSubdivide for mesh ${mesh?.name}:`, error);
            return false;
        }
    }

    // async mergeBoundingBoxes(scene) {
    //     if (this.boundingBoxMeshes.length === 0) {
    //         console.log(`Node ${this.nodeId}: No bounding boxes to merge`);
    //         return;
    //     }
    
    //     // Initial state logging
    //     console.log(`=== MERGE OPERATION START ===`);
    //     console.log(`Node ${this.nodeId}: Starting merge process with ${this.boundingBoxMeshes.length} bounding boxes`);
        
    //     // Track initial state
    //     const initialState = {
    //         totalMeshes: scene.meshes.length,
    //         meshesToMerge: this.boundingBoxMeshes.length,
    //         totalVertices: 0,
    //         totalIndices: 0,
    //         meshDetails: []
    //     };
    
    //     try {
    //         // Filter and validate meshes
    //         const validMeshes = this.boundingBoxMeshes.filter(mesh => {
    //             if (!mesh || !mesh.isVisible || mesh.isDisposed()) return false;
    //             if (!mesh.geometry || !mesh.geometry.vertices || mesh.geometry.vertices.length === 0) return false;
                
    //             // Collect details for each valid mesh
    //             initialState.totalVertices += mesh.geometry.getTotalVertices();
    //             initialState.totalIndices += mesh.geometry.getTotalIndices();
    //             initialState.meshDetails.push({
    //                 name: mesh.name,
    //                 vertices: mesh.geometry.getTotalVertices(),
    //                 indices: mesh.geometry.getTotalIndices(),
    //                 position: mesh.position.asArray(),
    //                 boundingBox: mesh.getBoundingInfo().boundingBox
    //             });
                
    //             return true;
    //         });
    
    //         console.log('Initial State:', initialState);
    //         console.log(`Valid meshes for merging: ${validMeshes.length}`);
    
    //         if (validMeshes.length === 0) {
    //             console.log(`Node ${this.nodeId}: No valid meshes to merge`);
    //             return;
    //         }
    
    //         if (validMeshes.length === 1) {
    //             console.log(`Node ${this.nodeId}: Only one valid mesh, using it directly`);
    //             this.mergedMesh = validMeshes[0];
    //             this.mergedMesh.name = `mergedBox_node_${this.nodeId}`;
    //         } else {
    //             console.log(`Attempting to merge ${validMeshes.length} meshes...`);
                
    //             // Store positions before merge
    //             const originalPositions = validMeshes.map(mesh => ({
    //                 name: mesh.name,
    //                 position: mesh.position.clone(),
    //                 bounds: mesh.getBoundingInfo().boundingBox.clone()
    //             }));
    
    //             this.mergedMesh = BABYLON.Mesh.MergeMeshes(
    //                 validMeshes,
    //                 true,    // dispose source meshes
    //                 true,    // allow different materials
    //                 undefined, // parent
    //                 false,   // don't optimize vertices
    //                 true     // use multi-materials
    //             );
    
    //             // Verify merge result
    //             const mergeVerification = {
    //                 success: false,
    //                 details: {}
    //             };
    
    //             if (this.mergedMesh) {
    //                 mergeVerification.success = true;
    //                 mergeVerification.details = {
    //                     name: this.mergedMesh.name,
    //                     totalVertices: this.mergedMesh.geometry.getTotalVertices(),
    //                     totalIndices: this.mergedMesh.geometry.getTotalIndices(),
    //                     position: this.mergedMesh.position.asArray(),
    //                     boundingBox: this.mergedMesh.getBoundingInfo().boundingBox,
    //                     materialAssigned: !!this.mergedMesh.material,
    //                     isVisible: this.mergedMesh.isVisible,
    //                     isEnabled: this.mergedMesh.isEnabled()
    //                 };
    
    //                 // Apply material
    //                 const material = new BABYLON.StandardMaterial(`material_${this.mergedMesh.name}`, scene);
    //                 material.diffuseColor = new BABYLON.Color3(0.678, 0.847, 0.902);
    //                 material.alpha = 0.3;
    //                 this.mergedMesh.material = material;
    
    //                 // Verification checks
    //                 const verificationResults = {
    //                     verticesMatch: Math.abs(initialState.totalVertices - mergeVerification.details.totalVertices) < 1,
    //                     indicesMatch: Math.abs(initialState.totalIndices - mergeVerification.details.totalIndices) < 1,
    //                     boundingBoxValid: this.verifyBoundingBox(originalPositions, this.mergedMesh),
    //                     materialApplied: !!this.mergedMesh.material,
    //                     meshVisible: this.mergedMesh.isVisible,
    //                     meshEnabled: this.mergedMesh.isEnabled()
    //                 };
    
    //                 console.log('=== MERGE VERIFICATION RESULTS ===');
    //                 console.log('Original State:', {
    //                     totalVertices: initialState.totalVertices,
    //                     totalIndices: initialState.totalIndices
    //                 });
    //                 console.log('Merged Mesh State:', {
    //                     totalVertices: mergeVerification.details.totalVertices,
    //                     totalIndices: mergeVerification.details.totalIndices
    //                 });
    //                 console.log('Verification Results:', verificationResults);
                    
    //                 // Check if all verifications passed
    //                 const allChecksPass = Object.values(verificationResults).every(result => result === true);
    //                 console.log(`Merge ${allChecksPass ? 'SUCCESSFUL' : 'FAILED'} - All checks pass: ${allChecksPass}`);
                    
    //                 if (allChecksPass) {
    //                     console.log(`Node ${this.nodeId}: Successfully created and verified merged mesh '${this.mergedMesh.name}'`);
    //                 } else {
    //                     console.warn(`Node ${this.nodeId}: Merge completed but some verifications failed`);
    //                 }
    //             } else {
    //                 console.error(`Node ${this.nodeId}: Merge operation failed - no mesh produced`);
    //             }
    //         }
    
    //     } catch (error) {
    //         console.error(`Node ${this.nodeId}: Error during merge process:`, error);
    //     }
    
    //     console.log(`=== MERGE OPERATION END ===`);
    // }
    
    // // Helper method to verify bounding box
    // verifyBoundingBox(originalPositions, mergedMesh) {
    //     if (!mergedMesh || !mergedMesh.getBoundingInfo()) return false;
        
    //     const mergedBounds = mergedMesh.getBoundingInfo().boundingBox;
    //     let isValid = true;
        
    //     // Check if merged bounding box contains all original positions
    //     originalPositions.forEach(original => {
    //         const point = new BABYLON.Vector3(
    //             original.bounds.centerWorld.x,
    //             original.bounds.centerWorld.y,
    //             original.bounds.centerWorld.z
    //         );
    //         if (!mergedBounds.intersectsPoint(point)) {
    //             console.warn(`Bounding box verification failed for original mesh: ${original.name}`);
    //             isValid = false;
    //         }
    //     });
        
    //     return isValid;
    // }

    async mergeBoundingBoxes(scene) {
        if (this.boundingBoxMeshes.length === 0) {
            console.log(`Node ${this.nodeId}: No bounding boxes to merge`);
            return;
        }
        console.log(`Node ${this.nodeId}: Starting merge process with ${this.boundingBoxMeshes.length} bounding boxes`);
        
        try {
            // Filter out null/undefined meshes and ensure they're visible
            const validMeshes = this.boundingBoxMeshes.filter(mesh => {
                if (!mesh) {
                    console.log('Found null/undefined mesh');
                    return false;
                }
                if (!mesh.isVisible) {
                    console.log(`Mesh ${mesh.name} is not visible`);
                    return false;
                }
                // Check if mesh is disposed
                if (mesh.isDisposed()) {
                    console.log(`Mesh ${mesh.name} is disposed`);
                    return false;
                }
                // Verify mesh has geometry
                if (!mesh.geometry || !mesh.geometry.vertices || mesh.geometry.vertices.length === 0) {
                    console.log(`Mesh ${mesh.name} has no valid geometry`);
                    return false;
                }
                return true;
            });
    
            console.log(`Valid meshes for merging: ${validMeshes.length}`);
            validMeshes.forEach(mesh => {
                console.log(`Mesh details - Name: ${mesh.name}, Visible: ${mesh.isVisible}, Vertices: ${mesh.geometry?.vertices?.length}`);
            });
    
            if (validMeshes.length === 0) {
                console.log(`Node ${this.nodeId}: No valid meshes to merge`);
                return;
            }
    
            if (validMeshes.length === 1) {
                console.log(`Node ${this.nodeId}: Only one valid mesh, using it directly`);
                this.mergedMesh = validMeshes[0];
                this.mergedMesh.name = `mergedBox_node_${this.nodeId}`;
            } else {
                console.log(`Node ${this.nodeId}: Attempting to merge ${validMeshes.length} meshes`);
                
                // Clone meshes before merging to prevent potential issues
                const meshesToMerge = validMeshes.map(mesh => mesh.clone(`clone_${mesh.name}`));
                
                // Ensure all meshes are in world space
                meshesToMerge.forEach(mesh => {
                    mesh.computeWorldMatrix(true);
                    mesh.position = mesh.getAbsolutePosition();
                    mesh.rotation = BABYLON.Vector3.Zero();
                    mesh.scaling = new BABYLON.Vector3(1, 1, 1);
                });
    
                this.mergedMesh = BABYLON.Mesh.MergeMeshes(
                    meshesToMerge,
                    true,    // dispose source meshes
                    true,    // allow different materials
                    undefined, // parent
                    false,   // don't optimize vertices
                    true     // use multi-materials
                );
    
                if (!this.mergedMesh) {
                    console.log(`Node ${this.nodeId}: Merge operation returned null`);
                    // Try alternative merge approach
                    this.mergedMesh = new BABYLON.Mesh(`mergedBox_node_${this.nodeId}`, scene);
                    const vertexData = new BABYLON.VertexData();
                    const positions = [];
                    const indices = [];
                    let currentIndex = 0;
    
                    meshesToMerge.forEach(mesh => {
                        const meshVertexData = BABYLON.VertexData.ExtractFromMesh(mesh);
                        if (meshVertexData && meshVertexData.positions) {
                            positions.push(...meshVertexData.positions);
                            const meshIndices = meshVertexData.indices.map(i => i + currentIndex);
                            indices.push(...meshIndices);
                            currentIndex += meshVertexData.positions.length / 3;
                        }
                    });
    
                    vertexData.positions = positions;
                    vertexData.indices = indices;
                    vertexData.applyToMesh(this.mergedMesh);
                }
            }
    
            if (this.mergedMesh) {
                this.mergedMesh.name = `mergedBox_node_${this.nodeId}`;
                const material = new BABYLON.StandardMaterial(`material_${this.mergedMesh.name}`, scene);
                material.diffuseColor = new BABYLON.Color3(0.678, 0.847, 0.902);
                material.alpha = 0.3;
                this.mergedMesh.material = material;
                console.log(`Node ${this.nodeId}: Successfully created merged mesh '${this.mergedMesh.name}'`);
                scene.addMesh(this.mergedMesh)
            } else {
                console.log(`Node ${this.nodeId}: Failed to create merged mesh`);
            }
    
        } catch (error) {
            console.error(`Node ${this.nodeId}: Error during merge process:`, error);
            // Log detailed error information
            if (error.stack) {
                console.log('Error stack:', error.stack);
            }
        }
    }


    // async mergeBoundingBoxes(scene) {
    //     if (this.boundingBoxMeshes.length === 0) {
    //         console.log(`Node ${this.nodeId}: No bounding boxes to merge`);
    //         return;
    //     }

    //     console.log(`Node ${this.nodeId}: Merging ${this.boundingBoxMeshes.length} bounding boxes`);
    //     // console.log(`${this.boundingBoxMeshes}`);
        

    //     // try {
    //         // Filter out any null or undefined meshes
    //         const validMeshes = this.boundingBoxMeshes.filter(mesh => mesh != null);
    //         console.log(validMeshes);
            
    //         if (validMeshes.length === 0) {
    //             console.log(`Node ${this.nodeId}: No valid meshes to merge`);
    //             return;
    //         }

    //         if (validMeshes.length === 1) {
    //             // If only one mesh, just use it directly
    //             this.mergedMesh = validMeshes[0];
    //             this.mergedMesh.name = `mergedBox_node_${this.nodeId}`;
    //         } else {
    //             console.log('line number 517',validMeshes);
                
    //             // Merge multiple meshes
    //             this.mergedMesh = BABYLON.Mesh.MergeMeshes(
    //                 validMeshes,
    //                 true,
    //                 true,
    //                 undefined,
    //                 false,
    //                 true
    //             );
    //             console.log('line number 528',this.mergedMesh);
                
    //         }

    //         if (this.mergedMesh) {
    //             this.mergedMesh.name = `mergedBox_node_${this.nodeId}`;
    //             const material = new BABYLON.StandardMaterial(`material_${this.mergedMesh.name}`, scene);
    //             material.diffuseColor = new BABYLON.Color3(0.678, 0.847, 0.902);
    //             material.alpha = 0.3;
    //             this.mergedMesh.material = material;

    //             console.log(`Node ${this.nodeId}: Successfully created merged mesh '${this.mergedMesh.name}'`);
    //         }
    //         else{
    //             console.log(`Node ${this.nodeId}: Error merging bounding boxes:`);
                
    //         }
    //     // } catch (error) {
    //     //     console.error(`Node ${this.nodeId}: Error merging bounding boxes:`, error);
    //     // }
    // }
}

export class CustomOctree {
    constructor(center, size, maxDepth) {
        this.nodeCounter = 0;
        this.root = new OctreeNode(center, size, this.getNextNodeId());
        this.maxDepth = maxDepth;
    }

    getNextNodeId() {
        return `node_${++this.nodeCounter}`;
    }
    insertMesh(node, mesh, boundingBoxMesh, depth) {
        if (!mesh) {
            console.warn('Attempted to insert null or undefined mesh');
            return;
        }

        console.log(`\nAttempting to insert mesh ${mesh.name} at depth ${depth} in node ${node.nodeId}`);
        
        if (boundingBoxMesh) {
            node.boundingBoxMeshes.push(boundingBoxMesh);
            console.log(`Added bounding box mesh to node ${node.nodeId}`);
        }

        if (depth >= this.maxDepth) {
            node.objects.push(mesh);
            console.log(`Max depth ${this.maxDepth} reached. Storing mesh in node ${node.nodeId}`);
            return;
        }

        try {
            if (node.children.length === 0 && node.shouldSubdivide(mesh)) {
                this.subdivide(node, depth);
                console.log(`Node ${node.nodeId} subdivided at depth ${depth}`);
            }

            let inserted = false;
            if (node.children.length > 0) {
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    if (child.containsObject(mesh)) {
                        console.log(`Mesh ${mesh.name} fits in child node ${child.nodeId}`);
                        this.insertMesh(child, mesh, boundingBoxMesh, depth + 1);
                        inserted = true;
                        break;
                    }
                }
            }

            if (!inserted) {
                node.objects.push(mesh);
                console.log(`Mesh ${mesh.name} stored in node ${node.nodeId} at depth ${depth}`);
            }
        } catch (error) {
            console.error(`Error inserting mesh ${mesh.name}:`, error);
            // Store in current node if error occurs
            node.objects.push(mesh);
        }
    }

    subdivide(node, depth) {
        if (depth >= this.maxDepth) return;

        const halfSize = node.size / 2;
        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    const childCenter = new BABYLON.Vector3(
                        node.center.x + x * halfSize / 2,
                        node.center.y + y * halfSize / 2,
                        node.center.z + z * halfSize / 2
                    );
                    const child = new OctreeNode(childCenter, halfSize, this.getNextNodeId());
                    node.children.push(child);
                }
            }
        }
    }
      // Add method to display octree contents
      printOctreeContents() {
        console.log("=== Octree Contents ===");
        this.printNode(this.root, 0);
    }
    printNode(node, depth) {
        const indent = "  ".repeat(depth);
        console.log(`${indent}Node at depth ${depth}:`);
        console.log(`${indent}Center: (${node.center.x}, ${node.center.y}, ${node.center.z})`);
        console.log(`${indent}Size: ${node.size}`);
        console.log(`${indent}Objects: ${node.objects.length}`);

        node.objects.forEach((obj, index) => {
            console.log(`${indent}  Object ${index}: ${obj.name}`);
        });

        node.children.forEach((child, index) => {
            console.log(`${indent}Child ${index}:`);
            this.printNode(child, depth + 1);
        });
    }

    async mergeBoundingBoxesInAllNodes(scene) {
        console.log("\n=== Starting Bounding Box Merge Process ===");
        await this.mergeBoundingBoxesInNode(this.root, scene);
        console.log("=== Completed Bounding Box Merge Process ===\n");
    }
    async mergeBoundingBoxesInNode(node, scene) {
        await node.mergeBoundingBoxes(scene);
        for (const child of node.children) {
            await this.mergeBoundingBoxesInNode(child, scene);
        }
    }
    printMergedMeshDetails() {
        console.log("\n=== Merged Mesh Details ===");
        this.printNodeMergedMeshDetails(this.root, 0);
    }

    printNodeMergedMeshDetails(node, depth) {
        const indent = "  ".repeat(depth);
        console.log(`${indent}Node ${node.nodeId} at depth ${depth}:`);
        
        if (node.mergedMesh) {
            const boundingInfo = node.mergedMesh.getBoundingInfo();
            console.log(`${indent}  Merged Mesh: ${node.mergedMesh.name}`);
            console.log(`${indent}  Bounds:`, {
                min: {
                    x: boundingInfo.boundingBox.minimumWorld.x.toFixed(2),
                    y: boundingInfo.boundingBox.minimumWorld.y.toFixed(2),
                    z: boundingInfo.boundingBox.minimumWorld.z.toFixed(2)
                },
                max: {
                    x: boundingInfo.boundingBox.maximumWorld.x.toFixed(2),
                    y: boundingInfo.boundingBox.maximumWorld.y.toFixed(2),
                    z: boundingInfo.boundingBox.maximumWorld.z.toFixed(2)
                }
            });
            console.log(`${indent}  Original boxes merged: ${node.boundingBoxMeshes.length}`);
        } else {
            console.log(`${indent}  No merged mesh`);
        }

        for (const child of node.children) {
            this.printNodeMergedMeshDetails(child, depth + 1);
        }
    }
   
}
export function createCustomOctree(scene, size, center, maxDepth = 3) {
    console.log("Creating custom octree with size:", size, "and center:", center);
    const octree = new CustomOctree(
        new BABYLON.Vector3(center.x, center.y, center.z),
        Math.max(size.x, size.y, size.z),
        maxDepth
    );
    
    return octree;
}

export function visualizeCustomOctree(scene, octree) {
    if (!scene || !octree || !octree.root) {
        console.warn('Invalid scene or octree for visualization');
        return;
    }

    const lines = [];

    function createEdgesForNode(node) {
        if (!node || !node.center || typeof node.size !== 'number') {
            console.warn('Invalid node for edge creation');
            return;
        }

        try {
            const halfSize = node.size / 2;
            const corners = [
                new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z - halfSize),
                new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z - halfSize),
                new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z - halfSize),
                new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z - halfSize),
                new BABYLON.Vector3(node.center.x - halfSize, node.center.y - halfSize, node.center.z + halfSize),
                new BABYLON.Vector3(node.center.x + halfSize, node.center.y - halfSize, node.center.z + halfSize),
                new BABYLON.Vector3(node.center.x + halfSize, node.center.y + halfSize, node.center.z + halfSize),
                new BABYLON.Vector3(node.center.x - halfSize, node.center.y + halfSize, node.center.z + halfSize)
            ];

            // Create edges
            for (let i = 0; i < 4; i++) {
                lines.push([corners[i], corners[(i + 1) % 4]]);
                lines.push([corners[i + 4], corners[((i + 1) % 4) + 4]]);
                lines.push([corners[i], corners[i + 4]]);
            }

            // Recursively create edges for valid child nodes
            if (Array.isArray(node.children)) {
                node.children.forEach(child => {
                    if (child) {
                        createEdgesForNode(child);
                    }
                });
            }
        } catch (error) {
            console.error('Error creating edges for node:', error);
        }
    }

    try {
        createEdgesForNode(octree.root);

        if (lines.length > 0) {
            const lineSystem = BABYLON.MeshBuilder.CreateLineSystem(
                "octreeLines",
                { lines: lines },
                scene
            );
            lineSystem.color = new BABYLON.Color3(0, 1, 0);
            console.log("Created octree visualization with", lines.length, "lines");
        } else {
            console.warn("No lines generated for octree visualization");
        }
    } catch (error) {
        console.error("Error in octree visualization:", error);
    }
}

export function initializeScene(canvas) {
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener('resize', () => {
        engine.resize();
    });

    return { scene, engine };
}