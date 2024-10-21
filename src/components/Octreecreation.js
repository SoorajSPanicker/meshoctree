

import * as BABYLON from '@babylonjs/core';

export function createOctree(scene, size, center, maxDepth = 4) {
  if (!scene) {
    console.error("Scene is not available");
    return null;
  }

  // Check if size and center are valid
  if (!size || typeof size.x !== 'number' || typeof size.y !== 'number' || typeof size.z !== 'number') {
    console.error("Invalid size object", size);
    return null;
  }

  if (!center || typeof center.x !== 'number' || typeof center.y !== 'number' || typeof center.z !== 'number') {
    console.error("Invalid center object", center);
    return null;
  }

  // Create an octree with the provided depth and size
  const octree = new BABYLON.Octree(maxDepth);

  // Create a dummy root mesh for the scene
  const rootMesh = new BABYLON.Mesh("root", scene);
  rootMesh.position = new BABYLON.Vector3(center.x, center.y, center.z);

  // Create a box to represent the octree bounds
  const boundingBox = BABYLON.MeshBuilder.CreateBox("boundingBox", { size: 1 }, scene);
  boundingBox.scaling = new BABYLON.Vector3(size.x, size.y, size.z);
  boundingBox.parent = rootMesh;

  // Make the bounding box wireframe
  const boundingBoxMaterial = new BABYLON.StandardMaterial("boundingBoxMat", scene);
  boundingBoxMaterial.wireframe = true;
  boundingBox.material = boundingBoxMaterial;

  // Register the root mesh in the octree
  octree.update(rootMesh);

  console.log("Octree created with size and center");
  return { octree, rootMesh };
}

export function visualizeOctree(scene, octree, rootMesh) {
    const boxMaterial = new BABYLON.StandardMaterial("boxMat", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    boxMaterial.alpha = 0.3;
  
    function createBoxForOctreeNode(node, depth) {
      if (depth >= octree.maxDepth) return;
  
      const size = node.boundingBox.maximumWorld.subtract(node.boundingBox.minimumWorld);
      const center = node.boundingBox.centerWorld;
  
      const box = BABYLON.MeshBuilder.CreateBox(`octreeNode_${depth}`, { size: 1 }, scene);
      box.scaling = size;
      box.position = center;
      box.material = boxMaterial;
  
      // Recursively create boxes for child nodes
      if (node.blocks) {
        for (let childNode of node.blocks) {
          createBoxForOctreeNode(childNode, depth + 1);
        }
      }
    }
  
    createBoxForOctreeNode(octree.blocks[0], 0);
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