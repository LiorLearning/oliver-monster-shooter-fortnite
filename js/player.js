// Player controls and movement

class Projectile {
    constructor(scene, position, direction) {
        this.scene = scene;
        this.direction = direction.clone().normalize();
        this.speed = 0.7;
        this.lifetime = 1000; // ms
        this.startTime = Date.now();
        // Create a smaller glowing sphere (2x smaller)
        const geometry = new THREE.SphereGeometry(0.06, 16, 16);
        // Use a yellow-orange gradient effect
        const material = new THREE.MeshBasicMaterial({ color: 0xffb300 }); // orange-yellow
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        // Add a glow effect with both yellow and orange
        const glowYellow = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4 })
        );
        const glowOrange = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.25 })
        );
        this.mesh.add(glowYellow);
        this.mesh.add(glowOrange);
        scene.add(this.mesh);
    }
    update() {
        this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed));
    }
    isAlive() {
        return (Date.now() - this.startTime) < this.lifetime;
    }
    remove() {
        this.scene.remove(this.mesh);
    }
}

class AmmoBox {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.sprite = null;
        this.glowSprite = null;
        this.active = true;
        this.time = 0;
        this.init();
    }

    init() {
        // Load the ammo box image as a sprite
        const loader = new THREE.TextureLoader();
        loader.load('assets/ammo_box.png', (texture) => {
            // Main sprite
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: 0xffffff,
                transparent: true,
                depthTest: true,
                depthWrite: false,
                alphaTest: 0.2
            });
            this.sprite = new THREE.Sprite(material);
            this.sprite.position.copy(this.position);
            this.sprite.scale.set(1.5, 1.5, 1.5);
            this.sprite.frustumCulled = false;
            this.scene.add(this.sprite);

            // Glow sprite (slightly larger, yellow, additive blending)
            const glowMaterial = new THREE.SpriteMaterial({
                map: texture,
                color: 0xffff66,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                depthWrite: false
            });
            this.glowSprite = new THREE.Sprite(glowMaterial);
            this.glowSprite.position.copy(this.position);
            this.glowSprite.scale.set(2.2, 2.2, 2.2);
            this.glowSprite.frustumCulled = false;
            this.scene.add(this.glowSprite);
        });
    }

    update() {
        if (!this.active) return;
        this.time += 0.02;
        // Pulse the glow
        if (this.glowSprite) {
            const scale = 2.2 + Math.sin(this.time) * 0.25;
            this.glowSprite.scale.set(scale, scale, scale);
            this.glowSprite.material.opacity = 0.5 + 0.3 * Math.abs(Math.sin(this.time));
        }
        // Bobbing animation
        if (this.sprite && this.glowSprite) {
            const y = this.position.y + Math.sin(this.time * 2) * 0.15;
            this.sprite.position.y = y;
            this.glowSprite.position.y = y;
        }
    }

    remove() {
        if (this.sprite) this.scene.remove(this.sprite);
        if (this.glowSprite) this.scene.remove(this.glowSprite);
        this.active = false;
    }
}

class HealthKit {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.sprite = null;
        this.glowSprite = null;
        this.active = true;
        this.time = 0;
        this.init();
    }

    init() {
        // Load the health kit image as a sprite
        const loader = new THREE.TextureLoader();
        loader.load('assets/health_kit.png', (texture) => {
            // Main sprite
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: 0xffffff,
                transparent: true,
                depthTest: true,
                depthWrite: false,
                alphaTest: 0.2
            });
            this.sprite = new THREE.Sprite(material);
            this.sprite.position.copy(this.position);
            this.sprite.scale.set(1.5, 1.5, 1.5);
            this.sprite.frustumCulled = false;
            this.scene.add(this.sprite);

            // Glow sprite (slightly larger, red, additive blending)
            const glowMaterial = new THREE.SpriteMaterial({
                map: texture,
                color: 0xff6666,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                depthWrite: false
            });
            this.glowSprite = new THREE.Sprite(glowMaterial);
            this.glowSprite.position.copy(this.position);
            this.glowSprite.scale.set(2.2, 2.2, 2.2);
            this.glowSprite.frustumCulled = false;
            this.scene.add(this.glowSprite);
        });
    }

    update() {
        if (!this.active) return;
        this.time += 0.02;
        // Pulse the glow
        if (this.glowSprite) {
            const scale = 2.2 + Math.sin(this.time) * 0.25;
            this.glowSprite.scale.set(scale, scale, scale);
            this.glowSprite.material.opacity = 0.5 + 0.3 * Math.abs(Math.sin(this.time));
        }
        // Bobbing animation
        if (this.sprite && this.glowSprite) {
            const y = this.position.y + Math.sin(this.time * 2) * 0.15;
            this.sprite.position.y = y;
            this.glowSprite.position.y = y;
        }
    }

    remove() {
        if (this.sprite) this.scene.remove(this.sprite);
        if (this.glowSprite) this.scene.remove(this.glowSprite);
        this.active = false;
    }
}

