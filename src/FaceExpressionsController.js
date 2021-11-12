import FaceExpressions from "../lib/jeelizWeboji/dist/jeelizFaceExpressions.module.js";;
import NNC from "../lib/jeelizWeboji/dist/jeelizFaceExpressionsNNC.json";

export default class FaceExpressionsController {
  constructor (stateRef) {
    this.canvas = document.createElement("canvas");
    this.stateRef = stateRef;
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
              this.stateRef.rotation = [-rot[0] * 1.5 + 0.25, -rot[1], rot[2]];
              const morphs = FaceExpressions.get_morphTargetInfluencesStabilized();
              this.stateRef.expression.A = morphs[6] * 5.0;
              this.stateRef.expression.BlinkR = morphs[8] * 100.0;
              this.stateRef.expression.BlinkL = morphs[9] * 100.0;
            }
          };
          monitor();
          resolve();
        },
      });
    });
  }
}
