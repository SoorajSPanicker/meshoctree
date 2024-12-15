
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
//             // const result = await BABYLON.SceneLoader.LoadAssetContainerAsync("",convertedFilePath, scene);
//             const meshes = result.meshes;
//             const meshBoundingBoxes = meshes
//                 .filter(mesh => !mesh.name.includes('_root_'))
//                 .map((mesh) => {
//                     console.log(mesh);
//                     // if(mesh.name.includes('_root_')){
//                     //     console.log("Skipping root mesh");

//                     // }
//                     // else{
//                     const boundingInfo = mesh.getBoundingInfo();
//                     console.log(boundingInfo);
//                     const boundingBox = boundingInfo.boundingBox;

//                     // // Update cumulative bounding box
//                     // cumulativeMin = Vector3.Minimize(cumulativeMin, boundingBox.minimumWorld);
//                     // cumulativeMax = Vector3.Maximize(cumulativeMax, boundingBox.maximumWorld);
//                     // // Create a box mesh from the bounding box
//                     // const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
//                     // const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
//                     // const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;
//                     // const center = boundingBox.centerWorld;
//                     // // const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox("boundingBox_" + mesh.name, {
//                     // //     width: sizeX,
//                     // //     height: sizeY,
//                     // //     depth: sizeZ
//                     // // }, scene);
//                     // // boundingBoxMesh.position = center;
//                     // // boundingBoxMesh.visibility = 0.3; // Make it semi-transparent
//                     // // //   console.log(boundingBox.minimumWorld);

//                     return {
//                         originalMesh: mesh,
//                         // boundingBoxMesh: boundingBoxMesh,
//                         meshName: mesh.name,
//                         min: {
//                             x: boundingBox.minimumWorld.x,
//                             y: boundingBox.minimumWorld.y,
//                             z: boundingBox.minimumWorld.z
//                         },
//                         max: {
//                             x: boundingBox.maximumWorld.x,
//                             y: boundingBox.maximumWorld.y,
//                             z: boundingBox.maximumWorld.z
//                         }
//                     };
//                     // }

//                 });
//             return {
//                 filePath: convertedFilePath,
//                 boundingBoxes: meshBoundingBoxes
//             };
//         } catch (error) {
//             console.error(`Error loading file ${convertedFilePath}:, error`);
//             return {
//                 filePath: convertedFilePath,
//                 error: error.message
//             };
//         }
//     });
//     const boxesResults = await Promise.all(boxesPromises);
//     engine.dispose();
//     return {
//         individualResults: boxesResults
//         // ,
//         // cumulativeBoundingBox: {
//         //     min: { x: cumulativeMin.x, y: cumulativeMin.y, z: cumulativeMin.z },
//         //     max: { x: cumulativeMax.x, y: cumulativeMax.y, z: cumulativeMax.z }
//         // }
//     };
// }





// import { Engine, Scene, SceneLoader, Vector3 } from '@babylonjs/core';
// import '@babylonjs/loaders/glTF';
// import * as BABYLON from '@babylonjs/core';

// // Function to generate a unique 7-digit ID
// function generateUniqueId() {
//     return Math.floor(1000000 + Math.random() * 9000000).toString();
// }

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
//             const meshBoundingBoxes = meshes
//                 .filter(mesh => !mesh.name.includes('_root_'))
//                 .map((mesh) => {
//                     console.log(mesh);

//                     // if(mesh.name.includes('_root_')){
//                     //     console.log("Skipping root mesh");

//                     // }
//                     // else{
//                     const boundingInfo = mesh.getBoundingInfo();
//                     console.log(boundingInfo);
//                     const boundingBox = boundingInfo.boundingBox;

//                     // Update cumulative bounding box
//                     cumulativeMin = Vector3.Minimize(cumulativeMin, boundingBox.minimumWorld);
//                     cumulativeMax = Vector3.Maximize(cumulativeMax, boundingBox.maximumWorld);
//                     // Create a box mesh from the bounding box
//                     const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
//                     const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
//                     const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;
//                     const center = boundingBox.centerWorld;
//                     const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox("boundingBox_" + mesh.name, {
//                         width: sizeX,
//                         height: sizeY,
//                         depth: sizeZ
//                     }, scene);
//                     boundingBoxMesh.position = center;
//                     // boundingBoxMesh.visibility = 0.3; // Make it semi-transparent
//                     // //   console.log(boundingBox.minimumWorld);

