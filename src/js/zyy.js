import * as THREE from 'three'
import {scene, camera, image, video, shader, model, gltfBridge, gltfMountain, container} from './index'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import TWEEN from '@tweenjs/tween.js'
import {createModel, getSizeFromObject, changeObjectToCenter, changeClientToWorldVector, getRayDistance} from "./util"
import {Vector3} from "three"
import { ifBoating } from './zt'

let clock = new THREE.Clock()

//控制桥的坍塌。
let collapseFunction = () => {
}
// let collapseFunction = updatePhysics;
export let duration = 15000
// let animateTime = 5000;
// let radius = 15
//物理世界的属性
const Ammo = require('ammojs')
let gravityConstant = -9.8//-5//9.8
let collisionConfiguration
let dispatcher
let broadphase
let solver
let physicsWord
let rigidBodies = []
let margin = 0.05
let transformAuxl = new Ammo.btTransform()

//walk相关
let flag = 1
let lastCameraPosition = new Vector3(67.5, 21, 70)
let walkHeight = 2
let walkAnimateNum = 2
export let ZYYinit = () => {

    initPhysics()

}
export let ZYYanimate = () => {
    collapseFunction(clock.getDelta() * 50)
    // console.log(flag)
    if (flag === 1) {
        flag = flag + 1
        if ((!camera.position.equals(lastCameraPosition))&&(!ifBoating)) {
            walkBoundary();
            lastCameraPosition = camera.position.clone()
        }
    } else if (flag === walkAnimateNum) {
        flag = 1
    } else {
        flag = flag + 1
    }
}

function walkBoundary() {
    let result = getRayDistance(camera.position)
    if (result.object.name === "water") {
        camera.position.x = lastCameraPosition.x
        camera.position.y = lastCameraPosition.y
        camera.position.z = lastCameraPosition.z
    } else {
        camera.position.y = camera.position.y - (result.distance - walkHeight)
    }
}

export let collapseBridge = function () {
    let mp3 = new Audio(video.bridgeCollapse)
    mp3.play()
    setTimeout(() => {
        // tempBridge = gltfBridge.clone();
        // // tempBridge.position.set(gltfBridge.position.x,gltfBridge.position.y,gltfBridge.position.z)
        // scene.add(tempBridge);
        // gltfBridge.visible = false;
        //廊桥坍塌开启
        // spearation(tempBridge.children[0],10);
        collapseFunction = updatePhysics
        setTimeout(() => {
            // collapseBack();
            let object
            for (let i = 0, iL = rigidBodies.length; i < iL; i++) {
                object = rigidBodies[i]
                physicsWord.removeRigidBody(object.userData.physicsBody)
            }
        }, duration)
    }, 300)
}
//让廊桥复原
export let rollBackBridge = function (bool) {
    //演示duration后廊桥开始复原
    collapseFunction = () => {
    }
    //位置还原
    collapseBack(bool)
}

//廊桥位置的复原,false:瞬间复原
function collapseBack(bool) {
    //rigidBodies
    for (let i = 0, iL = rigidBodies.length; i < iL; i++) {
        let object = rigidBodies[i]
        // physicsWord.removeRigidBody(object.userData.physicsBody);
        let nowValue = {
            x: object.position.x,
            y: object.position.y,
            z: object.position.z,
            _x: object.quaternion._x,
            _y: object.quaternion._y,
            _z: object.quaternion._z,
            _w: object.quaternion._w,
        }
        let lastValue = {
            x: object.userData.originalPosition.x,
            y: object.userData.originalPosition.y,
            z: object.userData.originalPosition.z,
            _x: object.userData.originalQuaternion._x,
            _y: object.userData.originalQuaternion._y,
            _z: object.userData.originalQuaternion._z,
            _w: object.userData.originalQuaternion._w
        }
        if (bool) {

            // debugger
            let tween = new TWEEN.Tween(nowValue).to(lastValue, duration)
            tween.easing(TWEEN.Easing.Sinusoidal.InOut)
            let onUpdate = function (value) {
                object.position.set(value.x, value.y, value.z)
                object.quaternion.set(value._x, value._y, value._z, value._w)
            }
            tween.onUpdate(onUpdate)
            tween.start()
        } else {
            object.position.set(lastValue.x, lastValue.y, lastValue.z)
            object.quaternion.set(lastValue._x, lastValue._y, lastValue._z, lastValue._w)
        }

    }
}

