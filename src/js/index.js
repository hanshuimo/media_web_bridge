import '../css/index.css'
import '../css/loading.css'
import * as THREE from 'three'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader"
import {FirstPersonControls} from "three/examples/jsm/controls/FirstPersonControls"
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import {DeviceOrientationControls} from "three/examples/jsm/controls/DeviceOrientationControls"
import {Sky} from "three/examples/jsm/objects/Sky"
import {Water} from 'three/examples/jsm/objects/Water'
import {
    createModel,
    createModelDB,
    showMessage,
    showOperate,
    collisionDetection,
    changeClientToWorldVector,
    walkgetRayObject,
    getRayGltfObject, changeObjectToCenter
} from "./util"
import {Uniform} from 'three/build/three.module'
import {ZTinit, ZTanimate, swerve, ZTinitAR, initARCameraBox, mediaStreamTrack, ifBoating} from './zt.js'
import {YZanimate, YZinit} from "./yz"
import {ZYYinit, ZYYanimate} from './zyy'
import TWEEN from '@tweenjs/tween.js'
//泛光
import {
    GodRaysFakeSunShader,
    GodRaysDepthMaskShader,
    GodRaysCombineShader,
    GodRaysGenerateShader
} from "three/examples/jsm/shaders/GodRaysShader"
//关于轮廓描边
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js"
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js"
import {OutlinePass} from "three/examples/jsm/postprocessing/OutlinePass.js"

import {CustomDB} from './dbClass.js'

export const model = require("./model.js")
export const image = require("./image.js")
export const video = require("./video.js")
export const shader = require("./Shader.js")

export const container = document.getElementById('container')
export let ifAR = false
export let camera, controls, scene, renderer, dControls, operate, sceneBackgroundTextureCube
export let rendererAR, sceneAR, cameraAR, controlsAR
export let render = renderBG
export let tweenBeamGroup, tweenPillarGroup, tweenRoof, tweenTriangle
export let plane,BeamGroup,PillarGroup,Roof,Triangle
let modelArrayAR = [plane,BeamGroup,PillarGroup,Roof,Triangle]
export let ontouchstart
export let modelNum = 0
let sky, sun, water, ground
let gltfWharf
export let gltfBoat, gltfBridge, gltfBridgeAR, gltfBoatAnimation, gltfMountain
let clock = new THREE.Clock(), time
//设置Phone/PC类型
let ifPhone = true
let cameraDirectionMethod = null
//设置长按移动
let ifCameraGo = false
export let timeOutEvent = 0 //长按定时器

let objCloud, objCloudArray = []

//轮廓描边
let composer, outlinePass
export let selectObjects = []

function init() {
    // initLoading()
    initDB()
    initBG()
    initAR()
    initOperate()
    //object:需要检测的物体。list：会碰撞到的物理列表。optionLength:自定义碰撞迁移距离
    //collisionDetection(direction, objBridge, 1)

}

function initDB() {
    //创建数据库，数据库名称以及版本
    let paramsDB = {dbName: 'bridge', version: 1}
    //数据表具体参数初始化
    let paramsStore = [
        {
            baseInfo: {'storeName': 'mountain', 'keyPath': 'id', 'storeIfUp': false}
        },
        {
            baseInfo: {'storeName': 'bridgeWithGroupSecond', 'keyPath': 'id', 'storeIfUp': false}
        },
        {
            baseInfo: {'storeName': 'wharf', 'keyPath': 'id', 'storeIfUp': false}
        },
        // {
        //   //数据表名称，主键，主键是否自动递增排序
        //   baseInfo: {'storeName': 'boat1', 'keyPath': 'id', 'storeIfUp': false},
        //   //传递数据表索引，键名：索引，键值：配置对象（说明该属性是否包含重复值）
        //   //模型名字，模型信息，模型位置信息
        //   // indexesInfo: {'arrayBuffer': true}
        // },
        // {
        //   //数据表名称，主键，主键是否自动递增排序
        //   baseInfo: {'storeName': 'boat2', 'keyPath': 'id', 'storeIfUp': false},
        //   //传递数据表索引，键名：索引，键值：配置对象（说明该属性是否包含重复值）
        //   //模型名字，模型信息，模型位置信息
        //   // indexesInfo: {'arrayBuffer': true}
        // },
    ]

    let db = new CustomDB(paramsDB, paramsStore)
}

