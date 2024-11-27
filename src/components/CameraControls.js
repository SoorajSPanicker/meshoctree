// import React from 'react';
// import * as BABYLON from '@babylonjs/core';
// import { FreeCameraMouseInput } from './FreeCameraMouseInput'; // You'll need to ensure this is properly imported
// import './Fbxload.css'
// const CameraControls = ({ scene, canvas, updateLODVisibility, maxDistance }) => {
//     const handleOrbitCamera = () => {
//         if (!scene || !scene.activeCamera) return;

//         // Store current camera position and target
//         const cameraPosition = scene.activeCamera.position.clone();
//         const cameraTarget = scene.activeCamera.target ? 
//             scene.activeCamera.target.clone() : 
//             scene.activeCamera.getTarget().clone();

//         // Remove old camera
//         scene.activeCamera.dispose();

//         // Create new ArcRotate camera
//         const camera = new BABYLON.ArcRotateCamera(
//             "arcCamera",
//             Math.PI / 4, // alpha
//             Math.PI / 3, // beta
//             scene.activeCamera.radius || maxDistance, // radius
//             cameraTarget,
//             scene
//         );

//         // Configure camera
//         camera.setPosition(cameraPosition);
//         camera.minZ = 0.001;
//         camera.wheelDeltaPercentage = 0.01;
//         camera.pinchDeltaPercentage = 0.01;
//         camera.wheelPrecision = 50;
//         camera.panningSensibility = 100;
//         camera.angularSensibilityX = 500;
//         camera.angularSensibilityY = 500;
//         camera.useBouncingBehavior = true;
//         camera.useAutoRotationBehavior = false;
//         camera.panningAxis = new BABYLON.Vector3(1, 1, 0);
//         camera.pinchToPanMaxDistance = 100;

//         camera.attachControl(canvas, true);
//         scene.activeCamera = camera;

//         // Re-add observer for LOD updates
//         camera.onViewMatrixChangedObservable.add(() => {
//             updateLODVisibility();
//         });
//     };

//     const handleFlyCamera = () => {
//         if (!scene || !scene.activeCamera) return;

//         // Store current camera position and target
//         const cameraPosition = scene.activeCamera.position.clone();
//         const cameraTarget = scene.activeCamera.target ? 
//             scene.activeCamera.target.clone() : 
//             scene.activeCamera.getTarget().clone();

//         // Remove old camera
//         scene.activeCamera.dispose();

//         // Create new Free camera
//         const camera = new BABYLON.FreeCamera("flyCamera", cameraPosition, scene);
//         camera.setTarget(cameraTarget);

//         // Setup custom mouse input
//         const mouseInput = new FreeCameraMouseInput();
//         mouseInput.camera = camera;

//         camera.inputs.clear();
//         camera.inputs.add(mouseInput);

//         // Camera settings
//         camera.speed = 0.5;
//         camera.inertia = 0.9;
//         camera.angularSensibility = 1000;
//         camera.minZ = 0.001;

//         camera.attachControl(canvas, true);
//         scene.activeCamera = camera;

//         // Re-add observer for LOD updates
//         camera.onViewMatrixChangedObservable.add(() => {
//             updateLODVisibility();
//         });
//     };

//     return (
//         <div id='rightopt' style={{ right: '0px' }} >
//                 <i class="fa-solid fa-circle-info  button " title='Tag Info' onClick={handleOrbitCamera} ></i>
//                 <i class="fa fa-search-plus button" title='Zoomin' onClick={handleFlyCamera}></i>
//             </div>
//     );
// };

// export default CameraControls;

// import React from 'react';
// import * as BABYLON from '@babylonjs/core';
// import './Fbxload.css'
// // // First define the FreeCameraMouseInput class exactly as in your code
// // const FreeCameraMouseInput = function () {
// //     this.buttons = [];
// //     this.angularSensibility = 2000.0;
// //     this.offsetX = 0;
// //     this.offsetY = 0;
// //     this.direction = new BABYLON.Vector3(0, 0, 0);
// // }

