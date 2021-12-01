import * as FaceApi from "@vladmandic/face-api";

export default class FaceApiController {
  constructor (driver, video) {
    this.driver = driver;
    this.video = video;
    this.stopped = false;
  }

  blendShape (key, value, speed) {
    this.driver.blendShape(this.driver.Schema.BlendShapes[key], value, speed);
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
    await FaceApi.nets.tinyFaceDetector.load("./model/");
    await FaceApi.nets.faceExpressionNet.load("./model/");
    const options = new FaceApi.TinyFaceDetectorOptions({
      inputSize: Math.max(this.video.width, this.video.height),
      scoreThreshold: 0.2,
    });
    const monitor = async () => {
      if (!this.video.paused) {
        const result = await FaceApi.detectSingleFace(this.video, options).withFaceExpressions();
        if (result) {
          this.updateState(result.expressions);
        }
      }
      if (!this.stopped) {
        requestAnimationFrame(monitor);
      }
    };
    this.stopped = false;
    monitor();
  }

  stop () {
    this.stopped = true;
  }
}