function initBG() {
    initRenderer()
    initScene()
    initCamera()
    //初始化方式 PC/PHONE
    controlMethod()
    // initLight()
    initWater()
    initSky()
    YZinit()
    ZTinit()
    ZYYinit()
    initObj()
    // let axesHelper = new THREE.AxesHelper(1000)
    // scene.add(axesHelper)
    showMessage("转动视角：移动手机。<br/>前进：长按场景。<br/>隐藏/显示操作小提示：单击场景。<br/>开启任务：双击发光石碑，继续探寻廊桥遗迹的沧桑历史吧！", null,
        () => {
        }, () => {
            dControls.connect()
        }, () => {
            dControls.connect()
        })
    //初始化轮廓显示
    initComposer()
}

function initAR() {
    initARRenderer()
    initARScene()
    initARCamera()
    initARControl()
    initARLight()
    initARObj()
    ZTinitAR()
    //The X axis is red. The Y axis is green. The Z axis is blue.
    // let axesHelper = new THREE.AxesHelper(1000)
    // sceneAR.add(axesHelper)
}

function initLoading() {
    let flag = false;
    let loading = document.createElement("div")
    loading.setAttribute("class", "loading")
    let base = document.createElement("div")
    base.setAttribute("class", "base")
    let cube
    for (let i = 0; i < 9; i++) {
        cube = document.createElement("div")
        cube.setAttribute("class", "cube")
        base.appendChild(cube)
    }
    loading.appendChild(base)
    document.body.appendChild(loading)
    let testTime = new Date().getTime()
    let interval = setInterval(() => {
        if (modelNum === 5 && loading&&!flag) {
            flag = true;
            setTimeout(() => {
                console.log(new Date().getTime() - testTime)
                clearInterval(interval)
                camera.lookAt(gltfBridge)
                document.body.removeChild(loading)
            }, 500)
        }
    }, 100)

}

function initARScene() {
    sceneAR = new THREE.Scene()
}

function initARCamera() {
    cameraAR = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    // cameraAR.position.set(0, 100, 0)
    // cameraAR.lookAt(new THREE.Vector3(0, 0, 0))
    cameraAR.position.set(-40, 0, 0)
}

function initARControl() {
    controlsAR = new DeviceOrientationControls(cameraAR)
    // controlsAR = new OrbitControls(cameraAR, rendererAR.domElement)
    // controlsAR.target.set(0, 0, 0)
}

function initARObj() {
    // let group = new THREE.Group()
    // let num = 0
    let modelArray = [model.plane, model.beam, model.pillar, model.roof, model.triangle]
    let nameArray = ['plane', 'beam', 'pillar', 'roof', 'triangle']

    for (let i = 0; i < 5; i++) {
        createModel({
            gltf: true,
            url: modelArray[i],
            name: nameArray[i],
            function: (gltf) => {
                gltf.scale.set(30, 30, 30)
                gltf.position.set(0, 0, 0)
                // group.add(gltf)
                // num++
                // bridgeAddGroup(group, num)

                // sceneAR.add(gltf)
                modelArrayAR[i]=gltf
                sceneAR.add(modelArrayAR[i])

                console.log(sceneAR)
                if (i !== 0) {
                    //todo
                    // dispersed(i, gltf.name, 2, gltf, new THREE.Box3().setFromObject(gltf))
                    dispersed(i, modelArrayAR[i].name, 2, modelArrayAR[i], new THREE.Box3().setFromObject(gltf))
                }
            }
        })
    }
    cameraAR.lookAt(0, 0, 0)
    // function bridgeAddGroup(group,num) {
    //     if (num == 5) {
    //         gltfBridgeAR = group
    //     }
    // }

}

