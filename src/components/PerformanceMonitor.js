// import React, { useEffect, useState } from 'react';

// const PerformanceMonitor = ({ scene, engine }) => {
//     const [fps, setFps] = useState(0);
//     const [memoryUsage, setMemoryUsage] = useState({
//         totalJSHeapSize: 0,
//         usedJSHeapSize: 0,
//         jsHeapSizeLimit: 0
//     });

//     useEffect(() => {
//         if (!scene || !engine) return;

//         let fpsInterval;
//         let memoryInterval;

//         // FPS monitoring
//         const updateFPS = () => {
//             setFps(engine.getFps().toFixed());
//         };

//         // Memory monitoring
//         const updateMemoryUsage = () => {
//             if (window.performance && window.performance.memory) {
//                 const memory = window.performance.memory;
//                 setMemoryUsage({
//                     totalJSHeapSize: (memory.totalJSHeapSize / (1024 * 1024)).toFixed(2),
//                     usedJSHeapSize: (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
//                     jsHeapSizeLimit: (memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)
//                 });
//             }
//         };

//         // Start monitoring
//         fpsInterval = setInterval(updateFPS, 1000);
//         memoryInterval = setInterval(updateMemoryUsage, 1000);

//         // Scene statistics observer
//         const sceneStatsObserver = scene.onAfterRenderObservable.add(() => {
//             if (scene.getActiveMeshes().length > 0) {
//                 const stats = scene.getStatsId();
//                 console.log('Active Meshes:', scene.getActiveMeshes().length);
//                 console.log('Draw Calls:', stats.drawCallsCount);
//                 console.log('Total Vertices:', stats.totalVertices);
//                 console.log('Total Faces:', stats.totalFaces);
//             }
//         });

//         return () => {
//             clearInterval(fpsInterval);
//             clearInterval(memoryInterval);
//             if (sceneStatsObserver) {
//                 scene.onAfterRenderObservable.remove(sceneStatsObserver);
//             }
//         };
//     }, [scene, engine]);

//     return (
//         <div className="fixed top-0 left-0 bg-black bg-opacity-50 text-white p-4 rounded m-2">
//             <div>FPS: {fps}</div>
//             <div>Total Heap Size: {memoryUsage.totalJSHeapSize} MB</div>
//             <div>Used Heap Size: {memoryUsage.usedJSHeapSize} MB</div>
//             <div>Heap Size Limit: {memoryUsage.jsHeapSizeLimit} MB</div>
//         </div>
//     );
// };

// export default PerformanceMonitor;

// import React, { useEffect, useState, useRef } from 'react';
// import * as BABYLON from '@babylonjs/core';

// const PerformanceMonitor = ({ scene, engine }) => {
//     const [metrics, setMetrics] = useState({
//         fps: 0,
//         drawCalls: 0,
//         triangles: 0,
//         vertices: 0,
//         meshes: 0,
//         memoryMB: 0
//     });

//     const frameCountRef = useRef(0);
//     const lastTimeRef = useRef(Date.now());

//     useEffect(() => {
//         if (!scene || !engine) return;

//         // Enable instrumentation for performance metrics
//         const instrumentation = new BABYLON.EngineInstrumentation(engine);
//         instrumentation.captureGPUFrameTime = true;
//         instrumentation.captureShaderCompilationTime = true;

//         // Enable the inspector to get more detailed stats (optional)
//         // scene.debugLayer.show();

//         const updateMetrics = () => {
//             frameCountRef.current++;
//             const currentTime = Date.now();
//             const deltaTime = currentTime - lastTimeRef.current;

//             // Update FPS every second
//             if (deltaTime >= 1000) {
//                 const fps = (frameCountRef.current * 1000) / deltaTime;
//                 frameCountRef.current = 0;
//                 lastTimeRef.current = currentTime;

//                 // Get scene statistics
//                 const activeTriangles = scene.getActiveIndices() / 3;
//                 const activeVertices = scene.getActiveVertices();
//                 const activeMeshes = scene.getActiveMeshes().length;
//                 const totalDrawCalls = engine.drawCalls;

//                 // Calculate approximate memory usage (this is an estimation)
//                 const vertexMemory = activeVertices * 32; // 32 bytes per vertex (position, normal, uv)
//                 const indexMemory = (activeTriangles * 3) * 4; // 4 bytes per index
//                 const approximateMemoryBytes = vertexMemory + indexMemory;
//                 const approximateMemoryMB = (approximateMemoryBytes / (1024 * 1024)).toFixed(2);

