import * as THREE from 'three/build/three.module.js'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js"
// import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {camera, model, scene, container, composer, renderer, outlinePass, selectedObjects} from "./index"
import {rendererAR, sceneAR, cameraAR, controlsAR} from "./index"
//关于轮廓描边
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js"
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js"
import {OutlinePass} from "three/examples/jsm/postprocessing/OutlinePass.js"
import TWEEN from "@tweenjs/tween.js"
import {duration} from "./zyy"
import {CustomGLTFLoader} from './poolClass.js'

// let json = {
//   gltf:true
//   function:()=>{}
//   geometry: new THREE.BoxGeometry(1, 1, 0),
//   material: new THREE.MeshBasicMaterial({
//     color: 0xffffff,
//     transparent: true,
//     opacity: 1,
//   }),
//   texture: textureLoaderUrl,
// }

//创建模型的通用方法
export let createModel = function (json) {
    if (json["gltf"]) {
        // gltf,url,name,scene,function
        new GLTFLoader().load(json["url"], (gltf) => {
            gltf.scene.name = json["name"]
            json["function"](gltf.scene)
        })
    } else {
        //gltf,geometry,material,textureLoaderUrl,name,scene,function
        if (json["textureLoaderUrl"] != null) {
            json["material"].map = new THREE.TextureLoader().load(json["textureLoaderUrl"])
            json["material"].wrapS = json["material"].wrapT = THREE.RepeatWrapping
        }
        let mesh = new THREE.Mesh(json["geometry"], json["material"])
        mesh.name = json["name"]
        json["function"](mesh)
        return mesh
    }
}
export let createModelDB = function (json) {
    // new GLTFLoader().load(json["url"][0].url, (gltf) => {
    //     gltf.scene.name = json["name"]
    //     json["function"](gltf.scene)
    // })
    new CustomGLTFLoader(json['url'], 'bridge').load().then(gltf => {
        let time = setInterval(() => {
            if (gltf.children[0]) {
                let model = gltf.children[0]
                model.name = json["name"]
                json["function"](model)
                // console.log(modelNum)
                clearInterval(time)
                time = null
            }
        }, 60)
    })
}
//射线识别的通用方法
export let getRayObject = function (clientX, clientY) {
    let worldVector = changeClientToWorldVector(clientX, clientY, container, camera)
    // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    let ray = worldVector.sub(camera.position).normalize()
    // 创建射线投射器对象
    let rayCaster = new THREE.Raycaster(camera.position, ray)
    let result = null
    // 返回射线选中的对象数组(第二个参数默认值是false，意为是否遍历图形内部的所有子图形)
    let intersects = rayCaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
        // 射线拾取的首个对象
        result = intersects[0].object
        //处理导入的gltf模型会检测到内部模型的问题
        if (result.name.slice(0, 3) != "obj") {
            result = result.parent
        }
    }
    return result
}

//射线识别的通用方法
export let getRayGltfObject = function (clientX, clientY) {
    let worldVector = changeClientToWorldVector(clientX, clientY, container, camera)
    // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    let ray = worldVector.sub(camera.position).normalize()
    // 创建射线投射器对象
    let rayCaster = new THREE.Raycaster(camera.position, ray, 0, 10)
    let result = null
    // 返回射线选中的对象数组(第二个参数默认值是false，意为是否遍历图形内部的所有子图形)
    let intersects = rayCaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
        // 射线拾取的首个对象
        result = intersects[0].object
        //处理导入的gltf模型会检测到内部模型的问题
        while (result.name.slice(0, 4) != "gltf" && result.name.slice(0, 3) != "obj") {
            if (result.parent == null) break
            result = result.parent
        }
    }
    return result
}
//检测距离脚底下最近模型的距离
export let getRayDistance = function (position) {
    let verticalPosition = new THREE.Vector3(position.x, 0, position.z)
    // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    let ray = verticalPosition.sub(position).normalize()
    // 创建射线投射器对象
    let rayCaster = new THREE.Raycaster(position, ray, 0, 10)
    let result = null
    // 返回射线选中的对象数组(第二个参数默认值是false，意为是否遍历图形内部的所有子图形)
    let intersects = rayCaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
        // // 射线拾取的首个对象
        // result = intersects[0].object
        // //处理导入的gltf模型会检测到内部模型的问题
        // while (result.name.slice(0, 4) != "gltf") {
        //     if(result.parent==null) break;
        //     result = result.parent
        // }
        result = intersects[0]
    }
    return result
}
export let walkgetRayObject = function (clientX, clientY) {
    let worldVector = changeClientToWorldVector(clientX, clientY, container, camera)
    // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    let ray = worldVector.sub(camera.position).normalize()
    // 创建射线投射器对象
    let rayCaster = new THREE.Raycaster(camera.position, ray, 0, 1)
    let result = null
    // 返回射线选中的对象数组(第二个参数默认值是false，意为是否遍历图形内部的所有子图形)
    let intersects = rayCaster.intersectObjects(scene.children, true)
    if (intersects.length > 0) {
        // 射线拾取的首个对象
        result = intersects[0].object
        //处理导入的gltf模型会检测到内部模型的问题
        if (result.name.slice(0, 3) != "obj") {
            result = result.parent
        }
    }
    return result
}