// // FreeCameraMouseInput.prototype.attachControl = function (element, noPreventDefault) {
// //     var _this = this;
// //     if (!this._pointerInput) {
// //         this._pointerInput = function (p, s) {
// //             var evt = p.event;
// //             if (evt.pointerType != 'mouse') return;
// //             if (p.type == BABYLON.PointerEventTypes.POINTERDOWN) {
// //                 try {
// //                     evt.srcElement.setPointerCapture(evt.pointerId);
// //                 }
// //                 catch (e) { }
// //                 if (_this.buttons.length == 0) _this.buttons.push(evt.button);
// //                 _this.previousPosition = {
// //                     x: evt.clientX,
// //                     y: evt.clientY
// //                 };
// //                 if (!noPreventDefault) {
// //                     evt.preventDefault();
// //                 }
// //             }
// //             else if (p.type == BABYLON.PointerEventTypes.POINTERUP) {
// //                 try {
// //                     evt.srcElement.releasePointerCapture(evt.pointerId);
// //                 }
// //                 catch (e) { }
// //                 if (_this.buttons.length != 0) _this.buttons.pop();
// //                 _this.previousPosition = null;
// //                 _this.offsetX = 0;
// //                 _this.offsetY = 0;
// //                 if (!noPreventDefault) evt.preventDefault();
// //             }
// //             else if (p.type == BABYLON.PointerEventTypes.POINTERMOVE) {
// //                 if (!_this.previousPosition) return;
// //                 _this.offsetX = evt.clientX - _this.previousPosition.x;
// //                 _this.offsetY = evt.clientY - _this.previousPosition.y;
// //                 if (!noPreventDefault) evt.preventDefault();
// //             }
// //         };
// //     }
// //     this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput,
// //         BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
// // }

// // FreeCameraMouseInput.prototype.detachControl = function (element) {
// //     if (this._observer && element) {
// //         this.camera.getScene().onPointerObservable.remove(this._observer);
// //         this._observer = null;
// //         this.previousPosition = null;
// //     }
// // }

// // FreeCameraMouseInput.prototype.checkInputs = function () {
// //     var speed = this.camera.speed;
// //     if (!this.previousPosition) return;
// //     if (this.buttons.indexOf(0) != -1) {
// //         if (this.camera.getScene().useRightHandedSystem) this.camera.cameraRotation.y -= this.offsetX / (20 * this.angularSensibility);
// //         else this.camera.cameraRotation.y += this.offsetX / (20 * this.angularSensibility);
// //         this.direction.copyFromFloats(0, 0, -this.offsetY * speed / 300);
// //         if (this.camera.getScene().useRightHandedSystem) this.direction.z *= -1;
// //     }
// //     if (this.buttons.indexOf(1) != -1) this.direction.copyFromFloats(this.offsetX * speed / 500, -this.offsetY * speed / 500, 0);
// //     if (this.buttons.indexOf(0) != -1 || this.buttons.indexOf(1) != -1) {
// //         this.camera.getViewMatrix().invertToRef(this.camera._cameraTransformMatrix);
// //         BABYLON.Vector3.TransformNormalToRef(this.direction, this.camera._cameraTransformMatrix, this.camera._transformedDirection);
// //         this.camera.cameraDirection.addInPlace(this.camera._transformedDirection);
// //     }
// // }

// // FreeCameraMouseInput.prototype.getTypeName = function () {
// //     return "FreeCameraMouseInput";
// // }

// // FreeCameraMouseInput.prototype.getSimpleName = function () {
// //     return "mouse";
// // }

// // Updated FreeCameraMouseInput class with proper zoom/forward movement
// const FreeCameraMouseInput = function () {
//     this.buttons = [];
//     this.angularSensibility = 2000.0;
//     this.offsetX = 0;
//     this.offsetY = 0;
//     this.direction = new BABYLON.Vector3(0, 0, 0);
//     this.movementDirection = new BABYLON.Vector3();
// }

// FreeCameraMouseInput.prototype.attachControl = function (element, noPreventDefault) {
//     var _this = this;
//     if (!this._pointerInput) {
//         this._pointerInput = function (p, s) {
//             var evt = p.event;
//             if (evt.pointerType != 'mouse') return;
//             if (p.type == BABYLON.PointerEventTypes.POINTERDOWN) {
//                 try {
//                     evt.srcElement.setPointerCapture(evt.pointerId);
//                 } catch (e) { }
//                 if (_this.buttons.length == 0) _this.buttons.push(evt.button);
//                 _this.previousPosition = {
//                     x: evt.clientX,
//                     y: evt.clientY
//                 };
//                 if (!noPreventDefault) {
//                     evt.preventDefault();
//                 }
//             }
//             else if (p.type == BABYLON.PointerEventTypes.POINTERUP) {
//                 try {
//                     evt.srcElement.releasePointerCapture(evt.pointerId);
//                 } catch (e) { }
//                 if (_this.buttons.length != 0) _this.buttons.pop();
//                 _this.previousPosition = null;
//                 _this.offsetX = 0;
//                 _this.offsetY = 0;
//                 _this.movementDirection.scaleInPlace(0);
//                 if (!noPreventDefault) evt.preventDefault();
//             }
//             else if (p.type == BABYLON.PointerEventTypes.POINTERMOVE) {
//                 if (!_this.previousPosition) return;
//                 _this.offsetX = evt.clientX - _this.previousPosition.x;
//                 _this.offsetY = evt.clientY - _this.previousPosition.y;

