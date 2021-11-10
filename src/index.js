import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Quaternion,
  Euler,
  Vector3,
  DirectionalLight,
  Clock,
  GridHelper,
  AxesHelper,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMSchema } from "@pixiv/three-vrm";
import FaceFilter from "facefilter/dist/jeelizFaceFilter.module.js";
import Resizer from "facefilter/helpers/JeelizResizer.js";
import NNC from "facefilter/neuralNets/NN_DEFAULT.json";

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

const camera = new PerspectiveCamera(30, width / height, 0.01, 20);
camera.position.set(0, 0, 5);

const scene = new Scene();
scene.add(new GridHelper(10, 10));
scene.add(new AxesHelper(5));

const light = new DirectionalLight(0xffffff);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

let vrm;
const loader = new GLTFLoader();
loader.load(
  "https://cdn.glitch.com/e9accf7e-65be-4792-8903-f44e1fc88d68%2Fthree-vrm-girl.vrm",
  async gltf => {
    vrm = await VRM.from(gltf);
    scene.add(vrm.scene);
    const hips = vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Hips);
    hips.rotation.y = Math.PI;
    vrm.humanoid.setPose({
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
    });
    const head = vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Head);
    camera.position.set(0.0, head.getWorldPosition(new Vector3()).y, 2.0);
    vrm.lookAt.target = camera;
  },
  progress => {
    console.info((100.0 * progress.loaded / progress.total).toFixed(2) + '% loaded' );
  },
  error => {
    console.error(error);
  },
);

const clock = new Clock();
clock.start();

function update () {
  requestAnimationFrame(update);
  const delta = clock.getDelta();
  if (vrm) {
    vrm.update(delta);
    const blink = Math.max(0.0, 1.0 - 10.0 * Math.abs((clock.getElapsedTime() % 4.0) - 2.0));
    vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Blink, blink);
  }
  renderer.render(scene, camera);
};
update();

/* ---- mouse */

renderer.domElement.addEventListener('mousemove', event => {
  if (vrm) {
    const x = event.clientX / renderer.domElement.clientWidth;
    vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Fun, x);
    const y = event.clientY / renderer.domElement.clientHeight;
    vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Sorrow, y);
  }
});

/* ---- face recognition */

const jeelizCanvas = document.createElement('canvas');

Resizer.size_canvas({
  canvas: jeelizCanvas,
  callback: () => {
    FaceFilter.init({
      canvas: jeelizCanvas,
      NNC: NNC,
      followZRot: true,
      maxFacedDetected: 1,
      callbackReady: (error) => {
        if (error) {
          console.error(error);
        }
      },
      callbackTrack: (state) => {
        if (vrm) {
          const head = vrm.humanoid.getBoneNode(VRMSchema.HumanoidBoneName.Head);
          head.rotation.set(-state.rx, -state.ry, state.rz, 'ZXY');
          const expressionA = state.expressions[0];
          vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.A, expressionA);
        }
      },
    });
  }
});
