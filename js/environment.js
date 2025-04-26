// Environment creation for the abandoned house

class Environment {
    constructor(scene) {
        this.scene = scene;
        this.houseSize = 40;
        this.wallHeight = 5;
        this.doorWidth = 2;
        this.doorHeight = 3;
        this.windowSize = 1.5;
        
        // Darker, more mysterious colors
        this.floorColor = 0x1a1a1a;  // Darker floor
        this.wallColor = 0x2a2a2a;   // Darker walls
        this.ceilingColor = 0x1a1a1a; // Dark ceiling
        this.doorColor = 0x1a1a1a;
        this.windowFrameColor = 0x1a1a1a;
        
        // Create textures
        this.woodTexture = this.createWoodTexture();
        this.wallTexture = this.createWallTexture();
        
        // Initialize environment
        this.createFloorAndCeiling();
        this.createWalls();
        this.createFurniture();
        this.createDecorations();
        
        // Colliders for collision detection
        this.colliders = this.createColliders();

        // Ambient light (reduced intensity for more mystery)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2); // Reduced from 0.3 to 0.2
        this.scene.add(ambientLight);

        // Directional light (reduced intensity and adjusted position)
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6); // Reduced from 0.8 to 0.6
        dirLight.position.set(10, 15, 10); // Moved light higher and further
        dirLight.castShadow = true;
        
        // Increase shadow quality for larger space
        dirLight.shadow.mapSize.width = 4096; // Increased from 2048
        dirLight.shadow.mapSize.height = 4096; // Increased from 2048
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100; // Increased from 50
        dirLight.shadow.camera.left = -30; // Increased from -20
        dirLight.shadow.camera.right = 30; // Increased from 20
        dirLight.shadow.camera.top = 30; // Increased from 20
        dirLight.shadow.camera.bottom = -30; // Increased from -20
        
        // Add subtle color to the directional light
        dirLight.color.setHSL(0.1, 0.1, 0.6); // Slightly warmer but dimmer
        
        this.scene.add(dirLight);