//                     return {
//                         originalMesh: mesh,
//                         boundingBoxMesh: boundingBoxMesh,
//                         meshName: mesh.name,
//                         min: {
//                             x: boundingBox.minimumWorld.x,
//                             y: boundingBox.minimumWorld.y,
//                             z: boundingBox.minimumWorld.z
//                         },
//                         max: {
//                             x: boundingBox.maximumWorld.x,
//                             y: boundingBox.maximumWorld.y,
//                             z: boundingBox.maximumWorld.z
//                         }
//                     };
//                     // }

//                 });
//             return {
//                 filePath: convertedFilePath,
//                 boundingBoxes: meshBoundingBoxes
//             };
//         } catch (error) {
//             console.error(`Error loading file ${convertedFilePath}:, error`);
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



import { Engine, Scene, SceneLoader, Vector3 } from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import * as BABYLON from '@babylonjs/core';

export async function calculateBoundingBoxes(results, canvas) {
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    let cumulativeMin = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    let cumulativeMax = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    const boxesResults = [];

    // Process files sequentially instead of in parallel
    for (const result of results) {
        const { convertedFilePath } = result;
        try {
            // Load mesh
            const loadResult = await SceneLoader.ImportMeshAsync("", "", convertedFilePath, scene);
            const meshes = loadResult.meshes;
            const meshBoundingBoxes = [];

            // Process each mesh
            for (const mesh of meshes) {
                if (mesh.name.includes('_root_')) continue;
                console.log(mesh);
                try {
                    const boundingInfo = mesh.getBoundingInfo();
                    const boundingBox = boundingInfo.boundingBox;
                    console.log(boundingBox);

                    // Update cumulative bounds
                    cumulativeMin = Vector3.Minimize(cumulativeMin, boundingBox.minimumWorld);
                    cumulativeMax = Vector3.Maximize(cumulativeMax, boundingBox.maximumWorld);

                    // Calculate box dimensions
                    const sizeX = boundingBox.maximumWorld.x - boundingBox.minimumWorld.x;
                    const sizeY = boundingBox.maximumWorld.y - boundingBox.minimumWorld.y;
                    const sizeZ = boundingBox.maximumWorld.z - boundingBox.minimumWorld.z;
                    const center = boundingBox.centerWorld;

                    // // Create bounding box mesh
                    // const boundingBoxMesh = BABYLON.MeshBuilder.CreateBox(
                    //     "boundingBox_" + mesh.name,
                    //     { width: sizeX, height: sizeY, depth: sizeZ },
                    //     scene
                    // );
                    // boundingBoxMesh.position = center;

                    // Store results
                    meshBoundingBoxes.push({
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
                    });
                    console.log(`mesh ${mesh.name} calculation complete`);


                    // Clean up original mesh immediately
                    mesh.dispose();
                } catch (error) {
                    console.warn(`Error processing mesh ${mesh.name}:`, error);
                }
            }

            // Store results for this file
            boxesResults.push({
                filePath: convertedFilePath,
                boundingBoxes: meshBoundingBoxes
            });

            // Force cleanup
            loadResult.meshes.forEach(mesh => {
                if (mesh && !mesh.isDisposed()) {
                    mesh.dispose();
                }
            });

            // Optional: Force garbage collection if available
            if (window.gc) {
                window.gc();
            }

            // Give time for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`Error loading file ${convertedFilePath}:`, error);
            boxesResults.push({
                filePath: convertedFilePath,
                error: error.message
            });
        }
    }

    // Clean up engine and scene
    scene.dispose();
    engine.dispose();

    return {
        individualResults: boxesResults,
        cumulativeBoundingBox: {
            min: { x: cumulativeMin.x, y: cumulativeMin.y, z: cumulativeMin.z },
            max: { x: cumulativeMax.x, y: cumulativeMax.y, z: cumulativeMax.z }
        }
    };
}