//                 // Update movement direction based on mouse drag
//                 if (_this.buttons.indexOf(0) !== -1) {
//                     // Left mouse button - Update forward/backward movement
//                     _this.movementDirection.z = -_this.offsetY * 0.01;
//                 }

//                 if (!noPreventDefault) evt.preventDefault();
//             }
//         };
//     }

//     this._observer = this.camera.getScene().onPointerObservable.add(
//         this._pointerInput,
//         BABYLON.PointerEventTypes.POINTERDOWN |
//         BABYLON.PointerEventTypes.POINTERUP |
//         BABYLON.PointerEventTypes.POINTERMOVE
//     );

//     // Add keyboard controls for WASD movement
//     this._onKeyDown = (evt) => {
//         const speed = 1;
//         switch (evt.key.toLowerCase()) {
//             case 'w':
//                 this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Forward()).scale(speed));
//                 break;
//             case 's':
//                 this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Forward()).scale(-speed));
//                 break;
//             case 'a':
//                 this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Right()).scale(-speed));
//                 break;
//             case 'd':
//                 this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Right()).scale(speed));
//                 break;
//         }
//     };

//     element.addEventListener("keydown", this._onKeyDown);
// };

// FreeCameraMouseInput.prototype.detachControl = function (element) {
//     if (this._observer && element) {
//         this.camera.getScene().onPointerObservable.remove(this._observer);
//         this._observer = null;
//         this.previousPosition = null;
//         element.removeEventListener("keydown", this._onKeyDown);
//     }
// };

// FreeCameraMouseInput.prototype.checkInputs = function () {
//     if (!this.previousPosition) return;

//     // Handle rotation
//     if (this.buttons.indexOf(0) !== -1) {
//         // Rotation
//         this.camera.rotation.y += this.offsetX / this.angularSensibility;
//         this.camera.rotation.x += this.offsetY / this.angularSensibility;

//         // Forward/Backward movement based on mouse drag
//         const forward = this.camera.getDirection(BABYLON.Vector3.Forward());
//         this.camera.position.addInPlace(forward.scale(this.movementDirection.z * this.camera.speed));
//     }

//     // Handle panning with right mouse button
//     if (this.buttons.indexOf(1) !== -1) {
//         const right = this.camera.getDirection(BABYLON.Vector3.Right());
//         const up = BABYLON.Vector3.Up();

//         this.camera.position.addInPlace(right.scale(this.offsetX * 0.01));
//         this.camera.position.addInPlace(up.scale(-this.offsetY * 0.01));
//     }
// };

// FreeCameraMouseInput.prototype.getTypeName = function () {
//     return "FreeCameraMouseInput";
// };

// FreeCameraMouseInput.prototype.getSimpleName = function () {
//     return "mouse";
// };


// // Then define the CameraControls component
// const CameraControls = ({ scene, canvas, updateLODVisibility, maxDistance }) => {
//     const handleOrbitCamera = () => {
//         if (!scene || !scene.activeCamera) return;

//         // Store current camera position and target
//         const cameraPosition = scene.activeCamera.position.clone();
//         const cameraTarget = scene.activeCamera.target ?
//             scene.activeCamera.target.clone() :
//             scene.activeCamera.getTarget().clone();

//         // Remove old camera
//         scene.activeCamera.dispose();

//         // Create new ArcRotate camera
//         const camera = new BABYLON.ArcRotateCamera(
//             "arcCamera",
//             Math.PI / 4, // alpha
//             Math.PI / 3, // beta
//             scene.activeCamera.radius || maxDistance, // radius
//             cameraTarget,
//             scene
//         );

//         // Configure camera
//         camera.setPosition(cameraPosition);
//         camera.minZ = 0.001;
//         camera.wheelDeltaPercentage = 0.01;
//         camera.pinchDeltaPercentage = 0.01;
//         camera.wheelPrecision = 50;
//         camera.panningSensibility = 100;
//         camera.angularSensibilityX = 500;
//         camera.angularSensibilityY = 500;
//         camera.useBouncingBehavior = true;
//         camera.useAutoRotationBehavior = false;
//         camera.panningAxis = new BABYLON.Vector3(1, 1, 0);
//         camera.pinchToPanMaxDistance = 100;

