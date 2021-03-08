import * as THREE from 'three/build/three.module.js'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js"
import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils'
import {ImprovedNoise} from 'three/examples/jsm/math/ImprovedNoise.js'
import TWEEN from '@tweenjs/tween.js'
import {
    camera,
    scene,
    sceneBackgroundTextureCube,
    video,
    gltfBoat,
    gltfBridge,
    shader,
    image,
    operate,
    dControls,
    container,
    rendererAR, sceneAR, cameraAR, controlsAR,
    tweenBeamGroup, tweenPillarGroup, tweenRoof, tweenTriangle,
    ifAR,
    changeScene, controls
} from "./index"
import {
    getRayGltfObject,
    getRayObject,
    changeObjectToCenter,
    showOperate,
    getRayObjectAR, showMessage, getRayDistance,
    rotateCamera
} from "./util"
import {
    duration,
    collapseBridge,
    rollBackBridge,
    spearation
} from "./zyy.js"


import * as p5 from './p5.min.js'
import {DeviceOrientationControls} from "three/examples/jsm/controls/DeviceOrientationControls"
// import * as chroma from './chroma.min.js'

new p5()
let durationRotateCamera = 3000
let conf = {
    xyCoef: 12,
    zCoef: 30,
    lightIntensity: 0.5,
    ambientColor: 0xffffff,
    light1Color: 0x61719d,
    light2Color: 0x182430,
    light3Color: 0xcf3ce6,
    light4Color: 0x66bc20
    // light1Color: chroma.random().hex(),
    // light2Color: chroma.random().hex(),
    // light3Color: chroma.random().hex(),
    // light4Color: chroma.random().hex()
}
let darkCloud //乌云
let rectLight;
let ambientLight = null
let darkCloudFunction = () => {
}

let repairCount = 0
//单击双击设置clickTime防止冲突
let clickTime = null
//记录时间
var counter = 0
//是否在船上
export let ifBoating = true
var objCloud
//方块视频
var videoBox_1, ifRightVideoPlay = false, videoDiamonds = [], ifRightVideoPlayDone = false, VideoDiamondsSpeed = 1
//方块数量
var cube_count
//粒子视频
var videoBox_2, ifLeftVideoPlay = false, particleVideo, ifLeftVideoPlayDone = false
//是否触发任务一：望向桥的任意一边
var ifMission_1 = false, ifMission_1Done = false
//触发任务，跑到桥的两边
var ifMission_2 = false, ifMission_2Done = false

let iftweenBeamGroup = false, iftweenPillarGroup = false, iftweenRoof = false, iftweenTriangle = false
//判断是否走到桥上望向任意一边
export let mediaStreamTrack
export let ZTinit = () => {
    // document.body.appendChild(test)

    // initDarkCloud()
    initVideo()
    initLight()
    //initARCamera();
    container.addEventListener('dblclick', ZTdoubleClickEvent, false)

    // var x=document.createElement("div")
    // x.style.position="absolute"
    // x.style.height="100px";
    // x.style.width="100px";
    // x.style.zIndex=99;
    // x.style.backgroundColor="white";
    // x.innerHTML=conf.light1Color+"<br>"+conf.light2Color+"<br>"+conf.light3Color+"<br>"+conf.light4Color
    // document.getElementsByTagName("body")[0].appendChild(x);
}
export let ZTanimate = () => {
    //objCloud.lookAt(objCloud.position.x,21,objCloud.position.z)
    //console.log(objCloud.position)

    //乌云动画
    // darkCloud.rotation.z += 0.01
    // animatedarkCloud()
    darkCloudFunction()

    if (!ifBoating) {
        // walkBoundary();
        circleBoundary()
    } else {
        boatingBoundary()
        if (gltfBoat != null) gltfBoat.position.copy(camera.position)
    }
    if (ifRightVideoPlay && counter < 125) {
        changeVideoDiamondsPosition(4)
        //1 350 2
        if (counter == 100) {
            videoBox_1.play()
            videoBox_1.addEventListener("ended", function () {
                removeVideo()
            })
        }
        counter++
    }
    if (ifRightVideoPlayDone && counter > 0) {
        changeVideoDiamondsPosition(-4)
        if (counter == 25) {
            removeVideoDiamond()
            ifRightVideoPlayDone = false
            ifRightVideoPlay = false
            // showTyphoonTip()
            counter = 0
        }
        counter--
    }
    if (ifLeftVideoPlay && counter < 1) {
        videoBox_2.play()
        videoBox_2.addEventListener("ended", function () {
            removeVideo()
        })
        counter++
    }

}

