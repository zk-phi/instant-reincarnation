import { Quaternion, Euler, Vector3 } from "three";
import * as Kalidokit from "kalidokit";
import FaceExpressions from "../lib/jeelizWeboji/dist/jeelizFaceExpressions.module.js";;
import NNC from "../lib/jeelizWeboji/dist/jeelizFaceExpressionsNNC.json";
import { VRMSchema } from "@pixiv/three-vrm";

const lerp = Kalidokit.Vector.lerp;
const clamp = Kalidokit.Utils.clamp;

export default class FaceExpressionsController {
  constructor (vrm) {
    this.canvas = document.createElement("canvas");
    this.vrm = vrm;
  }

  rotatePart (name, rotation, speed) {
    const part = this.vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName[name]);
    const euler = new Euler(rotation[0], rotation[1], rotation[2]);
    const quaternion = new Quaternion().setFromEuler(euler);
    part.quaternion.slerp(quaternion, speed);
  }

  blendShape (name, value, speed) {
    const currentValue = this.vrm.blendShapeProxy.getValue(VRMSchema.BlendShapePresetName[name]);
    const lerpValue = lerp(clamp(value, 0, 1), currentValue, 1 - speed);
    this.vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName[name], lerpValue);
  }

  async control () {
    return new Promise((resolve, reject) => {
      FaceExpressions.init({
        NNC,
        canvas: this.canvas,
        callbackReady: error => {
          if (error) {
            return reject(error);
          }
          const monitor = () => {
            requestAnimationFrame(monitor);
            if (FaceExpressions.is_detected()) {
              const rot = FaceExpressions.get_rotationStabilized();
              const head = { x: -rot[0], y: rot[1], z: -rot[2] };
              this.rotatePart("Neck",  [head.x * 0.2, head.y * 0.0, head.z * 0.2], 0.7);
              this.rotatePart("Hips",  [head.x * 0.0, head.y * 0.3, head.z * 0.0], 0.7);
              this.rotatePart("Chest", [head.x * 0.1, head.y * 0.0, head.z * 0.1], 0.7);
              this.rotatePart("Spine", [head.x * 0.1, head.y * 0.0, head.z * 0.1], 0.7);
              const morphs = FaceExpressions.get_morphTargetInfluencesStabilized();
              this.blendShape("A", morphs[6], 0.8);
              this.blendShape("BlinkR", morphs[8], 0.8);
              this.blendShape("BlinkL", morphs[9], 0.8);
            }
          };
          monitor();
          resolve();
        },
      });
    });
  }
}
