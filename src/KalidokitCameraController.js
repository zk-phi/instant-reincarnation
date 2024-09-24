import { Vector3, Quaternion, Euler } from "three";
import * as Kalidokit from "kalidokit";
import { FaceMesh } from "@mediapipe/face_mesh";

export default class KalidokitCameraController {
  constructor (camera, video, canvas) {
    this.camera = camera;
    this.video = video;
    this.canvas = canvas;
    this.detector = new FaceMesh({ locateFile: file => `./face_mesh/${file}` });
    this.detector.setOptions({
      maxNumFaces: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      refineFaceLandmarks: true,
    });
    this.detector.onResults(result => this.updateState({
      faceLandmarks: result.multiFaceLandmarks && result.multiFaceLandmarks[0]
    }));
    this.stopped = false;
    console.log(this.video.videoWidth);
  }

  updateState (result) {
    if (result.faceLandmarks) {
      const face = Kalidokit.Face.solve(result.faceLandmarks, {
        runtime: "mediapipe",
        video: this.video,
      });
      const x = (face.head.position.x / 320 - 0.2) * 2;
      const y = (face.head.position.y / 240 - 0.5) * 2;
      this.camera.position.y = 1.3 + y;
      this.camera.position.x = x;
      this.camera.position.z = 3.0;
      this.camera.lookAt(new Vector3(0, 1.3, 0));
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
