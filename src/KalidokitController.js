import { Euler } from "three";
import * as Kalidokit from "kalidokit";
import { Holistic } from "@mediapipe/holistic";
import { FaceMesh } from "@mediapipe/face_mesh";

const lerp = Kalidokit.Vector.lerp;

export default class KalidokitController {
  constructor (driver, video, clock) {
    this.driver = driver;
    this.video = video;
    this.clock = clock;
    // FaceMesh ... 顔のみ、視線・まばたきは取れない
    // this.detector = new FaceMesh({ locateFile: file => `./face_mesh/${file}` });
    // this.detector.setOptions({
    //   maxNumFaces: 1,
    //   minDetectionConfidence: 0.7,
    //   minTrackingConfidence: 0.7,
    //   refineFaceLandmarks: true,
    // });
    // this.detector.onResults(result => this.updateState({
    //   faceLandmarks: result.multiFaceLandmarks && result.multiFaceLandmarks[0]
    // }));
    // Holistic ... フルトラ、視線・まばたきも取れる
    this.detector = new Holistic({ locateFile: file => `./holistic/${file}` });
    this.detector.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      refineFaceLandmarks: true,
    });
    this.detector.onResults(result => this.updateState(result));
    this.lastLookTarget = new Euler();
    this.stopped = false;
  }

  rotateBone (name, vector, speed) {
    this.driver.rotateBone(this.driver.Schema.Bones[name], vector, speed);
  }

  blendShape (name, value, speed) {
    this.driver.blendShape(this.driver.Schema.BlendShapes[name], value, speed);
  }

  updateState (result) {
    if (result.faceLandmarks) {
      const face = Kalidokit.Face.solve(result.faceLandmarks, {
        runtime: "mediapipe",
        video: this.video,
      });
      const breath = 1 - Math.abs(1 - this.clock.elapsedTime % 4 / 2);
      const rot = face.head;
      this.rotateBone("Neck",       [rot.x *  .4 + breath * -.1, rot.y *  .2, rot.z *  .4], .6);
      this.rotateBone("UpperChest", [rot.x *  .1 + breath *  .2, rot.y *  .1, rot.z *  .1], .6);
      this.rotateBone("Chest",      [rot.x *  .0 + breath * -.1, rot.y *  .0, rot.z *  .0], .6);
      this.rotateBone("Spine",      [rot.x *  .1 + breath *  .0, rot.y *  .1, rot.z *  .1], .6);
      this.rotateBone("Hips",       [rot.x *  .0 + breath *  .0, rot.y *  .1, rot.z *  .0], .6);
      this.rotateBone("LeftUpperArm",  [breath * -.1, 0.,  1.1], .6)
      this.rotateBone("RightUpperArm", [breath * -.1, 0., -1.1], .6)
      this.blendShape("I", face.mouth.shape.I, .6);
      this.blendShape("A", face.mouth.shape.A, .6);
      this.blendShape("E", face.mouth.shape.E, .6);
      this.blendShape("O", face.mouth.shape.O, .6);
      this.blendShape("U", face.mouth.shape.U, .6);
      this.blendShape("BlinkL", 1 - face.eye.l, .6);
      this.blendShape("BlinkR", 1 - face.eye.r, .6);
      const lookTarget = new Euler(
        lerp(this.lastLookTarget.x , face.pupil.y * 0.25, .4),
        lerp(this.lastLookTarget.y, face.pupil.x * 0.25, .4),
        0,
        "XYZ",
      );
      this.lastLookTarget.copy(lookTarget);
      this.driver.lookAt(lookTarget);
    }
  }

  start () {
    const monitor = async () => {
      if (!this.video.paused) {
        await this.detector.send({ image: this.video });
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