//分离桥吗，模拟坍塌
export let spearation = function (object, mass) {
    for (let i = 0; i < object.children.length; i++) {
        if (object.children[i] instanceof THREE.Object3D) {
            let obj = object.children[i]
            let size = getSizeFromObject(obj)
            let position = obj.position
            let quaternion = obj.quaternion
            createRigidBodyExsists(obj,
                new Ammo.btBoxShape(new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5)), mass,
                position, quaternion)
        }
    }
}

//物理初始化
function initPhysics() {
    //碰撞配置
    collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
    //碰撞调度
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    //广泛阶段
    broadphase = new Ammo.btDbvtBroadphase()
    //约束解析器
    solver = new Ammo.btSequentialImpulseConstraintSolver()
    //物理世界
    physicsWord = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration)
    physicsWord.setGravity(new Ammo.btVector3(0, 0, -gravityConstant))
}

//随机颜色材质
function createRandomColorMaterial() {
    //000000->ffffff
    let color = Math.floor(Math.random() * (1 << 24))
    return new THREE.MeshPhongMaterial({color: color})
}

//创建box物理对象
function createParallelepiped(sx, sy, sz, mass, pos, quat, material) {
    let threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material)
    //给中心点，根据中心点计算
    let shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5))
    //给一个误差
    shape.setMargin(margin)

    createRigidBody(threeObject, shape, mass, pos, quat)

    return threeObject
}

//已经在场景中的物质转成物理对象
function createRigidBodyExsists(threeObject, physicsShape, mass, pos, quat) {
    physicsShape.setMargin(margin)
    // threeObject.position.copy(pos);
    // threeObject.quaternion.copy(quat);
    //设置transform
    let transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    //动作阶段
    let motionState = new Ammo.btDefaultMotionState(transform)

    let localInertia = new Ammo.btVector3(0, 0, 0)
    physicsShape.calculateLocalInertia(mass, localInertia)

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
    let body = new Ammo.btRigidBody(rbInfo)

    //给threeObject的物体放入自定义的数据
    threeObject.userData.physicsBody = body

    let ms = body.getMotionState()
    if (ms) {
        ms.getWorldTransform(transformAuxl)
        let p = transformAuxl.getOrigin()
        let g = transformAuxl.getRotation()
        threeObject.userData.originalPosition = new THREE.Vector3(p.x(), p.y(), p.z())
        threeObject.userData.originalQuaternion = new THREE.Quaternion(g.x(), g.y(), g.z(), g.w())
    }

    // scene.add(threeObject);
    //当质量设置为0的时候是静态物体
    if (mass > 0) {
        rigidBodies.push(threeObject)
        //c++枚举的第二位，设置为4则不会发生力量的衰减。
        body.setActivationState(4)
    }
    physicsWord.addRigidBody(body)
    return body
}

//新建物理对象
function createRigidBody(threeObject, physicsShape, mass, pos, quat) {
    threeObject.position.copy(pos)
    threeObject.quaternion.copy(quat)

    let transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    let motionState = new Ammo.btDefaultMotionState(transform)

    let localInertia = new Ammo.btVector3(0, 0, 0)
    physicsShape.calculateLocalInertia(mass, localInertia)

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia)
    let body = new Ammo.btRigidBody(rbInfo)

    //给threeObject的物体放入自定义的数据
    threeObject.userData.physicsBody = body
    scene.add(threeObject)

    //当质量设置为0的时候是静态物体
    if (mass > 0) {
        rigidBodies.push(threeObject)
        //c++枚举的第二位，设置为4则不会发生力量的衰减。
        body.setActivationState(4)
    }
    physicsWord.addRigidBody(body)

    return body
}

//跟新物理对象渲染
function updatePhysics(deltaTime) {
    physicsWord.stepSimulation(deltaTime)
    for (let i = 0, iL = rigidBodies.length; i < iL; i++) {
        let objTHREE = rigidBodies[i]
        let objPhys = objTHREE.userData.physicsBody
        let ms = objPhys.getMotionState()
        if (ms) {
            ms.getWorldTransform(transformAuxl)
            let p = transformAuxl.getOrigin()
            let g = transformAuxl.getRotation()
            objTHREE.position.set(p.x(), p.y(), p.z())
            objTHREE.quaternion.set(g.x(), g.y(), g.z(), g.w())
        }
    }
}
