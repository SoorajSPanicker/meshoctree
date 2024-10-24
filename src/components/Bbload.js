


// import { Engine, Scene, SceneLoader, Vector3 } from '@babylonjs/core';
// import '@babylonjs/loaders/glTF';

// export async function calculateBoundingBoxes(results, canvas) {
//     const engine = new Engine(canvas, true);
//     const scene = new Scene(engine);

//     let cumulativeMin = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
//     let cumulativeMax = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

//     const boxesPromises = results.map(async (result) => {
//         const { convertedFilePath } = result;

//         try {
//             const result = await SceneLoader.ImportMeshAsync("", "", convertedFilePath, scene);
//             const meshes = result.meshes;

//             const meshBoundingBoxes = meshes.map((mesh) => {
//                 const boundingBox = mesh.getBoundingInfo().boundingBox;

//                 // Update cumulative bounding box
//                 cumulativeMin = Vector3.Minimize(cumulativeMin, boundingBox.minimumWorld);
//                 cumulativeMax = Vector3.Maximize(cumulativeMax, boundingBox.maximumWorld);

//                 return {
//                     meshName: mesh.name,
//                     min: {
//                         x: boundingBox.minimumWorld.x,
//                         y: boundingBox.minimumWorld.y,
//                         z: boundingBox.minimumWorld.z
//                     },
//                     max: {
//                         x: boundingBox.maximumWorld.x,
//                         y: boundingBox.maximumWorld.y,
//                         z: boundingBox.maximumWorld.z
//                     }
//                 };
//             });

//             return {
//                 filePath: convertedFilePath,
//                 boundingBoxes: meshBoundingBoxes
//             };
//         } catch (error) {
//             console.error(`Error loading file ${convertedFilePath}:`, error);
//             return {
//                 filePath: convertedFilePath,
//                 error: error.message
//             };
//         }
//     });

//     const boxesResults = await Promise.all(boxesPromises);

//     engine.dispose();

//     return {
//         individualResults: boxesResults,
//         cumulativeBoundingBox: {
//             min: {
//                 x: cumulativeMin.x,
//                 y: cumulativeMin.y,
//                 z: cumulativeMin.z
//             },
//             max: {
//                 x: cumulativeMax.x,
//                 y: cumulativeMax.y,
//                 z: cumulativeMax.z
//             }
//         }
//     };
// }

// import { Engine, Scene, SceneLoader, Vector3 } from '@babylonjs/core';
// import '@babylonjs/loaders/glTF';
// import * as BABYLON from '@babylonjs/core';

// export async function calculateBoundingBoxes(results, canvas) {
//     const engine = new Engine(canvas, true);
//     const scene = new Scene(engine);
    
//     let cumulativeMin = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
//     let cumulativeMax = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    
//     const boxesPromises = results.map(async (result) => {
//         const { convertedFilePath } = result;
//         try {
//             const result = await SceneLoader.ImportMeshAsync("", "", convertedFilePath, scene);
//             const meshes = result.meshes;
//             const meshBoundingBoxes = meshes.map((mesh) => {
//                 const boundingInfo = mesh.getBoundingInfo();
//                 const boundingBox = boundingInfo.boundingBox;
                
//                 // Update cumulative bounding box
//                 cumulativeMin = Vector3.Minimize(cumulativeMin, boundingBox.minimumWorld);
//                 cumulativeMax = Vector3.Maximize(cumulativeMax, boundingBox.maximumWorld);

//                 // Create a box mesh from the bounding box
//                 const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
//                 const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
//                 const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;
//                 const center = boundingBox.centerWorld;

//                 const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox("boundingBox_" + mesh.name, {
//                     width: sizeX,
//                     height: sizeY,
//                     depth: sizeZ
//                 }, scene);
//                 boundingBoxMesh.position = center;
//                 boundingBoxMesh.visibility = 0.3; // Make it semi-transparent
                
//                 return {
//                     originalMesh: mesh,
//                     boundingBoxMesh: boundingBoxMesh,
//                     meshName: mesh.name,
//                     min: {
//                         x: boundingBox.minimumWorld.x,
//                         y: boundingBox.minimumWorld.y,
//                         z: boundingBox.minimumWorld.z
//                     },
//                     max: {
//                         x: boundingBox.maximumWorld.x,
//                         y: boundingBox.maximumWorld.y,
//                         z: boundingBox.maximumWorld.z
//                     }
//                 };
//             });
            
