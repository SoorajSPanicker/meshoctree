// import React, { useEffect, useRef, useState } from 'react';
// import { calculateBoundingBoxes } from './Bbload';
// import { createCustomOctree, visualizeCustomOctree,initializeScene } from './Octreecreation';
// import * as BABYLON from '@babylonjs/core';

// function Fbxload() {
//     const [selectedFiles, setSelectedFiles] = useState([]);
//     const [conversionResults, setConversionResults] = useState([]);
//     const [boundingBoxes, setBoundingBoxes] = useState([]);
//     const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
//     const canvasRef = useRef(null);
//     const sceneRef = useRef(null);

//     const handleFileSelect = () => {
//         window.api.send('open-file-dialog');
//     };

//     useEffect(() => {
//         let scene;
//         if (canvasRef.current && !sceneRef.current) {
//             const { scene: newScene, engine } = initializeScene(canvasRef.current);
//             sceneRef.current = newScene;
//             scene = newScene;

//             // Add camera control for easier navigation
//             const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
//             camera.setPosition(new BABYLON.Vector3(0, 5, -10));
//             camera.attachControl(canvasRef.current, true);
//         }

//         window.api.receive('gbl-file-content', (fileInfoArray) => {
//             if (fileInfoArray && fileInfoArray.length > 0) {
//                 console.log('Selected files:', fileInfoArray);
//                 window.api.send('fbx-gltf-converter', fileInfoArray);
//             } else {
//                 console.log('No files selected');
//             }
//         });

//         window.api.receive('fbx-conversion-success', async (results) => {
//             console.log('Conversion results:', results);
//             setConversionResults(results);
//             try {
//                 const { individualResults, cumulativeBoundingBox } = await calculateBoundingBoxes(results, canvasRef.current);
//                 console.log('Individual results:', individualResults);
//                 console.log('Cumulative bounding box:', cumulativeBoundingBox);

//                 setBoundingBoxes(individualResults);
//                 setCumulativeBoundingBox(cumulativeBoundingBox);

//                 if (!cumulativeBoundingBox || !cumulativeBoundingBox.min || !cumulativeBoundingBox.max) {
//                     console.error('Invalid cumulative bounding box:', cumulativeBoundingBox);
//                     return;
//                 }

//                 const size = {
//                     x: cumulativeBoundingBox.max.x - cumulativeBoundingBox.min.x,
//                     y: cumulativeBoundingBox.max.y - cumulativeBoundingBox.min.y,
//                     z: cumulativeBoundingBox.max.z - cumulativeBoundingBox.min.z
//                 };
//                 const center = {
//                     x: (cumulativeBoundingBox.max.x + cumulativeBoundingBox.min.x) / 2,
//                     y: (cumulativeBoundingBox.max.y + cumulativeBoundingBox.min.y) / 2,
//                     z: (cumulativeBoundingBox.max.z + cumulativeBoundingBox.min.z) / 2
//                 };

//                 console.log("Calculated size:", size);
//                 console.log("Calculated center:", center);

//                 if (scene) {
//                     try {
//                         const customOctree = createCustomOctree(scene, size, center);
//                         console.log("Custom octree creation result:", customOctree);
//                         visualizeCustomOctree(scene, customOctree);
//                         console.log("Custom octree created and visualized successfully");
//                     } catch (error) {
//                         console.error("Error in custom octree creation or visualization:", error);
//                     }
//                 } else {
//                     console.error("Scene is not initialized");
//                 }

//             } catch (error) {
//                 console.error("Error processing conversion results:", error);
//             }
//         });

//         return () => {
//             if (scene) {
//                 scene.dispose();
//             }
//         };
//     }, []);
//     return (
//         <div>
//             <button
//                 onClick={handleFileSelect}
//                 className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//                 Select FBX File
//             </button>
//             <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />

//             {cumulativeBoundingBox && (
//                 <div>
//                     <h2>Cumulative Bounding Box:</h2>
//                     <p>
//                         Min: ({cumulativeBoundingBox.min.x.toFixed(2)}, {cumulativeBoundingBox.min.y.toFixed(2)}, {cumulativeBoundingBox.min.z.toFixed(2)})
//                     </p>
//                     <p>
//                         Max: ({cumulativeBoundingBox.max.x.toFixed(2)}, {cumulativeBoundingBox.max.y.toFixed(2)}, {cumulativeBoundingBox.max.z.toFixed(2)})
//                     </p>
//                 </div>
//             )}
//             {boundingBoxes.length > 0 && (
//                 <div>
//                     <h2>Individual Bounding Boxes:</h2>
//                     {boundingBoxes.map((fileResult, index) => (
//                         <div key={index}>
//                             <h3>{fileResult.filePath}</h3>
//                             {fileResult.error ? (
//                                 <p>Error: {fileResult.error}</p>
//                             ) : (
//                                 <ul>
//                                     {fileResult.boundingBoxes.map((box, boxIndex) => (
//                                         <li key={boxIndex}>
//                                             {box.meshName}: Min ({box.min.x.toFixed(2)}, {box.min.y.toFixed(2)}, {box.min.z.toFixed(2)}),
//                                             Max ({box.max.x.toFixed(2)}, {box.max.y.toFixed(2)}, {box.max.z.toFixed(2)})
//                                         </li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default Fbxload;

