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
        this.objects = [];
    }
}

export class CustomOctree {
    constructor(center, size, maxDepth) {
        this.root = new OctreeNode(center, size);
        this.maxDepth = maxDepth;
        this.totalObjects = 0;
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
                    this.subdivide(child, depth + 1);
                }
            }
        }
    }

    create() {
        this.subdivide(this.root, 0);
    }

    insert(object) {
        this.insertToNode(this.root, object, 0);
        this.totalObjects++;
        console.log(`Inserted object: ${JSON.stringify(object.userData)}`);
    }

    insertToNode(node, object, depth) {
        if (depth >= this.maxDepth || node.children.length === 0) {
            node.objects.push(object);
            return;
        }

        const { position, radius } = object;
        for (let child of node.children) {
            if (this.intersectsSphere(child, position, radius)) {
                this.insertToNode(child, object, depth + 1);
            }
        }
    }

    intersectsSphere(node, position, radius) {
        const dx = Math.abs(position.x - node.center.x);
        const dy = Math.abs(position.y - node.center.y);
        const dz = Math.abs(position.z - node.center.z);
        const maxDist = node.size / 2 + radius;

        return dx <= maxDist && dy <= maxDist && dz <= maxDist;
    }

    displayInsertedData() {
        console.log(`Total objects inserted: ${this.totalObjects}`);
        this.displayNodeData(this.root, 0);
    }

    displayNodeData(node, depth) {
        const indent = '  '.repeat(depth);
        console.log(`${indent}Node at depth ${depth}:`);
        console.log(`${indent}Center: (${node.center.x}, ${node.center.y}, ${node.center.z})`);
        console.log(`${indent}Size: ${node.size}`);
        console.log(`${indent}Objects: ${node.objects.length}`);
        
        node.objects.forEach((obj, index) => {
            console.log(`${indent}  Object ${index}:`);
            console.log(`${indent}    Position: (${obj.position.x}, ${obj.position.y}, ${obj.position.z})`);
            console.log(`${indent}    Radius: ${obj.radius}`);
            console.log(`${indent}    UserData: ${JSON.stringify(obj.userData)}`);
        });

        node.children.forEach((child, index) => {
            console.log(`${indent}Child ${index}:`);
            this.displayNodeData(child, depth + 1);
        });
    }
}

export function createCustomOctree(scene, size, center, meshes, maxDepth = 3) {
    console.log("Creating custom octree with size:", size, "and center:", center);

    const octree = new CustomOctree(
        new BABYLON.Vector3(center.x, center.y, center.z),
        Math.max(size.x, size.y, size.z),
        maxDepth
    );
    octree.create();

    // Insert meshes into the octree
    meshes.forEach((mesh, index) => {
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        const center = boundingBox.centerWorld;
        const size = boundingBox.extendSizeWorld;
        const radius = size.length() / 2;

        octree.insert({
            position: center,
            radius: radius,
            userData: {
                id: mesh.id,
                index: index,
                meshName: mesh.name
            }
        });
    });

    console.log("Custom octree created successfully");
    octree.displayInsertedData();
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
    lineSystem.color = new BABYLON.Color3(0, 1, 0); // Green color for better visibility

    console.log("Custom octree visualized with edge lines");
}

export function initializeScene(canvas) {
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    // Add a camera
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Add a light
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    engine.runRenderLoop(() => {
        scene.render();
    });

    window.addEventListener('resize', () => {
        engine.resize();
    });

    return { scene, engine };
}