//         camera.attachControl(canvas, true);
//         scene.activeCamera = camera;

//         // Re-add observer for LOD updates
//         camera.onViewMatrixChangedObservable.add(() => {
//             updateLODVisibility();
//         });
//     };

//     const handleFlyCamera = () => {
//         if (!scene || !scene.activeCamera) return;

//         // Store current camera position and target
//         const cameraPosition = scene.activeCamera.position.clone();
//         const cameraTarget = scene.activeCamera.target ?
//             scene.activeCamera.target.clone() :
//             scene.activeCamera.getTarget().clone();

//         // Remove old camera
//         scene.activeCamera.dispose();

//         // Create new Free camera
//         const camera = new BABYLON.FreeCamera("flyCamera", cameraPosition, scene);
//         camera.setTarget(cameraTarget);

//         // Setup custom mouse input using our FreeCameraMouseInput class
//         const mouseInput = new FreeCameraMouseInput();
//         mouseInput.camera = camera;

//         camera.inputs.clear();
//         camera.inputs.add(mouseInput);

//         // Camera settings
//         camera.speed = 0.5;
//         camera.inertia = 0.9;
//         camera.angularSensibility = 1000;
//         camera.minZ = 0.001;

//         camera.attachControl(canvas, true);
//         scene.activeCamera = camera;

//         // Re-add observer for LOD updates
//         camera.onViewMatrixChangedObservable.add(() => {
//             updateLODVisibility();
//         });
//     };

//     return (
//         // <div id='rightopt' style={{ position: 'absolute', right: '0px', top: '10px' }}>
//         //     <i
//         //         className="fa-solid fa-circle-info button"
//         //         title='Orbit Camera'
//         //         onClick={handleOrbitCamera}
//         //         style={{ cursor: 'pointer', margin: '0 5px', fontSize: '24px' }}
//         //     />
//         //     <i
//         //         className="fa fa-search-plus button"
//         //         title='Fly Camera'
//         //         onClick={handleFlyCamera}
//         //         style={{ cursor: 'pointer', margin: '0 5px', fontSize: '24px' }}
//         //     />
//         // </div>
//         <div id='rightopt' style={{ right: '0px' }} >
//             <i class="fa-solid fa-circle-info  button " title='Tag Info' onClick={handleOrbitCamera} ></i>
//             <i class="fa fa-search-plus button" title='Zoomin' onClick={handleFlyCamera}></i>
//         </div>
//     );
// };

// export default CameraControls;

import React from 'react';
import * as BABYLON from '@babylonjs/core';
import './Fbxload.css';

