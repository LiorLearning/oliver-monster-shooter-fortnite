class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.bgm = null;
        this.bgmGain = null;
        this.isBGMPlaying = false;
        
        // Load all sound effects
        this.loadSound('shotgun', 'assets/shotgun.mp3');
        this.loadSound('reload', 'assets/reload.mp3');
        this.loadSound('health', 'assets/health.mp3');
        this.loadSound('answer', 'assets/answer.mp3');
        this.loadSound('bgm', 'assets/bgm.mp3');
    }

    loadSound(name, url) {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.sounds[name] = audioBuffer;
                if (name === 'bgm') {
                    this.setupBGM();
                }
            })
            .catch(error => console.error('Error loading sound:', error));
    }

    setupBGM() {
        this.bgmGain = this.audioContext.createGain();
        this.bgmGain.gain.value = 0.3; // Set background music volume
        this.bgmGain.connect(this.audioContext.destination);
    }

    playSound(name) {
        if (!this.sounds[name]) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name];
        
        if (name === 'bgm') {
            if (this.isBGMPlaying) return;
            source.loop = true;
            source.connect(this.bgmGain);
            this.isBGMPlaying = true;
        } else {
            // Create gain node for sound effects and set volume to 30%
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.1;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
        }
        
        source.start(0);
    }

    stopBGM() {
        if (this.bgm) {
            this.bgm.stop();
            this.isBGMPlaying = false;
        }
    }

    // Resume audio context if it was suspended (required for browser autoplay policies)
    resumeAudioContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
} 