// Main game initialization and loop

// Initialize global variables
let scene, camera, renderer;
let environment, player, targetManager;
let isPaused = false;
let audioManager;

// Initialize the game
function init() {
    // Initialize Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0xcce6ff, 5, 30); // Soft blue fog with reduced density

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6; // Player height (eye level)

    // Create renderer with enhanced settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Add lighting
    setupLights();
    
    // Create environment
    environment = new Environment(scene);
    
    // Initialize audio manager and expose it globally
    audioManager = new AudioManager();
    window.audioManager = audioManager;
    
    // Create player controller
    player = new Player(camera, environment.colliders);
    // Initialize target manager for monsters
    targetManager = new TargetManager(scene, camera);
    // Link player and targetManager for health kit logic
    player.targetManager = targetManager;
    window.player = player;
    targetManager.startSpawning();
    
    // Set up ambient sounds
    setupAmbientSounds();
    
    // Add window resize handler
    window.addEventListener('resize', onWindowResize);
    
    // Add shooting event listener
    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'e') {
            if (player.currentAmmo > 0) {
                player.shoot(scene, targetManager);
                // Play shotgun sound
                audioManager.playSound('shotgun');
                // Trigger shotgun recoil
                const shotgun = document.getElementById('shotgun');
                if (shotgun) {
                    shotgun.classList.remove('recoil'); // Reset if already animating
                    // Force reflow to restart animation
                    void shotgun.offsetWidth;
                    shotgun.classList.add('recoil');
                    // Remove class after animation
                    setTimeout(() => shotgun.classList.remove('recoil'), 180);
                }
            } else {
                // Play empty gun sound
                audioManager.playSound('empty');
            }
        }
    });
    
    // Add pause button event listener
    document.getElementById('pause-button').addEventListener('click', togglePause);
    
    // Add keyboard pause shortcut (Escape key)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            togglePause();
        }
    });
    
    // Start animation loop
    animate();
}

// Set up lights in the scene
function setupLights() {
    // Add soft blue ambient light
    const ambientLight = new THREE.AmbientLight(0xa3d0ff, 0.7);
    scene.add(ambientLight);

    // Add moonlight directional light
    const moonLight = new THREE.DirectionalLight(0xffffff, 1.0);
    moonLight.position.set(5, 10, 7);
    moonLight.castShadow = true;
    
    // Configure shadow properties for better quality
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 50;
    moonLight.shadow.camera.left = -20;
    moonLight.shadow.camera.right = 20;
    moonLight.shadow.camera.top = 20;
    moonLight.shadow.camera.bottom = -20;
    moonLight.shadow.bias = -0.0001;
    
    scene.add(moonLight);

    // Add colorful point lights for Fortnite-style color pops
    const pointLights = [
        { color: 0xff66cc, position: new THREE.Vector3(-5, 3, -5), intensity: 1.2, distance: 15 }, // Pink
        { color: 0x66ffe0, position: new THREE.Vector3(5, 2, 5), intensity: 1.0, distance: 12 },   // Teal
        { color: 0xaa66ff, position: new THREE.Vector3(0, 4, 0), intensity: 0.8, distance: 10 }    // Purple
    ];

    pointLights.forEach(lightConfig => {
        const pointLight = new THREE.PointLight(
            lightConfig.color,
            lightConfig.intensity,
            lightConfig.distance
        );
        pointLight.position.copy(lightConfig.position);
        pointLight.castShadow = true;
        
        // Configure point light shadows
        pointLight.shadow.mapSize.width = 512;
        pointLight.shadow.mapSize.height = 512;
        pointLight.shadow.camera.near = 0.5;
        pointLight.shadow.camera.far = lightConfig.distance;
        
        scene.add(pointLight);
        
        // Add light helper for debugging (optional)
        // const helper = new THREE.PointLightHelper(pointLight, 1);
        // scene.add(helper);
    });
}

// Handle window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (isPaused) {
        return; // Skip updates when paused
    }
    
    // Update player position
    player.update(environment.houseSize);
    
    // Update projectiles
    player.updateProjectiles();
    
    // Update environment effects
    environment.updateDust();
    
    // Update monsters
    targetManager.updateTargets(camera.position);
    
    // Render the scene
    renderer.render(scene, camera);
}

