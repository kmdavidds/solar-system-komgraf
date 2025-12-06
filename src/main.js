import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

import bgTexture1 from '/images/1.jpg';
import bgTexture2 from '/images/2.jpg';
import bgTexture3 from '/images/3.jpg';
import bgTexture4 from '/images/4.jpg';
import sunTexture from '/images/sun.jpg';
import mercuryTexture from '/images/mercurymap.jpg';
import mercuryBump from '/images/mercurybump.jpg';
import venusTexture from '/images/venusmap.jpg';
import venusBump from '/images/venusmap.jpg';
import venusAtmosphere from '/images/venus_atmosphere.jpg';
import earthTexture from '/images/earth_daymap.jpg';
import earthNightTexture from '/images/earth_nightmap.jpg';
import earthAtmosphere from '/images/earth_atmosphere.jpg';
import earthMoonTexture from '/images/moonmap.jpg';
import earthMoonBump from '/images/moonbump.jpg';
import marsTexture from '/images/marsmap.jpg';
import marsBump from '/images/marsbump.jpg';
import jupiterTexture from '/images/jupiter.jpg';
import ioTexture from '/images/jupiterIo.jpg';
import europaTexture from '/images/jupiterEuropa.jpg';
import ganymedeTexture from '/images/jupiterGanymede.jpg';
import callistoTexture from '/images/jupiterCallisto.jpg';
import saturnTexture from '/images/saturnmap.jpg';
import satRingTexture from '/images/saturn_ring.png';
import uranusTexture from '/images/uranus.jpg';
import uraRingTexture from '/images/uranus_ring.png';
import neptuneTexture from '/images/neptune.jpg';
import plutoTexture from '/images/plutomap.jpg';

import { createPlanet } from './scripts/planets.js';
import { loadAsteroids } from './scripts/loaders.js';
import { identifyPlanet, identifyMoon } from './scripts/identify.js';
import { showPlanetInfo, showMoonInfo, closeInfoNoZoomOut, closeInfo } from './scripts/ui.js';
import { createEarthMaterial } from './scripts/shaders.js';
import { animate } from './scripts/animate.js';
import { createRocket, RocketController } from './scripts/rocket.js';

// ******  PERSIAPAN  ******
console.log("Membuat scene");
const scene = new THREE.Scene();

console.log("Membuat kamera proyeksi perspektif");
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(-175, 115, 5);

console.log("Membuat renderer");
const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

console.log("Membuat kontrol orbit");
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.75;
controls.screenSpacePanning = false;

console.log("Menyiapkan pemuat tekstur");
const cubeTextureLoader = new THREE.CubeTextureLoader();
const loadTexture = new THREE.TextureLoader();

// postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x190a05);
composer.addPass(outlinePass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
bloomPass.threshold = 1;
bloomPass.radius = 0.9;
composer.addPass(bloomPass);

// cahaya ambient & background
console.log("Menambahkan cahaya ambient");
const lightAmbient = new THREE.AmbientLight(0x222222, 2.5); // Balanced, jangan overpowering
scene.add(lightAmbient);

scene.background = cubeTextureLoader.load([ bgTexture3, bgTexture1, bgTexture2, bgTexture2, bgTexture4, bgTexture2 ]);

// GUI
const gui = new dat.GUI({ autoPlace: false, width: 400 });
document.getElementById('gui-container').appendChild(gui.domElement);

// pengaturan interaktif
const settings = { accelerationOrbit: 1, acceleration: 1, sunIntensity: 1.9, freeFlightMode: false };
let sunMat = null;
let lastFreeFlightMode = false; // Track mode changes
gui.add(settings, 'accelerationOrbit', 0, 10).name('Revolusi');
gui.add(settings, 'acceleration', 0, 10).name('Rotasi');
gui.add(settings, 'sunIntensity', 1, 10).name('Kecerahan Matahari').onChange(v => { if (sunMat) sunMat.emissiveIntensity = v; });
const freeFlightToggle = gui.add(settings, 'freeFlightMode').name('Free Flight Mode');
// Handler akan di-setup setelah rocket creation

// raycast & mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
function onMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

// PILIH PLANET (state & refs)
let selectedPlanet = null;
let selectedMoon = null;
let selectedMoonParent = null;
const isMovingTowardsPlanetRef = { value: false };
const targetCameraPositionRef = { value: new THREE.Vector3() };
let offset = 0;
const zoomFlagsRef = { isZoomingOut: false, zoomOutTargetPosition: new THREE.Vector3(-175, 115, 5) };

// fungsi klik: gunakan identifyPlanet dari identify.js
function onDocumentMouseDown(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(raycastTargets);

  // Di free flight mode, allow click tapi hanya untuk select planet (tidak zoom)
  if (settings.freeFlightMode) {
    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      const { result } = identifyPlanet(clickedObject, { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto });
      if (result) {
        // Show planet info di free flight mode juga
        selectedPlanet = result;
        showPlanetInfo(result.name, planetData);
      }
    }
    return;
  }

  // Normal orbit mode clicks (dengan zoom)
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    console.log('Clicked object:', clickedObject);

    // Cek apakah yang diklik adalah moon
    const moonData = identifyMoon(clickedObject, { earth, jupiter });
    console.log('Moon data:', moonData);

    if (moonData.result) {
      const moon = moonData.result;
      const parentPlanet = moonData.planetParent;
      console.log('Moon found:', moon.name, 'from', parentPlanet);

      selectedPlanet = null;
      selectedMoon = moon;
      selectedMoonParent = parentPlanet;
      closeInfoNoZoomOut(settings);
      settings.accelerationOrbit = 0;

      // Dapatkan posisi moon di world
      const moonPosition = new THREE.Vector3();
      moon.mesh.getWorldPosition(moonPosition);
      controls.target.copy(moonPosition);
      camera.lookAt(moonPosition);
      offset = moonData.offset;
      targetCameraPositionRef.value.copy(moonPosition).add(camera.position.clone().sub(moonPosition).normalize().multiplyScalar(offset));
      isMovingTowardsPlanetRef.value = true;
      return;
    }

    // Jika bukan moon, cek planet
    const { result, offset: newOffset } = identifyPlanet(clickedObject, { mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto });
    if (result) {
      console.log('Planet found:', result.name);
      selectedPlanet = result;
      selectedMoon = null;
      selectedMoonParent = null;
      closeInfoNoZoomOut(settings);
      settings.accelerationOrbit = 0;
      const planetPosition = new THREE.Vector3();
      selectedPlanet.planet.getWorldPosition(planetPosition);
      controls.target.copy(planetPosition);
      camera.lookAt(planetPosition);
      offset = newOffset;
      targetCameraPositionRef.value.copy(planetPosition).add(camera.position.clone().sub(planetPosition).normalize().multiplyScalar(offset));
      isMovingTowardsPlanetRef.value = true;
    }
  }
}

// MATAHARI
const sunSize = 697/40;
const sunGeom = new THREE.SphereGeometry(sunSize, 32, 20);
sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xFFF88F,
  emissiveMap: loadTexture.load(sunTexture),
  emissiveIntensity: settings.sunIntensity
});
const sun = new THREE.Mesh(sunGeom, sunMat);
scene.add(sun);
const pointLight = new THREE.PointLight(0xFDFFD3 , 1200, 400, 1.4);
scene.add(pointLight);

// MOONS data
const earthMoon = [{ name: 'The Moon', size:1.6, texture: earthMoonTexture, bump: earthMoonBump, orbitSpeed: 0.001 * settings.accelerationOrbit, orbitRadius: 10 }];
const marsMoons = [
  { name: 'Phobos', modelPath:'/images/mars/phobos.glb', scale:0.1, orbitRadius:5, orbitSpeed:0.002 * settings.accelerationOrbit, position:100, mesh:null },
  { name: 'Deimos', modelPath:'/images/mars/deimos.glb', scale:0.1, orbitRadius:9, orbitSpeed:0.0005 * settings.accelerationOrbit, position:120, mesh:null }
];
const jupiterMoons = [
  { name: 'Io', size:1.6, texture:ioTexture, orbitRadius:20, orbitSpeed:0.0005 * settings.accelerationOrbit },
  { name: 'Europa', size:1.4, texture:europaTexture, orbitRadius:24, orbitSpeed:0.00025 * settings.accelerationOrbit },
  { name: 'Ganymede', size:2, texture:ganymedeTexture, orbitRadius:28, orbitSpeed:0.000125 * settings.accelerationOrbit },
  { name: 'Callisto', size:1.7, texture:callistoTexture, orbitRadius:32, orbitSpeed:0.00006 * settings.accelerationOrbit }
];