        // Add more pronounced fog for atmosphere
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02); // Increased from 0.015

        // Add subtle point lights in corners for eerie effect
        const pointLight1 = new THREE.PointLight(0xff0000, 0.1, 15);
        pointLight1.position.set(-18, 2, -18);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00ff00, 0.1, 15);
        pointLight2.position.set(18, 2, 18);
        this.scene.add(pointLight2);

        // Create window and light beam
        this.createWindow();
    }
    
    createWoodTexture() {
        // Create a canvas for the wood texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // Draw wood grain pattern
        context.fillStyle = '#e6a86c';
        context.fillRect(0, 0, 256, 256);

        // Add wood grain lines
        context.strokeStyle = '#d98c4a';
        context.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            context.beginPath();
            context.moveTo(Math.random() * 256, 0);
            context.bezierCurveTo(
                Math.random() * 256, Math.random() * 256,
                Math.random() * 256, Math.random() * 256,
                Math.random() * 256, 256
            );
            context.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        return texture;
    }
    
    createWallTexture() {
        // Create a canvas for the wall texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');

        // Base color
        context.fillStyle = '#bfe9ff';
        context.fillRect(0, 0, 256, 256);

        // Add subtle pattern
        context.fillStyle = '#a8d9f0';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const size = Math.random() * 3 + 1;
            context.fillRect(x, y, size, size);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        return texture;
    }
    
    createFloorAndCeiling() {
        // Create floor with Fortnite-style material
        const floorGeometry = new THREE.PlaneGeometry(this.houseSize, this.houseSize);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x0a0a0a, // Much darker floor color
            map: this.woodTexture,
            roughness: 0.95, // Increased roughness to reduce reflectivity
            metalness: 0.05, // Reduced metalness
            envMapIntensity: 0.2 // Reduced environment map intensity
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Create ceiling with Fortnite-style material
        const ceilingGeometry = new THREE.PlaneGeometry(this.houseSize, this.houseSize);
        const ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: this.ceilingColor,
            roughness: 0.8,
            metalness: 0.1,
            envMapIntensity: 0.3
        });
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = this.wallHeight;
        ceiling.receiveShadow = true;
        this.scene.add(ceiling);
    }
    
    createWall(width, height, posX, posZ, rotY) {
        const wallGeometry = new THREE.PlaneGeometry(width, height);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: this.wallColor,
            map: this.wallTexture,
            roughness: 0.8,
            metalness: 0.1,
            envMapIntensity: 0.3
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(posX, height/2, posZ);
        wall.rotation.y = rotY;
        wall.receiveShadow = true;
        wall.castShadow = true;
        this.scene.add(wall);
        return wall;
    }
    
    createWindow() {
        // Window frame dimensions
        const windowWidth = 1;
        const windowHeight = 1.5;
        const frameThickness = 0.1;
        
        // Create window frame material
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a1a0a, // Dark wood color
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Create window frame group
        const windowGroup = new THREE.Group();
        
        // Create frame pieces
        const horizontalFrame = new THREE.Mesh(
            new THREE.BoxGeometry(windowWidth + frameThickness * 2, frameThickness, frameThickness),
            frameMaterial
        );
        
        const verticalFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, windowHeight + frameThickness * 2, frameThickness),
            frameMaterial
        );
        
        // Position frame pieces
        horizontalFrame.position.y = windowHeight / 2 + frameThickness / 2;
        windowGroup.add(horizontalFrame.clone()); // Top
        horizontalFrame.position.y = -windowHeight / 2 - frameThickness / 2;
        windowGroup.add(horizontalFrame.clone()); // Bottom
        
        verticalFrame.position.x = windowWidth / 2 + frameThickness / 2;
        windowGroup.add(verticalFrame.clone()); // Right
        verticalFrame.position.x = -windowWidth / 2 - frameThickness / 2;
        windowGroup.add(verticalFrame.clone()); // Left
        
        // Position window on north wall
        windowGroup.position.set(0, 3, -this.houseSize / 2 + frameThickness / 2);
        this.scene.add(windowGroup);
        
        // Create sunlight
        const sunlight = new THREE.DirectionalLight(0xfff1cc, 0.25);
        sunlight.position.set(0, 5, -this.houseSize / 2 - 5);
        sunlight.target.position.set(0, 2, -this.houseSize / 2 + 5);
        this.scene.add(sunlight);
        this.scene.add(sunlight.target);
        
        // Create light beam effect
        const beamGeometry = new THREE.PlaneGeometry(windowWidth * 1.2, windowHeight * 1.2);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: 0xfff1cc,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(0, 3, -this.houseSize / 2 + 1);
        beam.rotation.x = Math.PI / 4;
        this.scene.add(beam);
        
        // Add dust particles in the light beam
        const dustCount = 50;
        const dustGeometry = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustCount * 3);
        const dustMaterial = new THREE.PointsMaterial({
            color: 0xfff1cc,
            size: 0.05,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        for (let i = 0; i < dustCount; i++) {
            const x = (Math.random() - 0.5) * windowWidth;
            const y = (Math.random() - 0.5) * windowHeight;
            const z = Math.random() * 5;
            
            dustPositions[i * 3] = x;
            dustPositions[i * 3 + 1] = y;
            dustPositions[i * 3 + 2] = z;
        }
        
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
        dustParticles.position.set(0, 3, -this.houseSize / 2 + 1);
        this.scene.add(dustParticles);
        
        // Animate dust particles
        this.dustParticles = dustParticles;
    }
    
    createWalls() {
        // Create north wall (with door)
        const northWallLeft = this.createWall(
            (this.houseSize - this.doorWidth) / 2, 
            this.wallHeight, 
            -(this.houseSize + this.doorWidth) / 4, 
            -this.houseSize / 2, 
            0
        );
        
        const northWallRight = this.createWall(
            (this.houseSize - this.doorWidth) / 2, 
            this.wallHeight, 
            (this.houseSize + this.doorWidth) / 4, 
            -this.houseSize / 2, 
            0
        );
        
        const doorFrame = this.createWall(
            this.doorWidth, 
            this.doorHeight, 
            0, 
            -this.houseSize / 2, 
            0
        );
        doorFrame.material = new THREE.MeshStandardMaterial({ color: this.doorColor });

        // Create east wall (with multiple windows)
        const eastWall = this.createWall(
            this.houseSize, 
            this.wallHeight, 
            this.houseSize / 2, 
            0, 
            Math.PI / 2
        );
        
        this.createWindow(this.houseSize / 2, 5, Math.PI / 2);
        this.createWindow(this.houseSize / 2, -4, Math.PI / 2);
        this.createWindow(this.houseSize / 2, -8, Math.PI / 2);

        // Create south wall (with multiple windows)
        const southWall = this.createWall(
            this.houseSize, 
            this.wallHeight, 
            0, 
            this.houseSize / 2, 
            0
        );
        
        this.createWindow(5, this.houseSize / 2, 0);
        this.createWindow(-4, this.houseSize / 2, 0);
        this.createWindow(-8, this.houseSize / 2, 0);

        // Create west wall (with multiple windows)
        const westWall = this.createWall(
            this.houseSize, 
            this.wallHeight, 
            -this.houseSize / 2, 
            0, 
            Math.PI / 2
        );
        
        this.createWindow(-this.houseSize / 2, 5, Math.PI / 2);
        this.createWindow(-this.houseSize / 2, -5, Math.PI / 2);
    }
    
    createTable(posX = -2, posZ = -2, rotation = 0) {
        const group = new THREE.Group();
        
        const tableTop = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.1, 1),
            new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                map: this.woodTexture,
                roughness: 0.8
            })
        );
        tableTop.position.set(0, 0.8, 0);
        tableTop.castShadow = true;
        tableTop.receiveShadow = true;
        group.add(tableTop);
        
        // Table legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9
        });
        
        const positions = [
            [-0.7, 0.4, -0.4],
            [0.7, 0.4, -0.4],
            [-0.7, 0.4, 0.4],
            [0.7, 0.4, 0.4]
        ];
        
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });
        
        // Set position and rotation
        group.position.set(posX, 0, posZ);
        group.rotation.y = rotation;
        this.scene.add(group);
    }
    
    createChair(x, z, rotation) {
        const group = new THREE.Group();
        
        // Chair seat
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.1, 0.6),
            new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                map: this.woodTexture,
                roughness: 0.8
            })
        );
        seat.position.y = 0.5;
        seat.castShadow = true;
        seat.receiveShadow = true;
        group.add(seat);
        
        // Chair back
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.1),
            new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                map: this.woodTexture,
                roughness: 0.8
            })
        );
        back.position.set(0, 0.9, -0.25);
        back.castShadow = true;
        back.receiveShadow = true;
        group.add(back);
        
        // Chair legs
        const legGeometry = new THREE.BoxGeometry(0.08, 0.5, 0.08);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9
        });
        
        const positions = [
            [-0.25, 0.25, -0.25],
            [0.25, 0.25, -0.25],
            [-0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25]
        ];
        
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });
        
        group.position.set(x, 0, z);
        group.rotation.y = rotation;
        this.scene.add(group);
    }
    
    createBookshelf(posX = 3, posZ = 3, rotation = -Math.PI / 4) {
        const group = new THREE.Group();
        
        // Bookshelf frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 2, 0.4),
            new THREE.MeshStandardMaterial({ 
                color: 0x5C4033,
                map: this.woodTexture,
                roughness: 0.8
            })
        );
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);
        
        // Shelves
        for (let i = 0; i < 4; i++) {
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.05, 0.4),
                new THREE.MeshStandardMaterial({ 
                    color: 0x6B4226,
                    map: this.woodTexture,
                    roughness: 0.7
                })
            );
            shelf.position.y = -0.9 + i * 0.6;
            shelf.castShadow = true;
            shelf.receiveShadow = true;
            group.add(shelf);
        }
        
        // Add some books
        const bookColors = [
            0x8B0000, 0x006400, 0x00008B, 
            0x8B008B, 0x8B8B00, 0x008B8B
        ];
        
        for (let shelf = 0; shelf < 4; shelf++) {
            let offsetX = -0.6;
            const y = -0.7 + shelf * 0.6;
            
            for (let book = 0; book < 4; book++) {
                if (Math.random() > 0.7) continue; // Some spaces for realism
                
                const width = Math.random() * 0.1 + 0.1;
                const height = Math.random() * 0.2 + 0.3;
                
                const bookGeometry = new THREE.BoxGeometry(width, height, 0.25);
                const bookMaterial = new THREE.MeshStandardMaterial({ 
                    color: bookColors[Math.floor(Math.random() * bookColors.length)],
                    roughness: 0.9
                });
                
                const bookMesh = new THREE.Mesh(bookGeometry, bookMaterial);
                bookMesh.position.set(offsetX, y + height / 2, 0);
                bookMesh.castShadow = true;
                bookMesh.receiveShadow = true;
                group.add(bookMesh);
                
                offsetX += width + 0.02;
            }
        }
        
        group.position.set(posX, 1, posZ);
        group.rotation.y = rotation;
        this.scene.add(group);
    }
    
    createBrokenChair(posX = 1, posZ = -3, rotation = Math.PI / 4) {
        const group = new THREE.Group();
        
        // Broken chair seat (tilted)
        const seat = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.1, 0.6),
            new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                map: this.woodTexture,
                roughness: 0.8
            })
        );
        seat.position.set(0, 0.3, 0);
        seat.rotation.z = Math.PI / 6;
        seat.castShadow = true;
        seat.receiveShadow = true;
        group.add(seat);
        
        // Broken chair back (detached)
        const back = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.8, 0.1),
            new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                map: this.woodTexture,
                roughness: 0.8
            })
        );
        back.position.set(0.3, 0.2, -0.5);
        back.rotation.x = Math.PI / 2.5;
        back.castShadow = true;
        back.receiveShadow = true;
        group.add(back);
        
        // Chair legs (only three, one broken)
        const legGeometry = new THREE.BoxGeometry(0.08, 0.5, 0.08);
        const legMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.9
        });
        
        const positions = [
            [-0.25, 0.25, -0.25],
            [0.25, 0.25, -0.25],
            [-0.25, 0.25, 0.25]
        ];
        
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });
        
        // Broken leg on the ground
        const brokenLeg = new THREE.Mesh(legGeometry, legMaterial);
        brokenLeg.position.set(0.4, 0.04, 0.3);
        brokenLeg.rotation.z = Math.PI / 2;
        brokenLeg.castShadow = true;
        group.add(brokenLeg);
        
        group.position.set(posX, 0, posZ);
        group.rotation.y = rotation;
        this.scene.add(group);
    }
    
    createDust() {
        // Create a circular sprite texture for dust particles
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Create a radial gradient for soft circular particles
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const sprite = new THREE.CanvasTexture(canvas);
        
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 300;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * (this.houseSize - 1);
            positions[i * 3 + 1] = Math.random() * this.wallHeight * 0.9 + 0.2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * (this.houseSize - 1);
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0xCCCCCC,
            size: 0.08,
            transparent: true,
            opacity: 0.3,
            map: sprite,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(particles);
        
        return particles;
    }
    
    createCobweb(x, y, z) {
        const group = new THREE.Group();
        
        // Create a cobweb using thin lines
        const webGeometry = new THREE.BufferGeometry();
        const webMaterial = new THREE.LineBasicMaterial({ 
            color: 0xCCCCCC,
            transparent: true,
            opacity: 0.5
        });
        
        const points = [];
        const center = new THREE.Vector3(0, 0, 0);
        const radius = 0.5;
        const strands = 12;
        
        // Create radial strands
        for (let i = 0; i < strands; i++) {
            const angle = (i / strands) * Math.PI * 2;
            const endpoint = new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius * 0.5, // Slightly oval
                0
            );
            
            points.push(center.clone());
            points.push(endpoint.clone());
            
            // Create connecting threads between strands
            if (i > 0) {
                const prevAngle = ((i - 1) / strands) * Math.PI * 2;
                const prevPoint = new THREE.Vector3(
                    Math.cos(prevAngle) * radius,
                    Math.sin(prevAngle) * radius * 0.5,
                    0
                );
                
                // Add some spiral threads
                for (let r = 0.2; r < radius; r += 0.15) {
                    const p1 = new THREE.Vector3(
                        Math.cos(prevAngle) * r,
                        Math.sin(prevAngle) * r * 0.5,
                        0
                    );
                    
                    const p2 = new THREE.Vector3(
                        Math.cos(angle) * r,
                        Math.sin(angle) * r * 0.5,
                        0
                    );
                    
                    points.push(p1.clone());
                    points.push(p2.clone());
                }
            }
        }
        
        webGeometry.setFromPoints(points);
        const web = new THREE.LineSegments(webGeometry, webMaterial);
        group.add(web);
        
        group.position.set(x, y, z);
        this.scene.add(group);
    }
    
    createFurniture() {
        // Calculate grid positions for even distribution
        const gridSize = 8; // 8x8 grid
        const spacing = this.houseSize / gridSize;
        const startPos = -this.houseSize / 2 + spacing / 2;

        // Create furniture in a grid pattern
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                const posX = startPos + x * spacing;
                const posZ = startPos + z * spacing;
                
                // Skip center area to keep it clear
                if (Math.abs(posX) < spacing * 2 && Math.abs(posZ) < spacing * 2) continue;

                // Randomly choose furniture type
                const choice = Math.random();
                
                if (choice < 0.3) {
                    // Broken chair
                    this.createBrokenChair(
                        posX + (Math.random() - 0.5) * spacing * 0.5,
                        posZ + (Math.random() - 0.5) * spacing * 0.5,
                        Math.random() * Math.PI * 2
                    );
                } else if (choice < 0.6) {
                    // Table with broken chairs
                    this.createTable(
                        posX + (Math.random() - 0.5) * spacing * 0.5,
                        posZ + (Math.random() - 0.5) * spacing * 0.5,
                        Math.random() * Math.PI * 2
                    );
                    // Add 1-2 broken chairs around the table
                    const numChairs = Math.floor(Math.random() * 2) + 1;
                    for (let i = 0; i < numChairs; i++) {
                        const angle = (i / numChairs) * Math.PI * 2;
                        this.createBrokenChair(
                            posX + Math.cos(angle) * 1.5,
                            posZ + Math.sin(angle) * 1.5,
                            angle + Math.PI / 2
                        );
                    }
                } else if (choice < 0.8) {
                    // Bookshelf (sometimes broken)
                    this.createBookshelf(
                        posX + (Math.random() - 0.5) * spacing * 0.5,
                        posZ + (Math.random() - 0.5) * spacing * 0.5,
                        Math.random() * Math.PI * 2
                    );
                }
            }
        }
    }
    
    createDecorations() {
        // Create dust particles
        this.dust = this.createDust();
        
        // Add cobwebs throughout the space
        const webSpacing = this.houseSize / 6;
        const startPos = -this.houseSize / 2 + webSpacing / 2;
        
        for (let x = 0; x < 6; x++) {
            for (let z = 0; z < 6; z++) {
                const posX = startPos + x * webSpacing;
                const posZ = startPos + z * webSpacing;
                
                // Skip center area
                if (Math.abs(posX) < webSpacing && Math.abs(posZ) < webSpacing) continue;
                
                // Add cobweb with random height
                const height = 2.5 + Math.random() * 2;
                this.createCobweb(posX, height, posZ);
            }
        }

        // Add broken glass and debris
        const debrisCount = 20;
        for (let i = 0; i < debrisCount; i++) {
            const posX = (Math.random() - 0.5) * (this.houseSize - 4);
            const posZ = (Math.random() - 0.5) * (this.houseSize - 4);
            
            // Skip center area
            if (Math.abs(posX) < 4 && Math.abs(posZ) < 4) continue;
            
            this.createDebris(posX, 0, posZ);
        }
    }
    
    createDebris(x, y, z) {
        const group = new THREE.Group();
        
        // Create random pieces of debris
        const pieceCount = Math.floor(Math.random() * 5) + 3;
        for (let i = 0; i < pieceCount; i++) {
            const size = Math.random() * 0.3 + 0.1;
            const geometry = new THREE.BoxGeometry(size, size * 0.2, size);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const piece = new THREE.Mesh(geometry, material);
            piece.position.set(
                (Math.random() - 0.5) * 0.5,
                size * 0.1,
                (Math.random() - 0.5) * 0.5
            );
            piece.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            piece.castShadow = true;
            group.add(piece);
        }
        
        group.position.set(x, y, z);
        this.scene.add(group);
    }
    
    createColliders() {
        // Create collision detection boxes for walls
        const wallColliders = [
            // North wall left
            { 
                minX: -this.houseSize / 2, 
                maxX: -(this.doorWidth / 2), 
                minZ: -this.houseSize / 2 - 0.2, 
                maxZ: -this.houseSize / 2 + 0.2 
            },
            // North wall right
            { 
                minX: this.doorWidth / 2, 
                maxX: this.houseSize / 2, 
                minZ: -this.houseSize / 2 - 0.2, 
                maxZ: -this.houseSize / 2 + 0.2 
            },
            // East wall
            { 
                minX: this.houseSize / 2 - 0.2, 
                maxX: this.houseSize / 2 + 0.2, 
                minZ: -this.houseSize / 2, 
                maxZ: this.houseSize / 2 
            },
            // South wall
            { 
                minX: -this.houseSize / 2, 
                maxX: this.houseSize / 2, 
                minZ: this.houseSize / 2 - 0.2, 
                maxZ: this.houseSize / 2 + 0.2 
            },
            // West wall
            { 
                minX: -this.houseSize / 2 - 0.2, 
                maxX: -this.houseSize / 2 + 0.2, 
                minZ: -this.houseSize / 2, 
                maxZ: this.houseSize / 2 
            }
        ];

        // Add furniture colliders for all furniture pieces
        const furnitureColliders = [
            // Original furniture
            { 
                minX: -2.75, 
                maxX: -1.25, 
                minZ: -2.5, 
                maxZ: -1.5 
            },
            { 
                minX: 2.2, 
                maxX: 3.8, 
                minZ: 2.2, 
                maxZ: 3.8 
            },
            { 
                minX: 0.5, 
                maxX: 1.5, 
                minZ: -3.5, 
                maxZ: -2.5 
            },
            
            // New furniture colliders
            { 
                minX: -7.0, 
                maxX: -5.0, 
                minZ: -7.0, 
                maxZ: -5.0 
            },
            { 
                minX: -8.0, 
                maxX: -6.5, 
                minZ: -6.5, 
                maxZ: -5.5 
            },
            { 
                minX: 6.0, 
                maxX: 8.0, 
                minZ: -8.0, 
                maxZ: -6.0 
            },
            { 
                minX: 7.0, 
                maxX: 9.0, 
                minZ: 5.0, 
                maxZ: 7.0 
            },
            { 
                minX: 5.5, 
                maxX: 6.5, 
                minZ: -3.5, 
                maxZ: -2.5 
            },
            { 
                minX: -4.5, 
                maxX: -3.5, 
                minZ: 4.5, 
                maxZ: 5.5 
            },
            { 
                minX: 7.0, 
                maxX: 9.0, 
                minZ: 1.0, 
                maxZ: 3.0 
            }
        ];

        // Combine colliders
        return [...wallColliders, ...furnitureColliders];
    }
    
    updateDust() {
        if (this.dust) {
            this.dust.rotation.y += 0.0003;
            const positions = this.dust.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Slow vertical movement
                positions[i + 1] -= 0.001;
                
                // Wrap around if dust particle goes below floor
                if (positions[i + 1] < 0.1) {
                    positions[i + 1] = this.wallHeight * 0.8;
                }
                
                // Add slight random horizontal drift
                positions[i] += (Math.random() - 0.5) * 0.002;
                positions[i + 2] += (Math.random() - 0.5) * 0.002;
                
                // Keep within house bounds
                positions[i] = Math.max(-this.houseSize/2 + 0.5, Math.min(this.houseSize/2 - 0.5, positions[i]));
                positions[i + 2] = Math.max(-this.houseSize/2 + 0.5, Math.min(this.houseSize/2 - 0.5, positions[i + 2]));
            }
            
            this.dust.geometry.attributes.position.needsUpdate = true;
        }
    }

    update() {
        // ... existing code ...
        
        // Animate dust particles
        if (this.dustParticles) {
            const positions = this.dustParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += (Math.random() - 0.5) * 0.01;
                positions[i + 2] += 0.01;
                if (positions[i + 2] > 5) {
                    positions[i + 2] = 0;
                }
            }
            this.dustParticles.geometry.attributes.position.needsUpdate = true;
        }
    }
}