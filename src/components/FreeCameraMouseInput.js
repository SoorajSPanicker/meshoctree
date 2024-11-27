import * as BABYLON from '@babylonjs/core';

export class FreeCameraMouseInput {
    constructor() {
        this.buttons = [];
        this.angularSensibility = 2000.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.direction = new BABYLON.Vector3(0, 0, 0);
    }

    attachControl(element, noPreventDefault) {
        if (!this._pointerInput) {
            this._pointerInput = (p, s) => {
                const evt = p.event;
                if (evt.pointerType != 'mouse') return;
                
                if (p.type == BABYLON.PointerEventTypes.POINTERDOWN) {
                    try {
                        evt.srcElement.setPointerCapture(evt.pointerId);
                    } catch (e) { }
                    
                    if (this.buttons.length == 0) this.buttons.push(evt.button);
                    this.previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY
                    };
                    
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
                else if (p.type == BABYLON.PointerEventTypes.POINTERUP) {
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    } catch (e) { }
                    
                    if (this.buttons.length != 0) this.buttons.pop();
                    this.previousPosition = null;
                    this.offsetX = 0;
                    this.offsetY = 0;
                    
                    if (!noPreventDefault) evt.preventDefault();
                }
                else if (p.type == BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (!this.previousPosition) return;
                    
                    this.offsetX = evt.clientX - this.previousPosition.x;
                    this.offsetY = evt.clientY - this.previousPosition.y;
                    
                    if (!noPreventDefault) evt.preventDefault();
                }
            };
        }
        
        this._observer = this.camera.getScene().onPointerObservable.add(
            this._pointerInput,
            BABYLON.PointerEventTypes.POINTERDOWN |
            BABYLON.PointerEventTypes.POINTERUP |
            BABYLON.PointerEventTypes.POINTERMOVE
        );
    }

    detachControl(element) {
        if (this._observer && element) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;
            this.previousPosition = null;
        }
    }

    checkInputs() {
        const speed = this.camera.speed;
        if (!this.previousPosition) return;

        if (this.buttons.indexOf(0) != -1) {
            // Left mouse button
            if (this.camera.getScene().useRightHandedSystem) {
                this.camera.cameraRotation.y -= this.offsetX / (20 * this.angularSensibility);
            } else {
                this.camera.cameraRotation.y += this.offsetX / (20 * this.angularSensibility);
            }
            
            this.direction.copyFromFloats(0, 0, -this.offsetY * speed / 300);
            if (this.camera.getScene().useRightHandedSystem) this.direction.z *= -1;
        }

        if (this.buttons.indexOf(1) != -1) {
            // Right mouse button
            this.direction.copyFromFloats(
                this.offsetX * speed / 500,
                -this.offsetY * speed / 500,
                0
            );
        }

        if (this.buttons.indexOf(0) != -1 || this.buttons.indexOf(1) != -1) {
            this.camera.getViewMatrix().invertToRef(this.camera._cameraTransformMatrix);
            BABYLON.Vector3.TransformNormalToRef(
                this.direction,
                this.camera._cameraTransformMatrix,
                this.camera._transformedDirection
            );
            this.camera.cameraDirection.addInPlace(this.camera._transformedDirection);
        }
    }

    getTypeName() {
        return "FreeCameraMouseInput";
    }

    getSimpleName() {
        return "mouse";
    }
}