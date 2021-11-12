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
  GridHelper,
  AxesHelper,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { VRM, VRMSchema } from "@pixiv/three-vrm";
import FaceFilterController from "./FaceFilterController.js";
import FaceExpressionsController from "./FaceExpressionsController.js";

const width = 800;
const height = 600;

const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(width, height);
renderer.setPixelRatio(devicePixelRatio);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(35, width / height, 0.1, 1000);
camera.position.set(0, 1.1, 3);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.85, 0);
controls.screenSpacePanning = true;
controls.update();

const scene = new Scene();
scene.add(new GridHelper(10, 10));
scene.add(new AxesHelper(0.5));

const light = new AmbientLight(0xffffff, 10.0);
scene.add(light);

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

let vrm;
let controller;
const loader = new GLTFLoader();
loader.load(
  "./8988580958909680445.vrm",
  async gltf => {
    vrm = await VRM.from(gltf);
    scene.add(vrm.scene);
    vrm.scene.rotation.y = Math.PI;
    vrm.humanoid.setPose(pose);
    vrm.lookAt.target = camera;
    /* controller = new FaceFilterController(vrm).control(); */
    controller = new FaceExpressionsController(vrm).control();
  },
  progress => {
    console.info((100.0 * progress.loaded / progress.total).toFixed(2) + '% loaded' );
  },
  error => {
    console.error(error);
  },
);

/* ---- animation */

const clock = new Clock();
clock.start();

function update () {
  requestAnimationFrame(update);
  const delta = clock.getDelta();
  if (vrm) {
    vrm.update(delta);
  }
  renderer.render(scene, camera);
};
update();
