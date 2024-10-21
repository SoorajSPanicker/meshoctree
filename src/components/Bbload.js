import { Engine, Scene, SceneLoader, Vector3 } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export async function calculateBoundingBoxes(results, canvas) {
  const engine = new Engine(canvas, true);
  const scene = new Scene(engine);

  let cumulativeMin = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  let cumulativeMax = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

  const boxesPromises = results.map(async (result) => {
    const { convertedFilePath } = result;
    
    try {
      const result = await SceneLoader.ImportMeshAsync("", "", convertedFilePath, scene);
      const meshes = result.meshes;

      const meshBoundingBoxes = meshes.map((mesh) => {
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        
        // Update cumulative bounding box
        cumulativeMin = Vector3.Minimize(cumulativeMin, boundingBox.minimumWorld);
        cumulativeMax = Vector3.Maximize(cumulativeMax, boundingBox.maximumWorld);

        return {
          meshName: mesh.name,
          min: {
            x: boundingBox.minimumWorld.x,
            y: boundingBox.minimumWorld.y,
            z: boundingBox.minimumWorld.z
          },
          max: {
            x: boundingBox.maximumWorld.x,
            y: boundingBox.maximumWorld.y,
            z: boundingBox.maximumWorld.z
          }
        };
      });

      return {
        filePath: convertedFilePath,
        boundingBoxes: meshBoundingBoxes
      };
    } catch (error) {
      console.error(`Error loading file ${convertedFilePath}:`, error);
      return {
        filePath: convertedFilePath,
        error: error.message
      };
    }
  });

  const boxesResults = await Promise.all(boxesPromises);
  
  engine.dispose();
  
  return {
    individualResults: boxesResults,
    cumulativeBoundingBox: {
      min: {
        x: cumulativeMin.x,
        y: cumulativeMin.y,
        z: cumulativeMin.z
      },
      max: {
        x: cumulativeMax.x,
        y: cumulativeMax.y,
        z: cumulativeMax.z
      }
    }
  };
}