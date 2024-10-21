import React, { useRef, useEffect, useState } from 'react';
import { BabylonSceneManager } from './babylonSceneManager';

function BabylonComponent() {
    const canvasRef = useRef(null);
    const [sceneManager, setSceneManager] = useState(null);

    useEffect(() => {
        if (canvasRef.current) {
            const manager = new BabylonSceneManager(canvasRef.current);
            manager.startRenderLoop();
            setSceneManager(manager);

            window.addEventListener('resize', manager.resize.bind(manager));

            return () => {
                window.removeEventListener('resize', manager.resize.bind(manager));
                manager.engine.dispose();
            };
        }
    }, []);

    const handleFileInput = async (event) => {
        const files = event.target.files;
        const meshes = [];

        for (let file of files) {
            try {
                const data = await readFileAsArrayBuffer(file);
                const loadedMeshes = await sceneManager.loadGLBFile(data);
                meshes.push(...loadedMeshes);
            } catch (error) {
                console.error(`Error loading file ${file.name}:`, error);
            }
        }

        if (meshes.length > 0) {
            const boundingInfo = sceneManager.calculateCumulativeBoundingBox(meshes);
            sceneManager.setCameraPosition(boundingInfo);
        }
    };

    const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    };

    return (
        <div>
            <input type="file" multiple onChange={handleFileInput} accept=".glb" />
            <canvas ref={canvasRef} style={{ width: '100%', height: '600px' }} />
        </div>
    );
}

export default BabylonComponent;