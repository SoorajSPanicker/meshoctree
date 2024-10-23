// import * as BABYLON from 'babylonjs';
// import 'babylonjs-loaders';

// export async function applyLODToFile(filePath) {
//     const engine = new BABYLON.NullEngine();
//     const scene = new BABYLON.Scene(engine);

//     try {
//         console.log(`Attempting to load file: ${filePath}`);
//         const result = await BABYLON.SceneLoader.ImportMeshAsync("", "file:///", filePath, scene);
//         console.log("Import result:", result);

//         if (!result.meshes || result.meshes.length === 0) {
//             console.error("No meshes were loaded");
//             return null;
//         }

//         // Find the mesh with the most vertices
//         let originalMesh = result.meshes[0];
//         let maxVertices = 0;
//         for (const mesh of result.meshes) {
//             const vertexCount = mesh.getTotalVertices();
//             console.log(`Mesh: ${mesh.name}, Vertices: ${vertexCount}, Faces: ${mesh.getTotalIndices() / 3}`);
//             if (vertexCount > maxVertices) {
//                 maxVertices = vertexCount;
//                 originalMesh = mesh;
//             }
//         }

//         console.log("Selected mesh for LOD:", originalMesh);

//         // Count original vertices and faces
//         const originalVertices = originalMesh.getTotalVertices();
//         const originalFaces = originalMesh.getTotalIndices() / 3;

//         console.log(`Original mesh - Vertices: ${originalVertices}, Faces: ${originalFaces}`);

//         if (originalVertices === 0 || originalFaces === 0) {
//             console.error("Selected mesh has no vertices or faces");
//             return null;
//         }

//         // Apply LOD reduction
//         const simplifiedMesh = originalMesh.simplify(
//             [{ quality: 0.15, distance: 1000 }], // 85% reduction
//             false,
//             BABYLON.SimplificationType.QUADRATIC
//         );

//         // Count simplified vertices and faces
//         const simplifiedVertices = simplifiedMesh.getTotalVertices();
//         const simplifiedFaces = simplifiedMesh.getTotalIndices() / 3;

//         console.log(`Simplified mesh - Vertices: ${simplifiedVertices}, Faces: ${simplifiedFaces}`);

//         // Calculate reduction percentages
//         const vertexReduction = ((originalVertices - simplifiedVertices) / originalVertices * 100).toFixed(2);
//         const faceReduction = ((originalFaces - simplifiedFaces) / originalFaces * 100).toFixed(2);

//         return {
//             originalVertices,
//             originalFaces,
//             simplifiedVertices,
//             simplifiedFaces,
//             vertexReduction,
//             faceReduction
//         };
//     } catch (error) {
//         console.error(`Error applying LOD to ${filePath}:`, error);
//         return null;
//     } finally {
//         scene.dispose();
//         engine.dispose();
//     }
// }




// import * as BABYLON from 'babylonjs';
// import 'babylonjs-loaders';

// export async function applyLODToFile(filePath) {
//     const engine = new BABYLON.NullEngine();
//     const scene = new BABYLON.Scene(engine);

//     try {
//         console.log(`Attempting to load file: ${filePath}`);
//         const result = await BABYLON.SceneLoader.ImportMeshAsync("", "file:///", filePath, scene);
//         console.log("Import result:", result);

//         if (!result.meshes || result.meshes.length === 0) {
//             console.error("No meshes were loaded");
//             return null;
//         }

//         // Find the mesh with the most vertices
//         let originalMesh = result.meshes[0];
//         let maxVertices = 0;
//         for (const mesh of result.meshes) {
//             const vertexCount = mesh.getTotalVertices();
//             console.log(`Mesh: ${mesh.name}, Vertices: ${vertexCount}, Faces: ${mesh.getTotalIndices() / 3}`);
//             if (vertexCount > maxVertices) {
//                 maxVertices = vertexCount;
//                 originalMesh = mesh;
//             }
//         }

//         console.log("Selected mesh for LOD:", originalMesh);

//         // Count original vertices and faces
//         const originalVertices = originalMesh.getTotalVertices();
//         const originalFaces = originalMesh.getTotalIndices() / 3;

//         console.log(`Original mesh - Vertices: ${originalVertices}, Faces: ${originalFaces}`);

//         if (originalVertices === 0 || originalFaces === 0) {
//             console.error("Selected mesh has no vertices or faces");
//             return null;
//         }

//         // Apply LOD reduction
//         const simplifiedMesh = originalMesh.simplify(
//             [{ quality: 0.5, distance: 1000 }], // 85% reduction
//             false,
//             BABYLON.SimplificationType.QUADRATIC
//         );