// BUAT PLANET (memanggil createPlanet)
const mercury = createPlanet(scene, loadTexture, 'Mercury', 2.4, 40, 0, mercuryTexture, mercuryBump);
const venus = createPlanet(scene, loadTexture, 'Venus', 6.1, 65, 3, venusTexture, venusBump, null, venusAtmosphere);
const earth = createPlanet(scene, loadTexture, 'Earth', 6.4, 90, 23, createEarthMaterial(loadTexture, earthTexture, earthNightTexture, sun), null, null, earthAtmosphere, earthMoon);
const mars = createPlanet(scene, loadTexture, 'Mars', 3.4, 115, 25, marsTexture, marsBump);
const jupiter = createPlanet(scene, loadTexture, 'Jupiter', 69/4, 200, 3, jupiterTexture, null, null, null, jupiterMoons);
const saturn = createPlanet(scene, loadTexture, 'Saturn', 58/4, 270, 26, saturnTexture, null, { innerRadius:18, outerRadius:29, texture: satRingTexture });
const uranus = createPlanet(scene, loadTexture, 'Uranus', 25/4, 320, 82, uranusTexture, null, { innerRadius:6, outerRadius:8, texture: uraRingTexture });
const neptune = createPlanet(scene, loadTexture, 'Neptune', 24/4, 340, 28, neptuneTexture);
const pluto = createPlanet(scene, loadTexture, 'Pluto', 1, 350, 57, plutoTexture);

// planetData
const planetData = {
  'Mercury': { radius:'2,439.7 km', tilt:'0.034°', rotation:'58.6 Earth days', orbit:'88 Earth days', distance:'57.9 million km', moons:'0', info:'Planet terkecil di tata surya kita dan yang paling dekat dengan Matahari.' },
  'Venus': { radius:'6,051.8 km', tilt:'177.4°', rotation:'243 Earth days', orbit:'225 Earth days', distance:'108.2 million km', moons:'0', info:'Planet kedua dari Matahari, dikenal karena suhu ekstrem dan atmosfer yang sangat tebal.' },
  'Earth': { radius:'6,371 km', tilt:'23.5°', rotation:'24 hours', orbit:'365 days', distance:'150 million km', moons:'1 (Bulan)', info:'Planet ketiga dari Matahari dan satu-satunya yang diketahui mendukung kehidupan.' },
  'Mars': { radius:'3,389.5 km', tilt:'25.19°', rotation:'1.03 Earth days', orbit:'687 Earth days', distance:'227.9 million km', moons:'2 (Phobos dan Deimos)', info:'Dikenal sebagai Planet Merah, terkenal karena penampilan kemerahan dan potensinya untuk kolonisasi manusia.' },
  'Jupiter': { radius:'69,911 km', tilt:'3.13°', rotation:'9.9 hours', orbit:'12 Earth years', distance:'778.5 million km', moons:'95 dikenal (Ganymede, Callisto, Europa, Io adalah 4 yang terbesar)', info:'Planet terbesar di tata surya kita, terkenal dengan Great Red Spot.' },
  'Saturn': { radius:'58,232 km', tilt:'26.73°', rotation:'10.7 hours', orbit:'29.5 Earth years', distance:'1.4 billion km', moons:'146 dikenal', info:'Dikenal karena sistem cincinnya yang luas, planet terbesar kedua di tata surya.' },
  'Uranus': { radius:'25,362 km', tilt:'97.77°', rotation:'17.2 hours', orbit:'84 Earth years', distance:'2.9 billion km', moons:'27 dikenal', info:'Dikenal karena rotasinya yang unik miring ke samping dan warna biru pucat.' },
  'Neptune': { radius:'24,622 km', tilt:'28.32°', rotation:'16.1 hours', orbit:'165 Earth years', distance:'4.5 billion km', moons:'14 dikenal', info:'Planet paling jauh dari Matahari di tata surya kita, dikenal karena warna biru pekatnya.' },
  'Pluto': { radius:'1,188.3 km', tilt:'122.53°', rotation:'6.4 Earth days', orbit:'248 Earth years', distance:'5.9 billion km', moons:'5 (Charon, Styx, Nix, Kerberos, Hydra)', info:'Awalnya diklasifikasikan sebagai planet kesembilan; sekarang dianggap sebagai planet kerdil.' }
};