export let getRayObjectAR = function (clientX, clientY) {
    let worldVector = changeClientToWorldVectorAR(clientX, clientY, container, cameraAR)
    // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
    let ray = worldVector.sub(cameraAR.position).normalize()
    // 创建射线投射器对象
    let rayCaster = new THREE.Raycaster(cameraAR.position, ray)
    let result = null
    // 返回射线选中的对象数组(第二个参数默认值是false，意为是否遍历图形内部的所有子图形)
    let intersects = rayCaster.intersectObjects(sceneAR.children, true)
    if (intersects.length > 0) {
        // 射线拾取的首个对象
        result = intersects[0].object

    }
    return result
}
export let changeClientToWorldVectorAR = function (clientX, clientY) {
    let x = ((clientX - container.getBoundingClientRect().left) / container.offsetWidth) * 2 - 1   // 设备横坐标
    let y = -((clientY - container.getBoundingClientRect().top) / container.offsetHeight) * 2 + 1  // 设备纵坐标
    // 标准设备坐标转为世界坐标
    return new THREE.Vector3(x, y, 1).unproject(cameraAR)
}
export let changeClientToWorldVector = function (clientX, clientY) {
    let x = ((clientX - container.getBoundingClientRect().left) / container.offsetWidth) * 2 - 1   // 设备横坐标
    let y = -((clientY - container.getBoundingClientRect().top) / container.offsetHeight) * 2 + 1  // 设备纵坐标
    // 标准设备坐标转为世界坐标
    return new THREE.Vector3(x, y, 1).unproject(camera)
}
//获取模型的大小
export let getSizeFromObject = function (object) {
    let box = new THREE.Box3().setFromObject(object)
    let x = box.max.x - box.min.x
    let y = box.max.y - box.min.y
    let z = box.max.z - box.min.z
    return new THREE.Vector3(x, y, z)
}
//吧模型包裹并且重置中点,true以模型中心为中心点
export let changeObjectToCenter = function (object, bool) {
    let group = new THREE.Group()
    group.position.set(0, 0, 0)
    group.add(object)
    let box = new THREE.Box3().setFromObject(object)
    let x = (box.max.x + box.min.x) / 2
    let z = (box.max.z + box.min.z) / 2
    if (bool) {
        let y = (box.max.y + box.min.y) / 2
        object.position.set(-x, -y, -z)
    } else {
        object.position.set(-x, 0, -z)
    }
    return group
}
//object:需要检测的物体。list：会碰撞到的物理列表。optionLength:自定义碰撞迁移距离
export let collisionDetection = function (object, list, optionLength) {
    let originPoint = object.position
    let result = false
    for (let vertexIndex = 0; vertexIndex < object.geometry.vertices.length; vertexIndex++) {
        //获取object的其中一个顶点
        let localVertex = object.geometry.vertices[vertexIndex]
        // 顶点经过变换后的坐标
        let globalVertex = localVertex.applyMatrix4(object.matrix)
        // 获得由中心指向顶点的向量
        let directionVector = globalVertex.sub(originPoint)
        // 将方向向量初始化
        let ray = new THREE.Raycaster(originPoint, directionVector.normalize())
        // 检测射线与多个物体的相交情况
        let collisionResults = ray.intersectObjects(list, true)
        // debugger
        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() + optionLength) {
            result = true
        }
    }
    return result
}
//消息提示的工具
export let showMessage = function (message, url, onProgress, cancel, confirm) {
    let time
    let objMessage = document.createElement("div")
    objMessage.setAttribute("class", "message")
    if (url != null) {
        let image = document.createElement("img")
        image.src = url
        objMessage.appendChild(image)
    }
    //message的div
    let div = document.createElement("div")
    div.innerHTML = message
    objMessage.appendChild(div)
    //提示的div
    let divTip = document.createElement("div")
    divTip.innerText = "双击进入，单击取消"
    objMessage.appendChild(divTip)
    document.getElementsByTagName("body")[0].appendChild(objMessage)
    onProgress(div)
    objMessage.addEventListener('click', () => {
        clearTimeout(time)
        time = setTimeout(() => {
            document.getElementsByTagName("body")[0].removeChild(objMessage)
            cancel()
        }, 300)
    }, false)
    objMessage.addEventListener('dblclick', () => {
        clearTimeout(time)
        document.getElementsByTagName("body")[0].removeChild(objMessage)
        confirm()
    }, false)
}

