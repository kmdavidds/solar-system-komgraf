import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export function loadObject(scene, path, position, scale, callback) {
  const loader = new GLTFLoader();
  loader.load(path, function (gltf) {
      const obj = gltf.scene;
      obj.position.set(position, 0, 0);
      obj.scale.set(scale, scale, scale);
      scene.add(obj);
      if (callback) callback(obj);
  }, undefined, function (error) {
      console.error('Terjadi kesalahan', error);
  });
}

export function loadAsteroids(scene, path, numberOfAsteroids, minOrbitRadius, maxOrbitRadius) {
  const loader = new GLTFLoader();
  const asteroids = [];
  loader.load(path, function (gltf) {
      gltf.scene.traverse(function (child) {
          if (child.isMesh) {
              for (let i = 0; i < numberOfAsteroids / 12; i++) { // Dibagi 12 ada 12 asteroid idi dalam packnya
                  const asteroid = child.clone();
                  const orbitRadius = THREE.MathUtils.randFloat(minOrbitRadius, maxOrbitRadius);
                  const angle = Math.random() * Math.PI * 2;
                  const x = orbitRadius * Math.cos(angle);
                  const y = 0;
                  const z = orbitRadius * Math.sin(angle);
                  child.receiveShadow = true;
                  asteroid.position.set(x, y, z);
                  asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
                  scene.add(asteroid);
                  asteroids.push(asteroid);
              }
          }
      });
  }, undefined, function (error) {
      console.error('Terjadi kesalahan', error);
  });
  return asteroids;
}
