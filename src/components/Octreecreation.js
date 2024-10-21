import * as BABYLON from '@babylonjs/core';

class OctreeNode {
  constructor(center, size) {
    this.center = center;
    this.size = size;
    this.children = [];
  }
}

export class CustomOctree {
  constructor(center, size, maxDepth) {
    this.root = new OctreeNode(center, size);
    this.maxDepth = maxDepth;
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
}

export function createCustomOctree(scene, size, center, maxDepth = 1) {
  console.log("Creating custom octree with size:", size, "and center:", center);

  const octree = new CustomOctree(
    new BABYLON.Vector3(center.x, center.y, center.z),
    Math.max(size.x, size.y, size.z),
    maxDepth
  );
  octree.create();

  console.log("Custom octree created successfully");
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