export let showOperate = function () {
    let obj = {}
    let time
    obj.objOperate = null
    obj.objOperateContent = null
    obj.objOperateTip = null
    obj.objListener = null
    obj.confirm = () => {
    }
    obj.cancel = () => {
    }
    obj.init = function () {
        if (document.getElementById("operate") !== null) return null
        let time
        obj.objOperate = document.createElement("div")
        obj.objOperate.setAttribute("id", "operate")
        obj.objOperate.setAttribute("class", "endMoveOperate")
        //创建内容提示分离
        obj.objOperateContent = document.createElement("div")
        obj.objOperateContent.setAttribute("id", "operateContent")
        obj.objOperate.appendChild(obj.objOperateContent)
        obj.objOperateTip = document.createElement("div")
        obj.objOperateTip.setAttribute("id", "operateTip")
        obj.objOperateTip.innerHTML = "双击面板继续<br>单击面板取消剧情"
        obj.objOperate.appendChild(obj.objOperateTip)
        document.getElementsByTagName("body")[0].appendChild(obj.objOperate)
        //单击container可以伸缩operate
        //touch
        // container
        obj.objListener = (event) => {
            if (obj.objOperate.getAttribute("class") === "startMoveOperate") {
                obj.objOperate.setAttribute("class", "endMoveOperate")
            } else {
                obj.objOperate.setAttribute("class", "startMoveOperate")
            }
        }
        container.addEventListener("click", obj.objListener, false)
        //初始化comfirm和cancel绑定的函数；
        obj.objOperateTip.addEventListener("dblclick", obj.confirm, false)
        obj.objOperateTip.addEventListener("click", obj.cancel, false)
        return obj
    }
    obj.pushAllAndPushElement = function (createElement, end) {
        obj.objOperateContent.innerHTML = ""
        let element = createElement()
        obj.objOperateContent.appendChild(element)
        if (end != null) end(element)
        return obj
    }
    obj.pushElement = function (createElement, end) {
        let element = createElement()
        obj.objOperateContent.appendChild(element)
        if (end != null) end(element)
        return obj
    }
    obj.pushConfirm = function (confirm) {
        obj.objOperateTip.removeEventListener("dblclick", obj.confirm, false)
        obj.confirm = () => {
            clearTimeout(time)
            //传入之前的运行函数可以制作多重函数
            confirm()
        }
        obj.objOperateTip.addEventListener("dblclick", obj.confirm, false)
        return obj
    }
    obj.pushCancel = function (cancel) {
        obj.objOperateTip.removeEventListener("click", obj.cancel, false)
        obj.cancel = () => {
            clearTimeout(time)
            time = setTimeout(() => {
                //传入之前的运行函数可以制作多重函数
                cancel()
            }, 300)
        }
        obj.objOperateTip.addEventListener("click", obj.cancel, false)
        return obj
    }
    obj.isEmpty = function () {
        if (obj.objOperate == null) return true
        else return false
    }
    obj.hide = function () {
        obj.objOperate.setAttribute("class", "startMoveOperate")
        return obj
    }
    obj.show = function () {
        this.objOperate.setAttribute("class", "endMoveOperate")
        return obj
    }
    obj.delete = function () {
        container.removeEventListener("click", obj.objListener, false)
        document.getElementsByTagName("body")[0].removeChild(obj.objOperate)
        obj.objOperate = null
        return obj
    }
    return obj

}

export function rotateCamera(cameraDirection, position, camera, duration) {
    // let direction = new THREE.Vector3()
    // camera.getWorldDirection(direction)
    let nowValue = {
        x: camera.position.x + cameraDirection.x * 100,
        y: camera.position.y + cameraDirection.y * 100,
        z: camera.position.z + cameraDirection.z * 100,
    }
    let toValue = {
        x: position.x,
        y: position.y,
        z: position.z
    }

    let tween = new TWEEN.Tween(nowValue).to(toValue, duration)
    tween.easing(TWEEN.Easing.Linear.None)
    let onUpdate = function (value) {
        camera.lookAt(value.x, value.y, value.z)
    }
    tween.onUpdate(onUpdate)
    tween.start()
}

//literallycanvas create-react-class  react react-dom react-dom-factories


