import * as THREE from 'three';

export function createRocket(scene) {
  // Buat grup rocket
  const rocketGroup = new THREE.Group();
  rocketGroup.position.set(0, 50, 0);
  
  // Body (tabung) - vertical (Y axis)
  const bodyGeometry = new THREE.CylinderGeometry(2, 2, 15, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff6600,
    emissive: 0xff6600,
    emissiveIntensity: 1.0,
    metalness: 0.3,
    roughness: 0.7
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  rocketGroup.add(body);

  // Nose cone (kerucut) - di atas
  const noseGeometry = new THREE.ConeGeometry(2, 6, 16);
  const noseMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 1.0,
    metalness: 0.3,
    roughness: 0.7
  });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.y = 10.5;
  nose.castShadow = true;
  nose.receiveShadow = true;
  rocketGroup.add(nose);

  // Fins (sirip) - di bawah
  const finGeometry = new THREE.BoxGeometry(0.5, 4, 3);
  const finMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0066ff,
    emissive: 0x0066ff,
    emissiveIntensity: 0.8,
    metalness: 0.5,
    roughness: 0.5
  });
  
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.position.y = -3;
    fin.position.z = 2;
    fin.rotation.y = (i * Math.PI / 2);
    fin.castShadow = true;
    fin.receiveShadow = true;
    rocketGroup.add(fin);
  }

  // Flame (api roket) - di bawah (Y negative)
  const flameGeometry = new THREE.ConeGeometry(1.8, 4, 8);
  const flameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffaa00,
    emissive: 0xff6600,
    emissiveIntensity: 0.8,
    metalness: 0,
    roughness: 1
  });
  const flame = new THREE.Mesh(flameGeometry, flameMaterial);
  flame.position.y = -10;
  flame.scale.y = 0; // Hidden by default
  rocketGroup.add(flame);

  // Simpan flame reference di rocketGroup
  rocketGroup.flame = flame;

  scene.add(rocketGroup);

  return rocketGroup;
}

