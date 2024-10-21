import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import { GLTF2Export } from '@babylonjs/serializers/glTF';

export async function modifyGLB(file) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    try {
        const url = URL.createObjectURL(file);

        // console.log('Loading file:', file.name);
        console.log('File type:', file.type);
        console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

        const assetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync("", url, scene, null, ".glb");

        console.log('Original mesh count:', assetContainer.meshes.length);
        console.log('Original material count:', assetContainer.materials.length);
        console.log('Original texture count:', assetContainer.textures.length);
        console.log('Original animation group count:', assetContainer.animationGroups.length);

        // Remove all textures
        // assetContainer.textures.forEach(texture => {
        //     texture.dispose();
        // });
        // assetContainer.textures = [];

        // assetContainer.materials.forEach(material => {
        //     console.log('Material type:', material.getClassName());
            
        //     if (material instanceof BABYLON.PBRMaterial) {
        //         // Set a neutral gray color and remove all textures
        //         material.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);  // Gray color
        //         material.metallic = 0.1;
        //         material.roughness = 0.8;
        //         // Remove all PBR textures
        //         material.albedoTexture = null;
        //         material.bumpTexture = null;
        //         material.ambientTexture = null;
        //         material.opacityTexture = null;
        //         material.emissiveTexture = null;
        //         material.metallicTexture = null;
        //         material.reflectivityTexture = null;
        //         material.microSurfaceTexture = null;
        //     } else if (material instanceof BABYLON.StandardMaterial) {
        //         // Set neutral gray color for diffuse and low specular value, and remove all textures
        //         material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);  // Gray color
        //         material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Low specular
        //         material.emissiveColor = new BABYLON.Color3(0, 0, 0);       // No emissive color
        //         material.ambientColor = new BABYLON.Color3(0, 0, 0);        // No ambient color
        //         // Remove all StandardMaterial textures
        //         material.diffuseTexture = null;
        //         material.bumpTexture = null;
        //         material.ambientTexture = null;
        //         material.opacityTexture = null;
        //         material.emissiveTexture = null;
        //         material.specularTexture = null;
        //     }
        
        //     // Ensure all remaining texture properties are removed, if any
        //     for (let prop in material) {
        //         if (material[prop] instanceof BABYLON.BaseTexture) {
        //             console.log('Removing texture from property:', prop);
        //             material[prop] = null;  // Remove texture reference
        //         }
        //     }
        // });

        // // Remove animations
        // assetContainer.animationGroups.forEach(animationGroup => {
        //     animationGroup.dispose();
        // });
        // assetContainer.animationGroups = [];

        // Add modified meshes to the scene
        assetContainer.addAllToScene();

        console.log('Modified mesh count:', scene.meshes.length);
        console.log('Modified material count:', scene.materials.length);
        console.log('Modified texture count:', scene.textures.length);
        console.log('Modified animation group count:', scene.animationGroups.length);

        const exportOptions = {
            truncateDrawRange: true,
            exportWithoutWrapperExtensions: true,
            removeEmptyNodes: true,
            exportIndices: true,
            exportMorphNormals: false,
            exportMorphTargets: false,
            exportWithoutWrapperExtensions: true,
            useWebkitPropertyBug: true,  // This might help reduce file size
            exportBinaryGeometry: true   // This might help reduce file size
        };

        const glb = await GLTF2Export.GLBAsync(scene, "modified_model", exportOptions);
        const modifiedBlob = new Blob([glb.glTFFiles["modified_model.glb"]], { type: "model/gltf-binary" });

        console.log('Modified file size:', (modifiedBlob.size / 1024 / 1024).toFixed(2), 'MB');

        URL.revokeObjectURL(url);
        engine.dispose();
        canvas.remove();

        return modifiedBlob;
    } catch (error) {
        console.error('Error processing GLB:', error);
        throw error;
    }
}


// import * as BABYLON from '@babylonjs/core';
// import '@babylonjs/loaders';
// import { GLTF2Export } from '@babylonjs/serializers/glTF';