//             return {
//                 filePath: convertedFilePath,
//                 boundingBoxes: meshBoundingBoxes
//             };
//         } catch (error) {
//             console.error(`Error loading file ${convertedFilePath}:`, error);
//             return {
//                 filePath: convertedFilePath,
//                 error: error.message
//             };
//         }
//     });
    
//     const boxesResults = await Promise.all(boxesPromises);
//     engine.dispose();
    
//     return {
//         individualResults: boxesResults,
//         cumulativeBoundingBox: {
//             min: { x: cumulativeMin.x, y: cumulativeMin.y, z: cumulativeMin.z },
//             max: { x: cumulativeMax.x, y: cumulativeMax.y, z: cumulativeMax.z }
//         }
//     };
// }

// export function createBoundingBoxMesh(mesh, scene) {
//     const boundingBox = mesh.getBoundingInfo().boundingBox;
    
//     // Calculate dimensions
//     const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
//     const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
//     const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;
//     const center = boundingBox.centerWorld;

//     // Create box mesh
//     const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox(
//         "boundingBox_" + mesh.name, 
//         {
//             width: sizeX,
//             height: sizeY,
//             depth: sizeZ
//         }, 
//         scene
//     );
    
//     // Position the box at the center of the bounding box
//     boundingBoxMesh.position = center;
//     boundingBoxMesh.visibility = 0.3;  // Make it semi-transparent

//     console.log(`Created bounding box mesh for ${mesh.name}:`, {
//         dimensions: { width: sizeX, height: sizeY, depth: sizeZ },
//         center: center
//     });

//     return boundingBoxMesh;
// }
import { Engine, Scene, SceneLoader, Vector3 } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import * as BABYLON from '@babylonjs/core';

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
                const boundingInfo = mesh.getBoundingInfo();
                const boundingBox = boundingInfo.boundingBox;
                
                // Update cumulative bounding box
                cumulativeMin = Vector3.Minimize(cumulativeMin, boundingBox.minimumWorld);
                cumulativeMax = Vector3.Maximize(cumulativeMax, boundingBox.maximumWorld);
                  // Create a box mesh from the bounding box
                  const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
                  const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
                  const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;
                  const center = boundingBox.centerWorld;
                  const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox("boundingBox_" + mesh.name, {
                      width: sizeX,
                      height: sizeY,
                      depth: sizeZ
                  }, scene);
                  boundingBoxMesh.position = center;
                  boundingBoxMesh.visibility = 0.3; // Make it semi-transparent
                  
                  return {
                      originalMesh: mesh,
                      boundingBoxMesh: boundingBoxMesh,
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
            min: { x: cumulativeMin.x, y: cumulativeMin.y, z: cumulativeMin.z },
            max: { x: cumulativeMax.x, y: cumulativeMax.y, z: cumulativeMax.z }
        }
    };
}

// function createBoundingBoxMesh(mesh, scene) {
//     const boundingBox = mesh.getBoundingInfo().boundingBox;
    
//     // Calculate dimensions
//     const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
//     const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
//     const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;
//     const center = boundingBox.centerWorld;

//     // Create box mesh with complete options
//     const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox(
//         "boundingBox_" + mesh.name, 
//         {
//             width: sizeX,
//             height: sizeY,
//             depth: sizeZ,
//             updatable: true,  // Ensure geometry is updatable
//             generateNormals: true,  // Generate normals
//             generateUVs: true,      // Generate UVs
//         }, 
//         scene
//     );
    
//     // Position the box
//     boundingBoxMesh.position = center;
    
//     // Create and assign a material
//     const material = new BABYLON.StandardMaterial("boundingBoxMat_" + mesh.name, scene);
//     material.diffuseColor = new BABYLON.Color3(0, 1, 0);  // Green color
//     material.alpha = 0.3;  // Transparency
//     boundingBoxMesh.material = material;

//     // Ensure the mesh has all required vertex data
//     boundingBoxMesh.computeWorldMatrix(true);
    
//     // Log creation details for debugging
//     console.log(`Created bounding box mesh for ${mesh.name}:`, {
//         dimensions: { width: sizeX, height: sizeY, depth: sizeZ },
//         center: center,
//         hasPositions: boundingBoxMesh.geometry.getVerticesData(BABYLON.VertexBuffer.PositionKind) ? true : false,
//         hasIndices: boundingBoxMesh.geometry.getIndices() ? true : false,
//         hasNormals: boundingBoxMesh.geometry.getVerticesData(BABYLON.VertexBuffer.NormalKind) ? true : false,
//         hasUVs: boundingBoxMesh.geometry.getVerticesData(BABYLON.VertexBuffer.UVKind) ? true : false
//     });

//     return boundingBoxMesh;
// }