//                 setMetrics({
//                     fps: fps.toFixed(0),
//                     drawCalls: totalDrawCalls,
//                     triangles: activeTriangles.toFixed(0),
//                     vertices: activeVertices,
//                     meshes: activeMeshes,
//                     memoryMB: approximateMemoryMB
//                 });
//             }
//         };

//         // Create observer for scene
//         const observer = scene.onAfterRenderObservable.add(updateMetrics);

//         // Optional: Add additional observers for more detailed metrics
//         scene.getEngine().onEndFrameObservable.add(() => {
//             if (instrumentation.gpuFrameTimeCounter.current) {
//                 console.log('GPU Frame Time:', instrumentation.gpuFrameTimeCounter.current);
//             }
//         });

//         return () => {
//             scene.onAfterRenderObservable.remove(observer);
//             instrumentation.dispose();
//         };
//     }, [scene, engine]);

//     return (
//         <div className="fixed top-0 left-0 bg-black bg-opacity-75 text-white p-4 rounded m-2 font-mono">
//             <div>FPS: {metrics.fps}</div>
//             <div>Draw Calls: {metrics.drawCalls}</div>
//             <div>Triangles: {metrics.triangles}</div>
//             <div>Vertices: {metrics.vertices}</div>
//             <div>Active Meshes: {metrics.meshes}</div>
//             <div>Approx. Memory: {metrics.memoryMB} MB</div>
//         </div>
//     );
// };

// export default PerformanceMonitor;


// import React, { useEffect, useState, useRef } from 'react';
// import * as BABYLON from '@babylonjs/core';

// const PerformanceMonitor = ({ scene, engine }) => {
//     const [metrics, setMetrics] = useState({
//         fps: 0,
//         drawCalls: 0,
//         triangles: 0,
//         vertices: 0,
//         meshes: 0,
//         memoryMB: 0
//     });

//     const frameCountRef = useRef(0);
//     const lastTimeRef = useRef(Date.now());

//     useEffect(() => {
//         if (!scene || !engine) return;

//         // Enable instrumentation for performance metrics
//         const instrumentation = new BABYLON.EngineInstrumentation(engine);
//         instrumentation.captureGPUFrameTime = true;
//         instrumentation.captureShaderCompilationTime = true;

//         const updateMetrics = () => {
//             frameCountRef.current++;
//             const currentTime = Date.now();
//             const deltaTime = currentTime - lastTimeRef.current;

//             // Update metrics every second
//             if (deltaTime >= 1000) {
//                 const fps = (frameCountRef.current * 1000) / deltaTime;
//                 frameCountRef.current = 0;
//                 lastTimeRef.current = currentTime;

//                 // Calculate total vertices and triangles from active meshes
//                 let totalVertices = 0;
//                 let totalTriangles = 0;
//                 const activeMeshes = scene.getActiveMeshes();
//                 const meshCount = activeMeshes.length;

//                 activeMeshes.forEach(meshInfo => {
//                     const mesh = meshInfo.mesh;
//                     if (mesh.getTotalVertices) {
//                         totalVertices += mesh.getTotalVertices();
//                     }
//                     if (mesh.getTotalIndices) {
//                         totalTriangles += mesh.getTotalIndices() / 3;
//                     }
//                 });

//                 // Get draw calls from engine statistics
//                 const drawCalls = engine.drawCalls;

//                 // Calculate approximate memory usage
//                 const vertexMemory = totalVertices * 32; // 32 bytes per vertex (position, normal, uv)
//                 const indexMemory = totalTriangles * 3 * 4; // 4 bytes per index
//                 const approximateMemoryBytes = vertexMemory + indexMemory;
//                 const approximateMemoryMB = (approximateMemoryBytes / (1024 * 1024)).toFixed(2);

//                 setMetrics({
//                     fps: fps.toFixed(0),
//                     drawCalls: drawCalls,
//                     triangles: totalTriangles.toFixed(0),
//                     vertices: totalVertices,
//                     meshes: meshCount,
//                     memoryMB: approximateMemoryMB
//                 });
//             }
//         };

//         // Create observer for scene
//         const observer = scene.onAfterRenderObservable.add(updateMetrics);

//         // Optional: Log GPU time
//         scene.getEngine().onEndFrameObservable.add(() => {
//             if (instrumentation.gpuFrameTimeCounter.current) {
//                 console.log('GPU Frame Time:', instrumentation.gpuFrameTimeCounter.current);
//             }
//         });

//         return () => {
//             scene.onAfterRenderObservable.remove(observer);
//             instrumentation.dispose();
//         };
//     }, [scene, engine]);