function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pause-button');
    const pauseIcon = pauseButton.querySelector('.ui-icon');
    const pauseLabel = pauseButton.querySelector('.ui-label');
    
    if (isPaused) {
        pauseIcon.textContent = '▶️';
        pauseLabel.textContent = 'Resume';
        // Release pointer lock when paused
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        audioManager.stopBGM();
    } else {
        pauseIcon.textContent = '⏸️';
        pauseLabel.textContent = 'Pause';
        // Request pointer lock when resuming
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.requestPointerLock();
        }
        audioManager.playSound('bgm');
    }
}

// --- INTRO SCREEN LOGIC ---
window.addEventListener('load', () => {
    // Render the intro screen
    const intro = document.getElementById('intro-screen');
    intro.innerHTML = `
      <div class="intro-content">
        <div class="intro-title">MONSTER<br>HUNTER</div>
        <div class="intro-level">Level 1</div>
        <div class="intro-username-container">
          <label for="player-username" class="intro-username-label">Enter your username:</label>
          <input type="text" id="player-username" class="intro-username-input" placeholder="Your username" required>
        </div>
        <button class="intro-play-btn" id="intro-play-btn">PLAY</button>
        <div class="intro-creator">Created by OLIVER</div>
      </div>
      <div class="intro-instructions-box">
        <div class="intro-instructions-title">Game Instructions</div>
        <ul class="intro-instructions-list">
          <li>Move: <b>W / A / S / D</b></li>
          <li>Look Around: <b>Move Mouse</b></li>
          <li>Shoot: <b>Press E</b></li>
          <li>Collect Ammo: <b>Walk over Ammo Box → Answer Quiz</b></li>
          <li>Defeat Monsters to survive</li>
          <li>Watch your Health and Score</li>
        </ul>
      </div>
    `;
    intro.style.display = 'flex';
    // Hide all game UI and elements until play
    document.querySelector('.game-ui').style.display = 'none';
    document.getElementById('shotgun').style.display = 'none';
    document.getElementById('crosshair').style.display = 'none';
    // Hide quiz panel if visible
    document.getElementById('quiz-panel-root').style.display = 'none';

    // Only start the game after Play is clicked
    document.getElementById('intro-play-btn').onclick = () => {
        // Get the username from the input field
        const usernameInput = document.getElementById('player-username');
        const username = usernameInput.value.trim();
        
        // Validate username
        if (!username) {
            // Highlight the input with red border if empty
            usernameInput.style.border = '2px solid red';
            usernameInput.placeholder = 'Username is required';
            return;
        }
        
        // Store username in global variable for later use
        window.playerUsername = username;
        
        // Save user to Supabase
        if (window.GameData && window.GameData.saveUser) {
            window.GameData.saveUser(username)
                .then(result => {
                    console.log('User saved to Supabase:', result);
                })
                .catch(error => {
                    console.error('Error saving user to Supabase:', error);
                });
        }
        
        // Continue with game initialization
        intro.style.opacity = '0';
        setTimeout(() => {
            intro.style.display = 'none';
            // Show game UI
            document.querySelector('.game-ui').style.display = '';
            document.getElementById('shotgun').style.display = '';
            document.getElementById('crosshair').style.display = '';
            // Start the game
            init();
            // Start background music after user interaction
            document.addEventListener('click', () => {
                if (window.audioManager) {
                    window.audioManager.resumeAudioContext();
                    window.audioManager.playSound('bgm');
                }
            }, { once: true });
        }, 400);
    };
});

// --- QuizPanel Fortnite-Style Overlay ---
// Remove static QUIZ_QUESTIONS, and generate random questions each time

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUniqueMathQuestions(count) {
  const questions = [];
  const used = new Set();
  
  while (questions.length < count) {
    // 70% chance of addition, 30% chance of subtraction
    const isAddition = Math.random() < 0.7;
    
    if (isAddition) {
      // For addition, use numbers that sum up to 20 or less
      const a = getRandomInt(1, 10);
      const b = getRandomInt(1, 20 - a); // Ensure sum doesn't exceed 20
      const key = a < b ? `${a}+${b}` : `${b}+${a}`;
      if (used.has(key)) continue;
      used.add(key);
      const correct = a + b;
      
      // Generate 3 unique wrong answers
      const wrongs = new Set();
      while (wrongs.size < 3) {
        let wrong = correct + getRandomInt(-3, 3);
        if (wrong === correct || wrong <= 0 || wrong > 20) continue;
        wrongs.add(wrong);
      }
      
      const allAnswers = Array.from(wrongs);
      const correctIdx = getRandomInt(0, 3);
      allAnswers.splice(correctIdx, 0, correct);
      
      questions.push({
        q: `${a} + ${b} = ?`,
        answers: allAnswers,
        correct: correctIdx
      });
    } else {
      // For subtraction, ensure result is positive and within 20
      const a = getRandomInt(1, 20);
      const b = getRandomInt(1, a); // Ensure result is positive
      const key = `${a}-${b}`;
      if (used.has(key)) continue;
      used.add(key);
      const correct = a - b;
      
      // Generate 3 unique wrong answers
      const wrongs = new Set();
      while (wrongs.size < 3) {
        let wrong = correct + getRandomInt(-3, 3);
        if (wrong === correct || wrong < 0 || wrong > 20) continue;
        wrongs.add(wrong);
      }
      
      const allAnswers = Array.from(wrongs);
      const correctIdx = getRandomInt(0, 3);
      allAnswers.splice(correctIdx, 0, correct);
      
      questions.push({
        q: `${a} - ${b} = ?`,
        answers: allAnswers,
        correct: correctIdx
      });
    }
  }
  return questions;
}

