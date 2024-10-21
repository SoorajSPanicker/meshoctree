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

        // Find the mesh with the most vertices
        let originalMesh = result.meshes[0];
        let maxVertices = 0;
        for (const mesh of result.meshes) {
            const vertexCount = mesh.getTotalVertices();
            console.log(`Mesh: ${mesh.name}, Vertices: ${vertexCount}, Faces: ${mesh.getTotalIndices() / 3}`);
            if (vertexCount > maxVertices) {
                maxVertices = vertexCount;
                originalMesh = mesh;
            }
        }

        console.log("Selected mesh for LOD:", originalMesh);

        // Count original vertices and faces
        const originalVertices = originalMesh.getTotalVertices();
        const originalFaces = originalMesh.getTotalIndices() / 3;

        console.log(`Original mesh - Vertices: ${originalVertices}, Faces: ${originalFaces}`);

        if (originalVertices === 0 || originalFaces === 0) {
            console.error("Selected mesh has no vertices or faces");
            return null;
        }

        // Apply LOD reduction
        const simplifiedMesh = originalMesh.simplify(
            [{ quality: 0.15, distance: 1000 }], // 85% reduction
            false,
            BABYLON.SimplificationType.QUADRATIC
        );

        // Count simplified vertices and faces
        const simplifiedVertices = simplifiedMesh.getTotalVertices();
        const simplifiedFaces = simplifiedMesh.getTotalIndices() / 3;

        console.log(`Simplified mesh - Vertices: ${simplifiedVertices}, Faces: ${simplifiedFaces}`);

        // Calculate reduction percentages
        const vertexReduction = ((originalVertices - simplifiedVertices) / originalVertices * 100).toFixed(2);
        const faceReduction = ((originalFaces - simplifiedFaces) / originalFaces * 100).toFixed(2);

        return {
            originalVertices,
            originalFaces,
            simplifiedVertices,
            simplifiedFaces,
            vertexReduction,
            faceReduction
        };
    } catch (error) {
        console.error(`Error applying LOD to ${filePath}:`, error);
        return null;
    } finally {
        scene.dispose();
        engine.dispose();
    }
}