// raycastTargets tetap di main
const raycastTargets = [
  mercury.planet, venus.planet, venus.Atmosphere, earth.planet, earth.Atmosphere,
  mars.planet, jupiter.planet, saturn.planet, uranus.planet, neptune.planet, pluto.planet
];

// Tambahkan moons ke raycastTargets
if (earth && earth.moons) {
  console.log('Earth moons count:', earth.moons.length);
  earth.moons.forEach((moon, idx) => {
    if (moon.mesh) {
      raycastTargets.push(moon.mesh);
      console.log(`Moon ${idx} (${moon.name}) mesh added to raycastTargets`);
    } else {
      console.warn(`Moon ${idx} (${moon.name}) has no mesh!`);
    }
  });
}
if (mars && mars.moons) {
  console.log('Mars moons count:', mars.moons.length);
  mars.moons.forEach((moon, idx) => {
    if (moon.mesh) {
      raycastTargets.push(moon.mesh);
      console.log(`Moon ${idx} (${moon.name}) mesh added to raycastTargets`);
    }
  });
}
if (jupiter && jupiter.moons) {
  console.log('Jupiter moons count:', jupiter.moons.length);
  jupiter.moons.forEach((moon, idx) => {
    if (moon.mesh) {
      raycastTargets.push(moon.mesh);
      console.log(`Moon ${idx} (${moon.name}) mesh added to raycastTargets`);
    } else {
      console.warn(`Moon ${idx} (${moon.name}) has no mesh!`);
    }
  });
}

// shadows
renderer.shadowMap.enabled = true;
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.camera.near = 10;
pointLight.shadow.camera.far = 20;

// set cast/receive shadow (cek keberadaan properti)
[earth, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto].forEach(p => {
  if (p && p.planet) {
    p.planet.castShadow = true;
    p.planet.receiveShadow = true;
  }
  if (p && p.Atmosphere) {
    p.Atmosphere.castShadow = true;
    p.Atmosphere.receiveShadow = true;
  }
  if (p && p.moons) {
    p.moons.forEach(m => {
      if (m.mesh) { m.mesh.castShadow = true; m.mesh.receiveShadow = true; }
    });
  }
  if (p && p.Ring) p.Ring.receiveShadow = true;
});

// load asteroids (kembalikan arrays)
const asteroids1 = loadAsteroids(scene, '/asteroids/asteroidPack.glb', 1000, 130, 160) || [];
const asteroids2 = loadAsteroids(scene, '/asteroids/asteroidPack.glb', 3000, 352, 370) || [];
const asteroids = asteroids1.concat(asteroids2);

// Buat roket dan kontrol
const rocketMesh = createRocket(scene);
const rocketController = new RocketController(rocketMesh);

// Ambient light sudah cukup untuk menerangi roket

// Setup free flight toggle handler (setelah rocket dibuat)
freeFlightToggle.onChange(() => {
  if (settings.freeFlightMode && !lastFreeFlightMode) {
    // Entering free flight mode
    isMovingTowardsPlanetRef.value = false;
    zoomFlagsRef.isZoomingOut = false;

    // Reset controls sepenuhnya
    controls.reset();
    controls.enabled = false;

    // Set target ke rocket position supaya tidak orbit ke sun
    controls.target.copy(rocketMesh.position);

    // Show crosshair dan help
    crosshair.style.display = 'block';
  } else if (!settings.freeFlightMode && lastFreeFlightMode) {
    // Exiting free flight mode
    controls.enabled = true;
    // Reset target ke sun (0, 0, 0)
    controls.target.set(0, 0, 0);

    // Hide crosshair
    crosshair.style.display = 'none';
  }
  lastFreeFlightMode = settings.freeFlightMode;
});

