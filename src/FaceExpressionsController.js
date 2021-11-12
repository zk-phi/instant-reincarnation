import FaceExpressions from "../lib/jeelizWeboji/dist/jeelizFaceExpressions.module.js";;
import NNC from "../lib/jeelizWeboji/dist/jeelizFaceExpressionsNNC.json";
import { VRMSchema } from "@pixiv/three-vrm";

export default class FaceExpressionsController {
  constructor (vrm) {
    this.canvas = document.createElement("canvas");
    this.vrm = vrm;
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
              const head = this.vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Head);
              head.rotation.set(-rot[0] * 1.5 + 0.25, -rot[1], rot[2], 'ZXY');
              const morphs = FaceExpressions.get_morphTargetInfluencesStabilized();
              this.vrm.blendShapeProxy.setValue(
                VRMSchema.BlendShapePresetName.A,
                morphs[6] * 5.0,
              );
              this.vrm.blendShapeProxy.setValue(
                VRMSchema.BlendShapePresetName.BlinkR,
                morphs[8] * 100.0,
              );
              this.vrm.blendShapeProxy.setValue(
                VRMSchema.BlendShapePresetName.BlinkL,
                morphs[9] * 100.0,
              );
            }
          };
          monitor();
          resolve();
        },
      });
    });
  }
}
