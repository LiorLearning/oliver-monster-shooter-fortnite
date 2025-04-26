class FirstPersonWeapon {
    constructor(camera) {
        this.camera = camera;
        this.group = new THREE.Group();
        this.camera.add(this.group);
        
        // Adjusted position to be more visible in first-person view
        this.group.position.set(0.2, -0.1, -0.3);
        
        // Create materials
        this.skinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd0a0,
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.weaponMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.6,
            metalness: 0.4
        });
        
        // Create arms and weapon
        this.createArms();
        this.createWeapon();
        
        // Animation variables
        this.breathingSpeed = 0.02;
        this.breathingAmplitude = 0.005;
        this.time = 0;
        
        // Start animation
        this.animate();
    }
    
    createArms() {
        // Left arm
        const leftArmGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const leftArm = new THREE.Mesh(leftArmGeometry, this.skinMaterial);
        leftArm.position.set(-0.15, 0, 0);
        leftArm.rotation.z = -0.2;
        this.group.add(leftArm);
        
        // Left forearm
        const leftForearmGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const leftForearm = new THREE.Mesh(leftForearmGeometry, this.skinMaterial);
        leftForearm.position.set(-0.15, -0.3, 0);
        leftForearm.rotation.z = 0.2;
        this.group.add(leftForearm);
        
        // Right arm
        const rightArmGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const rightArm = new THREE.Mesh(rightArmGeometry, this.skinMaterial);
        rightArm.position.set(0.15, 0, 0);
        rightArm.rotation.z = 0.2;
        this.group.add(rightArm);
        
        // Right forearm
        const rightForearmGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const rightForearm = new THREE.Mesh(rightForearmGeometry, this.skinMaterial);
        rightForearm.position.set(0.15, -0.3, 0);
        rightForearm.rotation.z = -0.2;
        this.group.add(rightForearm);
    }
    
    createWeapon() {
        // Weapon group
        const weaponGroup = new THREE.Group();
        weaponGroup.position.set(0, -0.15, 0);
        this.group.add(weaponGroup);
        
        // Pistol body (slightly larger)
        const bodyGeometry = new THREE.BoxGeometry(0.2, 0.12, 0.4);
        const body = new THREE.Mesh(bodyGeometry, this.weaponMaterial);
        body.position.set(0, 0, 0);
        weaponGroup.add(body);
        
        // Pistol barrel (slightly longer)
        const barrelGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.5);
        const barrel = new THREE.Mesh(barrelGeometry, this.weaponMaterial);
        barrel.position.set(0, 0, 0.25);
        weaponGroup.add(barrel);
        
        // Pistol grip (slightly larger)
        const gripGeometry = new THREE.BoxGeometry(0.12, 0.18, 0.12);
        const grip = new THREE.Mesh(gripGeometry, this.weaponMaterial);
        grip.position.set(0, -0.15, -0.15);
        grip.rotation.x = 0.2;
        weaponGroup.add(grip);
    }
    
    animate() {
        this.time += this.breathingSpeed;
        
        // Simple vertical bobbing animation
        const bob = Math.sin(this.time) * this.breathingAmplitude;
        this.group.position.y = -0.1 + bob;
        
        requestAnimationFrame(() => this.animate());
    }
} 