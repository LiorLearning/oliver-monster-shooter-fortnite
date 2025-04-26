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

function generateUniqueMultiplicationQuestions(count) {
  const questions = [];
  const used = new Set();
  while (questions.length < count) {
    const a = getRandomInt(6, 20); // Reasonable range for fun
    const b = getRandomInt(2, 12);
    const key = a < b ? `${a}x${b}` : `${b}x${a}`;
    if (used.has(key)) continue;
    used.add(key);
    const correct = a * b;
    // Generate 3 unique wrong answers
    const wrongs = new Set();
    while (wrongs.size < 3) {
      let wrong = correct + getRandomInt(-20, 20);
      if (wrong === correct || wrong <= 0) continue;
      wrongs.add(wrong);
    }
    const allAnswers = Array.from(wrongs);
    const correctIdx = getRandomInt(0, 3);
    allAnswers.splice(correctIdx, 0, correct);
    questions.push({
      q: `${a} × ${b} = ?`,
      answers: allAnswers,
      correct: correctIdx
    });
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
  const QUIZ_QUESTIONS = generateUniqueMultiplicationQuestions(3);

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
        if (selected[step] !== undefined) {
            btn.disabled = true;
            btn.style.background = '#222e3c';
            btn.style.color = '#aaa';
            btn.style.cursor = 'not-allowed';
            btn.style.transform = 'scale(0.98)';
        }
        btn.onclick = () => {
            if (selected[step] !== undefined) return;
            selected[step] = idx;
            btn.style.background = '#222e3c';
            btn.style.color = '#aaa';
            btn.style.cursor = 'not-allowed';
            btn.style.transform = 'scale(0.98)';
            
            // Play answer sound if correct
            if (QUIZ_QUESTIONS[step].correct === idx && window.audioManager) {
                window.audioManager.playSound('answer');
            }
            
            setTimeout(() => {
                if (step < QUIZ_QUESTIONS.length - 1) {
                    step++;
                    renderQuestion();
                } else {
                    renderCalculation();
                }
            }, 350);
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