// export async function modifyGLB(file) {
//     const canvas = document.createElement('canvas');
//     canvas.width = 1;
//     canvas.height = 1;
    
//     const engine = new BABYLON.Engine(canvas, true);
//     const scene = new BABYLON.Scene(engine);

//     try {
//         const url = URL.createObjectURL(file);

//         console.log('Loading file:', file.name);
//         console.log('File type:', file.type);
//         console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

//         const result = await BABYLON.SceneLoader.ImportMeshAsync("", url, "", scene);

//         console.log('Original mesh count:', result.meshes.length);

//         // Merge all meshes into one
//         let mergedMesh = BABYLON.Mesh.MergeMeshes(result.meshes, true, true, undefined, false, true);
        
//         if (mergedMesh) {
//             // Remove unnecessary attributes
//             if (mergedMesh.getVerticesData(BABYLON.VertexBuffer.ColorKind)) {
//                 mergedMesh.removeVerticesData(BABYLON.VertexBuffer.ColorKind);
//             }
//             if (mergedMesh.getVerticesData(BABYLON.VertexBuffer.UVKind)) {
//                 mergedMesh.removeVerticesData(BABYLON.VertexBuffer.UVKind);
//             }
            
//             // Simplify the mesh (reduce vertex count by 50%)
//             const simplificationRatio = 0.5;
//             const simplifiedMesh = BABYLON.Mesh.CreateSimplification("simplified", mergedMesh, simplificationRatio, scene);
            
//             if (simplifiedMesh) {
//                 mergedMesh.dispose();
//                 mergedMesh = simplifiedMesh;
//             }

//             // Apply a simple material
//             const material = new BABYLON.StandardMaterial("simpleMaterial", scene);
//             material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
//             material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
//             material.emissiveColor = new BABYLON.Color3(0, 0, 0);
//             material.ambientColor = new BABYLON.Color3(0, 0, 0);
//             mergedMesh.material = material;

//             // Remove all other meshes and keep only the merged one
//             scene.meshes.slice().forEach(mesh => {
//                 if (mesh !== mergedMesh) {
//                     mesh.dispose();
//                 }
//             });

//             // Remove all materials except the new simple material
//             scene.materials.slice().forEach(mat => {
//                 if (mat !== material) {
//                     mat.dispose();
//                 }
//             });

//             // Remove all textures
//             scene.textures.slice().forEach(texture => {
//                 texture.dispose();
//             });

//             // Remove all animations
//             scene.animationGroups.slice().forEach(animationGroup => {
//                 animationGroup.dispose();
//             });

//             console.log('Modified mesh count:', scene.meshes.length);
//             console.log('Modified material count:', scene.materials.length);
//             console.log('Modified texture count:', scene.textures.length);
//             console.log('Modified animation group count:', scene.animationGroups.length);

//             const exportOptions = {
//                 truncateDrawRange: true,
//                 exportWithoutWrapperExtensions: true,
//                 removeEmptyNodes: true,
//                 exportIndices: true,
//                 exportMorphNormals: false,
//                 exportMorphTargets: false,
//                 exportWithoutWrapperExtensions: true,
//                 useWebkitPropertyBug: true,
//                 exportBinaryGeometry: true
//             };

//             const glb = await GLTF2Export.GLBAsync(scene, "modified_model", exportOptions);
//             const modifiedBlob = new Blob([glb.glTFFiles["modified_model.glb"]], { type: "model/gltf-binary" });

//             console.log('Modified file size:', (modifiedBlob.size / 1024 / 1024).toFixed(2), 'MB');

//             URL.revokeObjectURL(url);
//             engine.dispose();
//             canvas.remove();

//             return modifiedBlob;
//         } else {
//             throw new Error("Failed to merge meshes");
//         }
//     } catch (error) {
//         console.error('Error processing GLB:', error);
//         throw error;
//     }
// }