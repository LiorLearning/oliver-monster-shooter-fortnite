// Monster targets and target management

class MonsterTarget {
    constructor(scene, position, spriteFile = 'assets/monster_sprite.png') {
        this.scene = scene;
        this.sprite = null;
        this.active = false;
        
        // Determine wave number from sprite file for difficulty scaling
        const waveMatch = spriteFile.match(/monster_sprite_(\d+)/);
        const waveNumber = waveMatch ? parseInt(waveMatch[1]) : 0;
        
        // Scale health and speed based on wave number
        this.health = 100 + (waveNumber * 20); // Increase health for later waves
        this.baseSpeed = 0.04 + (waveNumber * 0.01); // Updated speed scaling
        this.speed = this.baseSpeed;
        this.damageTimer = 0;
        
        // Movement pattern variables
        this.strafeDirection = new THREE.Vector3();
        this.strafeTime = 0;
        this.strafeDuration = 0;
        this.lastDodgeTime = 0;
        this.dodgeCooldown = Math.max(800 - (waveNumber * 50), 500); // Reduce dodge cooldown (more frequent dodges)
        this.movementState = 'pursue';
        this.dodgeDirection = new THREE.Vector3();
        this.aggressionLevel = 0.3 + Math.random() * 0.3 + (waveNumber * 0.1); // Keep aggression scaling the same
        
        // Animation variables
        this.breathTime = 0;
        this.breathSpeed = 0.02;
        this.breathAmplitude = 0.05;
        
        // Load the monster image as a sprite
        const loader = new THREE.TextureLoader();
        loader.load(spriteFile, (texture) => {
            // Ensure texture is properly set up
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: 0xffffff,
                transparent: true,
                depthTest: true,
                depthWrite: true,
                alphaTest: 0.5 // Important for hit detection
            });
            
            this.sprite = new THREE.Sprite(material);
            this.sprite.scale.set(2.5, 2.5, 1);
            this.sprite.position.copy(position);
            this.sprite.visible = false;
            this.sprite.frustumCulled = false;
            
            // Set up the sprite for proper hit detection
            this.sprite.matrixAutoUpdate = true;
            this.sprite.updateMatrix();
            
            this.scene.add(this.sprite);
        });
    }
    
    show() {
        if (this.sprite) {
            this.sprite.visible = true;
            this.active = true;
            this.initialHealth = this.health; // Store the initial health
            // Pop-up animation
            this.sprite.scale.set(0.1, 0.1, 0.1);
            const targetScale = 2.5;
            const duration = 500;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const scale = progress * targetScale;
                this.sprite.scale.set(scale, scale, 1);
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.startBreathing();
                }
            };
            animate();
        }
    }
    
    startBreathing() {
        const animateBreath = () => {
            if (!this.active || !this.sprite) return;
            this.breathTime += this.breathSpeed;
            const breathScale = 2.5 + Math.sin(this.breathTime) * this.breathAmplitude;
            this.sprite.scale.y = breathScale;
            requestAnimationFrame(animateBreath);
        };
        animateBreath();
    }
    
    hide() {
        if (this.sprite) {
            this.sprite.visible = false;
            this.active = false;
        }
    }
    
    hit() {
        const damagePercent = 34; // Damage is now a percentage of total health
        const damage = Math.ceil(this.initialHealth * (damagePercent / 100));
        this.health -= damage;
        
        // Enhanced hit effect with glow
        if (this.sprite) {
            const originalScale = this.sprite.scale.clone();
            const originalColor = this.sprite.material.color.clone();
            
            // Create glow effect
            const glowMaterial = new THREE.SpriteMaterial({
                map: this.sprite.material.map,
                color: 0xff0000,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            const glowSprite = new THREE.Sprite(glowMaterial);
            glowSprite.scale.copy(this.sprite.scale).multiplyScalar(1.5);
            glowSprite.position.copy(this.sprite.position);
            this.scene.add(glowSprite);
            
            // Flash effect
            this.sprite.material.color.set(0xff0000);
            this.sprite.scale.multiplyScalar(1.2);
            
            // Animate glow
            let glowScale = 1.5;
            const animateGlow = () => {
                glowScale -= 0.1;
                if (glowScale <= 1) {
                    this.scene.remove(glowSprite);
                    if (this.sprite) {
                        this.sprite.material.color.copy(originalColor);
                        this.sprite.scale.copy(originalScale);
                    }
                    return;
                }
                glowSprite.scale.copy(this.sprite.scale).multiplyScalar(glowScale);
                requestAnimationFrame(animateGlow);
            };
            animateGlow();
        }
        
        if (this.health <= 0) {
            this.hide();
            return true;
        }
        return false;
    }
    
    calculateNewStrafeDirection() {
        // Calculate a perpendicular direction to the player
        const toPlayer = this.targetDirection.clone();
        this.strafeDirection.set(toPlayer.z, 0, -toPlayer.x).normalize();
        if (Math.random() < 0.5) this.strafeDirection.multiplyScalar(-1);
    }
    
    dodge(playerPosition) {
        const now = Date.now();
        if (now - this.lastDodgeTime < this.dodgeCooldown) return false;
        if (Math.random() < 0.4 * this.aggressionLevel) {
            this.lastDodgeTime = now;
            this.movementState = 'dodge';
            const awayFromPlayer = this.sprite.position.clone().sub(playerPosition).normalize();
            const sideways = new THREE.Vector3(awayFromPlayer.z, 0, -awayFromPlayer.x);
            const randomSide = Math.random() < 0.5 ? 1 : -1;
            this.dodgeDirection.copy(awayFromPlayer).multiplyScalar(0.6).add(sideways.multiplyScalar(0.4 * randomSide)).normalize();
            this.speed = this.baseSpeed * (2.5 + this.aggressionLevel);
            setTimeout(() => {
                this.movementState = 'pursue';
                this.speed = this.baseSpeed;
            }, 300);
            return true;
        }
        return false;
    }
    
    update(playerPosition) {
        if (!this.active || !this.sprite) return;
        this.targetDirection = new THREE.Vector3().subVectors(playerPosition, this.sprite.position).normalize();
        const distanceToPlayer = this.sprite.position.distanceTo(playerPosition);
        
        if (distanceToPlayer < 5) {
            this.speed = this.baseSpeed * (1.1 + this.aggressionLevel);
        } else {
            this.speed = this.baseSpeed;
        }
        
        if (this.movementState === 'pursue') {
            if (Math.random() < 0.03 * this.aggressionLevel) {
                this.movementState = 'strafe';
                this.calculateNewStrafeDirection();
                this.strafeTime = 0;
                this.strafeDuration = 600 + Math.random() * 600;
            } else {
                this.dodge(playerPosition);
            }
        }
        
        let moveDirection = new THREE.Vector3();
        switch (this.movementState) {
            case 'pursue':
                moveDirection.copy(this.targetDirection);
                break;
            case 'strafe':
                moveDirection.copy(this.targetDirection).multiplyScalar(0.6).add(this.strafeDirection.multiplyScalar(0.4));
                this.strafeTime += 16.67;
                if (this.strafeTime >= this.strafeDuration) {
                    this.movementState = 'pursue';
                }
                break;
            case 'dodge':
                moveDirection.copy(this.dodgeDirection);
                break;
        }
        
        const randomVariation = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            0,
            (Math.random() - 0.5) * 0.1
        );
        moveDirection.add(randomVariation).normalize();
        
        // Calculate new position
        const newPosition = this.sprite.position.clone().add(moveDirection.multiplyScalar(this.speed));
        
        // Check wall collisions
        const houseSize = 40;
        const monsterRadius = 1.25; // Half of the monster's scale (2.5/2)
        
        // Keep monster within house bounds
        newPosition.x = Math.max(-houseSize/2 + monsterRadius, Math.min(houseSize/2 - monsterRadius, newPosition.x));
        newPosition.z = Math.max(-houseSize/2 + monsterRadius, Math.min(houseSize/2 - monsterRadius, newPosition.z));
        
        // Keep monster above floor level (y = 1.5)
        newPosition.y = Math.max(1.5, newPosition.y);
        
        // Update position
        this.sprite.position.copy(newPosition);
        this.sprite.lookAt(playerPosition);
        
        if (distanceToPlayer < 2.0 && Date.now() - this.damageTimer > 700) {
            this.damageTimer = Date.now();
            return true;
        }
        return false;
    }
}

class TargetManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.targets = [];
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        this.playerHealth = 100;
        this.healthElement = document.getElementById('health');
        this.minSpawnDistance = 6;
        this.gameActive = true;
        this.waveSize = 5; // Fixed number of monsters per wave
        this.totalWaves = 3; // Changed to 3 total waves
        this.monstersKilledInWave = 0;
        this.monstersSpawnedInWave = 0;
        this.waveCooldown = 5000; // 5 seconds between waves
        this.isWaveCooldown = false;
        this.waveNumber = 0;
        
        // Create monsters remaining display
        this.monstersRemainingElement = document.createElement('div');
        this.monstersRemainingElement.id = 'monsters-remaining';
        this.monstersRemainingElement.style.position = 'fixed';
        this.monstersRemainingElement.style.top = '70px';
        this.monstersRemainingElement.style.right = '20px';
        this.monstersRemainingElement.style.color = 'white';
        this.monstersRemainingElement.style.fontSize = '20px';
        this.monstersRemainingElement.style.textShadow = '2px 2px 4px black';
        document.body.appendChild(this.monstersRemainingElement);
        this.updateMonstersRemaining();
        
        // Updated monster sprite files for each wave
        this.monsterSprites = [
            'assets/monster_sprite.png',    // Wave 1
            'assets/monster_sprite_2.png',  // Wave 2
            'assets/monster_sprite_5.png'   // Wave 3 (Final Boss)
        ];
        
        // Create potential spawn positions (we'll filter these based on player position)
        this.spawnPositions = [
            new THREE.Vector3(-8, 1.5, -8),
            new THREE.Vector3(8, 1.5, -8),
            new THREE.Vector3(-8, 1.5, 8),
            new THREE.Vector3(8, 1.5, 8),
            new THREE.Vector3(0, 1.5, -9),
            new THREE.Vector3(-9, 1.5, 0),
            new THREE.Vector3(9, 1.5, 0),
            new THREE.Vector3(0, 1.5, 9),
            // Add more spawn positions for variety
            new THREE.Vector3(-7, 1.5, -7),
            new THREE.Vector3(7, 1.5, -7),
            new THREE.Vector3(-7, 1.5, 7),
            new THREE.Vector3(7, 1.5, 7),
            new THREE.Vector3(-5, 1.5, -9),
            new THREE.Vector3(5, 1.5, -9),
            new THREE.Vector3(-9, 1.5, -5),
            new THREE.Vector3(-9, 1.5, 5)
        ];
        
        // Create targets for each monster type
        this.createTargetsForAllWaves();
    }
    
    createTargetsForAllWaves() {
        // Create a set of targets for each sprite/wave
        this.monsterSprites.forEach((spriteFile, index) => {
            this.spawnPositions.forEach(position => {
                this.targets.push(new MonsterTarget(this.scene, position, spriteFile));
            });
        });
    }
    
    getCurrentWaveSprite() {
        // Get the appropriate sprite for the current wave (0-indexed)
        const spriteIndex = Math.min(this.waveNumber, this.monsterSprites.length - 1);
        return this.monsterSprites[spriteIndex];
    }
    
    startSpawning() {
        this.spawnInterval = setInterval(() => {
            if (!this.gameActive) return;
            
            // Count active monsters
            const activeMonsters = this.targets.filter(t => t.active).length;
            
            // If we're in cooldown, don't spawn
            if (this.isWaveCooldown) return;
            
            // If all monsters in wave are dead and no monsters are active, start cooldown
            if (this.monstersKilledInWave >= this.waveSize && activeMonsters === 0) {
                this.startWaveCooldown();
                return;
            }
            
            // Only spawn if we haven't reached the wave size limit
            if (this.monstersSpawnedInWave < this.waveSize && Math.random() < 0.3) {
                // Get the current wave's sprite
                const currentSprite = this.getCurrentWaveSprite();
                const currentWaveIndex = Math.min(this.waveNumber, this.monsterSprites.length - 1);
                
                // Calculate the range of targets for the current wave
                const targetsPerWave = this.spawnPositions.length;
                const startIndex = currentWaveIndex * targetsPerWave;
                const endIndex = startIndex + targetsPerWave;
                
                // Get inactive targets for the current wave
                const matchingInactiveTargets = this.targets
                    .slice(startIndex, endIndex)
                    .filter(t => !t.active);
                
                if (matchingInactiveTargets.length > 0) {
                    const safePosition = this.getSafeSpawnPosition();
                    
                    if (safePosition) {
                        const availableTarget = matchingInactiveTargets.find(t => 
                            !this.targets.some(activeTarget => 
                                activeTarget.active && 
                                activeTarget.sprite.position.distanceTo(safePosition) < 2
                            )
                        );
                        
                        if (availableTarget) {
                            availableTarget.sprite.position.copy(safePosition);
                            availableTarget.show();
                            this.monstersSpawnedInWave++;
                        }
                    }
                }
            }
        }, 1000);
    }
    
    startWaveCooldown() {
        this.isWaveCooldown = true;
        this.monstersKilledInWave = 0;
        this.monstersSpawnedInWave = 0;
        this.waveNumber++;
        
        // Update monsters remaining display
        this.updateMonstersRemaining();
        
        // Check if all waves are completed
        if (this.waveNumber >= this.totalWaves) {
            this.victory();
            return;
        }
        
        // Get the next wave's monster type name
        const nextWaveType = this.waveNumber < this.monsterSprites.length - 1 ? 
            `Monster Type ${this.waveNumber + 1}` : 
            "Final Boss Monster";
        
        // Show wave complete message
        const waveCompleteMessage = document.createElement('div');
        waveCompleteMessage.style.position = 'fixed';
        waveCompleteMessage.style.top = '20%';
        waveCompleteMessage.style.left = '50%';
        waveCompleteMessage.style.transform = 'translate(-50%, -50%)';
        waveCompleteMessage.style.color = 'white';
        waveCompleteMessage.style.fontSize = '24px';
        waveCompleteMessage.style.textAlign = 'center';
        waveCompleteMessage.style.textShadow = '2px 2px 4px black';
        waveCompleteMessage.textContent = `Wave ${this.waveNumber} Complete!`;
        document.body.appendChild(waveCompleteMessage);
        
        // Show countdown to next wave
        const countdownMessage = document.createElement('div');
        countdownMessage.style.position = 'fixed';
        countdownMessage.style.top = '25%';
        countdownMessage.style.left = '50%';
        countdownMessage.style.transform = 'translate(-50%, -50%)';
        countdownMessage.style.color = 'white';
        countdownMessage.style.fontSize = '20px';
        countdownMessage.style.textAlign = 'center';
        countdownMessage.style.textShadow = '2px 2px 4px black';
        document.body.appendChild(countdownMessage);
        
        let timeLeft = this.waveCooldown / 1000;
        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdownMessage.textContent = `Next wave in ${timeLeft} seconds...`;
        }, 1000);
        
        setTimeout(() => {
            document.body.removeChild(waveCompleteMessage);
            document.body.removeChild(countdownMessage);
            clearInterval(countdownInterval);
            this.isWaveCooldown = false;
            
            // Show incoming wave warning
            const incomingWaveMessage = document.createElement('div');
            incomingWaveMessage.style.position = 'fixed';
            incomingWaveMessage.style.top = '20%';
            incomingWaveMessage.style.left = '50%';
            incomingWaveMessage.style.transform = 'translate(-50%, -50%)';
            incomingWaveMessage.style.color = 'red';
            incomingWaveMessage.style.fontSize = '28px';
            incomingWaveMessage.style.textAlign = 'center';
            incomingWaveMessage.style.textShadow = '2px 2px 4px black';
            incomingWaveMessage.style.fontWeight = 'bold';
            incomingWaveMessage.textContent = `Wave ${this.waveNumber + 1} Incoming!`;
            document.body.appendChild(incomingWaveMessage);
            
            setTimeout(() => {
                document.body.removeChild(incomingWaveMessage);
            }, 2000);
        }, this.waveCooldown);
    }
    
    victory() {
        this.gameActive = false;
        
        // Release pointer lock when game is won
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Play victory sound if available
        if (window.audioManager) {
            window.audioManager.playSound('victory');
        }
        
        const victoryScreen = document.createElement('div');
        victoryScreen.style.position = 'fixed';
        victoryScreen.style.top = '50%';
        victoryScreen.style.left = '50%';
        victoryScreen.style.transform = 'translate(-50%, -50%)';
        victoryScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        victoryScreen.style.color = 'gold';
        victoryScreen.style.padding = '30px';
        victoryScreen.style.borderRadius = '20px';
        victoryScreen.style.textAlign = 'center';
        victoryScreen.style.width = '500px';
        victoryScreen.style.boxShadow = '0 0 30px 5px rgba(255, 215, 0, 0.5)';
        victoryScreen.style.border = '3px solid gold';
        victoryScreen.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);">VICTORY!</h1>
            <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                <div style="height: 4px; width: 80%; background: linear-gradient(90deg, transparent, gold, transparent);"></div>
            </div>
            <p style="font-size: 26px; margin-bottom: 10px;">You have completed all ${this.totalWaves} waves!</p>
            <p style="font-size: 28px; margin-bottom: 30px; font-weight: bold;">Final Score: <span style="color: #00f0ff; text-shadow: 0 0 5px #00f0ff;">${this.score}</span></p>
            <div style="background: linear-gradient(135deg, #ff6b00, #ff3300); color: white; padding: 15px; margin: 20px 0; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 107, 0, 0.4);">
                <p style="font-size: 24px; margin: 0; font-weight: bold; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">COMING SOON</p>
                <p style="font-size: 20px; margin: 10px 0;">Next level being designed by Oliver!</p>
            </div>
            <button id="continue-to-feedback" style="padding: 18px 36px; font-size: 22px; background: linear-gradient(to bottom, #ffd700, #ffb800); color: #000; border: none; border-radius: 10px; cursor: pointer; margin-top: 20px; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.3); transition: all 0.2s ease;">
                Continue
            </button>
        `;
        document.body.appendChild(victoryScreen);
        
        // Add hover effect to button
        const button = victoryScreen.querySelector('button');
        button.addEventListener('mouseover', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 7px 20px rgba(0,0,0,0.4)';
        });
        button.addEventListener('mouseout', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        });
        
        // Show feedback form when continue button is clicked
        button.addEventListener('click', () => {
            document.body.removeChild(victoryScreen);
            
            // Call the feedback form function if it exists
            if (typeof createFeedbackForm === 'function') {
                createFeedbackForm();
            } else {
                console.error('createFeedbackForm function not found');
                location.reload();
            }
        });
        
        // Hide all targets and stop spawning
        this.targets.forEach(target => target.hide());
        this.stopSpawning();
    }
    
    getSafeSpawnPosition() {
        // Filter spawn positions that are far enough from the player
        const safePositions = this.spawnPositions.filter(pos => {
            const distance = pos.distanceTo(window.playerPosition);
            return distance >= this.minSpawnDistance;
        });
        
        if (safePositions.length === 0) return null;
        
        // Return a random safe position
        return safePositions[Math.floor(Math.random() * safePositions.length)];
    }
    
    updateTargets(playerPosition) {
        window.playerPosition = playerPosition.clone();
        
        for (const target of this.targets) {
            if (target.update(playerPosition)) {
                this.damagePlayer(10);
            }
        }
    }
    
    damagePlayer(damage) {
        this.playerHealth = Math.max(0, this.playerHealth - damage);
        this.healthElement.textContent = this.playerHealth;
        
        const flashOverlay = document.createElement('div');
        flashOverlay.style.position = 'fixed';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        flashOverlay.style.pointerEvents = 'none';
        document.body.appendChild(flashOverlay);
        
        setTimeout(() => {
            document.body.removeChild(flashOverlay);
        }, 100);
        
        // Health kit logic: spawn if health below 40 and no kit present
        if (this.playerHealth < 40 && window.player && !window.player.healthKit) {
            window.player.spawnHealthKit(this.scene);
        }
        
        if (this.playerHealth <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.gameActive = false;
        
        // Release pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Play game over sound if available
        if (window.audioManager) {
            window.audioManager.playSound('gameover');
        }
        
        const gameOverScreen = document.createElement('div');
        gameOverScreen.style.position = 'fixed';
        gameOverScreen.style.top = '50%';
        gameOverScreen.style.left = '50%';
        gameOverScreen.style.transform = 'translate(-50%, -50%)';
        gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        gameOverScreen.style.color = '#ff3333';
        gameOverScreen.style.padding = '30px';
        gameOverScreen.style.borderRadius = '20px';
        gameOverScreen.style.textAlign = 'center';
        gameOverScreen.style.width = '500px';
        gameOverScreen.style.boxShadow = '0 0 30px 5px rgba(255, 0, 0, 0.3)';
        gameOverScreen.style.border = '3px solid #ff3333';
        gameOverScreen.style.zIndex = '99999';
        
        gameOverScreen.innerHTML = `
            <h1 style="font-size: 48px; margin-bottom: 20px; text-shadow: 0 0 10px rgba(255, 0, 0, 0.7);">GAME OVER</h1>
            <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                <div style="height: 4px; width: 80%; background: linear-gradient(90deg, transparent, #ff3333, transparent);"></div>
            </div>
            <p style="font-size: 26px; margin-bottom: 20px;">You were defeated!</p>
            <p style="font-size: 28px; margin-bottom: 30px; font-weight: bold;">Final Score: <span style="color: #00f0ff; text-shadow: 0 0 5px #00f0ff;">${this.score}</span></p>
            <button id="continue-to-feedback" style="padding: 18px 36px; font-size: 22px; background: linear-gradient(to bottom, #ff5533, #cc3300); color: white; border: none; border-radius: 10px; cursor: pointer; margin-top: 20px; font-weight: bold; box-shadow: 0 5px 15px rgba(0,0,0,0.3); transition: all 0.2s ease;">
                Continue
            </button>
        `;
        document.body.appendChild(gameOverScreen);
        
        // Add hover effect to button
        const button = gameOverScreen.querySelector('button');
        button.addEventListener('mouseover', () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 7px 20px rgba(0,0,0,0.4)';
        });
        button.addEventListener('mouseout', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        });
        
        // Show feedback form when continue button is clicked
        button.addEventListener('click', () => {
            document.body.removeChild(gameOverScreen);
            
            // Call the feedback form function if it exists
            if (typeof createFeedbackForm === 'function') {
                createFeedbackForm();
            } else {
                console.error('createFeedbackForm function not found');
                location.reload();
            }
        });
        
        // Hide all targets and stop spawning
        this.targets.forEach(target => target.hide());
        this.stopSpawning();
    }
    
    stopSpawning() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
        }
    }
    
    checkShot(origin, direction) {
        if (!this.camera) {
            console.error("Camera not set for TargetManager");
            return false;
        }
        
        const raycaster = new THREE.Raycaster(origin, direction);
        raycaster.camera = this.camera;
        
        raycaster.params.Sprite = {
            threshold: 0.5,
            recursive: false
        };
        
        const rayHelper = new THREE.ArrowHelper(
            direction.clone().normalize(),
            origin,
            10,
            0xff0000,
            0.1,
            0.1
        );
        this.scene.add(rayHelper);
        setTimeout(() => this.scene.remove(rayHelper), 100);
        
        for (const target of this.targets) {
            if (target.active && target.sprite) {
                target.sprite.updateMatrix();
                target.sprite.updateMatrixWorld(true);
                
                const intersects = raycaster.intersectObject(target.sprite);
                
                if (intersects.length > 0) {
                    if (target.hit()) {
                        this.score += 100;
                        this.scoreElement.textContent = this.score;
                        this.monstersKilledInWave++; // Increment killed monsters counter
                        this.updateMonstersRemaining(); // Update display after killing a monster
                    }
                    return true;
                }
            }
        }
        return false;
    }
    
    // Add method to update monsters remaining display
    updateMonstersRemaining() {
        const remaining = this.waveSize - this.monstersKilledInWave;
        this.monstersRemainingElement.textContent = `Monsters: ${remaining}/${this.waveSize}`;
    }
}

class Monster {
    constructor(scene, camera, spriteFile = 'assets/monster_sprite.png') {
        this.scene = scene;
        this.camera = camera;
        this.sprite = null;
        this.spriteFile = spriteFile;
        this.init();
    }

    init() {
        // Remove any existing mesh or group
        if (this.sprite) {
            this.scene.remove(this.sprite);
        }

        // Load the monster image as a texture
        const loader = new THREE.TextureLoader();
        loader.load(this.spriteFile, (texture) => {
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: 0xffffff,
                transparent: true
            });
            this.sprite = new THREE.Sprite(material);
            this.sprite.scale.set(2.5, 2.5, 1); // Adjust scale as needed
            this.sprite.position.set(0, 1.25, 0); // Adjust position as needed
            this.scene.add(this.sprite);
        });
    }

    update() {
        // Optionally, add breathing or idle animation here
        // Example: gentle up/down bobbing
        if (this.sprite) {
            const t = performance.now() * 0.001;
            this.sprite.position.y = 1.25 + Math.sin(t * 1.5) * 0.08;
        }
    }
}