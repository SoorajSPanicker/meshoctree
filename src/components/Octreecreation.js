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

import * as BABYLON from '@babylonjs/core';

class OctreeNode {
    constructor(center, size) {
        this.center = center;
        this.size = size;
        this.children = [];
        this.objects = []; // Store meshes
    }

    // Check if an object fits within this node
    containsObject(mesh) {
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        const halfSize = this.size / 2;
        const min = this.center.subtract(new BABYLON.Vector3(halfSize, halfSize, halfSize));
        const max = this.center.add(new BABYLON.Vector3(halfSize, halfSize, halfSize));

        return (boundingBox.minimumWorld.x >= min.x && boundingBox.maximumWorld.x <= max.x &&
                boundingBox.minimumWorld.y >= min.y && boundingBox.maximumWorld.y <= max.y &&
                boundingBox.minimumWorld.z >= min.z && boundingBox.maximumWorld.z <= max.z);
    }
}

export class CustomOctree {
    constructor(center, size, maxDepth) {
        this.root = new OctreeNode(center, size);
        this.maxDepth = maxDepth;
    }

    insertMesh(node, mesh, depth) {
        if (depth >= this.maxDepth) {
            node.objects.push(mesh);
            return;
        }

        // If this is the first object at this node, subdivide
        if (node.children.length === 0) {
            this.subdivide(node, depth);
        }

        // Try to insert into children
        let inserted = false;
        for (const child of node.children) {
            if (child.containsObject(mesh)) {
                this.insertMesh(child, mesh, depth + 1);
                inserted = true;
                break;
            }
        }

        // If it doesn't fit in any child, store it at this level
        if (!inserted) {
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
                    const child = new OctreeNode(childCenter, halfSize);
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
    const lines = [];

    function createEdgesForNode(node) {
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

        // Recursively create edges for child nodes
        for (let child of node.children) {
            createEdgesForNode(child);
        }
    }

    createEdgesForNode(octree.root);
    const lineSystem = BABYLON.MeshBuilder.CreateLineSystem("octreeLines", { lines: lines }, scene);
    lineSystem.color = new BABYLON.Color3(0, 1, 0);
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