//         // Count simplified vertices and faces
//         const simplifiedVertices = simplifiedMesh.getTotalVertices();
//         const simplifiedFaces = simplifiedMesh.getTotalIndices() / 3;

//         console.log(`Simplified mesh - Vertices: ${simplifiedVertices}, Faces: ${simplifiedFaces}`);

//         // Calculate reduction percentages
//         const vertexReduction = ((originalVertices - simplifiedVertices) / originalVertices * 100).toFixed(2);
//         const faceReduction = ((originalFaces - simplifiedFaces) / originalFaces * 100).toFixed(2);

//         return {
//             originalVertices,
//             originalFaces,
//             simplifiedVertices,
//             simplifiedFaces,
//             vertexReduction,
//             faceReduction
//         };
//     } catch (error) {
//         console.error(`Error applying LOD to ${filePath}:`, error);
//         return null;
//     } finally {
//         scene.dispose();
//         engine.dispose();
//     }
// }


import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

export async function applyLODToFile(filePath) {
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);

    try {
        console.log(`Attempting to load file: ${filePath}`);
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "file:///", filePath, scene);
        console.log("Import result:", result);

        if (!result.meshes || result.meshes.length === 0) {
            console.error("No meshes were loaded");
            return null;
        }

        // Filter out parent nodes and get only meshes with geometry
        const meshesWithGeometry = result.meshes.filter(mesh => 
            mesh.getTotalVertices() > 0 && mesh.getTotalIndices() > 0
        );

        if (meshesWithGeometry.length === 0) {
            console.error("No meshes with geometry found");
            return null;
        }

        console.log(`Found ${meshesWithGeometry.length} meshes with geometry`);

        // Log original stats for all meshes
        let totalOriginalVertices = 0;
        let totalOriginalFaces = 0;
        meshesWithGeometry.forEach(mesh => {
            const vertices = mesh.getTotalVertices();
            const faces = mesh.getTotalIndices() / 3;
            console.log(`Mesh: ${mesh.name}, Vertices: ${vertices}, Faces: ${faces}`);
            totalOriginalVertices += vertices;
            totalOriginalFaces += faces;
        });

        // Merge all meshes into one
        const mergedMesh = BABYLON.Mesh.MergeMeshes(
            meshesWithGeometry,
            true, // dispose source meshes
            true, // allow different materials
            undefined, // don't force a parent
            false, // don't create multiMultiMaterials
            true // use world matrix
        );

        if (!mergedMesh) {
            console.error("Failed to merge meshes");
            return null;
        }

        console.log("Meshes merged successfully");
        console.log(`Merged mesh - Vertices: ${mergedMesh.getTotalVertices()}, Faces: ${mergedMesh.getTotalIndices() / 3}`);
        mergedMesh.forceSharedVertices();
        console.log("After forceSharedVertices:", mergedMesh.getTotalVertices());
        // Apply LOD reduction to merged mesh
        const simplifiedMesh = mergedMesh.simplify(
            [{
              quality: 0.1,  // Try a more aggressive reduction
              optimizeMesh: true
            }],
            false,
            BABYLON.SimplificationType.EDGE_COLLAPSE // Use edge collapse instead
          );
        // Get simplified stats
        const simplifiedVertices = simplifiedMesh.getTotalVertices();
        const simplifiedFaces = simplifiedMesh.getTotalIndices() / 3;

        console.log(`Simplified merged mesh - Vertices: ${simplifiedVertices}, Faces: ${simplifiedFaces}`);

        // Calculate reduction percentages
        const vertexReduction = ((totalOriginalVertices - simplifiedVertices) / totalOriginalVertices * 100).toFixed(2);
        const faceReduction = ((totalOriginalFaces - simplifiedFaces) / totalOriginalFaces * 100).toFixed(2);

        // Optional: Export simplified mesh (uncomment if needed)
        // const serializedMesh = BABYLON.SceneSerializer.SerializeMesh(simplifiedMesh);
        // await BABYLON.SceneSerializer.SerializeMeshToGLTF(simplifiedMesh, "simplified.glb");

        return {
            originalVertices: totalOriginalVertices,
            originalFaces: totalOriginalFaces,
            simplifiedVertices,
            simplifiedFaces,
            vertexReduction,
            faceReduction,
            originalMeshCount: meshesWithGeometry.length
        };

    } catch (error) {
        console.error(`Error applying LOD to ${filePath}:`, error);
        throw error;
    } finally {
        scene.dispose();
        engine.dispose();
    }
}