function dispersed(i, name, size, group, box) {
    // group.userData.dx = (Math.random() * 20 + 35) * (Math.round(Math.random()) * 2 - 1)
    // group.userData.dy = (Math.random() * 20 + 35) * (Math.round(Math.random()) * 2 - 1)
    // group.userData.dz = (Math.random() * 20 + 35) * (Math.round(Math.random()) * 2 - 1)
    let length = 50
    let dxArray = [0, length, length, -length, -length]
    let dzArray = [0, length, -length, length, -length]
    group.userData.dx = dxArray[i]
    group.userData.dy = (Math.random() * 20 + 35) * (Math.round(Math.random()) * 2 - 1)
    group.userData.dz = dzArray[i]
    group.position.x = group.userData.dx
    group.position.y = group.userData.dy
    group.position.z = group.userData.dz
    let geometry = new THREE.BoxBufferGeometry((box.max.x - box.min.x) * size, (box.max.y - box.min.y) * size, (box.max.z - box.min.z) * size)
    let material = new THREE.MeshBasicMaterial({opacity: 0, transparent: true})//wireframe: true,
    let mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
        group.userData.dx + (box.max.x + box.min.x) * size / 2,
        group.userData.dy + (box.max.y + box.min.y) * size / 2,
        group.userData.dz + (box.max.z + box.min.z) * size / 2)
    mesh.name = 'box_' + group.name
    sceneAR.add(mesh)
    let position = {
        x: group.userData.dx,
        y: group.userData.dy,
        z: group.userData.dz
    }

    let tween = new TWEEN.Tween(position).to({x: 0, y: 30, z: 0}, 5000)
    tween.easing(TWEEN.Easing.Sinusoidal.InOut)
    let onUpdate = function (e) {
        group.position.set(e.x, e.y, e.z)
    }
    tween.onUpdate(onUpdate)
    let tweenInsert = new TWEEN.Tween({x: 0, y: 30, z: 0}).to({x: 0, y: 0, z: 0}, 2000)
    tweenInsert.easing(TWEEN.Easing.Sinusoidal.InOut)
    let onUpdateInsert = function (e) {
        group.position.set(e.x, e.y, e.z)
    }
    tweenInsert.onUpdate(onUpdateInsert)

    tween.chain(tweenInsert)
    if (name === 'beam') {
        tweenBeamGroup = tween
        //tweenBeamGroup.start();
    } else if (name === 'pillar') {
        tweenPillarGroup = tween
        //tweenPillarGroup.start();
    } else if (name === 'roof') {
        tweenRoof = tween
        //tweenRoof.start();
    } else if (name === 'triangle') {
        tweenTriangle = tween
    }
}

function initOperate() {
    operate = showOperate()
}

//轮廓
function initComposer() {
    composer = new EffectComposer(renderer)
    let renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
    composer.addPass(outlinePass)
    outlinePass.edgeStrength = 5
    outlinePass.edgeGlow = 0.5
    outlinePass.edgeThickness = 1
    outlinePass.pulsePeriod = 2
    outlinePass.visibleEdgeColor.set('#ffffff')
    outlinePass.hiddenEdgeColor.set('#ffffff')
}

function controlMethod() {
    if (ifPhone) {
        //初始化陀螺仪
        initDControl()
        //长按事件
        //长按1s开始移动
        container.addEventListener('click', clickEvent, false)
        container.addEventListener('touchstart', ontouchstart, false)
        container.addEventListener('touchend', ontouchend, false)
        container.addEventListener('dblclick', doubleClickEvent, false)
        //陀螺仪移动方式
        cameraDirectionMethod = () => {
            if (dControls) {
                dControls.update()
            }
            if (ifCameraGo === true) {
                let direction = new THREE.Vector3()
                //console.log(direction);
                camera.getWorldDirection(direction)
                //direction.y = 0
                camera.position.add(direction.multiplyScalar(0.1))
                swerve()
            }
        }
    } else {
        //初始化第一人称
        initFirstPerson()
        //鼠标移动获取模型信息
        container.addEventListener('mousemove', mousemove, false)
        //鼠标点击获取模型信息
        container.addEventListener('click', clickEvent, false)
        //鼠标按下获取模型信息
        container.addEventListener('mousedown', onmousedownEvent, false)
        // //鼠标双击触发任务事件
        container.addEventListener('dblclick', doubleClickEvent, false)
        //第一人称移动方式
        cameraDirectionMethod = () => {
            controls.update(clock.getDelta())
        }

    }
}

