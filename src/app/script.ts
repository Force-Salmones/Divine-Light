const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const world = new Image();

type GameState = {
    player: Player;
    enemies: Enemy[];
    selectedEnemyId: number | null;
    lastAttackResult?: {
        enemyId: number;
        damage: number;
        timestamp: number;
        x: number;
        y: number;
        enemyDead: boolean;
    };
}

type Player = {
    id: number;
    name: string;
    health: number;
    mana: number;
    x: number;
    y: number;
    sprite: string;
    speed: number;
    attackRange: number;
    attackSpeed: number;
    lastAttackTime: number;
    targetX?: number;
    targetY?: number;
}

type Enemy = {
    id: number;
    x: number;
    y: number;
    health: number;
    sprite: string;
}

let gameState: GameState | null = null;
const sprites: Map<string, HTMLImageElement> = new Map();
let selectedEntity: { type: 'player' | 'enemy'; id?: number } | null = null;
let attackTargetEnemyId: number | null = null;
let attackIntervalId: number | null = null;
let gameStatePollId: number | null = null;
let lastProcessedAttackTimestamp: number = 0;

type DamageNumber = {
    text: string;
    startX: number;
    startY: number;
    elapsed: number;
    duration: number;
    amplitude: number;
    frequency: number;
};

let damageNumbers: DamageNumber[] = [];

function getEntityAt(x: number, y: number) {
    if (!gameState) return null;

    const playerWidth = 32;
    const playerHeight = 32;
    if (
        x >= gameState.player.x &&
        x <= gameState.player.x + playerWidth &&
        y >= gameState.player.y &&
        y <= gameState.player.y + playerHeight
    ) {
        return { type: 'player' as const };
    }

    const clickedEnemy = gameState.enemies.find(enemy =>
        x >= enemy.x &&
        x <= enemy.x + 24 &&
        y >= enemy.y &&
        y <= enemy.y + 24
    );

    return clickedEnemy ? { type: 'enemy' as const, id: clickedEnemy.id } : null;
}

function drawOutline(x: number, y: number, width: number, height: number) {
    ctx.save();
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
    ctx.restore();
}

