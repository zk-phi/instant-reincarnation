import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Quaternion, Euler } from "three";
import { VRM, VRMSchema } from "@pixiv/three-vrm";
import * as Kalidokit from "kalidokit";

const lerp = Kalidokit.Vector.lerp;
const clamp = Kalidokit.Utils.clamp;

export default class VRMDriver {
  Schema = {
    Bones: {
      LeftShoulder: VRMSchema.HumanoidBoneName.LeftShoulder,
      RightShoulder: VRMSchema.HumanoidBoneName.RightShoulder,
      LeftUpperArm: VRMSchema.HumanoidBoneName.LeftUpperArm,
      RightUpperArm: VRMSchema.HumanoidBoneName.RightUpperArm,
      LeftLowerArm: VRMSchema.HumanoidBoneName.LeftLowerArm,
      RightLowerArm: VRMSchema.HumanoidBoneName.RightLowerArm,
      Neck: VRMSchema.HumanoidBoneName.Neck,
      UpperChest: VRMSchema.HumanoidBoneName.UpperChest,
      Chest: VRMSchema.HumanoidBoneName.Chest,
      Spine: VRMSchema.HumanoidBoneName.Spine,
      Hips: VRMSchema.HumanoidBoneName.Hips,
    },
    BlendShapes: {
      Neutral: VRMSchema.BlendShapePresetName.Neutral,
      Fun: VRMSchema.BlendShapePresetName.Fun,
      Angry: VRMSchema.BlendShapePresetName.Angry,
      Sorrow: VRMSchema.BlendShapePresetName.Sorrow,
      A: VRMSchema.BlendShapePresetName.A,
      E: VRMSchema.BlendShapePresetName.E,
      I: VRMSchema.BlendShapePresetName.I,
      O: VRMSchema.BlendShapePresetName.O,
      U: VRMSchema.BlendShapePresetName.U,
      BlinkL: VRMSchema.BlendShapePresetName.BlinkL,
      BlinkR: VRMSchema.BlendShapePresetName.BlinkR,
    },
  };

  constructor () {
    this.vrm = null;
    this.initialized = false;
  }

  async initialize (url) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        async gltf => {
          this.vrm = await VRM.from(gltf);
          this.vrm.scene.rotation.y = Math.PI;
          this.initialized = true;
          resolve();
        },
        progress => null,
        error => reject(error),
      );
    });
  }

  blendShape (key, value, speed) {
    const currentValue = this.vrm.blendShapeProxy.getValue(key);
    const lerpValue = lerp(clamp(value, 0, 1), currentValue, 1 - speed);
    this.vrm.blendShapeProxy.setValue(key, lerpValue);
  }

  rotateBone (key, vec, speed) {
    const bone = this.vrm.humanoid.getBoneNode(key);
    const euler = new Euler(vec[0], vec[1], vec[2]);
    const quaternion = new Quaternion().setFromEuler(euler);
    bone.quaternion.slerp(quaternion, speed);
  }

  lookAt (euler) {
    this.vrm.lookAt.applyer.lookAt(euler);
  }

  setPose (pose) {
    this.vrm.humanoid.setPose(pose);
  }

  update (delta) {
    this.vrm.update(delta);
  }

  getSceneObject () {
    return this.vrm.scene;
  }
}