let quizPanelActive = false;
let lastAnimationFrame = null;

function freezeGameLoop() {
  quizPanelActive = true;
}
function unfreezeGameLoop() {
  quizPanelActive = false;
}

// Patch the animate loop to freeze when quiz is active
const originalAnimate = animate;
function animatePatched() {
  if (!quizPanelActive) {
    originalAnimate();
  } else {
    // Just keep calling animatePatched to check for unfreeze
    requestAnimationFrame(animatePatched);
  }
}
window.animate = animatePatched;

// QuizPanel rendering logic
window.showQuizPanel = function(callback) {
  // Release pointer lock so the cursor is visible for the quiz
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  freezeGameLoop();
  const root = document.getElementById('quiz-panel-root');
  root.style.display = 'flex';
  root.innerHTML = '';

  // Generate 3 unique random questions for this session
  const QUIZ_QUESTIONS = generateUniqueMathQuestions(3);

  // Style root
  root.style.position = 'fixed';
  root.style.top = '0';
  root.style.left = '0';
  root.style.width = '100vw';
  root.style.height = '100vh';
  root.style.background = 'rgba(10,20,40,0.85)';
  root.style.zIndex = '9999';
  root.style.alignItems = 'center';
  root.style.justifyContent = 'center';

  // Panel container
  const panel = document.createElement('div');
  panel.style.background = '#0a0e1a';
  panel.style.border = '4px solid #00f0ff';
  panel.style.boxShadow = '0 0 32px 8px #00f0ff88, 0 0 0 8px #0a0e1a';
  panel.style.borderRadius = '24px';
  panel.style.padding = '36px 48px';
  panel.style.minWidth = '420px';
  panel.style.textAlign = 'center';
  panel.style.position = 'relative';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.alignItems = 'center';

  // Title
  const title = document.createElement('div');
  title.textContent = 'QUIZ PANEL';
  title.style.fontFamily = 'Impact, Arial Black, sans-serif';
  title.style.fontSize = '2.5rem';
  title.style.color = '#fff';
  title.style.letterSpacing = '2px';
  title.style.marginBottom = '24px';
  title.style.textShadow = '0 2px 8px #00f0ff';
  panel.appendChild(title);

  // State
  let step = 0;
  let selected = [];
  let bullets = 0;

  function renderQuestion() {
    panel.innerHTML = '';
    panel.appendChild(title);
    const q = QUIZ_QUESTIONS[step];
    const question = document.createElement('div');
    question.textContent = q.q;
    question.style.fontSize = '2rem';
    question.style.color = '#fff';
    question.style.fontWeight = 'bold';
    question.style.marginBottom = '32px';
    panel.appendChild(question);

    const answers = document.createElement('div');
    answers.style.display = 'flex';
    answers.style.flexWrap = 'wrap';
    answers.style.gap = '20px';
    answers.style.justifyContent = 'center';
    q.answers.forEach((ans, idx) => {
        const btn = document.createElement('button');
        btn.textContent = ans;
        btn.style.flex = '1 1 40%';
        btn.style.minWidth = '120px';
        btn.style.background = '#0af';
        btn.style.color = '#fff';
        btn.style.fontSize = '1.5rem';
        btn.style.fontFamily = 'Impact, Arial Black, sans-serif';
        btn.style.border = 'none';
        btn.style.borderRadius = '18px';
        btn.style.padding = '18px 0';
        btn.style.margin = '0 8px';
        btn.style.boxShadow = '0 0 12px #00f0ff88';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'background 0.2s, transform 0.1s';
        
        // Track attempts for this question
        if (!q.attempts) q.attempts = 0;
        
        if (q.attempts >= 2) {
            btn.disabled = true;
            btn.style.background = '#222e3c';
            btn.style.color = '#aaa';
            btn.style.cursor = 'not-allowed';
            btn.style.transform = 'scale(0.98)';
        }
        
        btn.onclick = () => {
            if (q.attempts >= 2) return;
            
            q.attempts++;
            const isCorrect = QUIZ_QUESTIONS[step].correct === idx;
            
            if (isCorrect) {
                // Play answer sound if correct
                if (window.audioManager) {
                    window.audioManager.playSound('answer');
                }
                selected[step] = idx;
                btn.style.background = '#222e3c';
                btn.style.color = '#aaa';
                btn.style.cursor = 'not-allowed';
                btn.style.transform = 'scale(0.98)';
                
                setTimeout(() => {
                    if (step < QUIZ_QUESTIONS.length - 1) {
                        step++;
                        renderQuestion();
                    } else {
                        renderCalculation();
                    }
                }, 350);
            } else {
                // Wrong answer
                btn.style.background = '#ff4444';
                btn.style.boxShadow = '0 0 12px #ff444488';
                
                if (q.attempts >= 2) {
                    // On second wrong attempt, lock the answer and move on
                    selected[step] = idx;
                    setTimeout(() => {
                        if (step < QUIZ_QUESTIONS.length - 1) {
                            step++;
                            renderQuestion();
                        } else {
                            renderCalculation();
                        }
                    }, 350);
                }
            }
        };
        answers.appendChild(btn);
    });
    panel.appendChild(answers);
  }

  function renderCalculation() {
    panel.innerHTML = '';
    panel.appendChild(title);
    const calc = document.createElement('div');
    calc.textContent = '+0 BULLETS';
    calc.style.fontSize = '2.2rem';
    calc.style.color = '#ffe14b';
    calc.style.fontFamily = 'Impact, Arial Black, sans-serif';
    calc.style.textShadow = '0 2px 8px #ffe14b88';
    calc.style.marginBottom = '24px';
    panel.appendChild(calc);

    // Calculate bullets
    const earned = QUIZ_QUESTIONS.reduce(
      (sum, q, i) => sum + (q.correct === selected[i] ? 4 : 0),
      0
    );
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      calc.textContent = `+${Math.min(count * 4, earned)} BULLETS`;
      if (count * 4 >= earned) {
        clearInterval(interval);
        setTimeout(() => renderResult(earned, callback), 600);
      }
    }, 120);
  }

  function renderResult(earned, callback) {
    panel.innerHTML = '';
    panel.appendChild(title);
    const result = document.createElement('div');
    result.textContent = `+${earned} BULLETS`;
    result.style.fontSize = '2.2rem';
    result.style.color = '#ffe14b';
    result.style.fontFamily = 'Impact, Arial Black, sans-serif';
    result.style.textShadow = '0 2px 8px #ffe14b88';
    result.style.marginBottom = '24px';
    panel.appendChild(result);
    const btn = document.createElement('button');
    btn.textContent = 'Continue';
    btn.style.background = '#00f0ff';
    btn.style.color = '#fff';
    btn.style.fontSize = '1.2rem';
    btn.style.fontFamily = 'Impact, Arial Black, sans-serif';
    btn.style.border = 'none';
    btn.style.borderRadius = '12px';
    btn.style.padding = '12px 32px';
    btn.style.marginTop = '12px';
    btn.onclick = () => {
        // Play reload sound when continuing
        if (window.audioManager) {
            window.audioManager.playSound('reload');
        }
        // Hide the quiz panel
        const root = document.getElementById('quiz-panel-root');
        root.style.display = 'none';
        
        // Unfreeze the game loop
        unfreezeGameLoop();
        
        // Resume animation loop
        animate();
        
        // Re-request pointer lock for camera movement
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.requestPointerLock();
        }
        
        // Call the callback with earned bullets
        if (callback) {
            callback(earned);
        }
    };
    panel.appendChild(btn);
  }

  renderQuestion();
  root.appendChild(panel);
};

