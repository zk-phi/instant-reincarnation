import FaceFilter from "facefilter/dist/jeelizFaceFilter.module.js";
import Resizer from "facefilter/helpers/JeelizResizer.js";
import NNC from "facefilter/neuralNets/NN_DEFAULT.json";

export default class FaceFilterController {
  static async resizeCanvas (canvas) {
    return new Promise(resolve => {
      Resizer.size_canvas({ canvas, callback: resolve });
    });
  }

  constructor (stateRef) {
    this.canvas = document.createElement("canvas");
    this.stateRef = stateRef;
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
            this.stateRef.rotation = [-report.rx, report.ry, report.rz];
            this.stateRef.expression.A = report.expressions[0];
          }
        },
      });
    });
  }
}
