import * as FaceApi from "@vladmandic/face-api";
import * as Kalidokit from "kalidokit";
import { VRMSchema } from "@pixiv/three-vrm";

const lerp = Kalidokit.Vector.lerp;
const clamp = Kalidokit.Utils.clamp;

export default class FaceApiController {
  constructor (vrm, video) {
    this.vrm = vrm;
    this.video = video;
  }

  blendShape (name, value, speed) {
    const currentValue = this.vrm.blendShapeProxy.getValue(VRMSchema.BlendShapePresetName[name]);
    const lerpValue = lerp(clamp(value, 0, 1), currentValue, 1 - speed);
    this.vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName[name], lerpValue);
  }

  updateState (expressions) {
    /* unused: expressions.surprised */
    this.blendShape("Neutral", expressions.neutral, 0.6);
    this.blendShape("Fun", expressions.happy, 0.6);
    this.blendShape("Angry", Math.max(expressions.angry, expressions.disgusted), 0.6);
    this.blendShape("Sorrow", Math.max(expressions.sad, expressions.fearful), 0.6);
  }

  async start () {
    await FaceApi.tf.setBackend("webgl");
    await FaceApi.tf.enableProdMode();
    await FaceApi.tf.ENV.set('DEBUG', false);
    await FaceApi.tf.ready();
    await FaceApi.nets.tinyFaceDetector.load("/model/");
    await FaceApi.nets.faceExpressionNet.load("/model/");
    const options = new FaceApi.TinyFaceDetectorOptions({
      scoreThreshold: 0.2,
    });
    const monitor = async () => {
      if (!this.video.paused) {
        const result = await FaceApi.detectSingleFace(this.video, options).withFaceExpressions();
        if (result) {
          this.updateState(result.expressions);
        }
      }
      requestAnimationFrame(monitor);
    };
    monitor();
  }
}