function clickEvent(event) {
}

ontouchstart = function (event) {

    // event.preventDefault();
    if (event.touches.length == 1) {
        timeOutEvent = setTimeout(() => {
            timeOutEvent = 0
            //if(walkgetRayObject(event.changedTouches[0],event.changedTouches[0].clientY+500)==null)
            ifCameraGo = true
        }, 1000)

    }
    return false
}

function ontouchend() {
    clearTimeout(timeOutEvent)//清除定时器
    timeOutEvent = 0
    ifCameraGo = false
    //clearInterval(collisionDetectiontime);
}


function onmousedownEvent(event) {

}

// function onmousedownUp(event) {
//   //去除定时器-----------
//   clearInterval(collisionDetectiontime)
//   去除鼠标松开方法的绑定
//   controls.movementSpeed = 1;//改为0移动速度
//   container.removeEventListener('mouseup', onmousedownUp, false)
// }

function mousemove(event) {

}

function doubleClickEvent(event) {
    // clearTimeout(timeOutEvent)
    //
    // if (!ifAR) {
    //
    //     changeScene()
    // }
}

function animate() {
    requestAnimationFrame(animate)
    outlinePass.selectedObjects = [...selectObjects]
    // console.log(camera.position)
    let time = performance.now() * 0.001
    water.material.uniforms['time'].value += 2.0 / 1000.0
    if (objCloudArray.length !== 0) {
        for (let i in objCloudArray) {
            objCloudArray[i].lookAt(camera.position)
        }
    }
    TWEEN.update()
    if (gltfBoatAnimation && ifCameraGo && ifBoating) {
        let time = clock.getDelta()
        gltfBoatAnimation.update(time)
    }
    render()
}

function renderBG() {
    cameraDirectionMethod()
    ZTanimate()
    YZanimate()
    ZYYanimate()
    // renderer.render(scene, camera)
    composer.render(scene, camera)
}

function renderAR() {
    controlsAR.update()
    rendererAR.render(sceneAR, cameraAR)
}

function initScene() {
    scene = new THREE.Scene()
    //scene.fog = new THREE.Fog(0xffffff, 1,50);
}

function initCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    // camera.position.set(66,20,78)
    camera.position.set(96, 20.1, 97)
    // camera.lookAt(new THREE.Vector3(70, 21, 71))
    // warning 使用OrbitControls后camera.lookAt失效，需要调用controls.target设置相机方向，代码364行
}

function initFirstPerson() {
    controls = new FirstPersonControls(camera)
    controls.enabled = true
    controls.lookSpeed = 0.1 //鼠标移动查看的速度
    controls.movementSpeed = 10 //相机移动速度
    controls.noFly = false
    controls.constrainVertical = true //约束垂直
    controls.verticalMin = 1.0
    controls.verticalMax = 2.0
    controls.lon = 0 //进入初始视角x轴的角度
    controls.lat = 0 //初始视角进入后y轴的角度
    // controls = new OrbitControls(camera, renderer.domElement)
    // controls.target.set(70, 21, 71)
}

function initRenderer() {
    renderer = new THREE.WebGLRenderer({antialias: true})
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 1)
    renderer.shadowMap.enabled = true
    renderer.domElement.setAttribute("id", "canvasBG")
    container.appendChild(renderer.domElement)
}

function initARRenderer() {
    rendererAR = new THREE.WebGLRenderer({antialias: true, alpha: true})
    rendererAR.setPixelRatio(window.devicePixelRatio)
    rendererAR.setSize(window.innerWidth, window.innerHeight)
    rendererAR.setClearColor(0xffffff, 0)
    rendererAR.shadowMap.enabled = true
    rendererAR.domElement.setAttribute("id", "canvasAR")
    container.appendChild(rendererAR.domElement)
}