class Player {
    constructor(camera, colliders) {
        this.camera = camera;
        this.colliders = colliders;
        
        // Player physics
        this.height = 1.6;
        this.speed = 0.15;
        this.turnSpeed = 0.002;
        this.velocity = new THREE.Vector3();
        this.onFloor = true;
        this.canJump = true;
        this.radius = 0.3;  // Collision detection radius
        
        // Movement variables
        this.keyboard = {};
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Ammo system
        this.maxAmmo = 12;
        this.currentAmmo = this.maxAmmo;
        this.ammoElement = document.getElementById('ammo');
        this.updateAmmoUI();
        
        // Initialize controls
        this.initControls();
        this.projectiles = [];
        this.healthKit = null;
        this.targetManager = null; // Will be set externally
    }
    
    initControls() {
        // Keyboard controls
        this.keydownHandler = (event) => {
            this.keyboard[event.key.toLowerCase()] = true;
        };
        
        this.keyupHandler = (event) => {
            this.keyboard[event.key.toLowerCase()] = false;
        };
        
        this.mousemoveHandler = (event) => {
            if (document.pointerLockElement === document.body) {
                // Calculate rotation based on mouse movement
                const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
                
                // Debug log
                console.log('Mouse movement:', movementX);
                
                // Only rotate around Y-axis (horizontal)
                this.camera.rotation.y -= movementX * this.turnSpeed;
                // Keep vertical rotation fixed
                this.camera.rotation.x = 0;
                
                // Debug log
                console.log('Camera rotation:', this.camera.rotation.y);
            }
        };
        
        // Add pointer lock event listeners
        document.addEventListener('pointerlockchange', () => {
            console.log('Pointer lock state changed:', document.pointerLockElement === document.body);
            if (document.pointerLockElement === document.body) {
                // Pointer is locked
                this.camera.rotation.x = 0; // Reset vertical rotation
                // Add mousemove listener when pointer is locked
                document.addEventListener('mousemove', this.mousemoveHandler);
            } else {
                // Remove mousemove listener when pointer is unlocked
                document.removeEventListener('mousemove', this.mousemoveHandler);
            }
        });

        // Add pointer lock error handler
        document.addEventListener('pointerlockerror', (error) => {
            console.error('Pointer lock error:', error);
        });
        
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
        
        // Request pointer lock on canvas click
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.addEventListener('click', () => {
                console.log('Canvas clicked, requesting pointer lock');
                if (!document.pointerLockElement) {
                    // Request pointer lock on document.body
                    document.body.requestPointerLock = document.body.requestPointerLock || 
                                                      document.body.mozRequestPointerLock || 
                                                      document.body.webkitRequestPointerLock;
                    document.body.requestPointerLock();
                }
            });
        }
    }
    
    // Check if player position would collide with any colliders
    checkCollision(x, z) {
        for (const collider of this.colliders) {
            if (
                x + this.radius > collider.minX &&
                x - this.radius < collider.maxX &&
                z + this.radius > collider.minZ &&
                z - this.radius < collider.maxZ
            ) {
                return true;
            }
        }
        return false;
    }
    
    // Update player position based on keyboard input
    update(houseSize) {
        // Calculate movement direction based on camera rotation
        const moveX = Math.sin(this.camera.rotation.y);
        const moveZ = Math.cos(this.camera.rotation.y);
        
        // Movement speed with modification for diagonals
        let actualSpeed = this.speed;
        let movingDiagonally = false;
        
        // Check if moving diagonally
        if ((this.keyboard['w'] || this.keyboard['arrowup']) && 
            (this.keyboard['a'] || this.keyboard['d'] || this.keyboard['arrowleft'] || this.keyboard['arrowright']) ||
            (this.keyboard['s'] || this.keyboard['arrowdown']) && 
            (this.keyboard['a'] || this.keyboard['d'] || this.keyboard['arrowleft'] || this.keyboard['arrowright'])) {
            movingDiagonally = true;
            actualSpeed *= 0.7071; // Approximately 1/sqrt(2) to maintain consistent speed when moving diagonally
        }
        
        // Move forward/backward
        let newX = this.camera.position.x;
        let newZ = this.camera.position.z;
        
        if (this.keyboard['w'] || this.keyboard['arrowup']) {
            newX -= moveX * actualSpeed;
            newZ -= moveZ * actualSpeed;
        }
        if (this.keyboard['s'] || this.keyboard['arrowdown']) {
            newX += moveX * actualSpeed;
            newZ += moveZ * actualSpeed;
        }
        
        // Strafe left/right
        if (this.keyboard['a'] || this.keyboard['arrowleft']) {
            newX -= moveZ * actualSpeed; // Move right relative to camera direction
            newZ += moveX * actualSpeed;
        }
        if (this.keyboard['d'] || this.keyboard['arrowright']) {
            newX += moveZ * actualSpeed; // Move left relative to camera direction
            newZ -= moveX * actualSpeed;
        }
        
        // Check for collisions
        if (!this.checkCollision(newX, this.camera.position.z)) {
            this.camera.position.x = newX;
        }
        
        if (!this.checkCollision(this.camera.position.x, newZ)) {
            this.camera.position.z = newZ;
        }
        
        // Keep player within house bounds
        this.camera.position.x = Math.max(-houseSize/2 + this.radius, Math.min(houseSize/2 - this.radius, this.camera.position.x));
        this.camera.position.z = Math.max(-houseSize/2 + this.radius, Math.min(houseSize/2 - this.radius, this.camera.position.z));
        
        // Update ammo box if it exists
        if (this.ammoBox) {
            this.ammoBox.update();
            
            // Check if player is close enough to collect ammo
            if (this.ammoBox.active && 
                this.camera.position.distanceTo(this.ammoBox.position) < 2) {
                this.collectAmmo();
            }
        }

        // Update health kit if it exists
        if (this.healthKit) {
            this.healthKit.update();
            // Check if player is close enough to collect health kit
            if (this.healthKit.active && this.camera.position.distanceTo(this.healthKit.position) < 2) {
                this.collectHealthKit();
            }
        }
    }
    
    // Method to handle shooting
    shoot(scene, targetManager) {
        if (this.currentAmmo <= 0) {
            // Play empty sound or show message
            return;
        }

        this.currentAmmo--;
        this.updateAmmoUI();

        const shootDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const projectile = new Projectile(scene, this.camera.position.clone(), shootDirection);
        this.projectiles.push(projectile);
        createShootingEffect(scene, this.camera.position.clone(), shootDirection.clone());
        targetManager.checkShot(this.camera.position.clone(), shootDirection);

        // Check if we need to spawn an ammo box
        if (this.currentAmmo === 0) {
            this.spawnAmmoBox(scene);
        }
    }

    updateProjectiles() {
        this.projectiles = this.projectiles.filter(p => {
            p.update();
            if (!p.isAlive()) {
                p.remove();
                return false;
            }
            return true;
        });
    }

    updateAmmoUI() {
        if (this.ammoElement) {
            this.ammoElement.textContent = this.currentAmmo;
            this.ammoElement.classList.add('changed');
            setTimeout(() => this.ammoElement.classList.remove('changed'), 300);
        }
    }

    spawnAmmoBox(scene) {
        // Find a random position in the room
        const houseSize = 20; // Assuming house size is 20 units
        const x = (Math.random() - 0.5) * (houseSize - 2);
        const z = (Math.random() - 0.5) * (houseSize - 2);
        const position = new THREE.Vector3(x, 1, z);
        
        // Create ammo box
        this.ammoBox = new AmmoBox(scene, position);
    }

    collectAmmo() {
        if (this.ammoBox && this.ammoBox.active) {
            // Show QuizPanel overlay instead of instantly giving ammo
            if (window.showQuizPanel) {
                window.showQuizPanel((bulletsAwarded) => {
                    this.currentAmmo = Math.min(this.currentAmmo + bulletsAwarded, this.maxAmmo);
                    this.updateAmmoUI();
                });
            }
            this.ammoBox.remove();
            this.ammoBox = null;
        }
    }

    spawnHealthKit(scene) {
        if (this.healthKit) return;
        
        // Find a random position away from the player
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 5;
        const x = this.camera.position.x + Math.cos(angle) * distance;
        const z = this.camera.position.z + Math.sin(angle) * distance;
        
        this.healthKit = new HealthKit(scene, new THREE.Vector3(x, 1.5, z));
    }

    collectHealthKit() {
        if (!this.healthKit) return;
        
        const distance = this.camera.position.distanceTo(this.healthKit.position);
        if (distance < 2) {
            this.healthKit.remove();
            this.healthKit = null;
            this.targetManager.playerHealth = Math.min(100, this.targetManager.playerHealth + 30);
            this.targetManager.healthElement.textContent = this.targetManager.playerHealth;
            // Play health pickup sound
            window.audioManager.playSound('health');
        }
    }
}