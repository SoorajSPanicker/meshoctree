import React, { useEffect, useRef, useState } from 'react';
import GlbodifierComponent from './GlbodifierComponent';
import { calculateBoundingBoxes } from './Bbload';
import { calculateCumulativeBoundingBox } from './Cumulativebb';
import { createOctree, initializeScene, visualizeOctree } from './Octreecreation';

function Fbxload() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [conversionResults, setConversionResults] = useState([]);
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [cumulativeBoundingBox, setCumulativeBoundingBox] = useState(null);
    const canvasRef = useRef(null);
    const sceneRef = useRef(null);

    const handleFileSelect = () => {
        window.api.send('open-file-dialog');
    };

    useEffect(() => {
        if (canvasRef.current && !sceneRef.current) {
            const { scene, engine } = initializeScene(canvasRef.current);
            sceneRef.current = scene;
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
            const { individualResults, cumulativeBoundingBox } = await calculateBoundingBoxes(results, canvasRef.current);
            setBoundingBoxes(individualResults);
            setCumulativeBoundingBox(cumulativeBoundingBox);

            const size = {
                x: cumulativeBoundingBox.max._x - cumulativeBoundingBox.min._x,
                y: cumulativeBoundingBox.max._y - cumulativeBoundingBox.min._y,
                z: cumulativeBoundingBox.max._z - cumulativeBoundingBox.min._z
            };
            console.log(size);
            const center = {
                x: (cumulativeBoundingBox.max._x + cumulativeBoundingBox.min._x) / 2,
                y: (cumulativeBoundingBox.max._y + cumulativeBoundingBox.min._y) / 2,
                z: (cumulativeBoundingBox.max._z + cumulativeBoundingBox.min._z) / 2
            };
            console.log(center);
            const { octree, rootMesh } = createOctree(sceneRef.current, size, center);
            visualizeOctree(sceneRef.current, octree, rootMesh);
            console.log(octree);
        });

        return () => {
            if (sceneRef.current) {
                sceneRef.current.dispose();
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