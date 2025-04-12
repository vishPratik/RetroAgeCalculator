// Game Canvas Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 500;

// Game State
const gameState = {
    player: {
        x: 100,
        y: 350,
        width: 50,
        height: 80,
        speed: 5,
        isJumping: false,
        jumpHeight: 150,
        jumpStartY: 0,
        direction: 'right',
        worldX: 100
    },
    background: {
        imgWidth: 2400,
        x: 0,
        speed: 2
    },
    checkpoints: [
        { worldX: 500, width: 60, type: 'name', active: true, completed: false },
        { worldX: 1200, width: 60, type: 'dob', active: false, completed: false },
        { worldX: 2000, width: 60, type: 'age', active: false, completed: false }
    ],
    name: '',
    dob: null,
    gamePaused: false,
    currentStage: 'intro'
};

// Load Assets
const assets = {
    background: new Image(),
    character: new Image()
};

assets.background.src = "assets/bg/background.jpg";
assets.character.src = "assets/ch/char.png";

// Audio Elements
const bgMusic = document.getElementById('bg-music');
const footstepSFX = document.getElementById('footstep-sfx');
const jumpSFX = document.getElementById('jump-sfx');
const portalSFX = document.getElementById('portal-sfx');

// Modal Elements
const introModal = document.getElementById('intro-modal');
const nameInputModal = document.getElementById('name-input-modal');
const dobInputModal = document.getElementById('dob-input-modal');
const ageRevealModal = document.getElementById('age-reveal-modal');
const nameInput = document.getElementById('name-input');
const dobInput = document.getElementById('dob-input');
const playerNameDisplay = document.getElementById('player-name-display');
const ageDisplay = document.getElementById('age-display');
const funkyText = document.getElementById('funky-text');

// Event Listeners
document.getElementById('start-game').addEventListener('click', () => {
    introModal.classList.add('hidden');
    gameState.currentStage = 'name';
    bgMusic.play().catch(e => console.log('Autoplay prevented:', e));
    resumeGame();
});

document.getElementById('name-submit').addEventListener('click', () => {
    gameState.name = nameInput.value.trim() || 'HERO';
    nameInputModal.classList.add('hidden');
    gameState.checkpoints[0].completed = true;
    gameState.checkpoints[1].active = true;
    resumeGame();
});

document.getElementById('dob-submit').addEventListener('click', () => {
    gameState.dob = new Date(dobInput.value);
    dobInputModal.classList.add('hidden');
    gameState.checkpoints[1].completed = true;
    gameState.checkpoints[2].active = true;
    resumeGame();
});

document.getElementById('play-again').addEventListener('click', () => {
    resetGame();
});

// Keyboard Controls
const keys = {
    right: false,
    left: false,
    up: false
};