function initARLight() {
    //光线,环境光，点光
    const ambient = new THREE.AmbientLight(0xFFFFFF)
    sceneAR.add(ambient)
    const pointLight = new THREE.DirectionalLight(0xFFFFFF)
    pointLight.position.set(0, 100, 100)
    sceneAR.add(pointLight)
}

function initDControl() {
    dControls = new DeviceOrientationControls(camera)
    // console.log(dControls.object)
    // dControls.enabled=false
    // dControls.object.lookAt(70, 21, 71)
    // camera.lookAt(70, 21, 71)
}

function initLight() {
    //光线,环境光，点光
    const ambient = new THREE.AmbientLight(0xFFFFFF)
    scene.add(ambient)
    // const pointLight = new THREE.DirectionalLight(0xFFFFFF)
    // pointLight.position.set(0, 100, 100)
    // scene.add(pointLight)
}

function initSky() {
    let urls = [image.px, image.nx, image.py, image.ny, image.pz, image.nz]
    sceneBackgroundTextureCube = new THREE.CubeTextureLoader().load(urls)
    scene.background = sceneBackgroundTextureCube

    // let texture = THREE.ImageUtils.loadTexture(image.cloud.default, {}, function () {
    //     renderer.render(scene, camera)
    // });
    // // 材质
    // let material = new THREE.MeshLambertMaterial({
    //     map: texture,
    //     // color: 0xF6EECA,
    // })
    // material.side = THREE.DoubleSide
    // material.transparent = true
    // // 几何体
    // objCloud = new THREE.Mesh(new THREE.PlaneGeometry(64, 64, 32, 32), material)
    // objCloud.position.set(28, 16, -38)
    // objCloud.rotation.set(Math.PI / 2, Math.PI, 0)
    // objCloud.scale.set(3, 3, 3)
    // objCloud.name = 'objCloud'
    // scene.add(objCloud)

    // let objCloud1 = objCloud.clone()
    // objCloud1.position.set(80, 18, -38)
    // objCloud1.rotation.set(0, 0, 0)
    // objCloud1.scale.set(1, 1, 1)
    // objCloudArray.push(objCloud1)
    // scene.add(objCloud1)

    // for (let i = 0; i < 50; i++) {
    //     let objCloudA = objCloud.clone()
    //     if (i % 2 === 0) {
    //         let scale = 0.5 + Math.floor(Math.random() * 5) / 10
    //         objCloudA.position.set(80 + Math.floor(Math.random() * 200), 18 + Math.floor(Math.random() * 100), 100 - Math.floor(Math.random() * 400))
    //         objCloudA.rotation.set(0, 0, 0)
    //         objCloudA.scale.set(scale, scale, scale)
    //         objCloudArray.push(objCloudA)
    //         scene.add(objCloudA)
    //     } else {
    //         let scale = 0.5 + Math.floor(Math.random() * 5) / 10
    //         objCloudA.position.set(-80 - Math.floor(Math.random() * 200), 18 + Math.floor(Math.random() * 100), 100 - Math.floor(Math.random() * 400))
    //         objCloudA.rotation.set(0, 0, 0)
    //         objCloudA.scale.set(scale, scale, scale)
    //         objCloudArray.push(objCloudA)
    //         scene.add(objCloudA)
    //     }
    // }

    // var geometry = new THREE.SphereBufferGeometry(0.1, 32, 16)
    // var material = new THREE.MeshBasicMaterial({color: 0xffffff, envMap: textureCube})
    //
    // for (var i = 0; i < 500; i++) {
    //
    //     var mesh = new THREE.Mesh(geometry, material)
    //
    //     mesh.position.x = Math.random() * 10 - 5
    //     mesh.position.y = Math.random() * 10 - 5
    //     mesh.position.z = Math.random() * 10 - 5
    //
    //     mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1
    //
    //     scene.add(mesh)
    //
    //     spheres.push(mesh)
    //
    // }

    // sky = new Sky()
    // sky.scale.setScalar(1000)
    // scene.add(sky)
    //
    // sun = new THREE.Vector3()
    //
    // const effectController = {
    //     turbidity: 100,
    //     rayleigh: 0.5,
    //     mieCoefficient: 0.0005,
    //     mieDirectionalG: 50,
    //     inclination: 0.49,
    //     azimuth: 0.25,
    //     exposure: renderer.toneMappingExposure
    // }
    //
    // function guiChanged() {
    //
    //     let uniforms = sky.material.uniforms
    //     uniforms["turbidity"].value = effectController.turbidity
    //     uniforms["rayleigh"].value = effectController.rayleigh
    //     uniforms["mieCoefficient"].value = effectController.mieCoefficient
    //     uniforms["mieDirectionalG"].value = effectController.mieDirectionalG
    //
    //     let theta = Math.PI * (effectController.inclination - 0.5) * 2
    //     let phi = 2 * Math.PI * (effectController.azimuth - 0.5)
    //
    //     sun.x = Math.cos(phi)
    //     sun.y = Math.sin(phi) * Math.sin(theta)
    //     sun.z = Math.sin(phi) * Math.cos(theta)
    //
    //     uniforms["sunPosition"].value.copy(sun)
    //
    //     renderer.render(scene, camera)
    //
    // }
    //
    // guiChanged()
}