function removeVideo() {
    if (ifRightVideoPlay) {
        //去除方块
        videoBox_1.pause()
        ifRightVideoPlayDone = true
        ifRightVideoPlay = false
    } else if (ifLeftVideoPlay) {
        //去除粒子
        videoBox_2.pause()
        scene.remove(particleVideo)
        particleVideo.geometry.dispose()
        particleVideo.material.dispose()
        ifLeftVideoPlayDone = true
        ifLeftVideoPlay = false

        videoBox_2.remove()
        // showTyphoonTip()
    }
}

export let ZTinitAR = () => {
    container.addEventListener('click', clickAR, false)
}

function initVideo() {
    videoBox_2 = document.createElement('video')
    videoBox_2.preload = 'auto'
    videoBox_2.controls = 'controls'
    videoBox_2.volume = 1
    videoBox_2.style.objectFit = 'fill'
    let videoSource_2 = document.createElement('source')
    videoSource_2.type = 'video/mp4'
    videoSource_2.src = video.prettyFaery
    videoBox_2.appendChild(videoSource_2)

    videoBox_1 = document.createElement('video')
    videoBox_1.preload = 'auto'
    videoBox_1.controls = 'controls'
    videoBox_1.volume = 1
    videoBox_1.style.objectFit = 'fill'
    let videoSource_1 = document.createElement('source')
    videoSource_1.type = 'video/mp4'
    videoSource_1.src = video.prettyLotus
    videoBox_1.appendChild(videoSource_1)
}

function initLight() {
    ambientLight = new THREE.AmbientLight(0xFFFFFF)
    scene.add(ambientLight)
    let r = 5
    let lightIntensity = 0.7
    let lightDistance = 300
    let light1 = new THREE.PointLight(conf.light1Color, lightIntensity, lightDistance)
    light1.position.set(0, 150, r)
    scene.add(light1)
    let light2 = new THREE.PointLight(conf.light2Color, lightIntensity, lightDistance)
    light2.position.set(0, 150, -r)
    scene.add(light2)
    let light3 = new THREE.PointLight(conf.light3Color, lightIntensity, lightDistance)
    light3.position.set(r, 150, 0)
    scene.add(light3)
    let light4 = new THREE.PointLight(conf.light4Color, lightIntensity, lightDistance)
    light4.position.set(-r, 150, 0)
    scene.add(light4)
    let width = 50
    let height = 50
    let intensity = 50
    let rectLight = new THREE.RectAreaLight(0xffffff, intensity, width, height)
    rectLight.position.set(0, 150, 0)
    rectLight.lookAt(83, 0, 71)
    scene.add(rectLight)
}

export let initARCameraBox = () => {

    let videoBox = document.createElement('video')
    videoBox.setAttribute("id", "video-box")
    videoBox.style.objectFit = 'cover'
    container.appendChild(videoBox)
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
    navigator.getUserMedia({video: {facingMode: 'environment'}, audio: false}, function (stream) {
        mediaStreamTrack = stream
        videoBox.srcObject = stream
        videoBox.play()
    }, console.log)
}