import React, { useEffect, useRef, useState } from 'react';
import { calculateBoundingBoxes } from './Bbload';
import { createCustomOctree, visualizeCustomOctree, initializeScene } from './Octreecreation';
import * as BABYLON from '@babylonjs/core';

function Fbxload() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [conversionResults, setConversionResults] = useState([]);
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
    const [loadedMeshes, setLoadedMeshes] = useState([]);
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);

    const handleFileSelect = () => {
        window.api.send('open-file-dialog');
    };

    useEffect(() => {
        let scene;
        if (canvasRef.current && !sceneRef.current) {
            const { scene: newScene, engine } = initializeScene(canvasRef.current);
            sceneRef.current = newScene;
            scene = newScene;

            // Add camera control for easier navigation
            const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
            camera.setPosition(new BABYLON.Vector3(0, 5, -10));
            camera.attachControl(canvasRef.current, true);
        }

        window.api.receive('gbl-file-content', (fileInfoArray) => {
            if (fileInfoArray && fileInfoArray.length > 0) {
                console.log('Selected files:', fileInfoArray);
                window.api.send('fbx-gltf-converter', fileInfoArray);
            } else {
                console.log('No files selected');
            }
        });

        window.api.receive('fbx-conversion-success', async (results) => {
            console.log('Conversion results:', results);
            setConversionResults(results);
            try {
                const { individualResults, cumulativeBoundingBox, meshes } = await calculateBoundingBoxes(results, canvasRef.current);
                console.log('Individual results:', individualResults);
                console.log('Cumulative bounding box:', cumulativeBoundingBox);
                console.log('Loaded meshes:', meshes);

                setBoundingBoxes(individualResults);
                setCumulativeBoundingBox(cumulativeBoundingBox);
                setLoadedMeshes(meshes);

                if (!cumulativeBoundingBox || !cumulativeBoundingBox.min || !cumulativeBoundingBox.max) {
                    console.error('Invalid cumulative bounding box:', cumulativeBoundingBox);
                    return;
                }

                const size = {
                    x: cumulativeBoundingBox.max.x - cumulativeBoundingBox.min.x,
                    y: cumulativeBoundingBox.max.y - cumulativeBoundingBox.min.y,
                    z: cumulativeBoundingBox.max.z - cumulativeBoundingBox.min.z
                };
                const center = {
                    x: (cumulativeBoundingBox.max.x + cumulativeBoundingBox.min.x) / 2,
                    y: (cumulativeBoundingBox.max.y + cumulativeBoundingBox.min.y) / 2,
                    z: (cumulativeBoundingBox.max.z + cumulativeBoundingBox.min.z) / 2
                };

                console.log("Calculated size:", size);
                console.log("Calculated center:", center);

                if (scene) {
                    try {
                        const customOctree = createCustomOctree(scene, size, center, meshes);
                        console.log("Custom octree creation result:", customOctree);
                        visualizeCustomOctree(scene, customOctree);
                        console.log("Custom octree created and visualized successfully");

                        // Display inserted data
                        console.log("Displaying inserted data:");
                        customOctree.displayInsertedData();

                        // Add meshes to the scene
                        meshes.forEach(mesh => {
                            mesh.setParent(null);
                            scene.addMesh(mesh);
                        });
                    } catch (error) {
                        console.error("Error in custom octree creation or visualization:", error);
                    }
                } else {
                    console.error("Scene is not initialized");
                }

            } catch (error) {
                console.error("Error processing conversion results:", error);
            }
        });

        return () => {
            if (scene) {
                scene.dispose();
            }
        };
    }, []);
    return (
        <div>
            <button
                onClick={handleFileSelect}
                className="mb-4 mr-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Select FBX File
            </button>
            <canvas ref={canvasRef} style={{ width: '100%', height: '400px' }} />

            {cumulativeBoundingBox && (
                <div>
                    <h2>Cumulative Bounding Box:</h2>
                    <p>
                        Min: ({cumulativeBoundingBox.min.x.toFixed(2)}, {cumulativeBoundingBox.min.y.toFixed(2)}, {cumulativeBoundingBox.min.z.toFixed(2)})
                    </p>
                    <p>
                        Max: ({cumulativeBoundingBox.max.x.toFixed(2)}, {cumulativeBoundingBox.max.y.toFixed(2)}, {cumulativeBoundingBox.max.z.toFixed(2)})
                    </p>
                </div>
            )}
            {boundingBoxes.length > 0 && (
                <div>
                    <h2>Individual Bounding Boxes:</h2>
                    {boundingBoxes.map((fileResult, index) => (
                        <div key={index}>
                            <h3>{fileResult.filePath}</h3>
                            {fileResult.error ? (
                                <p>Error: {fileResult.error}</p>
                            ) : (
                                <ul>
                                    {fileResult.boundingBoxes.map((box, boxIndex) => (
                                        <li key={boxIndex}>
                                            {box.meshName}: Min ({box.min.x.toFixed(2)}, {box.min.y.toFixed(2)}, {box.min.z.toFixed(2)}),
                                            Max ({box.max.x.toFixed(2)}, {box.max.y.toFixed(2)}, {box.max.z.toFixed(2)})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Fbxload;