function initWater() {
    let waterGeometry = new THREE.PlaneBufferGeometry(1000, 2000)
    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(image.water, function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            }),
            waterColor: 0x93b5cf,
            fog: scene.fog !== undefined
        }
    )
    water.rotation.x = -Math.PI / 2
    water.position.y = 18
    // water.position.y = 17.8
    water.name = "water"
    scene.add(water)
}

function initObj() {
    //山
    createModel({
        gltf: true,
        url: model.mountain,
        name: "gltfMountain",
        function: (gltf) => {
            gltfMountain = gltf
            gltfMountain.traverse((obj) => {
                if (obj instanceof THREE.Mesh) {
                    obj.name = 'meshMountain'
                }
            })
            gltf.position.set(0, 17, 0)
            gltf.scale.set(0.001, 0.001, 0.001)
            scene.add(gltf)
            modelNum++
        }
    })
    //地面
    //initGround();
    // ground = createModel({
    //     gltf: false,
    //     name: 'ground',
    //     geometry: new THREE.PlaneGeometry(25, 8),
    //     textureLoaderUrl: image.ground,
    //     material: new THREE.MeshLambertMaterial(),
    //     function: (gltf) => {
    //         ground = gltf
    //         gltf.rotation.x = -Math.PI / 2
    //         gltf.position.set(-8.7, 19.5, -34)
    //         scene.add(gltf)
    //         console.log(gltf)
    //     }
    // })

    //桥
    createModel({
        gltf: true,
        url: model.bridgeWithGroupSecond,
        name: 'gltfBridge',
        function: (gltf) => {
            gltfBridge = gltf
            // gltf.position.set(0, 19, -15)
            gltf.position.set(83, 18, 71)
            gltf.scale.set(15, 15, 15)
            gltf.rotation.y = 90 / 180 * Math.PI
            scene.add(gltf)
            modelNum++
        }
    })

    //码头
    createModel({
        gltf: true,
        url: model.wharf,
        name: 'gltfWharf',
        function: (gltf) => {
            gltfWharf = gltf
            gltf.position.set(101, 17, 95)
            gltf.scale.set(2, 2, 2)
            gltf.rotation.y = 105 / 180 * Math.PI
            scene.add(gltf)
            modelNum++
        }
    })
    //码头下面透明的板子
    createModel({
        gltf: false,
        name: "gltfWharf",
        geometry: new THREE.BoxBufferGeometry(5, 1, 10),
        material: new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0, transparent: true}),
        textureLoaderUrl: null,

        function: (obj) => {
            obj.position.set(106, 18.7, 93.5)
            obj.rotation.y = 105 / 180 * Math.PI
            scene.add(obj)
        }
    })

    //船
    // createModel({
    //     gltf: true,
    //     url: model.boat,
    //     name: 'gltfBoat',
    //     function: (gltf) => {
    //         gltf.scale.set(0.3, 0.3, 0.3)
    //         gltfBoat = new THREE.Group()
    //         gltfBoat.position.set(-65, 20, -60)
    //         gltfBoat.add(gltf)
    //         let box = new THREE.Box3().setFromObject(gltf)
    //         gltf.position.set(0, -1, -2)
    //         scene.add(gltfBoat)
    //     }
    // })
    let loder = new GLTFLoader()
    loder.load(model.boat, function (obj) {
        //获取模型，并添加到场景
        let model = obj.scene
        model.scale.set(0.3, 0.3, 0.3)
        gltfBoat = new THREE.Group()
        gltfBoat.position.set(100, 20, 98)
        gltfBoat.add(model)
        let box = new THREE.Box3().setFromObject(model)
        model.position.set(0, -1, -2)
        gltfBoat.rotation.y = 195 / 180 * Math.PI
        gltfBoat.name = "gltfBoat"
        scene.add(gltfBoat)
        //将模型绑定到动画混合器里面
        gltfBoatAnimation = new THREE.AnimationMixer(model)
        // console.log(obj.animations.length)
        //同时将这个外部模型的动画全部绑定到动画混合器里面
        for (let i = 0; i < obj.animations.length; i++) {
            gltfBoatAnimation.clipAction(obj.animations[i]).play()
        }
        modelNum++
    })
    initObjStele()
    // let interval = setInterval(() => {
    //     if (modelNum === 5 && loading) {
    //         setTimeout(() => {
    //             clearInterval(interval)
    //             document.body.removeChild(loading)
    //             showMessage("转动视角：移动手机。前进：长按场景。隐藏/显示操作小提示：单击场景。开启任务：双击发光石碑，继续探寻廊桥遗迹的沧桑历史吧！", null,
    //                 () => {
    //                     // dControls.connect()
    //                 }, () => {
    //                     // dControls.connect()
    //                 })
    //         }, 500)

    //     }
    // }, 100)

}

