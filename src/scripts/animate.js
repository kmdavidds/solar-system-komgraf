import * as THREE from 'three';
import { updateRocketCamera } from './rocket.js';

export function animate(context){
  const {
    settings, sun, composer, outlinePass, raycaster, mouse, camera, controls,
    earth, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto,
    marsMoons, jupiterMoons, asteroids, planetData, raycastTargets,
    showPlanetInfo, showMoonInfo,
    isMovingTowardsPlanetRef,
    targetCameraPositionRef,
    zoomFlagsRef,
    selectedPlanetRef,
    selectedMoonRef,
    selectedMoonParentRef,
    rocketMesh,
    rocketController,
    rocketSpotlight
  } = context;

  function frame(){
    // rotasi planet & sistemnya
    sun.rotateY(0.001 * settings.acceleration);
    if (mercury && mercury.planet) mercury.planet.rotateY(0.001 * settings.acceleration);
    if (mercury && mercury.planet3d) mercury.planet3d.rotateY(0.004 * settings.accelerationOrbit);
    if (venus && venus.planet) venus.planet.rotateY(0.0005 * settings.acceleration);
    if (venus && venus.Atmosphere) venus.Atmosphere.rotateY(0.0005 * settings.acceleration);
    if (venus && venus.planet3d) venus.planet3d.rotateY(0.0006 * settings.accelerationOrbit);
    if (earth && earth.planet) earth.planet.rotateY(0.005 * settings.acceleration);
    if (earth && earth.Atmosphere) earth.Atmosphere.rotateY(0.001 * settings.acceleration);
    if (earth && earth.planet3d) earth.planet3d.rotateY(0.001 * settings.accelerationOrbit);
    if (mars && mars.planet) mars.planet.rotateY(0.01 * settings.acceleration);
    if (mars && mars.planet3d) mars.planet3d.rotateY(0.0007 * settings.accelerationOrbit);
    if (jupiter && jupiter.planet) jupiter.planet.rotateY(0.005 * settings.acceleration);
    if (jupiter && jupiter.planet3d) jupiter.planet3d.rotateY(0.0003 * settings.accelerationOrbit);
    if (saturn && saturn.planet) saturn.planet.rotateY(0.01 * settings.acceleration);
    if (saturn && saturn.planet3d) saturn.planet3d.rotateY(0.0002 * settings.accelerationOrbit);
    if (uranus && uranus.planet) uranus.planet.rotateY(0.005 * settings.acceleration);
    if (uranus && uranus.planet3d) uranus.planet3d.rotateY(0.0001 * settings.accelerationOrbit);
    if (neptune && neptune.planet) neptune.planet.rotateY(0.005 * settings.acceleration);
    if (neptune && neptune.planet3d) neptune.planet3d.rotateY(0.00008 * settings.accelerationOrbit);
    if (pluto && pluto.planet) pluto.planet.rotateY(0.001 * settings.acceleration);
    if (pluto && pluto.planet3d) pluto.planet3d.rotateY(0.00006 * settings.accelerationOrbit);

    // Bulan Bumi
    if (earth && earth.moons && !selectedMoonRef.value) {
      earth.moons.forEach(moon => {
        const time = performance.now();
        const tiltAngle = 5 * Math.PI / 180;
        const moonX = earth.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
        const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.sin(tiltAngle);
        const moonZ = earth.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed) * Math.cos(tiltAngle);
        moon.mesh.position.set(moonX, moonY, moonZ);
        moon.mesh.rotateY(0.01);
      });
    }

    // Mars moons
    if (marsMoons && !selectedMoonRef.value){
      marsMoons.forEach(moon => {
        if (moon.mesh) {
          const time = performance.now();
          const moonX = mars.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
          const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
          const moonZ = mars.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
          moon.mesh.position.set(moonX, moonY, moonZ);
          moon.mesh.rotateY(0.001);
        }
      });
    }

    // Jupiter moons
    if (jupiter && jupiter.moons && !selectedMoonRef.value) {
      jupiter.moons.forEach(moon => {
        const time = performance.now();
        const moonX = jupiter.planet.position.x + moon.orbitRadius * Math.cos(time * moon.orbitSpeed);
        const moonY = moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
        const moonZ = jupiter.planet.position.z + moon.orbitRadius * Math.sin(time * moon.orbitSpeed);
        moon.mesh.position.set(moonX, moonY, moonZ);
        moon.mesh.rotateY(0.01);
      });
    }

    // asteroid rotate
    asteroids.forEach(asteroid => {
      asteroid.rotation.y += 0.0001;
      const oldX = asteroid.position.x;
      asteroid.position.x = oldX * Math.cos(0.0001 * settings.accelerationOrbit) + asteroid.position.z * Math.sin(0.0001 * settings.accelerationOrbit);
      asteroid.position.z = asteroid.position.z * Math.cos(0.0001 * settings.accelerationOrbit) - oldX * Math.sin(0.0001 * settings.accelerationOrbit);
    });

    // outlines (raycast)
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(raycastTargets);
    outlinePass.selectedObjects = [];
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      if (intersectedObject === earth.Atmosphere) outlinePass.selectedObjects = [earth.planet];
      else if (intersectedObject === venus.Atmosphere) outlinePass.selectedObjects = [venus.planet];
      else outlinePass.selectedObjects = [intersectedObject];
    }

    // zoom in/out
    if (isMovingTowardsPlanetRef.value) {
      camera.position.lerp(targetCameraPositionRef.value, 0.03);
      if (camera.position.distanceTo(targetCameraPositionRef.value) < 1) {
        isMovingTowardsPlanetRef.value = false;
        // Check moon info dulu
        if (selectedMoonRef && selectedMoonRef.value && selectedMoonRef.value.name && selectedMoonParentRef && selectedMoonParentRef.value) {
          console.log('Showing moon info:', selectedMoonRef.value.name);
          showMoonInfo(selectedMoonRef.value, selectedMoonParentRef.value);
        } else if (selectedPlanetRef && selectedPlanetRef.value && selectedPlanetRef.value.name) {
          console.log('Showing planet info:', selectedPlanetRef.value.name);
          showPlanetInfo(selectedPlanetRef.value.name, planetData);
        }
      }
    }

    // zoom in/out (skip jika free flight mode)
    if (!settings.freeFlightMode) {
      if (isMovingTowardsPlanetRef.value) {
        camera.position.lerp(targetCameraPositionRef.value, 0.03);
        if (camera.position.distanceTo(targetCameraPositionRef.value) < 1) {
          isMovingTowardsPlanetRef.value = false;
          if (selectedPlanetRef && selectedPlanetRef.value) showPlanetInfo(selectedPlanetRef.value.name, planetData);
        }
      } else if (zoomFlagsRef.isZoomingOut) {
        camera.position.lerp(zoomFlagsRef.zoomOutTargetPosition, 0.05);
        if (camera.position.distanceTo(zoomFlagsRef.zoomOutTargetPosition) < 1) zoomFlagsRef.isZoomingOut = false;
      }
    }

    // Free flight mode
    if (settings.freeFlightMode) {
      rocketController.update();

      // Update camera untuk mengikuti roket (third person)
      updateRocketCamera(camera, rocketController.getRocketPosition(), rocketController.getRocketQuaternion(), 25, 10);

      // Update spotlight position untuk mengikuti roket
      if (rocketSpotlight) {
        rocketSpotlight.position.copy(rocketMesh.position).add(new THREE.Vector3(0, -30, -30));
        rocketSpotlight.target = rocketMesh;
      }

      // Disable orbit controls sepenuhnya
      controls.enabled = false;
      controls.autoRotate = false;
      controls.dampingFactor = 0;
    } else {
      controls.enabled = true;
      controls.autoRotate = false;
      controls.dampingFactor = 0.75;
      controls.update();
    }

    // Hanya update controls saat tidak di free flight mode
    if (!settings.freeFlightMode) {
      controls.update();
    }

    requestAnimationFrame(frame);
    composer.render();
  }

  requestAnimationFrame(frame);
}