export class RocketController {
  constructor(rocketMesh) {
    this.rocketMesh = rocketMesh;
    
    // Kecepatan dan rotasi
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.eulerAngles = { x: 0, y: 0, z: 0 }; // Pitch, Yaw, Roll
    
    // Kecepatan gerak
    this.moveSpeed = 0.5;  // Doubled from 0.25
    this.rotationSpeed = 0.02;
    this.acceleration = 0.024;  // Doubled from 0.012
    this.friction = 0.88; // Decay kecepatan
    
    // Input
    this.keys = {};
    this.setupKeyboardListeners();
    
    // State
    this.isAccelerating = false;
  }

  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      
      // Prevent default untuk arrow keys supaya tidak conflict
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      if (e.key === 'Shift') {
        this.isAccelerating = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      if (e.key === 'Shift') {
        this.isAccelerating = false;
      }
    });
  }

  normalizeAngle(angle) {
    // Keep angle dalam range -PI sampai PI
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }

  update() {
    const speed = this.isAccelerating ? this.moveSpeed * 2 : this.moveSpeed;
    let isMoving = false;

    // Rotasi dengan arrow keys
    // Pitch (naik/turun) - Arrow Up/Down
    // NO LIMITS - allow full rotation
    if (this.keys['ArrowUp']) {
      this.eulerAngles.x -= this.rotationSpeed;
    }
    if (this.keys['ArrowDown']) {
      this.eulerAngles.x += this.rotationSpeed;
    }
    
    // Yaw (kiri/kanan) - Arrow Left/Right
    // Normalize yaw agar tetap dalam -PI sampai PI
    if (this.keys['ArrowLeft']) {
      this.eulerAngles.y += this.rotationSpeed;
      this.eulerAngles.y = this.normalizeAngle(this.eulerAngles.y);
    }
    if (this.keys['ArrowRight']) {
      this.eulerAngles.y -= this.rotationSpeed;
      this.eulerAngles.y = this.normalizeAngle(this.eulerAngles.y);
    }

    // Roll (miring) - Q/E
    // Limit roll ke -90 sampai 90 derajat
    if (this.keys['q'] || this.keys['Q']) {
      this.eulerAngles.z = Math.min(this.eulerAngles.z + this.rotationSpeed, Math.PI / 2);
    }
    if (this.keys['e'] || this.keys['E']) {
      this.eulerAngles.z = Math.max(this.eulerAngles.z - this.rotationSpeed, -Math.PI / 2);
    }

    // Update rotation dari euler angles
    this.rocketMesh.rotation.order = 'YXZ'; // Important: correct order untuk aircraft
    this.rocketMesh.rotation.x = this.eulerAngles.x;
    this.rocketMesh.rotation.y = this.eulerAngles.y;
    this.rocketMesh.rotation.z = this.eulerAngles.z;

    // Gerakan maju/mundur (W/S)
    // Forward direction roket: +Y (karena roket vertical dengan nose di atas)
    if (this.keys['w'] || this.keys['W']) {
      const forward = new THREE.Vector3(0, 1, 0);
      // Apply rotation menggunakan quaternion dari mesh langsung
      forward.applyQuaternion(this.rocketMesh.quaternion);
      this.velocity.addScaledVector(forward, this.acceleration);
      isMoving = true;
    }
    if (this.keys['s'] || this.keys['S']) {
      const forward = new THREE.Vector3(0, 1, 0);
      forward.applyQuaternion(this.rocketMesh.quaternion);
      this.velocity.addScaledVector(forward, -this.acceleration);
      isMoving = true;
    }

    // Gerakan samping (A/D)
    // Right direction: +X
    if (this.keys['a'] || this.keys['A']) {
      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(this.rocketMesh.quaternion);
      this.velocity.addScaledVector(right, -this.acceleration);
      isMoving = true;
    }
    if (this.keys['d'] || this.keys['D']) {
      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(this.rocketMesh.quaternion);
      this.velocity.addScaledVector(right, this.acceleration);
      isMoving = true;
    }

    // Gerakan atas/bawah (SPACE/CTRL)
    if (this.keys[' ']) {
      this.velocity.y += this.acceleration;
      isMoving = true;
    }
    if (this.keys['Control']) {
      this.velocity.y -= this.acceleration;
      isMoving = true;
    }

    // Apply friction dan limit kecepatan
    this.velocity.multiplyScalar(this.friction);
    if (this.velocity.length() > speed) {
      this.velocity.normalize().multiplyScalar(speed);
    }

    // Update posisi
    this.rocketMesh.position.add(this.velocity);

    // Apply euler angles to quaternion - PENTING!
    const euler = new THREE.Euler(this.eulerAngles.x, this.eulerAngles.y, this.eulerAngles.z, 'YXZ');
    this.rocketMesh.quaternion.setFromEuler(euler);

    // Update flame effect
    if (this.rocketMesh.flame) {
      if (isMoving || this.velocity.length() > 0.05) {
        const flameScale = Math.min(this.velocity.length() * 0.5, 1);
        this.rocketMesh.flame.scale.y = Math.max(0.2, flameScale);
        this.rocketMesh.flame.material.emissiveIntensity = 0.6 + flameScale * 0.6;
      } else {
        this.rocketMesh.flame.scale.y = 0;
      }
    }
  }

  getRocketPosition() {
    return this.rocketMesh.position.clone();
  }

  getRocketQuaternion() {
    return this.rocketMesh.quaternion.clone();
  }
}

export function updateRocketCamera(camera, rocketPosition, rocketQuaternion, distance = 35, height = 15) {
  // Third-person camera - kamera selalu di belakang roket (follow roket orientation)
  // Kamera tetap di belakang roket apapun arah roket menghadap
  
  // Get rocket's forward direction (arah roket melihat)
  const forward = new THREE.Vector3(0, 1, 0); // Roket facing +Y
  forward.applyQuaternion(rocketQuaternion);
  
  // Kamera di belakang roket = opposite of forward direction
  const cameraDirection = forward.clone().multiplyScalar(-distance);
  
  // Add height offset
  const upOffset = new THREE.Vector3(0, height, 0);
  
  // Position kamera
  const targetPos = rocketPosition.clone().add(cameraDirection).add(upOffset);
  
  // Smooth lerp
  camera.position.lerp(targetPos, 0.08);
  
  // Kamera always look at roket
  camera.lookAt(rocketPosition);
  
  // Up vector tetap world Y
  camera.up.set(0, 1, 0);
}

// Tambahan utility function untuk reset rocket
export function resetRocket(rocketMesh, rocketController) {
  rocketMesh.position.set(0, 50, 0);
  rocketMesh.quaternion.set(0, 0, 0, 1);
  rocketController.velocity.set(0, 0, 0);
}
