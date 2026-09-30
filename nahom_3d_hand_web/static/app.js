import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("scene");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070a);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.7, 6);

const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 2;
controls.maxDistance = 14;

scene.add(new THREE.AmbientLight(0xffffff, 1.3));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(4,6,5);
scene.add(key);
const rim = new THREE.PointLight(0x66ffee, 35, 15);
rim.position.set(-4,2,2);
scene.add(rim);

const grid = new THREE.GridHelper(14, 28, 0x26313a, 0x151c23);
grid.position.y = -1.55;
scene.add(grid);

const group = new THREE.Group();
scene.add(group);

const material = new THREE.MeshStandardMaterial({
  color:0x32d9ff,
  metalness:.55,
  roughness:.2
});

const geometry = new THREE.IcosahedronGeometry(1.35, 2);
const object = new THREE.Mesh(geometry, material);
group.add(object);

const wire = new THREE.LineSegments(
  new THREE.WireframeGeometry(geometry),
  new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.28})
);
group.add(wire);

const loader = new GLTFLoader();
let loadedModel = null;

function resize(){
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1,r.width);
  const h = Math.max(1,r.height);
  renderer.setSize(w,h,false);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
}
addEventListener("resize",resize);
resize();

document.getElementById("resetBtn").onclick=()=>{
  group.rotation.set(0,0,0);
  group.position.set(0,0,0);
  camera.position.set(0,.7,6);
  controls.target.set(0,0,0);
  controls.update();
};

const video=document.getElementById("video");
const handCanvas=document.getElementById("handCanvas");
const hc=handCanvas.getContext("2d");
const cameraBtn=document.getElementById("cameraBtn");
const cameraMessage=document.getElementById("cameraMessage");

let stream=null;
let trackingReady=false;
let lastTime=performance.now();
let frameCount=0;
let fps=0;

cameraBtn.onclick=async()=>{
  try{
    stream=await navigator.mediaDevices.getUserMedia({
      video:{width:{ideal:640},height:{ideal:480},facingMode:"user"},
      audio:false
    });
    video.srcObject=stream;
    await video.play();
    cameraMessage.style.display="none";
    cameraBtn.textContent="CAMERA ENABLED";
    cameraBtn.disabled=true;
    startHandTracking();
  }catch(e){
    cameraMessage.textContent="CAMERA PERMISSION DENIED";
    document.getElementById("tracking").textContent="CAMERA ERROR";
    console.error(e);
  }
};

async function startHandTracking(){
  // MediaPipe is loaded dynamically so the 3D page still works if hand
  // tracking is unavailable.
  try{
    const vision=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22");
    const {HandLandmarker,FilesetResolver}=vision;
    const fileset=await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    );

    const handLandmarker=await HandLandmarker.createFromOptions(fileset,{
      baseOptions:{
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate:"GPU"
      },
      runningMode:"VIDEO",
      numHands:1,
      minHandDetectionConfidence:.5,
      minHandPresenceConfidence:.5,
      minTrackingConfidence:.5
    });

    trackingReady=true;

    function loop(){
      if(video.readyState>=2){
        const result=handLandmarker.detectForVideo(video,performance.now());
        drawHand(result);
      }
      requestAnimationFrame(loop);
    }
    loop();
  }catch(e){
    console.error("Hand tracking unavailable:",e);
    document.getElementById("tracking").textContent="3D ONLY";
  }
}

function distance(a,b){
  return Math.hypot(a.x-b.x,a.y-b.y);
}

function drawHand(result){
  handCanvas.width=video.videoWidth||640;
  handCanvas.height=video.videoHeight||480;
  hc.clearRect(0,0,handCanvas.width,handCanvas.height);

  if(!result.landmarks?.length){
    document.getElementById("tracking").textContent="NO HAND";
    document.getElementById("gesture").textContent="NONE";
    return;
  }

  const lm=result.landmarks[0];
  const connections=[
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
    [5,9],[9,13],[13,17]
  ];

  hc.lineWidth=3;
  hc.strokeStyle="#63fff0";
  for(const [a,b] of connections){
    hc.beginPath();
    hc.moveTo(lm[a].x*handCanvas.width,lm[a].y*handCanvas.height);
    hc.lineTo(lm[b].x*handCanvas.width,lm[b].y*handCanvas.height);
    hc.stroke();
  }

  hc.fillStyle="#ffffff";
  for(const p of lm){
    hc.beginPath();
    hc.arc(p.x*handCanvas.width,p.y*handCanvas.height,5,0,Math.PI*2);
    hc.fill();
  }

  const palm=lm[9];
  const x=palm.x;
  const y=palm.y;

  document.getElementById("tracking").textContent="HAND DETECTED";
  document.getElementById("handX").textContent=x.toFixed(2);
  document.getElementById("handY").textContent=y.toFixed(2);

  const pinch=distance(lm[4],lm[8]);
  const palmSize=distance(lm[0],lm[9]);
  const pinchRatio=pinch/Math.max(palmSize,.001);

  const tips=[8,12,16,20];
  const pips=[6,10,14,18];
  let extended=0;
  for(let i=0;i<4;i++){
    if(lm[tips[i]].y < lm[pips[i]].y) extended++;
  }

  let gesture="OPEN";
  if(pinchRatio<.55) gesture="PINCH";
  else if(extended<=1) gesture="FIST";

  document.getElementById("gesture").textContent=gesture;

  // Hand controls the 3D object.
  if(gesture==="OPEN"){
    group.rotation.y += (x-.5)*.035;
    group.rotation.x += (y-.5)*.025;
    group.position.x += ((x-.5)*2.0-group.position.x)*.08;
    group.position.y += ((.5-y)*1.5-group.position.y)*.08;
  }else if(gesture==="PINCH"){
    const target=THREE.MathUtils.mapLinear(
      THREE.MathUtils.clamp(pinchRatio,.25,.9),.25,.9,3.0,8.0
    );
    camera.position.z += (target-camera.position.z)*.08;
  }else if(gesture==="FIST"){
    // Pause hand movement.
  }
}

function animate(t){
  requestAnimationFrame(animate);

  frameCount++;
  if(t-lastTime>1000){
    fps=frameCount;
    frameCount=0;
    lastTime=t;
    document.getElementById("fps").textContent=String(fps);
  }

  // Very slow idle motion.
  if(!trackingReady) object.rotation.y += .003;

  controls.update();
  renderer.render(scene,camera);
}
animate(0);

// Python server status.
fetch("/api/status")
  .then(r=>r.json())
  .then(d=>{
    document.getElementById("serverStatus").textContent=
      "PYTHON SERVER: ONLINE";
  })
  .catch(()=>{
    document.getElementById("serverStatus").textContent=
      "PYTHON SERVER: OFFLINE";
  });
