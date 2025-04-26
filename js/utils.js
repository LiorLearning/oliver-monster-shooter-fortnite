// Utility functions for the abandoned house game

// Create wood texture
function createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base color
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 256, 256);
    
    // Wood grain
    for (let i = 0; i < 30; i++) {
        ctx.strokeStyle = `rgba(80, 40, 20, ${Math.random() * 0.2 + 0.1})`;
        ctx.lineWidth = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * 256);
        
        let lastX = 0;
        let lastY = Math.random() * 256;
        
        for (let x = 20; x < 256; x += 20) {
            const y = lastY + (Math.random() * 30 - 15);
            ctx.quadraticCurveTo(
                lastX + 10, lastY, 
                x, y
            );
            lastX = x;
            lastY = y;
        }
        
        ctx.stroke();
    }
    
    // Knots
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = Math.random() * 10 + 5;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(60, 30, 15, 0.8)');
        gradient.addColorStop(1, 'rgba(100, 50, 25, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
}

// Create wall texture
function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base color
    ctx.fillStyle = '#CCCCCC';
    ctx.fillRect(0, 0, 256, 256);
    
    // Cracks and stains
    for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(100, 100, 100, ${Math.random() * 0.3 + 0.1})`;
        ctx.lineWidth = Math.random() * 2 + 0.5;
        
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const length = Math.random() * 30 + 10;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.cos(angle) * length,
            y + Math.sin(angle) * length
        );
        ctx.stroke();
    }
    
    // Water damage and mold
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = Math.random() * 20 + 10;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(100, 120, 120, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
}

// Create shooting effect
function createShootingEffect(scene, origin, direction) {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.8
    });
    
    const points = [
        origin,
        origin.clone().add(direction.multiplyScalar(50))
    ];
    
    geometry.setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    
    setTimeout(() => {
        scene.remove(line);
        geometry.dispose();
        material.dispose();
    }, 50);
}

// Setup ambient sounds
function setupAmbientSounds() {
    // Create an audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create random creaking sounds
    function playCreak() {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(50 + Math.random() * 30, audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(20 + Math.random() * 10, audioContext.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.4);
        
        // Schedule next creak
        setTimeout(() => {
            if (Math.random() > 0.7) playCreak();
        }, 10000 + Math.random() * 20000);
    }
    
    // Create random wind howling sound
    function playWind() {
        const noise = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        // Create noise buffer
        const bufferSize = audioContext.sampleRate * 2; // 2 second buffer
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Fill buffer with noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = buffer;
        noise.loop = true;
        
        // Filter to create wind-like sound
        filter.type = 'bandpass';
        filter.frequency.value = 300 + Math.random() * 300;
        filter.Q.value = 0.5;
        
        // Set gain (volume)
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, audioContext.currentTime + 3);
        gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 8);
        gainNode.gain.linearRampToValueAtTime(0.04, audioContext.currentTime + 10);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 15);
        
        // Connect nodes
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        noise.start();
        
        // Stop after 15 seconds
        setTimeout(() => {
            noise.stop();
            // Schedule next wind sound
            setTimeout(() => {
                if (Math.random() > 0.3) playWind();
            }, 10000 + Math.random() * 30000);
        }, 15000);
    }
    
    // Event listener for user interaction (required for AudioContext)
    document.addEventListener('click', function initAudio() {
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Start ambient sounds with random delays
        setTimeout(playCreak, 5000 + Math.random() * 10000);
        setTimeout(playWind, 3000 + Math.random() * 5000);
        
        // Remove this listener after first click
        document.removeEventListener('click', initAudio);
    });
}