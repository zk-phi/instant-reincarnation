import FaceFilter from "facefilter/dist/jeelizFaceFilter.module.js";
import Resizer from "facefilter/helpers/JeelizResizer.js";
import NNC from "facefilter/neuralNets/NN_DEFAULT.json";
import { VRMSchema } from "@pixiv/three-vrm";

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
            const head = this.vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Head);
            head.rotation.set(-report.rx, report.ry, report.rz, 'ZXY');
            this.vrm.blendShapeProxy.setValue(
              VRMSchema.BlendShapePresetName.A,
              report.expressions[0],
            );
          }
        },
      });
    });
  }
}
