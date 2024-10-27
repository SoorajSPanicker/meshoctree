
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

    async mergeBoundingBoxes(scene) {
        if (this.boundingBoxMeshes.length === 0) {
            console.log(`Node ${this.nodeId}: No bounding boxes to merge`);
            return;
        }

        try {
            // Filter valid meshes
            const validMeshes = this.boundingBoxMeshes.filter(mesh => 
                mesh && mesh.isVisible && !mesh.isDisposed() && 
                mesh.geometry && mesh.geometry.vertices.length > 0
            );

            if (validMeshes.length === 0) return;

            if (validMeshes.length === 1) {
                this.mergedMesh = validMeshes[0];
            } else {
                // Merge meshes
                this.mergedMesh = BABYLON.Mesh.MergeMeshes(
                    validMeshes.map(mesh => mesh.clone()),
                    true,
                    true,
                    undefined,
                    false,
                    true
                );
            }

            if (this.mergedMesh) {
                this.mergedMesh.name = `mergedBox_node_${this.nodeId}`;
                // Set material for merged mesh
                const material = new BABYLON.StandardMaterial(
                    `material_${this.mergedMesh.name}`,
                    scene
                );
                material.diffuseColor = new BABYLON.Color3(1, 0, 0)
                material.alpha = 0.3;
                this.mergedMesh.material = material;
            }

        } catch (error) {
            console.error(`Error merging boxes in node ${this.nodeId}:`, error);
        }
    }


    // async mergeBoundingBoxes(scene) {
    //     if (this.boundingBoxMeshes.length === 0) {
    //         console.log(`Node ${this.nodeId}: No bounding boxes to merge`);
    //         return;
    //     }
    //     console.log(`Node ${this.nodeId}: Starting merge process with ${this.boundingBoxMeshes.length} bounding boxes`);

    //     try {
    //         // Filter out null/undefined meshes and ensure they're visible
    //         const validMeshes = this.boundingBoxMeshes.filter(mesh => {
    //             if (!mesh) {
    //                 console.log('Found null/undefined mesh');
    //                 return false;
    //             }
    //             if (!mesh.isVisible) {
    //                 console.log(`Mesh ${mesh.name} is not visible`);
    //                 return false;
    //             }
    //             // Check if mesh is disposed
    //             if (mesh.isDisposed()) {
    //                 console.log(`Mesh ${mesh.name} is disposed`);
    //                 return false;
    //             }
    //             // Verify mesh has geometry
    //             if (!mesh.geometry || !mesh.geometry.vertices || mesh.geometry.vertices.length === 0) {
    //                 console.log(`Mesh ${mesh.name} has no valid geometry`);
    //                 return false;
    //             }
    //             return true;
    //         });

    //         console.log(`Valid meshes for merging: ${validMeshes.length}`);
    //         validMeshes.forEach(mesh => {
    //             console.log(`Mesh details - Name: ${mesh.name}, Visible: ${mesh.isVisible}, Vertices: ${mesh.geometry?.vertices?.length}`);
    //         });

    //         if (validMeshes.length === 0) {
    //             console.log(`Node ${this.nodeId}: No valid meshes to merge`);
    //             return;
    //         }

    //         if (validMeshes.length === 1) {
    //             console.log(`Node ${this.nodeId}: Only one valid mesh, using it directly`);
    //             this.mergedMesh = validMeshes[0];
    //             this.mergedMesh.name = `mergedBox_node_${this.nodeId}`;
    //         } else {
    //             console.log(`Node ${this.nodeId}: Attempting to merge ${validMeshes.length} meshes`);

    //             // Clone meshes before merging to prevent potential issues
    //             const meshesToMerge = validMeshes.map(mesh => mesh.clone(`clone_${mesh.name}`));

    //             // Ensure all meshes are in world space
    //             meshesToMerge.forEach(mesh => {
    //                 mesh.computeWorldMatrix(true);
    //                 mesh.position = mesh.getAbsolutePosition();
    //                 mesh.rotation = BABYLON.Vector3.Zero();
    //                 mesh.scaling = new BABYLON.Vector3(1, 1, 1);
    //             });

    //             this.mergedMesh = BABYLON.Mesh.MergeMeshes(
    //                 meshesToMerge,
    //                 true,    // dispose source meshes
    //                 true,    // allow different materials
    //                 undefined, // parent
    //                 false,   // don't optimize vertices
    //                 true     // use multi-materials
    //             );

    //             if (!this.mergedMesh) {
    //                 console.log(`Node ${this.nodeId}: Merge operation returned null`);
    //                 // Try alternative merge approach
    //                 this.mergedMesh = new BABYLON.Mesh(`mergedBox_node_${this.nodeId}`, scene);
    //                 const vertexData = new BABYLON.VertexData();
    //                 const positions = [];
    //                 const indices = [];
    //                 let currentIndex = 0;

    //                 meshesToMerge.forEach(mesh => {
    //                     const meshVertexData = BABYLON.VertexData.ExtractFromMesh(mesh);
    //                     if (meshVertexData && meshVertexData.positions) {
    //                         positions.push(...meshVertexData.positions);
    //                         const meshIndices = meshVertexData.indices.map(i => i + currentIndex);
    //                         indices.push(...meshIndices);
    //                         currentIndex += meshVertexData.positions.length / 3;
    //                     }
    //                 });

    //                 vertexData.positions = positions;
    //                 vertexData.indices = indices;
    //                 vertexData.applyToMesh(this.mergedMesh);
    //             }
    //         }

    //         if (this.mergedMesh) {
    //             this.mergedMesh.name = `mergedBox_node_${this.nodeId}`;
    //             const material = new BABYLON.StandardMaterial(`material_${this.mergedMesh.name}`, scene);
    //             material.diffuseColor = new BABYLON.Color3(0.678, 0.847, 0.902);
    //             material.alpha = 0.3;
    //             this.mergedMesh.material = material;
    //             console.log(`Node ${this.nodeId}: Successfully created merged mesh '${this.mergedMesh.name}'`);
    //             scene.addMesh(this.mergedMesh)
    //         } else {
    //             console.log(`Node ${this.nodeId}: Failed to create merged mesh`);
    //         }

    //     } catch (error) {
    //         console.error(`Node ${this.nodeId}: Error during merge process:`, error);
    //         // Log detailed error information
    //         if (error.stack) {
    //             console.log('Error stack:', error.stack);
    //         }
    //     }
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

    // async mergeBoundingBoxesInAllNodes(scene) {
    //     console.log("\n=== Starting Bounding Box Merge Process ===");
    //     await this.mergeBoundingBoxesInNode(this.root, scene);
    //     console.log("=== Completed Bounding Box Merge Process ===\n");
    // }
    // async mergeBoundingBoxesInNode(node, scene) {
    //     await node.mergeBoundingBoxes(scene);
    //     for (const child of node.children) {
    //         await this.mergeBoundingBoxesInNode(child, scene);
    //     }
    // }

    async mergeBoundingBoxesInAllNodes(scene) {
        console.log("\n=== Starting Bounding Box Merge Process ===");
        await this.mergeBoundingBoxesInNode(this.root, scene);
        console.log("=== Completed Bounding Box Merge Process ===\n");
    }

    async mergeBoundingBoxesInNode(node, scene) {
        // First merge boxes in current node
        if (node.boundingBoxMeshes.length > 0) {
            console.log(`Merging ${node.boundingBoxMeshes.length} boxes in node ${node.nodeId}`);
            await node.mergeBoundingBoxes(scene);
            if (node.mergedMesh) {
                node.mergedMesh.name = `mergedBox_node_${node.nodeId}`;
                console.log(`Created merged mesh for node ${node.nodeId}`);
            }
        }

        // Then process each child node independently
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
            lineSystem.color = new BABYLON.Color3(1, 0, 0)
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

// Camera positioning utility functions
export function positionCameraToFitBoundingBox(camera, boundingBox, scene) {
    if (!boundingBox || !boundingBox.min || !boundingBox.max) {
        console.warn('Invalid bounding box provided for camera positioning');
        return;
    }

    // Calculate bounding box center
    const center = {
        x: (boundingBox.max.x + boundingBox.min.x) / 2,
        y: (boundingBox.max.y + boundingBox.min.y) / 2,
        z: (boundingBox.max.z + boundingBox.min.z) / 2
    };

    // Calculate bounding box dimensions
    const dimensions = {
        x: Math.abs(boundingBox.max.x - boundingBox.min.x),
        y: Math.abs(boundingBox.max.y - boundingBox.min.y),
        z: Math.abs(boundingBox.max.z - boundingBox.min.z)
    };

    // Calculate the radius of the bounding sphere
    const radius = Math.sqrt(
        Math.pow(dimensions.x, 2) +
        Math.pow(dimensions.y, 2) +
        Math.pow(dimensions.z, 2)
    ) / 2;

    // Set camera target to bounding box center
    camera.setTarget(new BABYLON.Vector3(center.x, center.y, center.z));

    // Calculate camera distance based on field of view and bounding sphere
    const aspectRatio = scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
    const fov = camera.fov;
    const distance = (radius * 1.5) / Math.tan(fov / 2); // 1.5 is a margin factor

    // Position camera at an angled view
    const alpha = -Math.PI / 4; // -45 degrees
    const beta = Math.PI / 3;   // 60 degrees

    camera.setPosition(new BABYLON.Vector3(
        center.x + distance * Math.cos(beta) * Math.cos(alpha),
        center.y + distance * Math.sin(beta),
        center.z + distance * Math.cos(beta) * Math.sin(alpha)
    ));

    // Set camera limits
    camera.lowerRadiusLimit = radius * 0.5;  // Don't allow closer than half radius
    camera.upperRadiusLimit = distance * 2;   // Don't allow farther than twice the initial distance

    // Update camera's radius
    camera.radius = distance;
}