//     return (
//         <div className="fixed top-0 left-0 bg-black bg-opacity-75 text-white p-4 rounded m-2 font-mono">
//             <div>FPS: {metrics.fps}</div>
//             <div>Draw Calls: {metrics.drawCalls}</div>
//             <div>Triangles: {metrics.triangles}</div>
//             <div>Vertices: {metrics.vertices}</div>
//             <div>Active Meshes: {metrics.meshes}</div>
//             <div>Approx. Memory: {metrics.memoryMB} MB</div>
//         </div>
//     );
// };

// export default PerformanceMonitor;

// import React, { useEffect, useState, useRef } from 'react';
// import * as BABYLON from '@babylonjs/core';

// const PerformanceMonitor = ({ scene, engine }) => {
//     const [metrics, setMetrics] = useState({
//         fps: 0,
//         drawCalls: 0,
//         triangles: 0,
//         vertices: 0,
//         meshes: 0,
//         memoryMB: 0
//     });

//     const frameCountRef = useRef(0);
//     const lastTimeRef = useRef(Date.now());

//     useEffect(() => {
//         if (!scene || !engine) return;

//         // Enable instrumentation for performance metrics
//         const instrumentation = new BABYLON.EngineInstrumentation(engine);
//         instrumentation.captureGPUFrameTime = true;

//         const updateMetrics = () => {
//             frameCountRef.current++;
//             const currentTime = Date.now();
//             const deltaTime = currentTime - lastTimeRef.current;

//             // Update metrics every second
//             if (deltaTime >= 1000) {
//                 const fps = (frameCountRef.current * 1000) / deltaTime;
//                 frameCountRef.current = 0;
//                 lastTimeRef.current = currentTime;

//                 // Calculate total vertices and triangles from meshes
//                 let totalVertices = 0;
//                 let totalTriangles = 0;
//                 let meshCount = 0;

//                 // Safely get meshes from scene
//                 const meshes = scene.meshes || [];

//                 meshes.forEach(mesh => {
//                     // Validate mesh and ensure it has geometry
//                     if (mesh && mesh.geometry) {
//                         meshCount++;

//                         // Safely get vertex count
//                         try {
//                             const vertexCount = mesh.getTotalVertices();
//                             if (typeof vertexCount === 'number') {
//                                 totalVertices += vertexCount;
//                             }
//                         } catch (e) {
//                             console.warn('Error getting vertex count for mesh:', mesh.name);
//                         }

//                         // Safely get triangle count
//                         try {
//                             const indices = mesh.getTotalIndices();
//                             if (typeof indices === 'number') {
//                                 totalTriangles += indices / 3;
//                             }
//                         } catch (e) {
//                             console.warn('Error getting indices for mesh:', mesh.name);
//                         }
//                     }
//                 });

//                 // Get draw calls
//                 const drawCalls = engine.drawCalls || 0;

//                 // Calculate approximate memory usage
//                 const vertexMemory = totalVertices * 32; // 32 bytes per vertex (position, normal, uv)
//                 const indexMemory = totalTriangles * 3 * 4; // 4 bytes per index
//                 const approximateMemoryBytes = vertexMemory + indexMemory;
//                 const approximateMemoryMB = (approximateMemoryBytes / (1024 * 1024)).toFixed(2);

//                 setMetrics({
//                     fps: fps.toFixed(0),
//                     drawCalls: drawCalls,
//                     triangles: Math.floor(totalTriangles),
//                     vertices: totalVertices,
//                     meshes: meshCount,
//                     memoryMB: approximateMemoryMB
//                 });
//             }
//         };

//         // Create observer for scene
//         const observer = scene.onAfterRenderObservable.add(updateMetrics);

//         return () => {
//             if (scene && scene.onAfterRenderObservable) {
//                 scene.onAfterRenderObservable.remove(observer);
//             }
//             if (instrumentation) {
//                 instrumentation.dispose();
//             }
//         };
//     }, [scene, engine]);

//     return (
//         <div className="fixed top-0 left-0 bg-black bg-opacity-75 text-white p-4 rounded m-2 font-mono">
//             <div>FPS: {metrics.fps}</div>
//             <div>Draw Calls: {metrics.drawCalls}</div>
//             <div>Triangles: {metrics.triangles.toLocaleString()}</div>
//             <div>Vertices: {metrics.vertices.toLocaleString()}</div>
//             <div>Active Meshes: {metrics.meshes}</div>
//             <div>Approx. Memory: {metrics.memoryMB} MB</div>
//         </div>
//     );
// };

