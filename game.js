(function() {
    'use strict';
    
    // DOM Elements
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const homeScreen = document.getElementById('homeScreen');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const gameOverScreen = document.getElementById('gameOver');
    const loadingScreen = document.getElementById('loadingScreen');
    const playBtn = document.getElementById('playBtn');
    const restartBtn = document.getElementById('restartBtn');
    const homeBtn = document.getElementById('homeBtn');
    const finalScoreEl = document.getElementById('finalScore');
    const highScoreEl = document.getElementById('highScore');
    const previewBird = document.getElementById('previewBird');
    
    // Game State
    let gameState = 'loading';
    let score = 0;
    let highScore = localStorage.getItem('flappyFaceHighScore') || 0;
    let frames = 0;
    let gameSpeed = 4;
    let shakeDuration = 0;
    
    // Bird
    let bird = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        velocity: 0,
        gravity: 0.38,
        jump: -6.5,
        rotation: 0,
        scale: 1
    };
    
    // Bird image
    let birdImage = null;
    let imageLoaded = false;
    
    // Pipes
    let pipes = [];
    let pipeTimer = 0;
    let pipeWidth = 80;
    let pipeGap = 200;
    
    // Environment
    let clouds = [];
    let hills = [];
    let groundOffset = 0;
    let particles = [];
    let scorePopup = null;
    let stars = [];
    
    // Initialize
    function init() {
        // Fix: explicitly hide game over on load
        gameOverScreen.style.display = 'none';
        gameOverScreen.classList.remove('visible');

        resize();
        loadBirdImage("Bird.png");
        initBackground();
        setupEventListeners();
        
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            gameState = 'home';
        }, 2000);
        
        requestAnimationFrame(gameLoop);
    }
    
    function loadBirdImage(imagePath) {
        birdImage = new Image();
        birdImage.onload = function() {
            imageLoaded = true;
            if (previewBird) {
                previewBird.src = imagePath;
            }
        };
        birdImage.onerror = function() {
            imageLoaded = false;
            createFallbackBird();
        };
        birdImage.src = imagePath;
    }
    
    function createFallbackBird() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 200;
        tempCanvas.height = 200;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.fillStyle = '#FFD93D';
        tempCtx.beginPath();
        tempCtx.ellipse(100, 100, 75, 60, 0, 0, Math.PI * 2);
        tempCtx.fill();
        
        tempCtx.fillStyle = '#F4C430';
        tempCtx.beginPath();
        tempCtx.ellipse(70, 110, 30, 20, -0.3, 0, Math.PI * 2);
        tempCtx.fill();
        
        tempCtx.fillStyle = '#fff';
        tempCtx.beginPath();
        tempCtx.arc(130, 85, 22, 0, Math.PI * 2);
        tempCtx.fill();
        
        tempCtx.fillStyle = '#000';
        tempCtx.beginPath();
        tempCtx.arc(138, 85, 10, 0, Math.PI * 2);
        tempCtx.fill();
        
        tempCtx.fillStyle = '#fff';
        tempCtx.beginPath();
        tempCtx.arc(142, 82, 4, 0, Math.PI * 2);
        tempCtx.fill();
        
        tempCtx.fillStyle = '#FF6B6B';
        tempCtx.beginPath();
        tempCtx.moveTo(150, 90);
        tempCtx.lineTo(185, 100);
        tempCtx.lineTo(150, 110);
        tempCtx.closePath();
        tempCtx.fill();
        
        birdImage = tempCanvas;
        imageLoaded = true;
        if (previewBird) {
            previewBird.src = tempCanvas.toDataURL();
        }
    }
    
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Use logical pixels for all game calculations
        canvas.logicalWidth = w;
        canvas.logicalHeight = h;

        bird.width = Math.min(w * 0.22, 120);
        bird.height = bird.width;

        // Fixed feel across all screen sizes
        bird.jump = -6.5;
        bird.gravity = 0.38;
        
        pipeWidth = Math.min(w * 0.12, 80);
        pipeGap = Math.max(h * 0.32, 190);
        
        if (gameState === 'home') {
            bird.x = w / 2 - bird.width / 2;
            bird.y = h * 0.35;
        }
    }
    
    function initBackground() {
        clouds = [];
        for (let i = 0; i < 12; i++) {
            clouds.push({
                x: Math.random() * window.innerWidth * 1.5,
                y: Math.random() * window.innerHeight * 0.35,
                width: 60 + Math.random() * 80,
                speed: 0.3 + Math.random() * 0.5,
                layer: Math.floor(Math.random() * 3) + 1
            });
        }
        
        hills = [];
        for (let i = 0; i < 5; i++) {
            hills.push({
                x: i * window.innerWidth * 0.5,
                width: window.innerWidth * 0.6,
                height: 80 + Math.random() * 120,
                color: `hsl(${100 + Math.random() * 30}, ${50 + Math.random() * 20}%, ${45 + Math.random() * 15}%)`
            });
        }

        // Floating sparkle stars for home screen
        stars = [];
        const starColors = ['#FFD700', '#FF6B6B', '#74b9ff', '#a29bfe', '#55efc4', '#fd79a8'];
        for (let i = 0; i < 25; i++) {
            stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight * 0.85,
                size: 3 + Math.random() * 6,
                speed: 0.2 + Math.random() * 0.4,
                opacity: Math.random(),
                opacityDir: Math.random() > 0.5 ? 1 : -1,
                color: starColors[Math.floor(Math.random() * starColors.length)]
            });
        }
    }
    
    function setupEventListeners() {
        window.addEventListener('resize', resize);
        canvas.addEventListener('touchstart', handleInput, { passive: false });
        canvas.addEventListener('click', handleInput);
        
        document.addEventListener('keydown', function(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                handleInput(e);
            }
            if (e.code === 'Escape' && gameState === 'gameover') {
                goHome();
            }
        });
        
        playBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', restartGame);
        homeBtn.addEventListener('click', goHome);
    }
    
    function handleInput(e) {
        if (gameState === 'playing') {
            bird.velocity = bird.jump;
            createParticles(bird.x + bird.width / 2, bird.y + bird.height, 6, 'jump');
        }
    }
    
    function startGame() {
        homeScreen.classList.add('hidden');
        scoreDisplay.classList.add('visible');
        gameState = 'playing';
        
        bird.x = window.innerWidth * 0.2;
        bird.y = window.innerHeight / 2;
        bird.velocity = bird.jump;
        bird.rotation = -0.3;
        
        score = 0;
        frames = 0;
        gameSpeed = 4;
        pipeTimer = 0;
        pipes = [];
        particles = [];
        scorePopup = null;
        
        scoreDisplay.textContent = '0';
    }
    
    function restartGame() {
        gameOverScreen.classList.remove('visible');
        gameOverScreen.style.display = 'none';
        startGame();
    }
    
    function goHome() {
        gameOverScreen.classList.remove('visible');
        gameOverScreen.style.display = 'none';
        scoreDisplay.classList.remove('visible');
        homeScreen.classList.remove('hidden');
        gameState = 'home';
        
        bird.x = window.innerWidth / 2 - bird.width / 2;
        bird.y = window.innerHeight * 0.35;
        bird.rotation = 0;
        bird.velocity = 0;
    }
    
    function createParticles(x, y, count, type) {
        const colors = type === 'jump' 
            ? ['#FFD700', '#FFA500', '#FFFFFF']
            : ['#FF6B6B', '#FF4757', '#FFE66D'];
        
        for (let i = 0; i < count; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - (type === 'jump' ? 2 : 3),
                life: 25 + Math.random() * 15,
                size: 3 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                decay: 0.02 + Math.random() * 0.02
            });
        }
    }
    
    function createScorePopup(x, y) {
        scorePopup = { x, y, life: 60, vy: -2 };
    }
    
    function update(delta = 1) {
        frames++;
        
        if (shakeDuration > 0) shakeDuration--;
        groundOffset = (groundOffset + gameSpeed * delta) % 40;
        
        // Clouds
        for (let cloud of clouds) {
            cloud.x -= cloud.speed * (cloud.layer * 0.5) * delta;
            if (cloud.x + cloud.width < -50) {
                cloud.x = window.innerWidth + Math.random() * 200;
                cloud.y = Math.random() * window.innerHeight * 0.35;
            }
        }
        
        // Hills
        for (let hill of hills) {
            hill.x -= gameSpeed * 0.2 * delta;
            if (hill.x + hill.width < 0) {
                hill.x = window.innerWidth;
                hill.height = 80 + Math.random() * 120;
            }
        }

        // Sparkle stars
        for (let s of stars) {
            s.opacity += s.opacityDir * 0.025;
            if (s.opacity >= 1) { s.opacity = 1; s.opacityDir = -1; }
            if (s.opacity <= 0) { s.opacity = 0; s.opacityDir = 1; }
            s.y -= s.speed * 0.4 * delta;
            if (s.y < 0) s.y = window.innerHeight * 0.9;
        }
        
        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.vy += 0.15 * delta;
            p.life -= delta;
            p.size *= 0.98;
            if (p.life <= 0 || p.size < 0.5) particles.splice(i, 1);
        }
        
        // Score popup
        if (scorePopup) {
            scorePopup.y += scorePopup.vy * delta;
            scorePopup.life -= delta;
            if (scorePopup.life <= 0) scorePopup = null;
        }
        
        if (gameState === 'home') {
            bird.y = window.innerHeight * 0.35 + Math.sin(frames * 0.025) * 12;
            bird.rotation = Math.sin(frames * 0.025) * 0.12;
            return;
        }
        
        if (gameState === 'gameover' || gameState === 'loading') return;
        
        // Bird physics
        bird.velocity += bird.gravity * delta;
        bird.y += bird.velocity * delta;
        
        let targetRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 3, bird.velocity * 0.06));
        bird.rotation += (targetRotation - bird.rotation) * 0.08 * delta;
        
        let groundY = window.innerHeight - 100;
        if (bird.y + bird.height >= groundY) {
            bird.y = groundY - bird.height;
            shakeDuration = 15;
            createParticles(bird.x + bird.width / 2, bird.y + bird.height, 20, 'hit');
            gameOver();
            return;
        }
        
        if (bird.y < 0) {
            bird.y = 0;
            bird.velocity = 0;
        }
        
        // Pipes
        pipeTimer += delta;
        let pipeInterval = Math.max(90, 120 - Math.floor(score / 5) * 5);
        if (pipeTimer >= pipeInterval) {
            pipeTimer = 0;
            addPipe();
        }
        
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= gameSpeed * delta;
            
            if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
                pipes[i].passed = true;
                score++;
                scoreDisplay.textContent = score;
                scoreDisplay.classList.add('bump');
                setTimeout(() => scoreDisplay.classList.remove('bump'), 100);
                createParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, 8, 'score');
                createScorePopup(bird.x + bird.width / 2, bird.y);
            }
            
            if (pipes[i].x + pipeWidth < 0) pipes.splice(i, 1);
        }
        
        if (frames % 600 === 0 && gameSpeed < 8) gameSpeed += 0.3;
        
        checkCollisions();
    }
    
    function addPipe() {
        let minY = window.innerHeight * 0.12;
        let maxY = window.innerHeight - 100 - pipeGap - window.innerHeight * 0.12;
        let y = minY + Math.random() * (maxY - minY);
        pipes.push({ x: window.innerWidth, top: y, bottom: y + pipeGap, passed: false });
    }
    
    function checkCollisions() {
        let b = bird;
        let hitbox = 12;
        for (let p of pipes) {
            if (b.x + b.width - hitbox > p.x && b.x + hitbox < p.x + pipeWidth) {
                if (b.y + hitbox < p.top || b.y + b.height - hitbox > p.bottom) {
                    shakeDuration = 20;
                    createParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, 15, 'hit');
                    gameOver();
                    return;
                }
            }
        }
    }
    
    function gameOver() {
        gameState = 'gameover';
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappyFaceHighScore', highScore);
        }
        
        finalScoreEl.textContent = score;
        highScoreEl.textContent = highScore;
        
        setTimeout(() => {
            gameOverScreen.style.display = 'flex';
            gameOverScreen.classList.add('visible');
        }, 600);
    }
    
    function draw() {
        ctx.save();
        if (shakeDuration > 0) {
            let intensity = shakeDuration * 0.5;
            ctx.translate((Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity);
        }
        
        // Sky
        let skyGradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.3, '#B4E4FF');
        skyGradient.addColorStop(0.7, '#E0F6FF');
        skyGradient.addColorStop(1, '#98D8AA');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        drawHills();
        drawClouds();
        
        if (gameState === 'home') drawStars();
        if (gameState !== 'home') drawPipes();
        
        drawGround();
        drawParticles();
        if (scorePopup) drawScorePopup();
        drawBird();
        
        ctx.restore();
    }

    function drawStars() {
        for (let s of stars) {
            ctx.save();
            ctx.globalAlpha = s.opacity;
            ctx.fillStyle = s.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = s.color;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                let angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                let r = i % 2 === 0 ? s.size : s.size * 0.4;
                if (i === 0) ctx.moveTo(s.x + r * Math.cos(angle), s.y + r * Math.sin(angle));
                else ctx.lineTo(s.x + r * Math.cos(angle), s.y + r * Math.sin(angle));
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    
    function drawHills() {
        for (let hill of hills) {
            ctx.fillStyle = hill.color;
            ctx.beginPath();
            ctx.moveTo(hill.x, window.innerHeight - 100);
            ctx.quadraticCurveTo(hill.x + hill.width / 2, window.innerHeight - 100 - hill.height * 1.5, hill.x + hill.width, window.innerHeight - 100);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(hill.x + hill.width * 0.3, window.innerHeight - 100);
            ctx.quadraticCurveTo(hill.x + hill.width / 2, window.innerHeight - 100 - hill.height * 1.2, hill.x + hill.width * 0.6, window.innerHeight - 100);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    function drawClouds() {
        clouds.sort((a, b) => a.layer - b.layer);
        for (let cloud of clouds) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + cloud.layer * 0.1})`;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.width * 0.25, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.25, cloud.y - cloud.width * 0.1, cloud.width * 0.3, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.55, cloud.y, cloud.width * 0.28, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.3, cloud.y + cloud.width * 0.1, cloud.width * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawPipes() {
        let capHeight = 30;
        for (let p of pipes) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(p.x + 8, 0, pipeWidth, p.top);
            ctx.fillRect(p.x + 8, p.bottom, pipeWidth, window.innerHeight - p.bottom);
            
            let pg = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
            pg.addColorStop(0, '#4CAF50');
            pg.addColorStop(0.5, '#66BB6A');
            pg.addColorStop(1, '#43A047');
            ctx.fillStyle = pg;
            
            ctx.fillRect(Math.floor(p.x), 0, Math.ceil(pipeWidth), Math.floor(p.top));
            ctx.fillRect(Math.floor(p.x) - 6, Math.floor(p.top) - capHeight, Math.ceil(pipeWidth) + 12, capHeight);
            ctx.fillRect(Math.floor(p.x), Math.floor(p.bottom), Math.ceil(pipeWidth), window.innerHeight - Math.floor(p.bottom));
            ctx.fillRect(Math.floor(p.x) - 6, Math.floor(p.bottom), Math.ceil(pipeWidth) + 12, capHeight);
            
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(Math.floor(p.x) + 4, 0, 6, Math.floor(p.top) - capHeight);
            ctx.fillRect(Math.floor(p.x) + 4, Math.floor(p.bottom) + capHeight, 6, window.innerHeight - Math.floor(p.bottom));
            ctx.fillRect(Math.floor(p.x) - 6, Math.floor(p.top) - capHeight, 6, capHeight);
            ctx.fillRect(Math.floor(p.x) - 6, Math.floor(p.bottom), 6, capHeight);
            
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(Math.floor(p.x) + pipeWidth - 10, 0, 6, Math.floor(p.top) - capHeight);
            ctx.fillRect(Math.floor(p.x) + pipeWidth - 10, Math.floor(p.bottom) + capHeight, 6, window.innerHeight - Math.floor(p.bottom));
            
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 2;
            ctx.strokeRect(Math.floor(p.x) - 6, Math.floor(p.top) - capHeight, Math.ceil(pipeWidth) + 12, capHeight);
            ctx.strokeRect(Math.floor(p.x) - 6, Math.floor(p.bottom), Math.ceil(pipeWidth) + 12, capHeight);
        }
    }
    
    function drawGround() {
        let groundY = window.innerHeight - 100;
        let gg = ctx.createLinearGradient(0, groundY, 0, window.innerHeight);
        gg.addColorStop(0, '#8B7355');
        gg.addColorStop(0.3, '#6B5344');
        gg.addColorStop(1, '#4A3728');
        ctx.fillStyle = gg;
        ctx.fillRect(0, groundY, window.innerWidth, 100);
        
        ctx.fillStyle = '#5DAA5D';
        ctx.fillRect(0, groundY, window.innerWidth, 18);
        
        ctx.fillStyle = '#4A9A4A';
        for (let x = Math.floor(groundOffset); x < window.innerWidth; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, groundY + 18);
            ctx.lineTo(x + 4, groundY + 8);
            ctx.lineTo(x + 8, groundY + 18);
            ctx.fill();
        }
        
        ctx.fillStyle = '#6BC16B';
        ctx.fillRect(0, groundY, window.innerWidth, 4);
        
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let x = Math.floor(groundOffset); x < window.innerWidth; x += 50) {
            ctx.beginPath();
            ctx.arc(x + 15, groundY + 40, 4, 0, Math.PI * 2);
            ctx.arc(x + 35, groundY + 65, 3, 0, Math.PI * 2);
            ctx.arc(x + 45, groundY + 45, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#3D2914';
        ctx.fillRect(0, groundY - 2, window.innerWidth, 2);
    }
    
    function drawParticles() {
        for (let p of particles) {
            ctx.globalAlpha = Math.min(1, p.life / 20);
            ctx.fillStyle = p.color;
            if (p.size > 3) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
    }
    
    function drawScorePopup() {
        ctx.save();
        ctx.font = 'bold 32px "Press Start 2P", cursive';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.min(1, scorePopup.life / 20);
        ctx.strokeText('+1', scorePopup.x, scorePopup.y);
        ctx.fillText('+1', scorePopup.x, scorePopup.y);
        ctx.restore();
    }
    
    function drawBird() {
        let cx = Math.floor(bird.x + bird.width / 2);
        let cy = Math.floor(bird.y + bird.height / 2);
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(bird.rotation);
        
        if (imageLoaded && birdImage) {
            let iw = birdImage.naturalWidth || birdImage.width;
            let ih = birdImage.naturalHeight || birdImage.height;
            let aspect = iw / ih;
            let drawW = bird.width;
            let drawH = drawW / aspect;
            ctx.drawImage(birdImage, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            let w = bird.width;
            let h = bird.height;
            ctx.fillStyle = '#FFD93D';
            ctx.beginPath();
            ctx.ellipse(0, 0, w / 2, h / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#F4C430';
            ctx.beginPath();
            ctx.ellipse(-w * 0.15, h * 0.1, w * 0.25, h * 0.15, -0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(w * 0.25, -h * 0.15, w * 0.18, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(w * 0.3, -h * 0.15, w * 0.08, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(w * 0.33, -h * 0.18, w * 0.03, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.moveTo(w * 0.3, h * 0.05);
            ctx.lineTo(w * 0.5 + 5, h * 0.1);
            ctx.lineTo(w * 0.3, h * 0.2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    let lastTime = 0;

    function gameLoop(timestamp) {
        const delta = Math.min((timestamp - lastTime) / (1000 / 60), 3); // normalize to 60fps
        lastTime = timestamp;
        update(delta);
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
