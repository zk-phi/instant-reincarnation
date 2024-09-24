import { MMDLoader } from "three/examples/jsm/loaders/MMDLoader.js";
import { MMDPhysics } from "three/examples/jsm/animation/MMDPhysics.js";
import { Quaternion, Euler, Vector3 } from "three";
import * as Kalidokit from "kalidokit";

const lerp = Kalidokit.Vector.lerp;
const clamp = Kalidokit.Utils.clamp;

export default class MMDDriver {
  constructor (url) {
    this.url = url;
    this.schema = {};
    this.mmd = null;
    this.physics = null;
    this.initialized = false;
  }

  async initialize () {
    return new Promise((resolve, reject) => {
      const loader = new MMDLoader();
      loader.load(
        this.url,
        async mmd => {
          this.mmd = mmd;
          this.schema = {
            Bones: {
              Neck: this.mmd.skeleton.bones.findIndex(bone => bone.name === "頭"),
              UpperChest: this.mmd.skeleton.bones.findIndex(bone => bone.name === "上半身2"),
              Chest: this.mmd.skeleton.bones.findIndex(bone => bone.name === "上半身"),
              Spine: this.mmd.skeleton.bones.findIndex(bone => bone.name === "腰"),
              Hips: this.mmd.skeleton.bones.findIndex(bone => bone.name === "センター"),
              _SpineCancel: this.mmd.skeleton.bones.findIndex(bone => bone.name === "下半身")
            },
            BlendShapes: {
            },
          };
          //this.physics = new MMDPhysics(this.mmd, []);
          /* this.mmd.castShadow = true; */
          /* this.mmd.receiveShadow = true; */
          this.mmd.material.forEach(material => {
            material.emissive.multiplyScalar(0.03);
            material.userData.outlineParameters.thickness = 0.0015;
          });
          this.mmd.scale.copy(new Vector3(0.0739, 0.0739, 0.0739));
          this.initialized = true;
          resolve();
        },
        progress => null,
        error => reject(error),
      );
    });
  }

  blendShape (key, value, speed) {
    if (key == null || key == -1) return;
  }

  rotateBone (key, vec, speed) {
    if (key == null || key == -1) return;
    if (key == this.schema.Bones.Spine) {
      this.rotateBone(this.schema.Bones._SpineCancel, [-vec[0], -vec[1], -vec[2]], speed);
    }
    const bone = this.mmd.skeleton.bones[key];
    const euler = new Euler(-vec[0], vec[1], -vec[2]);
    const quaternion = new Quaternion().setFromEuler(euler);
    bone.quaternion.slerp(quaternion, speed);
  }

  lookAt (euler) {
  }

  setPose (pose) {
  }

  update (delta) {
    //this.physics.update(delta);
  }

  getSceneObject () {
    return this.mmd;
  }
}
