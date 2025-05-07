class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.bgm = null;
        this.bgmGain = null;
        this.isBGMPlaying = false;
        this.totalSounds = 6; // Total number of sounds to load
        this.loadedSounds = 0;
        this.onLoadProgress = null;
        this.onLoadComplete = null;
        
        // Load all sound effects
        this.loadSound('shotgun', 'assets/shotgun.mp3');
        this.loadSound('reload', 'assets/reload.mp3');
        this.loadSound('health', 'assets/health.mp3');
        this.loadSound('answer', 'assets/answer.mp3');
        this.loadSound('bgm', 'assets/bgm.mp3');
        this.loadSound('slice', 'assets/slice.mp3');
    }

    loadSound(name, url) {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.sounds[name] = audioBuffer;
                this.loadedSounds++;
                
                // Update loading progress
                if (this.onLoadProgress) {
                    const progress = (this.loadedSounds / this.totalSounds) * 100;
                    this.onLoadProgress(progress, `Loading ${name}...`);
                }

                if (name === 'bgm') {
                    this.setupBGM();
                }

                // Check if all sounds are loaded
                if (this.loadedSounds === this.totalSounds && this.onLoadComplete) {
                    this.onLoadComplete();
                }
            })
            .catch(error => {
                console.error('Error loading sound:', error);
                // Still increment loaded sounds to prevent hanging
                this.loadedSounds++;
                if (this.onLoadProgress) {
                    const progress = (this.loadedSounds / this.totalSounds) * 100;
                    this.onLoadProgress(progress, `Error loading ${name}, continuing...`);
                }
                if (this.loadedSounds === this.totalSounds && this.onLoadComplete) {
                    this.onLoadComplete();
                }
            });
    }

    setupBGM() {
        this.bgmGain = this.audioContext.createGain();
        this.bgmGain.gain.value = 0.3; // Set background music volume
        this.bgmGain.connect(this.audioContext.destination);
    }

    playSound(name) {
        if (!this.sounds[name]) {
            console.warn(`Sound ${name} not loaded yet`);
            return;
        }

        // Always resume audio context before playing
        this.resumeAudioContext();

        if (name === 'bgm') {
            if (this.isBGMPlaying) return;
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];
            source.loop = true;
            source.connect(this.bgmGain);
            this.isBGMPlaying = true;
            this.bgm = source;
            source.start(0);
        } else {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[name];
            // Create gain node for sound effects and set volume to 30%
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0.1;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            source.start(0);
        }
    }

    stopBGM() {
        if (this.bgm) {
            this.bgm.stop();
            this.bgm = null;
            this.isBGMPlaying = false;
        }
    }

    // Resume audio context if it was suspended (required for browser autoplay policies)
    resumeAudioContext() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Set callback for loading progress
    setLoadProgressCallback(callback) {
        this.onLoadProgress = callback;
    }

    // Set callback for loading completion
    setLoadCompleteCallback(callback) {
        this.onLoadComplete = callback;
    }
} 