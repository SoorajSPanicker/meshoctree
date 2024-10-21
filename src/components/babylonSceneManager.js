import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class BabylonSceneManager {
    constructor(canvas) {
        this.engine = new BABYLON.Engine(canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), this.scene);
        this.camera.attachControl(canvas, true);
        this.light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    }

    startRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    resize() {
        this.engine.resize();
    }

    async loadGLBFile(data) {
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);
        try {
            const assetContainer = await BABYLON.SceneLoader.LoadAssetContainerAsync("", url, this.scene, null, ".glb");
            assetContainer.addAllToScene();
            URL.revokeObjectURL(url);
            return assetContainer.meshes;
        } catch (error) {
            console.error('Error loading GLB file:', error);
            URL.revokeObjectURL(url);
            throw error;
        }
    }

    calculateCumulativeBoundingBox(meshes) {
        let min = meshes[0].getBoundingInfo().boundingBox.minimumWorld;
        let max = meshes[0].getBoundingInfo().boundingBox.maximumWorld;

        for (let i = 1; i < meshes.length; i++) {
            const boundingInfo = meshes[i].getBoundingInfo();
            const boundingBox = boundingInfo.boundingBox;
            min = BABYLON.Vector3.Minimize(min, boundingBox.minimumWorld);
            max = BABYLON.Vector3.Maximize(max, boundingBox.maximumWorld);
        }

        return new BABYLON.BoundingInfo(min, max);
    }

    setCameraPosition(boundingInfo) {
        const center = boundingInfo.boundingBox.center;
        const diagonal = boundingInfo.boundingBox.maximumWorld.subtract(boundingInfo.boundingBox.minimumWorld);
        const radius = diagonal.length() / 2;

        this.camera.setPosition(new BABYLON.Vector3(
            center.x,
            center.y,
            center.z + radius * 2
        ));

        this.camera.setTarget(center);
    }
}