class FreeCameraMouseInput {
    constructor(camera) {
        this.camera = camera;
        this.buttons = [];
        this.angularSensibility = 2000.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.direction = new BABYLON.Vector3(0, 0, 0);
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    attachControl(element, noPreventDefault) {
        this._element = element;
        
        // Mouse movement handling
        this._pointerInput = (p) => {
            const evt = p.event;
            if (evt.pointerType !== 'mouse') return;

            if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                try {
                    evt.srcElement.setPointerCapture(evt.pointerId);
                } catch (e) { }
                
                this.buttons.push(evt.button);
                this.previousPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                };
                
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            }
            else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                try {
                    evt.srcElement.releasePointerCapture(evt.pointerId);
                } catch (e) { }
                
                this.buttons = [];
                this.previousPosition = null;
                this.offsetX = 0;
                this.offsetY = 0;
                
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            }
            else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE && this.previousPosition) {
                this.offsetX = evt.clientX - this.previousPosition.x;
                this.offsetY = evt.clientY - this.previousPosition.y;
                
                this.previousPosition = {
                    x: evt.clientX,
                    y: evt.clientY
                };
                
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            }
        };

        this._observer = this.camera.getScene().onPointerObservable.add(
            this._pointerInput,
            BABYLON.PointerEventTypes.POINTERDOWN |
            BABYLON.PointerEventTypes.POINTERUP |
            BABYLON.PointerEventTypes.POINTERMOVE
        );

        // Keyboard controls
        element.addEventListener("keydown", this._onKeyDown);
        element.tabIndex = 1;
        element.focus();
    }

    detachControl() {
        if (this._observer) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
        }
        if (this._element) {
            this._element.removeEventListener("keydown", this._onKeyDown);
        }
        this.buttons = [];
        this.previousPosition = null;
    }

    checkInputs() {
        if (this.buttons.length === 0) {
            return;
        }

        if (this.buttons[0] === 0) { // Left mouse button
            // Rotation
            if (this.offsetX) {
                this.camera.rotation.y += this.offsetX / this.angularSensibility;
            }
            if (this.offsetY) {
                this.camera.rotation.x += this.offsetY / this.angularSensibility;
            }

            // Forward/backward movement based on looking direction
            const speed = 0.5;
            const forward = this.camera.getDirection(BABYLON.Vector3.Forward());
            forward.scaleInPlace(-this.offsetY * speed * 0.01);
            this.camera.position.addInPlace(forward);
        }
        else if (this.buttons[0] === 2) { // Right mouse button
            // Panning
            const speed = 0.5;
            const right = this.camera.getDirection(BABYLON.Vector3.Right());
            const up = BABYLON.Vector3.Up();
            
            right.scaleInPlace(this.offsetX * speed * 0.01);
            up.scaleInPlace(-this.offsetY * speed * 0.01);
            
            this.camera.position.addInPlace(right);
            this.camera.position.addInPlace(up);
        }

        this.offsetX = 0;
        this.offsetY = 0;
    }

    _onKeyDown(evt) {
        const speed = 1;
        switch (evt.key.toLowerCase()) {
            case 'w':
                this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Forward()).scale(speed));
                break;
            case 's':
                this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Forward()).scale(-speed));
                break;
            case 'a':
                this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Right()).scale(-speed));
                break;
            case 'd':
                this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Vector3.Right()).scale(speed));
                break;
        }
    }

    getTypeName() {
        return "FreeCameraMouseInput";
    }

    getSimpleName() {
        return "mouse";
    }
}

const CameraControls = ({ scene, canvas, updateLODVisibility, maxDistance }) => {
    const handleOrbitCamera = () => {
        if (!scene || !scene.activeCamera) return;

        const cameraPosition = scene.activeCamera.position.clone();
        const cameraTarget = scene.activeCamera.target ? 
            scene.activeCamera.target.clone() : 
            scene.activeCamera.getTarget().clone();

        scene.activeCamera.dispose();

        const camera = new BABYLON.ArcRotateCamera(
            "arcCamera",
            Math.PI / 4,
            Math.PI / 3,
            scene.activeCamera.radius || maxDistance,
            cameraTarget,
            scene
        );

        camera.setPosition(cameraPosition);
        camera.minZ = 0.001;
        camera.wheelDeltaPercentage = 0.01;
        camera.pinchDeltaPercentage = 0.01;
        camera.wheelPrecision = 50;
        camera.panningSensibility = 100;
        camera.angularSensibilityX = 500;
        camera.angularSensibilityY = 500;
        camera.useBouncingBehavior = true;
        camera.useAutoRotationBehavior = false;
        camera.panningAxis = new BABYLON.Vector3(1, 1, 0);
        camera.pinchToPanMaxDistance = 100;

        camera.attachControl(canvas, true);
        scene.activeCamera = camera;

        camera.onViewMatrixChangedObservable.add(updateLODVisibility);
    };

    const handleFlyCamera = () => {
        if (!scene || !scene.activeCamera) return;

        const cameraPosition = scene.activeCamera.position.clone();
        const cameraTarget = scene.activeCamera.target ? 
            scene.activeCamera.target.clone() : 
            scene.activeCamera.getTarget().clone();

        scene.activeCamera.dispose();

        const camera = new BABYLON.FreeCamera("flyCamera", cameraPosition, scene);
        camera.setTarget(cameraTarget);

        const mouseInput = new FreeCameraMouseInput(camera);
        camera.inputs.clear();
        camera.inputs.add(mouseInput);

        camera.speed = 0.5;
        camera.inertia = 0.9;
        camera.angularSensibility = 1000;
        camera.minZ = 0.001;

        camera.attachControl(canvas, true);
        scene.activeCamera = camera;

        camera.onViewMatrixChangedObservable.add(updateLODVisibility);
    };

    return (
        <div id='rightopt' style={{ right: '0px' }} >
            <i className="fa-solid fa-circle-info button" title='Orbit Camera' onClick={handleOrbitCamera} ></i>
            <i className="fa fa-search-plus button" title='Fly Camera' onClick={handleFlyCamera} ></i>
        </div>
    );
};

export default CameraControls;