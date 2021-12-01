import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Quaternion,
  Euler,
  Vector3,
  // DirectionalLight,
  AmbientLight,
  Clock,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import VRMDriver from "./VRMDriver.js";
import KalidokitController from "./KalidokitController.js";
import FaceApiController from "./FaceApiController.js";
import { Camera } from "@mediapipe/camera_utils";

const width = 800;
const height = 600;

const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(width, height);
renderer.setPixelRatio(devicePixelRatio);
renderer.setClearColor(0x00ff00, 0);
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(35, width / height, 0.1, 1000);
camera.position.set(0, 1.3, 1.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.3, 0);
controls.screenSpacePanning = true;
controls.update();

const scene = new Scene();

const light = new AmbientLight(0xffffff, 10.0);
scene.add(light);

const clock = new Clock();

const video = document.createElement("video");
const webcam = new Camera(video, {
  onFrame: () => null,
  width: 320,
  height: 240,
});

let vrm;

const driver = new VRMDriver();
const pose = {
  [driver.Schema.Bones.LeftShoulder]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, 0.2)).toArray()
  },
  [driver.Schema.Bones.RightShoulder]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, -0.2)).toArray()
  },
  [driver.Schema.Bones.LeftUpperArm]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, 1.1)).toArray()
  },
  [driver.Schema.Bones.RightUpperArm]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, -1.1)).toArray()
  },
  [driver.Schema.Bones.LeftLowerArm]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, 0.1)).toArray()
  },
  [driver.Schema.Bones.RightLowerArm]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, -0.1)).toArray()
  },
};

driver.initialize(
  /* "./8988580958909680445.vrm", */
  "./4490707391186690073.vrm",
).then(() => {
  scene.add(driver.getSceneObject());
  driver.setPose(pose);
  clock.start();
  webcam.start();
  new KalidokitController(driver, video, clock).start(); // face angle
  new FaceApiController(driver, video).start(); // face expressions
}).catch(error => {
  throw error;
});

/* ---- animation */

function update () {
  requestAnimationFrame(update);
  const delta = clock.getDelta();
  if (driver.initialized) {
    driver.update(delta);
  }
  renderer.render(scene, camera);
};
update();