// Create feedback form after game completion
function createFeedbackForm() {
    const feedbackFormDiv = document.createElement('div');
    feedbackFormDiv.id = 'feedback-form';
    feedbackFormDiv.style.position = 'fixed';
    feedbackFormDiv.style.top = '50%';
    feedbackFormDiv.style.left = '50%';
    feedbackFormDiv.style.transform = 'translate(-50%, -50%)';
    feedbackFormDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    feedbackFormDiv.style.color = 'white';
    feedbackFormDiv.style.padding = '30px';
    feedbackFormDiv.style.borderRadius = '15px';
    feedbackFormDiv.style.textAlign = 'left';
    feedbackFormDiv.style.width = '500px';
    feedbackFormDiv.style.maxWidth = '90vw';
    feedbackFormDiv.style.maxHeight = '90vh';
    feedbackFormDiv.style.overflowY = 'auto';
    feedbackFormDiv.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.7)';
    feedbackFormDiv.style.border = '2px solid #00f0ff';
    feedbackFormDiv.style.zIndex = '100000';
    
    feedbackFormDiv.innerHTML = `
        <h2 style="text-align: center; color: #00f0ff; margin-bottom: 20px; font-size: 28px;">
            Game Feedback
        </h2>
        <form id="game-feedback-form">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 16px;">What did you think of the hero?</label>
                <textarea name="hero" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid #00f0ff; border-radius: 5px; color: white; min-height: 60px; font-size: 14px;"></textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 16px;">What did you think of the villain?</label>
                <textarea name="villain" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid #00f0ff; border-radius: 5px; color: white; min-height: 60px; font-size: 14px;"></textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 16px;">How was the gameplay?</label>
                <textarea name="gameplay" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid #00f0ff; border-radius: 5px; color: white; min-height: 60px; font-size: 14px;"></textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 16px;">What did you think of the setting?</label>
                <textarea name="setting" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid #00f0ff; border-radius: 5px; color: white; min-height: 60px; font-size: 14px;"></textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 16px;">What math topic would you like to see?</label>
                <textarea name="mathTopic" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid #00f0ff; border-radius: 5px; color: white; min-height: 60px; font-size: 14px;"></textarea>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-size: 16px;">Your Contact Info (optional):</label>
                <textarea name="contactInfo" style="width: 100%; padding: 10px; background: rgba(255, 255, 255, 0.1); border: 1px solid #00f0ff; border-radius: 5px; color: white; min-height: 60px; font-size: 14px;"></textarea>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button type="submit" style="background: linear-gradient(to bottom, #00f0ff, #0066cc); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 18px; cursor: pointer; font-weight: bold; transition: all 0.2s;">
                    Submit Feedback
                </button>
            </div>
        </form>
    `;
    
    document.body.appendChild(feedbackFormDiv);
    
    // Handle form submission
    document.getElementById('game-feedback-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            hero: this.elements.hero.value || "Idk",
            villain: this.elements.villain.value || "Idk",
            gameplay: this.elements.gameplay.value || "Idk",
            setting: this.elements.setting.value || "Idk",
            mathTopic: this.elements.mathTopic.value || "Idk",
            contactInfo: this.elements.contactInfo.value || "Idk",
            user: window.playerUsername || "Unknown"
        };
        
        // Submit to Supabase
        if (window.GameData && window.GameData.saveFormSubmission) {
            window.GameData.saveFormSubmission(formData)
                .then(result => {
                    console.log('Feedback saved to Supabase:', result);
                    feedbackFormDiv.innerHTML = `
                        <h2 style="text-align: center; color: #00f0ff; margin-bottom: 20px;">Thank You!</h2>
                        <p style="text-align: center; font-size: 18px; margin-bottom: 20px;">Your feedback has been submitted successfully.</p>
                        <div style="text-align: center;">
                            <button onclick="location.reload()" style="background: linear-gradient(to bottom, #ffe14b, #ffb800); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 18px; cursor: pointer; font-weight: bold;">
                                Play Again
                            </button>
                        </div>
                    `;
                })
                .catch(error => {
                    console.error('Error saving feedback to Supabase:', error);
                    feedbackFormDiv.innerHTML = `
                        <h2 style="text-align: center; color: red; margin-bottom: 20px;">Error</h2>
                        <p style="text-align: center; font-size: 18px; margin-bottom: 20px;">There was an error submitting your feedback. Please try again.</p>
                        <div style="text-align: center;">
                            <button onclick="location.reload()" style="background: linear-gradient(to bottom, #ffe14b, #ffb800); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 18px; cursor: pointer; font-weight: bold;">
                                Play Again
                            </button>
                        </div>
                    `;
                });
        }
    });
    
    // Add hover effects to buttons
    const buttons = feedbackFormDiv.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('mouseover', () => {
            btn.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseout', () => {
            btn.style.transform = 'scale(1)';
        });
    });
    
    return feedbackFormDiv;
}