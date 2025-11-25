// --- INITIAL SETUP ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- GAME STATE VARIABLES ---
let gameState = 'MENU'; // Possible states: 'MENU', 'LEVEL_SELECT', 'LEVEL', 'INFINITE'
let currentLevel = 1;
let score = 0;
let lastTime = 0;
let levelObstacles = [];

// --- PLAYER SPRITE SETUP ---
const playerImg = new Image();
// IMPORTANT: Link to your uploaded image file
playerImg.src = 'Mr Jones.png'; 

// Wait for the image to load before starting the game loop
playerImg.onload = init;

// --- GAME OBJECTS ---
const player = {
    x: 50,
    y: HEIGHT - 50,
    width: 40,
    height: 40,
    velocityY: 0,
    gravity: 0.8,
    jumpStrength: -16,
    isGrounded: true
};

// Define menu buttons for click detection
const menuButtons = {
    'levels': { x: WIDTH / 2 - 150, y: HEIGHT / 2 + 30, width: 140, height: 40, text: 'Levels' },
    'infinite': { x: WIDTH / 2 + 10, y: HEIGHT / 2 + 30, width: 140, height: 40, text: 'Infinite' },
    'back': { x: 50, y: 50, width: 100, height: 30, text: 'Back' }
};

// --- GAME FUNCTIONS ---

/**
 * Initializes the game and starts the main loop.
 */
function init() {
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('keydown', handleKeyInput);
    
    // Request focus so keyboard input works immediately
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
}

/**
 * The main game loop, runs every frame.
 * @param {number} timestamp - The current time in milliseconds.
 */
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000; // time in seconds
    lastTime = timestamp;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Draw the ground
    ctx.fillStyle = '#4f3922';
    ctx.fillRect(0, HEIGHT - 10, WIDTH, 10); 

    switch (gameState) {
        case 'MENU':
            drawMenu();
            break;
        case 'LEVEL_SELECT':
            drawLevelSelect();
            break;
        case 'LEVEL':
            updateGame(deltaTime);
            drawGame();
            drawLevelIndicator();
            break;
        case 'INFINITE':
            updateGame(deltaTime);
            drawGame();
            updateScore(deltaTime);
            drawScore();
            break;
    }

    requestAnimationFrame(gameLoop);
}

// --- PLAYER LOGIC ---

/**
 * Handles the player's movement and jumping physics.
 */
function updatePlayer() {
    // Apply gravity
    if (!player.isGrounded) {
        player.velocityY += player.gravity;
        player.y += player.velocityY;
    }

    // Check for ground collision (only on the main ground for now)
    if (player.y + player.height > HEIGHT - 10) {
        player.y = HEIGHT - 10 - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
    }
}

/**
 * Makes the player jump if they are grounded.
 */
function jump() {
    if (player.isGrounded) {
        player.isGrounded = false;
        player.velocityY = player.jumpStrength;
    }
}

/**
 * Draws the player sprite.
 */
function drawPlayer() {
    // Use the loaded image
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

// --- OBSTACLE LOGIC ---

/**
 * Generates the set of obstacles for the current level or infinite mode.
 * The difficulty increases based on the level number or current score.
 */
function generateObstacles(isInfinite) {
    levelObstacles = [];
    let difficultyFactor = 1;
    let maxDistance = 3000; 

    if (isInfinite) {
        // Difficulty increases slightly the further the score is
        difficultyFactor = 1 + Math.floor(score / 500) * 0.2;
        maxDistance = 1000000; // Essentially infinite
    } else {
        // Difficulty increases based on level number (1-50)
        difficultyFactor = 1 + (currentLevel - 1) * 0.1;
    }

    let currentX = 500;
    while (currentX < maxDistance) {
        // Gap between obstacles (gets smaller with difficulty)
        const gap = Math.max(200, 400 - difficultyFactor * 50 + Math.random() * 100); 
        currentX += gap;

        // Obstacle width (gets wider with difficulty)
        const width = Math.min(60, 20 + difficultyFactor * 5 + Math.random() * 10); 
        
        // Obstacle height (gets taller with difficulty)
        const maxHeight = Math.min(100, 30 + difficultyFactor * 10 + Math.random() * 20);
        const height = Math.random() < 0.2 ? maxHeight : 30; // 20% chance of a tall obstacle

        levelObstacles.push({
            x: currentX,
            y: HEIGHT - 10 - height,
            width: width,
            height: height
        });

        currentX += width;
    }
}

/**
 * Updates obstacle positions and checks for collision.
 */
function updateObstacles(deltaTime) {
    const scrollSpeed = (gameState === 'LEVEL' ? 200 : 250) + Math.floor(score / 100) * 5; // Base speed + speed-up in infinite
    const distanceToScroll = scrollSpeed * deltaTime;

    for (let i = 0; i < levelObstacles.length; i++) {
        const obs = levelObstacles[i];
        obs.x -= distanceToScroll;

        // Check for collision with player
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            // GAME OVER!
            resetGame();
            return;
        }
    }

    // Keep the infinite level going by regenerating if obstacles run low
    if (gameState === 'INFINITE' && levelObstacles.length > 0 && levelObstacles[levelObstacles.length - 1].x < WIDTH + 500) {
        // This is a simplified infinite generation. 
        // A more robust system would add chunks dynamically.
        // For simplicity, we just check distance and regenerate the set when needed, 
        // though a true infinite runner would add obstacles continuously.
    }
}