function initObjStele() {
    //石碑d
    let steleGeometry = new THREE.BoxBufferGeometry()
    //MeshPhongMaterial
    let steleMaterialFront = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load(image.steleFront),
        bumpMap: new THREE.TextureLoader().load(image.steleMap),
        bumpScale: 0.2
    })
    let materialOther = new THREE.MeshPhongMaterial({
        map: new THREE.TextureLoader().load(image.stele),
        bumpMap: new THREE.TextureLoader().load(image.steleMap),
        bumpScale: 0.2
    })
    // var rectLight = new THREE.DirectionalLight(0xFFFFCC,1);
    // rectLight.position.set(70,21,72.5);
    // rectLight.lookAt(67, 20, 77)
    // scene.add(rectLight)
    let steleMaterial = [steleMaterialFront, materialOther, materialOther, materialOther, materialOther, materialOther]
    let stele = new THREE.Mesh(steleGeometry, steleMaterial)
    scene.add(stele)
    modelNum++
    stele.name = 'objStele'
    stele.scale.set(0.3, 3.5, 2)
    // stele.position.set(70, 20.5, 75)
    stele.position.set(98, 20, 76)
    // stele.rotation.y = 2.5
    stele.rotation.y = 23 / 180 * Math.PI
    selectObjects[0] = stele
}

export let changeScene = () => {
    if (ifAR) {
        mediaStreamTrack.getTracks()[0].stop()
        document.getElementById("video-box").remove()
        render = renderBG
        renderer.domElement.style.zIndex = 4
        ifAR = false
        for(let i=0;i<5;i++){
            sceneAR.remove(modelArrayAR[i]);
        }

        initARObj()
    } else {
        initARCameraBox()
        render = renderAR
        renderer.domElement.style.zIndex = 0
        ifAR = true
    }
}
init()
animate()