//粒子视频
function initParticleVideo() {

    let texture = new THREE.VideoTexture(videoBox_2)
    texture.minFilter = THREE.NearestFilter
    var width = 640, height = 480
    var nearClipping = 850, farClipping = 2000
    let geometry = new THREE.BufferGeometry()
    var vertices = new Float32Array(width * height * 3)
    for (var i = 0, j = 0, l = vertices.length; i < l; i += 3, j++) {
        vertices[i] = j % width
        vertices[i + 1] = Math.floor(j / width)
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    let material = new THREE.ShaderMaterial({
        uniforms: {
            "map": {value: texture},
            "width": {value: width},
            "height": {value: height},
            "nearClipping": {value: nearClipping},
            "farClipping": {value: farClipping},
            "pointSize": {value: 2},
            "zOffset": {value: 200}
        },
        vertexShader: shader.video_vs,
        fragmentShader: shader.video_fs,
        blending: THREE.AdditiveBlending,
        depthTest: true, depthWrite: false,
        transparent: true
    })
    particleVideo = new THREE.Points(geometry, material)
    particleVideo.position.y = 200
    particleVideo.rotation.y = Math.PI
    // console.log(particleVideo)
    scene.add(particleVideo)
}

//方块视频
function initDiamondVideo() {
    var materials = [],
        xgrid = 20,
        ygrid = 10


    let texture = new THREE.VideoTexture(videoBox_1)  // video对象作为VideoTexture参数创建纹理对象
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
    texture.minFilter = THREE.LinearFilter
    var i, j, ux, uy, ox, oy,
        geometry,
        xsize, ysize

    ux = 1 / xgrid
    uy = 1 / ygrid

    xsize = 48 / xgrid
    ysize = 20.4 / ygrid

    var parameters = {color: 0xffffff, map: texture}
    cube_count = 0
    for (i = 0; i < xgrid; i++) {
        for (j = 0; j < ygrid; j++) {
            ox = i
            oy = j
            geometry = new THREE.BoxBufferGeometry(xsize, ysize, xsize)
            change_uvs(geometry, ux, uy, ox, oy)
            materials[cube_count] = new THREE.MeshLambertMaterial(parameters)
            let material = materials[cube_count]
            // //彩色渐变
            // material.hue = i / xgrid;
            // material.saturation = 1 - j / ygrid;
            // material.color.setHSL( material.hue, material.saturation, 0.5 );
            // //

            let mesh = new THREE.Mesh(geometry, material)

            mesh.position.x = -(i - xgrid / 2) * xsize + 70
            mesh.position.y = (j - ygrid / 2) * ysize + 28
            mesh.position.z = 100

            mesh.scale.x = mesh.scale.y = mesh.scale.z = 1

            mesh.userData.dx = 0.001 * (0.5 - Math.random())
            mesh.userData.dy = 0.001 * (0.5 - Math.random())
            mesh.userData.dz = 0.001 * (0.5 - Math.random())

            videoDiamonds[cube_count] = mesh

            mesh.rotation.x += 20 * mesh.userData.dx * 500
            mesh.rotation.y += 20 * mesh.userData.dy * 500
            mesh.rotation.z += 20 * mesh.userData.dz * 500

            mesh.position.x += 100 * mesh.userData.dx * 500
            mesh.position.y += 100 * mesh.userData.dy * 500
            mesh.position.z += 100 * mesh.userData.dz * 500

            mesh.position.y -= 0.1 * 500

            scene.add(mesh)
            cube_count += 1
        }

    }

    function change_uvs(geometry, unitx, unity, offsetx, offsety) {

        var uvs = geometry.attributes.uv.array

        for (var i = 0; i < uvs.length; i += 2) {

            uvs[i] = (uvs[i] + offsetx) * unitx
            uvs[i + 1] = (uvs[i + 1] + offsety) * unity

        }

    }

}

function changeVideoDiamondsPosition(num) {
    for (var i = 0; i < cube_count; i++) {
        let mesh = videoDiamonds[i]
        mesh.rotation.x -= 20 * mesh.userData.dx * num
        mesh.rotation.y -= 20 * mesh.userData.dy * num
        mesh.rotation.z -= 20 * mesh.userData.dz * num

        mesh.position.x -= 100 * mesh.userData.dx * num
        mesh.position.y -= 100 * mesh.userData.dy * num

        mesh.position.z -= 100 * mesh.userData.dz * num

        mesh.position.y += 0.1 * num
    }

}

function removeVideoDiamond() {
    for (var i = 0; i < cube_count; i++) {
        let mesh = videoDiamonds[i]
        scene.remove(mesh)
        mesh.geometry.dispose()
        mesh.material.dispose()
    }
    videoBox_1.remove()
}

function ZTdoubleClickEvent(event) {
    clearTimeout(clickTime)
    let doubleClickGltf = getRayGltfObject(event.clientX, event.clientY)
    let dobuleClickObj = getRayObject(event.clientX, event.clientY)
    // let doubleClickObj = getRayObject(event.clientX, event.clientY)
    // if (!ifRightVideoPlay && !ifLeftVideoPlay && camera.position.x < 71.5) {
    //     showVideoOperate()
    // }
    // console.log(dobuleClickObj)
    if (doubleClickGltf != null) {
        if (!ifRightVideoPlay && !ifLeftVideoPlay && doubleClickGltf.name == "objStele" && !ifAR) {
            showBridgeOperate()
        }
        if (ifBoating && gltfBoat != null) {
            if (doubleClickGltf.name == "gltfWharf") {
                ifBoating = false
                camera.position.set(101, 20, 95)
                gltfBoat.position.set(100, 20, 98)
                gltfBoat.rotation.y = 15 / 180 * Math.PI
            }
        } else {
            if (doubleClickGltf.name == "gltfBoat") {
                ifBoating = true
                camera.position.set(100, 20.1, 98)
            }
        }
    }

}

function oneClick(event) {
    clearTimeout(clickTime)
    clickTime = setTimeout((event) => {
        dControls.connect()
    }, 300)
}

export let swerve = () => {
    if (ifBoating && gltfBoat != null) {
        let direction = new THREE.Vector3()
        //console.log(direction);
        camera.getWorldDirection(direction)
        direction.y = 0
        let boatDirection = new THREE.Vector3()
        boatDirection.x = 0
        boatDirection.y = 0
        boatDirection.z = 1
        let angle = boatDirection.angleTo(direction)
        let langle = gltfBoat.rotation.y
        if (direction.x < 0) {
            angle = -angle
        }
        let dangle = angle - langle
        if (dangle > Math.PI) {
            dangle -= 2 * Math.PI
        } else if (dangle < -Math.PI) {
            dangle += 2 * Math.PI
        }
        if (dangle > 0 && dangle >= 0.01) {
            gltfBoat.rotation.y += 0.01
        } else if (dangle < 0 && dangle <= -0.01) {
            gltfBoat.rotation.y -= 0.01
        }
    }
}

function ZTmousemove(event) {
    if (ifBoating) {
        let cameraDirection = new THREE.Vector3()
        camera.getWorldDirection(cameraDirection)
        //console.log(cameraDirection);
        cameraDirection.y = 0
        let boatDirection = new THREE.Vector3()
        //gltfBoat.getWorldDirection(boatDirection);
        boatDirection.x = 0
        boatDirection.y = 0
        boatDirection.z = 1
        let angle = boatDirection.angleTo(cameraDirection)
        if (cameraDirection.x > 0) {
            gltfBoat.rotation.y = angle
        } else {
            gltfBoat.rotation.y = -angle
        }
    }
}

//显示视频选择菜单
function showBridgeOperate() {
    if (operate.isEmpty()) {
        operate.init().pushElement(() => {
            let divVideo = document.createElement('div')
            divVideo.innerText = '->1.观看廊桥介绍'
            divVideo.onclick = showVideoOperate
            return divVideo
        }).pushElement(() => {
            let divAR = document.createElement('div')
            divAR.innerText = '->2.重温廊桥历史'
            divAR.onclick = showAROperate
            return divAR
        }).pushElement(() => {
            let divBoat = document.createElement('div')
            divBoat.innerText = '->3.观赏廊桥构造'
            divBoat.onclick = () => {
                operate.hide()
                showMessage('为了更好地观看廊桥结构，请上船', null, () => {
                }, () => {
                    // operate.delete()
                }, () => {
                    operate.delete()
                })
            }
            return divBoat
        }).pushConfirm(() => {
        }).pushCancel(() => {
            operate.delete()
        })
    }
}

function showVideoOperate() {
    operate.delete().init().pushElement(() => {
        let divVideo = document.createElement('div')
        divVideo.innerText = '->1.芙蓉出水'
        divVideo.onclick = () => {
            removeVideo()
            ifRightVideoPlay = true
            ifMission_1Done = true
            initDiamondVideo()
        }
        return divVideo
    }).pushElement(() => {
        let divVideo = document.createElement('div')
        divVideo.innerText = '->2.紫霞仙子'
        divVideo.onclick = () => {
            // if(ifRightVideoPlay){
            //     removeVideoDiamond();
            //     ifRightVideoPlay=false;
            //     ifRightVideoPlayDone=false;
            // }
            removeVideo()
            ifLeftVideoPlay = true
            ifMission_1Done = true
            initParticleVideo()
        }
        return divVideo
    }).pushConfirm(() => {
        console.log('confirm')
    }).pushCancel(() => {
        console.log('cancel')
        operate.delete()
        removeVideo()
        showBridgeOperate()
    })
}

function showAROperate() {
    let result = getRayDistance(camera.position)
    if (result.object.name == "meshMountain") {
        operate.hide()
        showMessage('台风“莫兰蒂”带来的暴雨正在严重影响浙南地区', null, () => {
        }, () => {
            operate.show()
        }, () => {
            operate.delete()
            spearation(gltfBridge.children[0], 10)
            initDarkCloud()
            darkCloudFunction = animatedarkCloud
            rectLight = new THREE.RectAreaLight( 0xffffff, 1,  width, height );
            rectLight.position.set( gltfBridge.position.x, gltfBridge.position.y+50, gltfBridge.position.z );
            rectLight.lookAt( gltfBridge.position );
            scene.add( rectLight )
            let direction = new THREE.Vector3()
            camera.getWorldDirection(direction)
            dControls.enabled = false
            rotateCamera(direction, darkCloud.position, camera, durationRotateCamera)
            setTimeout(() => {
                let directionNew = new THREE.Vector3()
                camera.getWorldDirection(directionNew)
                let bridgePositon = gltfBridge.position.clone()
                bridgePositon.y += 5
                rotateCamera(directionNew, bridgePositon, camera, durationRotateCamera)
            }, durationRotateCamera + 1000)
            setTimeout(() => {
                collapseBridge()
                setTimeout(() => {
                    showMessage('尝试寻找分散在四处的廊桥结构部件，重建最美廊桥吧！', null, () => {
                    }, () => {
                        dControls.enabled = true
                        recoverScene(false)
                    }, () => {
                        changeScene()
                        dControls.enabled = true
                    })
                }, duration)
            }, durationRotateCamera * 2 + 2000)
        })
    } else {
        operate.hide()
        showMessage('请各位游客尽快离开廊桥，抵达沿岸安全区域', null, () => {
        }, () => {
        }, () => {
            operate.show()
        })
    }
}

function recoverScene(bool) {
    darkCloudFunction = () => {
    }
    scene.add(ambientLight)
    scene.remove(darkCloud)
    scene.remove(rectLight)
    scene.background = sceneBackgroundTextureCube
    rollBackBridge(bool)
}

// function showTyphoonTip() {
//     if (operate.isEmpty()) {
//         ifMission_2 = true
//         //init初始化operate
//         //pushElement创建div
//         operate.init().pushElement(() => {
//             let div = document.createElement("div")
//             div.innerText = "台风来了，快跑到桥对面去"
//             return div
//         })
//         operate.pushCancel(() => {
//             // ifMission_2=false;
//             //删除operate
//             operate.delete()
//         })
//         //双击事件
//         operate.pushConfirm(() => {
//             // ifMission_2=false;
//             //删除operate
//             if (camera.position.x > 94.5) {
//                 collapseBridge()
//                 setTimeout(() => {
//                     showRepaireTips()
//                 }, 10000)
//                 operate.delete()
//             }
//
//         })
//     }
// }
//
// function showRepaireTips() {
//     if (operate.isEmpty()) {
//         operate.init().pushElement(() => {
//             let div = document.createElement("div")
//             div.innerText = "到AR场景修复廊桥"
//             return div
//         })
//         operate.pushCancel(() => {
//             // ifMission_2=false;
//             //删除operate
//             operate.delete()
//         })
//         //双击事件
//         operate.pushConfirm(() => {
//             // ifMission_2=false;
//             //删除operate
//             changeScene()
//             operate.delete()
//
//         })
//     }
// }

//走路空气墙
function walkBoundary() {
    if (camera.position.x >= 67.5 && camera.position.x < 94.5) {
        if (camera.position.z < 69.5) {
            camera.position.z = 69.5
        }
        if (camera.position.z > 72.5) {
            camera.position.z = 72.5
        }
    }
    //开始的平台的边界
    if (camera.position.x < 67.5) camera.position.x = 67.5
    if (camera.position.x < 71.5 && camera.position.x >= 67.5) {
        camera.position.y = -0.25 * camera.position.x + 37.875
    }

    //向上的楼梯
    if (camera.position.x < 73.3 && camera.position.x >= 71.5) {
        camera.position.y = camera.position.x / 1.8 + 20 - 715 / 18
    }
    //向上的桥面,高度限制
    if (camera.position.x < 79 && camera.position.x >= 73.3) {
        camera.position.y = (camera.position.x * 4 + 105.8) / 19
    }
    //平的桥面,高度限制
    if (camera.position.x < 87 && camera.position.x >= 79) {
        camera.position.y = 22.2
    }
    //向下的桥面,高度限制
    if (camera.position.x < 92.7 && camera.position.x >= 87) {
        camera.position.y = (-4 * camera.position.x + 769.8) / 19
    }
    //下桥的楼梯,高度限制
    if (camera.position.x < 94.5 && camera.position.x >= 92.7) {
        camera.position.y = -camera.position.x / 1.8 + 20 + 945 / 18
    }

    //下桥后的平台
    if (camera.position.x >= 94.5) {
        let leftLine = (43 * camera.position.z + 1453) / 47
        camera.position.y = 20
        if (camera.position.x > leftLine) camera.position.x = leftLine
        if (camera.position.z <= 90) {
            let rightLine = (33 * camera.position.z + 915) / 35
            if (camera.position.x < rightLine) camera.position.x = rightLine
        } else {
            let rightLine = (381 - camera.position.x) / 3
            if (camera.position.z < rightLine) camera.position.z = rightLine
            let leftLine = (391 - camera.position.x) / 3
            if (camera.position.z > leftLine) camera.position.z = leftLine
            let topLine = (camera.position.z + 208) / 3
            if (camera.position.x < topLine) camera.position.x = topLine
        }
    }


    //码头


}

//圆形空气墙
function circleBoundary() {
    let centerX = 83, centerZ = 71
    let dX = camera.position.x - centerX, dZ = camera.position.z - centerZ
    let dLength = dX * dX + dZ * dZ
    if (dLength > 10000) {
        dLength = sqrt(dLength)
        camera.position.x = 83 + 100 / dLength * dX
        camera.position.z = 71 + 100 / dLength * dZ
    }
}

//开船的空气墙
function boatingBoundary() {
    camera.position.y = 20.1
    if (camera.position.z <= 78) {
        if (camera.position.x < 81) camera.position.x = 81
        if (camera.position.x > 86.5) camera.position.x = 86.5
        if (camera.position.z < 53) camera.position.z = 53
    }
    if (camera.position.z > 78) {
        let line = (camera.position.z * 27 + 1354) / 40
        if (camera.position.x > line) camera.position.x = line
        line = (951 - 5 * camera.position.x) / 7
        if (camera.position.z < line) camera.position.z = line
    }
    if (camera.position.z > 93) {
        let line = (camera.position.z + 627) / 12
        if (camera.position.x < line) camera.position.x = line
    }
    if (camera.position.z > 150) {
        camera.position.z = 150
    }
}

function clickAR(event) {
    if (ifAR) {
        // let arr = ["beamGroup", "pillarGroup", "roof", "triangle"]
        let boxArr = ["box_beam", "box_pillar", "box_roof", "box_triangle"]
        let result = getRayObjectAR(event.clientX, event.clientY)

        if (repairCount === 4) {
            showMessage('被冲垮的泰顺廊桥已完成修复工作，保护“隐居”山林间的百年古桥仍在进行\n' +
                '请继续游览廊桥周围场景，感受中国木拱桥传统营造技艺的独特魅力', null, () => {
            }, () => {
            }, () => {
                repairCount=0;
                iftweenBeamGroup=false;
                iftweenPillarGroup=false;
                iftweenRoof=false;
                iftweenTriangle=false;
                changeScene()
                recoverScene(true)
            })
            return
        }
        if (result != null) {
            // if (repairCount == 4) {
            //     showMessage('被冲垮的泰顺廊桥已完成修复工作，保护“隐居”山林间的百年古桥仍在进行\n' +
            //         '请继续游览廊桥周围场景，感受中国木拱桥传统营造技艺的独特魅力', null, () => {
            //     }, () => {
            //     }, () => {
            //         changeScene()
            //     })
            //     return
            // }
            if (result.name === boxArr[0]) {
                if (!iftweenBeamGroup) {
                    tweenBeamGroup.start()
                    sceneAR.remove(result)
                    iftweenBeamGroup = true
                    repairCount++
                }
            } else if (result.name === boxArr[1]) {
                if (!iftweenPillarGroup) {
                    tweenPillarGroup.start()
                    sceneAR.remove(result)
                    iftweenPillarGroup = true
                    repairCount++
                }
            } else if (result.name === boxArr[2]) {
                if (!iftweenRoof) {
                    tweenRoof.start()
                    sceneAR.remove(result)
                    iftweenRoof = true
                    repairCount++
                }
            } else if (result.name === boxArr[3]) {
                if (!iftweenTriangle) {
                    tweenTriangle.start()
                    sceneAR.remove(result)
                    iftweenTriangle = true
                    repairCount++
                }
            }

            // boxArr.forEach(item => {
            //     if (result.name == item) { // 对象里的唯一标识id
            //         if (item == "beamGroup") {
            //             tweenBeamGroup.start()
            //             if (!iftweenBeamGroup) {
            //                 iftweenBeamGroup = true
            //                 repairCount++
            //             }
            //         } else if (item == "pillarGroup") {
            //             tweenPillarGroup.start()
            //             if (!iftweenPillarGroup) {
            //                 iftweenPillarGroup = true
            //                 repairCount++
            //             }
            //         } else if (item == "roof") {
            //             tweenRoof.start()
            //             if (!iftweenRoof) {
            //                 iftweenRoof = true
            //                 repairCount++
            //             }
            //         } else if (item == "triangle") {
            //             tweenTriangle.start()
            //             if (!iftweenTriangle) {
            //                 iftweenTriangle = true
            //                 repairCount++
            //             }
            //         }
            //         return
            //     }
            // })
        }
    }


}


//container.addEventListener('mousemove', ZTmousemove, false);


//乌云
function initDarkCloud() {
    // let mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
    let mat = new THREE.MeshLambertMaterial({color: 0xffffff})
    let geo = new THREE.PlaneBufferGeometry(1000, 1000, 100, 100) //可调
    darkCloud = new THREE.Mesh(geo, mat)
    darkCloud.position.y = 200
    darkCloud.rotation.set(Math.PI / 2, 0, 0)
    scene.add(darkCloud)
    scene.background = null
    scene.remove(ambientLight)
    // setTimeout(() => {
    //     scene.add(darkCloud)
    //     scene.background = null
    //     scene.remove(ambientLight)
    // }, 5000)

}

function animatedarkCloud() {
    var gArray = darkCloud.geometry.attributes.position.array
    const time = Date.now() * 0.0002
    for (let i = 0; i < gArray.length; i += 3) {
        // gArray[i + 2] = noise(gArray[i] / conf.xyCoef + time, gArray[i + 1] / conf.xyCoef + time, time + (mouse.x + mouse.y)) * conf.zCoef;
        gArray[i + 2] = noise(gArray[i] / conf.xyCoef + time, gArray[i + 1] / conf.xyCoef + time, time + 2) * conf.zCoef
    }
    darkCloud.geometry.attributes.position.needsUpdate = true
    // darkCloud.geometry.computeBoundingSphere();
    darkCloud.rotation.z += 0.01
}