function drawAttackRangeCircle(radius: number) {
    if (!gameState) return;
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.arc(gameState.player.x + 16, gameState.player.y + 16, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawSelectedEnemyPanel(enemy: Enemy) {
    const panelX = 10;
    const panelY = 10;
    const panelWidth = 180;
    const panelHeight = 70;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Enemy #${enemy.id}`, panelX + 10, panelY + 24);
    ctx.fillText(`HP: ${enemy.health}`, panelX + 10, panelY + 44);

    const status = isWithinAttackRange(enemy) ? 'In range' : 'Out of range';
    ctx.fillStyle = status === 'In range' ? 'lightgreen' : 'lightcoral';
    ctx.fillText(status, panelX + 10, panelY + 64);
    ctx.restore();
}

function isWithinAttackRange(enemy: Enemy) {
    if (!gameState) return false;
    const player = gameState.player;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    return Math.hypot(dx, dy) <= player.attackRange;
}

async function attackEnemy(enemyId: number) {
    try {
        const response = await fetch('/api/attack-enemy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enemyId })
        });
        const data = await response.json();
        
        if (!data.success) {
            // Handle cooldown silently (expected during attack intervals)
            if (response.status === 429) {
                return;
            }
            
            // Handle actual errors
            console.error('Attack failed:', data.message);
            stopAttackLoop();
            return;
        }

        if (data.enemyDead) {
            if (gameState) {
                gameState.enemies = gameState.enemies.filter(e => e.id !== enemyId);
            }
            stopAttackLoop();
            return;
        }

        if (typeof data.enemyHealth === 'number') {
            const enemy = gameState?.enemies.find(e => e.id === enemyId);
            if (enemy) {
                enemy.health = data.enemyHealth;
            }
        }
    } catch (error) {
        console.error('Error attacking enemy:', error);
        stopAttackLoop();
    }
}

function stopAttackLoop() {
    if (attackIntervalId !== null) {
        clearInterval(attackIntervalId);
        attackIntervalId = null;
    }
    attackTargetEnemyId = null;
}

function startAttackLoop(enemyId: number) {
    stopAttackLoop();
    attackTargetEnemyId = enemyId;
    attackEnemy(enemyId);
    if (!gameState) return;
    const attackSpeed = gameState.player.attackSpeed;
    attackIntervalId = window.setInterval(() => {
        if (!gameState) {
            stopAttackLoop();
            return;
        }

        const enemy = gameState.enemies.find(e => e.id === enemyId);
        if (!enemy || !isWithinAttackRange(enemy)) {
            stopAttackLoop();
            return;
        }

        attackEnemy(enemyId);
    }, attackSpeed * 1000);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function loadSprites() {
    if (!gameState) return;

    const spriteUrls = new Set<string>();
    spriteUrls.add(gameState.player.sprite);
    gameState.enemies.forEach(enemy => spriteUrls.add(enemy.sprite));

    const promises = Array.from(spriteUrls).map(url => loadImage(url));
    const images = await Promise.all(promises);

    Array.from(spriteUrls).forEach((url, index) => {
        if (images[index]) {
            sprites.set(url, images[index]);
        }
    });
}

async function refreshSpritesIfNeeded() {
    if (!gameState) return;

    const spriteUrls = new Set<string>();
    spriteUrls.add(gameState.player.sprite);
    gameState.enemies.forEach(enemy => spriteUrls.add(enemy.sprite));

    const missing = Array.from(spriteUrls).filter(url => !sprites.has(url));
    if (!missing.length) return;

    const images = await Promise.all(missing.map(url => loadImage(url)));
    missing.forEach((url, index) => {
        if (images[index]) {
            sprites.set(url, images[index]);
        }
    });
}

async function refreshGameState() {
    try {
        const response = await fetch('/api/game-state');
        const data = await response.json();
        const loadedGameState = data.gameState as GameState;
        
        if (loadedGameState.player.speed === undefined) {
            loadedGameState.player.speed = 120;
        }
        if (loadedGameState.player.attackRange === undefined) {
            loadedGameState.player.attackRange = 48;
        }
        if (loadedGameState.player.attackSpeed === undefined) {
            loadedGameState.player.attackSpeed = 1;
        }
        gameState = loadedGameState;
        await refreshSpritesIfNeeded();

        // Handle automatic attack damage display
        if (gameState && gameState.lastAttackResult) {
            const attackResult = gameState.lastAttackResult;
            if (attackResult.timestamp > lastProcessedAttackTimestamp) {
                lastProcessedAttackTimestamp = attackResult.timestamp;
                spawnDamageNumber(attackResult.x + 12, attackResult.y, attackResult.damage.toString());
            }
        }

        if (attackTargetEnemyId !== null && gameState) {
            const enemy = gameState.enemies.find(e => e.id === attackTargetEnemyId);
            if (enemy && isWithinAttackRange(enemy)) {
                startAttackLoop(enemy.id);
            }
        }
    } catch (error) {
        console.error('Failed to refresh game state:', error);
    }
}

async function loadGameState() {
    try {
        const response = await fetch('/api/game-state');
        const data = await response.json();
        const loadedGameState = data.gameState as GameState;
        if (loadedGameState.player.speed === undefined) {
            loadedGameState.player.speed = 120;
        }
        if (loadedGameState.player.attackRange === undefined) {
            loadedGameState.player.attackRange = 48;
        }
        if (loadedGameState.player.attackSpeed === undefined) {
            loadedGameState.player.attackSpeed = 1;
        }
        gameState = loadedGameState;
        await loadSprites();
    } catch (error) {
        console.error('Failed to load game state or sprites:', error);
    }
}

world.onload = async () => {
    await loadGameState();
    gameStatePollId = window.setInterval(refreshGameState, 100);
    // Start the game loop after loading
    requestAnimationFrame(gameLoop);
};

world.src = "../../assets/world.png";

let lastTime: number = 0;

function gameLoop(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    updateDamageNumbers(deltaTime);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render everything
    render();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

function spawnDamageNumber(x: number, y: number, text: string) {
    damageNumbers.push({
        text,
        startX: x,
        startY: y,
        elapsed: 0,
        duration: 0.9,
        amplitude: 10,
        frequency: 3
    });
}

function updateDamageNumbers(deltaTime: number) {
    damageNumbers = damageNumbers.filter(damage => {
        damage.elapsed += deltaTime / 1000;
        return damage.elapsed < damage.duration;
    });
}

function renderDamageNumbers() {
    damageNumbers.forEach(damage => {
        const progress = damage.elapsed / damage.duration;
        const alpha = 1 - progress;
        const x = damage.startX + Math.sin(progress * Math.PI * 2 * damage.frequency) * damage.amplitude;
        const y = damage.startY - progress * 40;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 2;
        ctx.strokeText(damage.text, x, y);
        ctx.fillText(damage.text, x, y);
        ctx.restore();
    });
}

function render() {
    if (!gameState) return;

    // Draw the world background
    ctx.drawImage(world, 0, 0, canvas.width, canvas.height);

    const showAttackRange = selectedEntity?.type === 'enemy' || attackTargetEnemyId !== null || attackIntervalId !== null;
    if (showAttackRange) {
        drawAttackRangeCircle(gameState.player.attackRange);
    }

    // Draw player
    const playerImg = sprites.get(gameState.player.sprite);
    if (playerImg) {
        ctx.drawImage(playerImg, gameState.player.x, gameState.player.y, 32, 32);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(gameState.player.x, gameState.player.y, 32, 32);
    }

    if (selectedEntity?.type === 'player') {
        drawOutline(gameState.player.x, gameState.player.y, 32, 32);
    }

    // Draw enemies
    gameState.enemies.forEach(enemy => {
        const enemyImg = sprites.get(enemy.sprite);
        if (enemyImg) {
            ctx.drawImage(enemyImg, enemy.x, enemy.y, 24, 24);
        } else {
            ctx.fillStyle = 'green';
            ctx.fillRect(enemy.x, enemy.y, 24, 24);
        }

        if (selectedEntity?.type === 'enemy' && selectedEntity.id === enemy.id) {
            drawOutline(enemy.x, enemy.y, 24, 24);
        }
    });

    renderDamageNumbers();

    if (selectedEntity?.type === 'enemy') {
        const selected = selectedEntity;
        const enemy = gameState.enemies.find(e => e.id === selected.id);
        if (enemy) {
            drawSelectedEnemyPanel(enemy);
        }
    }
}

async function movePlayer(x?: number, y?: number, enemyId?: number) {
    try {
        const body: Record<string, number> = enemyId !== undefined ? { enemyId } : { x: x ?? 0, y: y ?? 0 };
        const response = await fetch('/api/move-player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!data.success) {
            console.error('Failed to move player:', data.message);
            return;
        }

        if (data.gameState) {
            gameState = data.gameState as GameState;
            await refreshSpritesIfNeeded();
        }
    } catch (error) {
        console.error('Error moving player:', error);
    }
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const hit = getEntityAt(x, y);
    if (hit?.type === 'enemy' && gameState) {
        const enemy = gameState.enemies.find(e => e.id === hit.id);
        if (enemy) {
            if (selectedEntity?.type === 'enemy' && selectedEntity.id === hit.id) {
                selectedEntity = hit;
                if (isWithinAttackRange(enemy)) {
                    startAttackLoop(enemy.id);
                    return;
                }

                attackTargetEnemyId = enemy.id;
                movePlayer(0, 0, enemy.id);
                return;
            }

            stopAttackLoop();
            selectedEntity = hit;
            return;
        }
    }

    if (hit) {
        stopAttackLoop();
        selectedEntity = hit;
        return;
    }

    stopAttackLoop();
    selectedEntity = null;
    movePlayer(x, y);
});