/**
 * Draws all active obstacles.
 */
function drawObstacles() {
    ctx.fillStyle = '#ff0000'; // Red
    levelObstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
}

// --- GAME STATE AND RENDER ---

/**
 * Runs the physics and logic updates for the active game state.
 */
function updateGame(deltaTime) {
    updatePlayer();
    updateObstacles(deltaTime);
}

/**
 * Draws all game elements for the active game state.
 */
function drawGame() {
    drawPlayer();
    drawObstacles();
}

/**
 * Resets the player, score, and returns to the main menu after a collision.
 */
function resetGame() {
    // Reset player position
    player.x = 50;
    player.y = HEIGHT - 50;
    player.velocityY = 0;
    player.isGrounded = true;

    // Reset score and state
    score = 0;
    gameState = 'MENU';
    levelObstacles = [];
    alert('Game Over! Your infinite score was: ' + score.toFixed(0));
}

// --- MENU RENDERING ---

/**
 * Draws the main title menu.
 */
function drawMenu() {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    
    // Title
    ctx.font = '60px Arial';
    ctx.fillText('JumperJonsey', WIDTH / 2, HEIGHT / 2 - 50);

    // Buttons
    drawButton(menuButtons.levels);
    drawButton(menuButtons.infinite);
}

/**
 * Draws the level selection screen (50 levels).
 */
function drawLevelSelect() {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    
    // Title
    ctx.font = '30px Arial';
    ctx.fillText('Select a Level', WIDTH / 2, 50);

    // Back Button
    drawButton(menuButtons.back);

    // Level buttons grid (10 rows, 5 columns)
    const startX = 100;
    const startY = 100;
    const btnWidth = 50;
    const btnHeight = 30;
    const padding = 15;
    const cols = 10;
    
    ctx.font = '16px Arial';

    for (let i = 1; i <= 50; i++) {
        const col = (i - 1) % cols;
        const row = Math.floor((i - 1) / cols);
        
        const x = startX + col * (btnWidth + padding);
        const y = startY + row * (btnHeight + padding);

        // Draw button background
        ctx.fillStyle = i <= 5 ? '#4CAF50' : '#888'; // Make early levels green, others gray
        ctx.fillRect(x, y, btnWidth, btnHeight);
        
        // Store the button area for click detection
        const buttonName = 'level_' + i;
        if (!menuButtons[buttonName]) {
            menuButtons[buttonName] = { x: x, y: y, width: btnWidth, height: btnHeight, text: i.toString() };
        }
        
        // Draw button text
        ctx.fillStyle = '#fff';
        ctx.fillText(i.toString(), x + btnWidth / 2, y + btnHeight / 2 + 5);
    }
}

/**
 * Helper function to draw a standardized menu button.
 */
function drawButton(button) {
    // Background
    ctx.fillStyle = '#4CAF50'; 
    ctx.fillRect(button.x, button.y, button.width, button.height);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2 + 7);
}

/**
 * Displays the current level number on the game screen.
 */
function drawLevelIndicator() {
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${currentLevel}`, 10, 30);
}

/**
 * Updates the score based on distance traveled and draws it.
 */
function updateScore(deltaTime) {
    const speed = 250; // Points per second
    score += speed * deltaTime;
}

/**
 * Draws the current score in the top right.
 */
function drawScore() {
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score.toFixed(0)}`, WIDTH - 10, 30);
}


// --- INPUT HANDLERS ---

/**
 * Handles mouse clicks for menu navigation.
 */
function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (gameState === 'MENU') {
        if (isButtonClicked(menuButtons.levels, mouseX, mouseY)) {
            gameState = 'LEVEL_SELECT';
        } else if (isButtonClicked(menuButtons.infinite, mouseX, mouseY)) {
            currentLevel = 0; // Use 0 to denote infinite mode
            score = 0;
            generateObstacles(true);
            gameState = 'INFINITE';
        }
    } else if (gameState === 'LEVEL_SELECT') {
        if (isButtonClicked(menuButtons.back, mouseX, mouseY)) {
            gameState = 'MENU';
        } else {
            // Check for level buttons
            for (let i = 1; i <= 50; i++) {
                const buttonName = 'level_' + i;
                if (isButtonClicked(menuButtons[buttonName], mouseX, mouseY)) {
                    currentLevel = i;
                    generateObstacles(false); // Generate obstacles for the selected level
                    gameState = 'LEVEL';
                    break;
                }
            }
        }
    }
}

/**
 * Checks if the mouse click is within a button's bounds.
 */
function isButtonClicked(button, mouseX, mouseY) {
    // Only check if button exists and has coordinates
    if (!button) return false;

    return mouseX >= button.x &&
           mouseX <= button.x + button.width &&
           mouseY >= button.y &&
           mouseY <= button.y + button.height;
}

/**
 * Handles keyboard input for jumping.
 */
function handleKeyInput(event) {
    // Check for SPACE or UP arrow
    if ((gameState === 'LEVEL' || gameState === 'INFINITE') && (event.code === 'Space' || event.code === 'ArrowUp')) {
        jump();
    }
}