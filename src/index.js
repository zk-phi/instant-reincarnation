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
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { VRM, VRMSchema } from "@pixiv/three-vrm";
import KalidokitController from "./KalidokitController.js";
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
camera.position.set(0, 1.4, 1.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.4, 0);
controls.screenSpacePanning = true;
controls.update();

const scene = new Scene();

const light = new AmbientLight(0xffffff, 10.0);
scene.add(light);

const clock = new Clock();

const pose = {
  [VRMSchema.HumanoidBoneName.LeftShoulder]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, 0.2)).toArray()
  },
  [VRMSchema.HumanoidBoneName.RightShoulder]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, -0.2)).toArray()
  },
  [VRMSchema.HumanoidBoneName.LeftUpperArm]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, 1.1)).toArray()
  },
  [VRMSchema.HumanoidBoneName.RightUpperArm]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, -1.1)).toArray()
  },
  [VRMSchema.HumanoidBoneName.LeftLowerArm]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, 0.1)).toArray()
  },
  [VRMSchema.HumanoidBoneName.RightLowerArm]: {
    rotation: new Quaternion().setFromEuler(new Euler(0.0, 0.0, -0.1)).toArray()
  },
};

const video = document.createElement("video");
const webcam = new Camera(video, { onFrame: () => null, width: 320, height: 240 });

let vrm;
const loader = new GLTFLoader();
loader.load(
  "./8988580958909680445.vrm",
  async gltf => {
    vrm = await VRM.from(gltf);
    scene.add(vrm.scene);
    vrm.scene.rotation.y = Math.PI;
    vrm.humanoid.setPose(pose);
    vrm.lookAt.target = camera;
    clock.start();
    webcam.start();
    new KalidokitController(vrm, video).start();
  },
  progress => {
    console.info((100.0 * progress.loaded / progress.total).toFixed(2) + '% loaded' );
  },
  error => {
    console.error(error);
  },
);

/* ---- animation */

function update () {
  requestAnimationFrame(update);
  const delta = clock.getDelta();
  if (vrm) {
    vrm.update(delta);
  }
  renderer.render(scene, camera);
};
update();
