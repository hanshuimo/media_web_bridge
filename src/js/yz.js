import * as THREE from "three"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"

import {model, scene, camera, renderer, image, selectObjects} from "./index"

import {AmmoPhysics} from "three/examples/jsm/physics/AmmoPhysics.js"

let enterCloudArray = []

//gltf凤凰
let gltfPhoenix
let clock = new THREE.Clock()

export function YZinit() {
    // 初始化云海
    // initEnterCloud()
    //初始化模型
    // initObj()
}

export function YZanimate() {
    //凤凰动画
    // -38, y: 21, -75
    // console.log(camera.position)
    // let time = clock.getDelta()
    // if (gltfPhoenix) {
    //     gltfPhoenix.update(time)
    // }
    // console.log(camera.position)
}

async function initEnterCloud() {
    let texture = THREE.ImageUtils.loadTexture(image.cloud.default, {}, function () {
        renderer.render(scene, camera)
    })
    // 材质
    let material = new THREE.MeshLambertMaterial({
        map: texture,
        // color: 0xF6EECA,
    })
    material.side = THREE.DoubleSide
    material.transparent = true
    // 几何体
    for (let i = 0; i < 10; i++) {
        let objEnterCloud = new THREE.Mesh(new THREE.PlaneGeometry(64, 64, 32, 32), material)
        objEnterCloud.position.set(-40 + Math.floor(Math.random() * 20), 21 + Math.floor(Math.random() * 20), -70 + Math.floor(Math.random() * 20))
        objEnterCloud.rotation.set(0, 0, 0)
        objEnterCloud.scale.set(0.5, 0.5, 0.5)
        scene.add(objEnterCloud)
        enterCloudArray.push(objEnterCloud)
    }
}

// function initObj() {
//     //石碑d
//     let steleGeometry = new THREE.BoxBufferGeometry()
//     //MeshPhongMaterial
//     let steleMaterialFront = new THREE.MeshPhongMaterial({
//         map: new THREE.TextureLoader().load(image.steleFront),
//         bumpMap: new THREE.TextureLoader().load(image.steleMap),
//         bumpScale: 0.2
//     })
//     let materialOther = new THREE.MeshPhongMaterial({
//         map: new THREE.TextureLoader().load(image.stele),
//         bumpMap: new THREE.TextureLoader().load(image.steleMap),
//         bumpScale: 0.2
//     })
//     // var rectLight = new THREE.DirectionalLight(0xFFFFCC,1);
//     // rectLight.position.set(70,21,72.5);
//     // rectLight.lookAt(67, 20, 77)
//     // scene.add(rectLight)
//     let steleMaterial = [steleMaterialFront, materialOther, materialOther, materialOther, materialOther, materialOther]
//     let stele = new THREE.Mesh(steleGeometry, steleMaterial)
//     scene.add(stele)
//     stele.name='objStele'
//     stele.scale.set(0.3, 3.5, 2)
//     stele.position.set(70, 20.5, 75)
//     stele.rotation.y = 2.5
//     selectObjects[0]=stele
//     //凤凰模型加载
//     // let loder = new GLTFLoader()
//     // loder.load(model.phoenix, function (obj) {
//     //     //获取模型，并添加到场景
//     //     let model = obj.scene
//     //     model.position.set(20, 25, 0)
//     //     model.rotation.y = Math.PI / 3
//     //     model.scale.set(0.01, 0.01, 0.01)
//     //     scene.add(model)
//     //     //将模型绑定到动画混合器里面
//     //     gltfPhoenix = new THREE.AnimationMixer(model)
//     //     // console.log(obj.animations.length)
//     //     //同时将这个外部模型的动画全部绑定到动画混合器里面
//     //     for (let i = 0; i < obj.animations.length; i++) {
//     //         gltfPhoenix.clipAction(obj.animations[i]).play()
//     //     }
//     // })
// }