// export default PerformanceMonitor;


import React, { useEffect, useState, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

const EnhancedPerformanceMonitor = ({ scene, engine }) => {
    const [metrics, setMetrics] = useState({
        fps: 0,
        drawCalls: 0,
        triangles: 0,
        vertices: 0,
        meshes: 0,
        geometryMemoryMB: 0,
        totalHeapMB: 0,
        usedHeapMB: 0,
        heapLimitMB: 0
    });

    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(Date.now());
    const memoryWarningIssued = useRef(false);

    useEffect(() => {
        if (!scene || !engine) return;

        const WARNING_THRESHOLD_MB = 1024; // 1GB
        const CRITICAL_THRESHOLD_MB = 1536; // 1.5GB

        const checkMemoryUsage = () => {
            if (window.performance && window.performance.memory) {
                const memoryInfo = window.performance.memory;
                const usedHeapMB = memoryInfo.usedJSHeapSize / (1024 * 1024);

                // Warning check
                if (usedHeapMB > WARNING_THRESHOLD_MB && !memoryWarningIssued.current) {
                    console.warn(`High memory usage detected: ${usedHeapMB.toFixed(2)} MB`);
                    memoryWarningIssued.current = true;
                }

                // Critical check
                if (usedHeapMB > CRITICAL_THRESHOLD_MB) {
                    console.error(`Critical memory usage: ${usedHeapMB.toFixed(2)} MB`);
                    // Optionally trigger cleanup or alert user
                    scene.dispose();
                    throw new Error('Memory usage exceeded safe limits');
                }

                return {
                    total: memoryInfo.totalJSHeapSize / (1024 * 1024),
                    used: usedHeapMB,
                    limit: memoryInfo.jsHeapSizeLimit / (1024 * 1024)
                };
            }
            return null;
        };

        const updateMetrics = () => {
            frameCountRef.current++;
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTimeRef.current;

            if (deltaTime >= 1000) {
                const fps = (frameCountRef.current * 1000) / deltaTime;
                frameCountRef.current = 0;
                lastTimeRef.current = currentTime;

                // Geometry metrics
                let totalVertices = 0;
                let totalTriangles = 0;
                let meshCount = 0;
                const meshes = scene.meshes || [];

                meshes.forEach(mesh => {
                    if (mesh && mesh.geometry) {
                        meshCount++;
                        try {
                            totalVertices += mesh.getTotalVertices() || 0;
                            totalTriangles += (mesh.getTotalIndices() || 0) / 3;
                        } catch (e) {
                            console.warn('Error getting mesh metrics:', e);
                        }
                    }
                });

                // Memory metrics
                const geometryMemory = (totalVertices * 32 + totalTriangles * 12) / (1024 * 1024);
                const systemMemory = checkMemoryUsage();

                setMetrics({
                    fps: fps.toFixed(0),
                    drawCalls: engine.drawCalls || 0,
                    triangles: Math.floor(totalTriangles),
                    vertices: totalVertices,
                    meshes: meshCount,
                    geometryMemoryMB: geometryMemory.toFixed(2),
                    totalHeapMB: systemMemory ? systemMemory.total.toFixed(2) : 'N/A',
                    usedHeapMB: systemMemory ? systemMemory.used.toFixed(2) : 'N/A',
                    heapLimitMB: systemMemory ? systemMemory.limit.toFixed(2) : 'N/A'
                });
            }
        };

        const observer = scene.onAfterRenderObservable.add(updateMetrics);

        return () => {
            if (scene && scene.onAfterRenderObservable) {
                scene.onAfterRenderObservable.remove(observer);
            }
        };
    }, [scene, engine]);

    return (
        <div className="fixed top-0 left-0 bg-black bg-opacity-75 text-white p-4 rounded m-2 font-mono">
            <div>FPS: {metrics.fps}</div>
            <div>Draw Calls: {metrics.drawCalls}</div>
            <div>Triangles: {metrics.triangles.toLocaleString()}</div>
            <div>Vertices: {metrics.vertices.toLocaleString()}</div>
            <div>Active Meshes: {metrics.meshes}</div>
            <div>Geometry Memory: {metrics.geometryMemoryMB} MB</div>
            <div className="mt-2 border-t pt-2">System Memory:</div>
            <div>Used Heap: {metrics.usedHeapMB} MB</div>
            <div>Total Heap: {metrics.totalHeapMB} MB</div>
            <div>Heap Limit: {metrics.heapLimitMB} MB</div>
        </div>
    );
};

export default EnhancedPerformanceMonitor;