window.addEventListener('keydown', (e) => {
    if (gameState.gamePaused) return;
    
    switch(e.key) {
        case 'ArrowRight':
        case 'd':
            keys.right = true;
            gameState.player.direction = 'right';
            break;
        case 'ArrowLeft':
        case 'a':
            keys.left = true;
            gameState.player.direction = 'left';
            break;
        case 'ArrowUp':
        case 'w':
        case ' ':
            if (!gameState.player.isJumping) {
                gameState.player.isJumping = true;
                gameState.player.jumpStartY = gameState.player.y;
                jumpSFX.currentTime = 0;
                jumpSFX.play();
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowRight':
        case 'd':
            keys.right = false;
            break;
        case 'ArrowLeft':
        case 'a':
            keys.left = false;
            break;
    }
});

// Game Functions
function pauseGame() {
    gameState.gamePaused = true;
}

function resumeGame() {
    gameState.gamePaused = false;
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    gameState.player.x = 100;
    gameState.player.y = 350;
    gameState.player.worldX = 100;
    gameState.background.x = 0;
    gameState.name = '';
    gameState.dob = null;
    gameState.currentStage = 'intro';
    
    gameState.checkpoints = [
        { worldX: 500, width: 60, type: 'name', active: true, completed: false },
        { worldX: 1200, width: 60, type: 'dob', active: false, completed: false },
        { worldX: 2000, width: 60, type: 'age', active: false, completed: false }
    ];
    
    ageRevealModal.classList.add('hidden');
    introModal.classList.remove('hidden');
    nameInput.value = '';
    dobInput.value = '';
    
    bgMusic.currentTime = 0;
    if (gameState.currentStage !== 'intro') {
        bgMusic.play();
    }
}

function checkCheckpointCollision() {
    const player = gameState.player;
    
    for (let i = 0; i < gameState.checkpoints.length; i++) {
        const checkpoint = gameState.checkpoints[i];
        const checkpointScreenX = checkpoint.worldX - gameState.player.worldX + player.x;
        
        if (checkpoint.active && 
            player.x + player.width > checkpointScreenX && 
            player.x < checkpointScreenX + checkpoint.width &&
            player.y + player.height > canvas.height - 100) {
            
            checkpoint.active = false;
            portalSFX.currentTime = 0;
            portalSFX.play();
            
            if (checkpoint.type === 'name') {
                pauseGame();
                nameInputModal.classList.remove('hidden');
                nameInput.focus();
            } else if (checkpoint.type === 'dob') {
                pauseGame();
                dobInputModal.classList.remove('hidden');
                dobInput.focus();
            } else if (checkpoint.type === 'age' && gameState.name && gameState.dob) {
                pauseGame();
                showAge();
            }
            
            return true;
        }
    }
    return false;
}

function showAge() {
    const today = new Date();
    const birthDate = new Date(gameState.dob);
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    playerNameDisplay.textContent = gameState.name.toUpperCase();
    ageDisplay.innerHTML = `
        <div>AGE:</div>
        <div>${years} YEARS</div>
        <div>${months} MONTHS</div>
        <div>${days} DAYS</div>
    `;
    
    if (years < 18) {
        funkyText.textContent = "WHOA KIDDO! YOU'RE YOUNG AND FULL OF ENERGY!";
    } else if (years < 30) {
        funkyText.textContent = "YOUNG ADULT! THE WORLD IS YOUR PLAYGROUND!";
    } else if (years < 50) {
        funkyText.textContent = "PRIME TIME! YOU'RE IN YOUR GLORY DAYS!";
    } else {
        funkyText.textContent = "WISE AND EXPERIENCED! YOU'VE SEEN IT ALL!";
    }
    
    ageRevealModal.classList.remove('hidden');
}

function updatePlayerPosition() {
    const player = gameState.player;
    
    if (keys.right) {
        player.direction = 'right';
        player.worldX += player.speed;
        gameState.background.x -= gameState.background.speed;
        
        if (Math.abs(gameState.background.x) >= gameState.background.imgWidth) {
            gameState.background.x = 0;
        }
        
        if (Math.floor(Date.now() / 200) % 2 === 0 && !player.isJumping) {
            footstepSFX.currentTime = 0;
            footstepSFX.play();
        }
    } else if (keys.left && player.worldX > player.x) {
        player.direction = 'left';
        player.worldX -= player.speed;
        gameState.background.x += gameState.background.speed;
        
        if (gameState.background.x > 0) {
            gameState.background.x = -gameState.background.imgWidth + canvas.width;
        }
        
        if (Math.floor(Date.now() / 200) % 2 === 0 && !player.isJumping) {
            footstepSFX.currentTime = 0;
            footstepSFX.play();
        }
    }
    
    if (player.isJumping) {
        const jumpProgress = (player.y - player.jumpStartY) / player.jumpHeight;
        const jumpSpeed = 8 * (jumpProgress < 0.5 ? 1 : -1);
        player.y -= jumpSpeed;
        
        if (player.y <= player.jumpStartY - player.jumpHeight) {
            player.isJumping = false;
        }
    } else if (player.y < 350) {
        player.y += 8;
    }
    
    if (player.y >= 350) {
        player.y = 350;
        player.isJumping = false;
    }
}

function drawBackground() {
    const bgX = gameState.background.x;
    const bgCount = Math.ceil(canvas.width / gameState.background.imgWidth) + 1;
    
    for (let i = 0; i < bgCount; i++) {
        const drawX = bgX + (i * gameState.background.imgWidth);
        if (drawX + gameState.background.imgWidth > 0 && drawX < canvas.width) {
            ctx.drawImage(assets.background, drawX, 0, gameState.background.imgWidth, canvas.height);
        }
    }
    
    ctx.fillStyle = '#5a3921';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

function drawPlayer() {
    const player = gameState.player;
    if (player.direction === 'right') {
        ctx.drawImage(assets.character, player.x, player.y, player.width, player.height);
    } else {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(assets.character, -player.x - player.width, player.y, player.width, player.height);
        ctx.restore();
    }
}

function drawCheckpoints() {
    gameState.checkpoints.forEach(checkpoint => {
        if (checkpoint.active || !checkpoint.completed) {
            const screenX = checkpoint.worldX - gameState.player.worldX + gameState.player.x;
            if (screenX + checkpoint.width > 0 && screenX < canvas.width) {
                ctx.fillStyle = checkpoint.type === 'name' ? '#f72585' : 
                                checkpoint.type === 'dob' ? '#4cc9f0' : '#b5179e';
                ctx.fillRect(screenX, canvas.height - 100, checkpoint.width, 50);
                
                ctx.fillStyle = '#fff';
                ctx.font = '12px "Press Start 2P"';
                ctx.fillText(checkpoint.type.toUpperCase(), screenX + 10, canvas.height - 70);
            }
        }
    });
}

// Main Game Loop
function gameLoop() {
    if (gameState.gamePaused) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updatePlayerPosition();
    checkCheckpointCollision();
    
    drawBackground();
    drawCheckpoints();
    drawPlayer();
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
function initGame() {
    bgMusic.volume = 0.3;
    footstepSFX.volume = 0.2;
    jumpSFX.volume = 0.3;
    portalSFX.volume = 0.4;
    
    introModal.classList.remove('hidden');
    
    setTimeout(() => {
        // Game will start when user clicks "START GAME"
    }, 500);
}

window.addEventListener('load', initGame);