// Siapkan context dan mulai animate
const context = {
  settings, sun, composer, outlinePass, raycaster, mouse, camera, controls,
  earth, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto,
  marsMoons, jupiterMoons, asteroids, planetData, raycastTargets,
  showPlanetInfo, showMoonInfo, isMovingTowardsPlanetRef, targetCameraPositionRef, zoomFlagsRef,
  selectedPlanetRef: { value: null },
  selectedMoonRef: { value: null },
  selectedMoonParentRef: { value: null },
  showPlanetInfo, isMovingTowardsPlanetRef, targetCameraPositionRef, zoomFlagsRef,
  selectedPlanetRef: { value: null },
  rocketMesh, rocketController
};
console.log('Context created, raycastTargets count:', raycastTargets.length);
animate(context);

// event listeners
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', function(e){
  onDocumentMouseDown(e);
  context.selectedPlanetRef.value = selectedPlanet;
  context.selectedMoonRef.value = selectedMoon;
  context.selectedMoonParentRef.value = selectedMoonParent;
}, false);
window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
  composer.setSize(window.innerWidth,window.innerHeight);
});

document.querySelector('.close-btn').textContent = 'Tutup';
document.querySelector('.close-btn').addEventListener('click', () => {
  closeInfo(settings, controls);
  zoomFlagsRef.isZoomingOut = true;
  context.selectedPlanetRef.value = null;
  context.selectedMoonRef.value = null;
  context.selectedMoonParentRef.value = null;
  selectedMoon = null;
  selectedMoonParent = null;
});

// Create crosshair untuk free flight mode
const crosshair = document.createElement('div');
crosshair.id = 'crosshair';
crosshair.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  pointer-events: none;
  display: none;
  z-index: 50;
`;
// Buat crosshair dengan SVG
crosshair.innerHTML = `
  <svg width="40" height="40" viewBox="0 0 40 40" style="overflow: visible;">
    <circle cx="20" cy="20" r="15" stroke="#0ff" stroke-width="1" fill="none" opacity="0.7"/>
    <line x1="20" y1="5" x2="20" y2="12" stroke="#0ff" stroke-width="2" opacity="0.8"/>
    <line x1="20" y1="28" x2="20" y2="35" stroke="#0ff" stroke-width="2" opacity="0.8"/>
    <line x1="5" y1="20" x2="12" y2="20" stroke="#0ff" stroke-width="2" opacity="0.8"/>
    <line x1="28" y1="20" x2="35" y2="20" stroke="#0ff" stroke-width="2" opacity="0.8"/>
    <circle cx="20" cy="20" r="3" fill="#0ff" opacity="0.9"/>
  </svg>
`;
document.body.appendChild(crosshair);

// Create help overlay untuk free flight mode
const helpOverlay = document.createElement('div');
helpOverlay.id = 'flight-help';
helpOverlay.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.8);
  color: #0f0;
  font-family: monospace;
  font-size: 12px;
  border: 2px solid #0f0;
  display: none;
  max-width: 250px;
  z-index: 100;
`;
helpOverlay.innerHTML = `
  <div style="margin-bottom: 10px; font-weight: bold; color: #0ff;">FREE FLIGHT MODE</div>
  <div><strong>Movement:</strong></div>
  <div>W/A/S/D - Move forward/left/back/right</div>
  <div>SPACE - Move up</div>
  <div>CTRL - Move down</div>
  <div style="margin-top: 8px;"><strong>Rotation:</strong></div>
  <div>↑/↓ - Pitch up/down</div>
  <div>←/→ - Yaw left/right</div>
  <div>Q/E - Roll left/right</div>
  <div style="margin-top: 8px;"><strong>Speed:</strong></div>
  <div>SHIFT - Accelerate (2x speed)</div>
`;
document.body.appendChild(helpOverlay);

// Properly update help overlay when toggle changes
gui.__controllers.forEach(controller => {
  if (controller.property === 'freeFlightMode') {
    controller.onChange(() => {
      helpOverlay.style.display = settings.freeFlightMode ? 'block' : 'none';
    });
  }
});
