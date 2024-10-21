import { SceneLoader, Vector3, BoundingInfo, MeshBuilder } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export async function calculateCumulativeBoundingBox(conversionResults) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const result of conversionResults) {
    try {
      const meshes = await SceneLoader.ImportMeshAsync("", "file:///" + result.convertedFilePath);
      
      meshes.meshes.forEach((mesh) => {
        const boundingInfo = mesh.getBoundingInfo();
        const min = boundingInfo.boundingBox.minimumWorld;
        const max = boundingInfo.boundingBox.maximumWorld;
        
        minX = Math.min(minX, min.x);
        minY = Math.min(minY, min.y);
        minZ = Math.min(minZ, min.z);
        
        maxX = Math.max(maxX, max.x);
        maxY = Math.max(maxY, max.y);
        maxZ = Math.max(maxZ, max.z);
      });
    } catch (error) {
      console.error(`Error loading file ${result.convertedFileName}:`, error);
    }
  }

  const cumulativeBB = {
    min: new Vector3(minX, minY, minZ),
    max: new Vector3(maxX, maxY, maxZ)
  };

  // Create a dummy mesh to represent the bounding box
  const dummyMesh = new MeshBuilder.CreateBox("boundingBox", { size: 1 });
  dummyMesh.setBoundingInfo(new BoundingInfo(cumulativeBB.min, cumulativeBB.max));

  // Get the Octree-compatible structure
  const octree = dummyMesh.getScene().createOrUpdateSelectionOctree(16);

  return { cumulativeBoundingBox: cumulativeBB, octree };
}