import { Quaternion, Euler, Vector3 } from "three";
import * as Kalidokit from "kalidokit";
import FaceFilter from "facefilter/dist/jeelizFaceFilter.module.js";
import Resizer from "facefilter/helpers/JeelizResizer.js";
import NNC from "facefilter/neuralNets/NN_DEFAULT.json";
import { VRMSchema } from "@pixiv/three-vrm";

const lerp = Kalidokit.Vector.lerp;
const clamp = Kalidokit.Utils.clamp;

export default class FaceFilterController {
  static async resizeCanvas (canvas) {
    return new Promise(resolve => {
      Resizer.size_canvas({ canvas, callback: resolve });
    });
  }

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
    await FaceFilterController.resizeCanvas(this.canvas);
    return new Promise((resolve, reject) => {
      FaceFilter.init({
        NNC,
        canvas: this.canvas,
        followZRot: true,
        maxFacedDetected: 1,
        callbackReady: error => error ? reject(error) : resolve(),
        callbackTrack: report => {
          if (report.detected) {
            const rot = { x: -report.rx, y: -report.ry, z: report.rz };
            this.rotatePart("Neck",  [rot.x * -0.2, rot.y * -0.2, rot.z * 0.3], 0.7);
            this.rotatePart("Hips",  [rot.x *  0.0, rot.y *  0.0, rot.z * 0.0], 0.7);
            this.rotatePart("Chest", [rot.x *  0.2, rot.y *  0.1, rot.z * 0.1], 0.7);
            this.rotatePart("Spine", [rot.x *  0.0, rot.y *  0.1, rot.z * 0.0], 0.7);
            this.blendShape("A", report.expressions[0], 0.8);
          }
        },
      });
    });
  }
}
