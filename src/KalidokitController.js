import { Quaternion, Euler, Vector3 } from "three";
import * as Kalidokit from "kalidokit";
import { Holistic } from "@mediapipe/holistic";
import { FaceMesh } from "@mediapipe/face_mesh";
import { VRMSchema } from "@pixiv/three-vrm";

const lerp = Kalidokit.Vector.lerp;
const clamp = Kalidokit.Utils.clamp;

export default class KalidokitController {
  constructor (vrm, video) {
    this.vrm = vrm;
    this.video = video;
    // this.detector = new FaceMesh({ locateFile: file => `/face_mesh/${file}` });
    // this.detector.setOptions({
    //   maxNumFaces: 1,
    //   minDetectionConfidence: 0.7,
    //   minTrackingConfidence: 0.7,
    //   refineFaceLandmarks: true,
    // });
    // this.detector.onResults(result => (
    //   this.updateState(result.multiFaceLandmarks && result.multiFaceLandmarks[0]
    // )));
    this.detector = new Holistic({ locateFile: file => `/holistic/${file}` });
    this.detector.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      refineFaceLandmarks: true,
    });
    this.detector.onResults(result => this.updateState(result.faceLandmarks));
    this.lastLookTarget = new Euler();
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

  updateState (faceLandmarks) {
    if (faceLandmarks) {
      const face = Kalidokit.Face.solve(faceLandmarks, {
        runtime: "mediapipe",
        video: this.video,
      });
      const rot = face.head;
      this.rotatePart("Neck",  [rot.x * -0.2, rot.y * -0.2, rot.z * 0.3], 0.6);
      this.rotatePart("Hips",  [rot.x *  0.0, rot.y *  0.0, rot.z * 0.0], 0.6);
      this.rotatePart("Chest", [rot.x *  0.2, rot.y *  0.1, rot.z * 0.1], 0.6);
      this.rotatePart("Spine", [rot.x *  0.0, rot.y *  0.1, rot.z * 0.0], 0.6);
      this.blendShape("I", face.mouth.shape.I, 0.6);
      this.blendShape("A", face.mouth.shape.A, 0.6);
      this.blendShape("E", face.mouth.shape.E, 0.6);
      this.blendShape("O", face.mouth.shape.O, 0.6);
      this.blendShape("U", face.mouth.shape.U, 0.6);
      this.blendShape("BlinkL", 1 - face.eye.l, 0.6);
      this.blendShape("BlinkR", 1 - face.eye.r, 0.6);
    }
  }

  start () {
    const monitor = async () => {
      if (!this.video.paused) {
        await this.detector.send({ image: this.video });
      }
      requestAnimationFrame(monitor);
    };
    monitor();
  }
}
