const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const world = new Image();

// Chat types
type ChatMessage = {
    from?: string; // playerId or undefined for system
    text: string;
    system?: boolean;
    timestamp: number;
};

const chatMessages: ChatMessage[] = [];
let chatContainer: HTMLDivElement | null = null;
let chatMessagesDiv: HTMLDivElement | null = null;
let chatInput: HTMLInputElement | null = null;
let statsButton: HTMLButtonElement | null = null;
let statsContainer: HTMLDivElement | null = null;

// Client-side types (subset mirrored from server for rendering)
type Player = {
    id: string;
    name: string;
    level: number;
    experience: number;
    expToNextLevel: number;
    currHealth: number;
    maxHealth: number;
    currMana: number;
    maxMana: number;
    STR: number;
    VIT: number;
    DEX: number;
    LUK: number;
    INT: number;
    WIS: number;
    unallocatedPoints: number;
    defense: number;
    resistance: number;
    x: number;
    y: number;
    sprite: string;
    speed: number;
    attackRange: number;
    attackSpeed: number;
    lastAttackTime: number;
};

type Enemy = {
    id: number;
    name: string;
    level: number;
    currHealth: number;
    maxHealth: number;
    x: number;
    y: number;
    sprite: string;
};

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

let gameState: GameState | null = null;
const sprites: Map<string, HTMLImageElement> = new Map();
let selectedEntity: { type: 'player' | 'enemy'; id?: number } | null = null;
let attackTargetEnemyId: number | null = null;
let attackIntervalId: number | null = null;
let gameStatePollId: number | null = null;
let lastProcessedAttackTimestamp: number = 0;
let hasInitializedAttackHistory = false;
let gameSocket: WebSocket | null = null;
const pendingMessages: any[] = []; // queue messages until socket is open

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
    const panelWidth = 220;
    const panelHeight = 80;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(enemy.name || `Enemy #${enemy.id}`, panelX + 10, panelY + 22);
    ctx.font = '12px sans-serif';
    ctx.fillText(`Level ${enemy.level}`, panelX + 10, panelY + 38);
    ctx.fillText(`HP: ${enemy.currHealth}/${enemy.maxHealth}`, panelX + 10, panelY + 54);

    const status = isWithinAttackRange(enemy) ? 'In range' : 'Out of range';
    ctx.fillStyle = status === 'In range' ? 'lightgreen' : 'lightcoral';
    ctx.fillText(status, panelX + 10, panelY + 70);

    // Draw enemy sprite on the right side of the panel
    const spriteImg = sprites.get(enemy.sprite);
    const spriteSize = 32;
    const spriteX = panelX + panelWidth - spriteSize - 8;
    const spriteY = panelY + (panelHeight - spriteSize) / 2;
    if (spriteImg) {
        ctx.drawImage(spriteImg, spriteX, spriteY, spriteSize, spriteSize);
    } else {
        ctx.fillStyle = 'green';
        ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
    }

    ctx.restore();
}

function isWithinAttackRange(enemy: Enemy) {
    if (!gameState) return false;
    const player = gameState.player;
    const playerCenterX = player.x + 16; // player sprite 32x32
    const playerCenterY = player.y + 16;
    const enemyCenterX = enemy.x + 12;   // enemy sprite 24x24
    const enemyCenterY = enemy.y + 12;
    const dx = enemyCenterX - playerCenterX;
    const dy = enemyCenterY - playerCenterY;
    return Math.hypot(dx, dy) <= player.attackRange;
}



function stopAttackLoop() {
    if (attackIntervalId !== null) {
        clearInterval(attackIntervalId);
        attackIntervalId = null;
    }
    attackTargetEnemyId = null;
}

function sendGameMessage(msg: any) {
    console.log('Client WS send', msg, 'enemyId type:', typeof (msg as any).enemyId);
    if (gameSocket && gameSocket.readyState === WebSocket.OPEN) {
        gameSocket.send(JSON.stringify(msg));
    } else {
        pendingMessages.push(msg);
    }
}

function appendChatMessage(message: ChatMessage) {
    chatMessages.push(message);
    if (chatMessages.length > 100) {
        chatMessages.shift();
    }
    if (!chatMessagesDiv) return;

    chatMessagesDiv.innerHTML = "";
    const recent = chatMessages.slice(-30);
    for (const msg of recent) {
        const line = document.createElement('div');
        line.style.fontSize = '12px';
        line.style.color = msg.system ? '#ffeb3b' : '#ffffff';
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const prefix = msg.system ? '[System]' : msg.from ? `[${msg.from}]` : '';
        line.textContent = `${time} ${prefix} ${msg.text}`.trim();
        chatMessagesDiv.appendChild(line);
    }
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

function startAttackLoop(enemyId: number) {
    // WebSocket: send one attack message; server handles auto-attacks
    stopAttackLoop();
    attackTargetEnemyId = enemyId;
    sendGameMessage({ type: 'attack', enemyId });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
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

async function handleGameStateMessage(loadedGameState: GameState) {
    // Fallback defaults for missing values
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

    // Avoid replaying old attack events on initial load: initialize the lastProcessed
    // timestamp from the first snapshot without spawning damage numbers.
    if (!hasInitializedAttackHistory) {
        if (gameState.lastAttackResult) {
            lastProcessedAttackTimestamp = gameState.lastAttackResult.timestamp;
        }
        hasInitializedAttackHistory = true;
    } else if (gameState.lastAttackResult && gameState.lastAttackResult.timestamp > lastProcessedAttackTimestamp) {
        lastProcessedAttackTimestamp = gameState.lastAttackResult.timestamp;
        const ar = gameState.lastAttackResult;
        spawnDamageNumber(ar.x + 12, ar.y, ar.damage.toString());

        // If the last attack killed the enemy, stop auto-attacking and clear selection.
        // This prevents automatically re-attacking or auto-selecting when the mob respawns.
        if (ar.enemyDead) {
            stopAttackLoop();
            if (selectedEntity?.type === 'enemy' && selectedEntity.id === ar.enemyId) {
                selectedEntity = null;
            }
        }
    }

    if (attackTargetEnemyId !== null && gameState) {
        const enemy = gameState.enemies.find(e => e.id === attackTargetEnemyId);
        if (!enemy) {
            // Target no longer exists (likely died); ensure we stop tracking it
            stopAttackLoop();
        } else if (isWithinAttackRange(enemy)) {
            startAttackLoop(enemy.id);
        }
    }

    // If stats panel is open, refresh its values
    if (statsContainer && statsContainer.style.display !== 'none') {
        updateStatsPanel();
    }
}

function spendStat(stat: 'STR' | 'VIT' | 'DEX' | 'LUK' | 'INT' | 'WIS') {
    sendGameMessage({ type: 'spendStat', stat });
}

function connectGameSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/ws`;

    if (gameSocket) {
        try { gameSocket.close(); } catch {}
    }
    gameSocket = new WebSocket(url);

    gameSocket.onopen = () => {
        console.log('Connected to game websocket');
        // Flush queued messages
        while (pendingMessages.length) {
            const msg = pendingMessages.shift();
            try { gameSocket?.send(JSON.stringify(msg)); } catch {}
        }
    };
    gameSocket.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'gameState') {
                await handleGameStateMessage(data.gameState as GameState);
            } else if (data.type === 'chat') {
                const msg: ChatMessage = {
                    from: typeof data.from === 'string' ? data.from : undefined,
                    text: String(data.text ?? ''),
                    system: !!data.system,
                    timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
                };
                appendChatMessage(msg);
            }
        } catch (err) {
            console.error('WS message parse error:', err);
        }
    };
    gameSocket.onclose = () => {
        console.warn('Game websocket closed, reconnecting in 1s...');
        window.setTimeout(connectGameSocket, 1000);
    };
    gameSocket.onerror = (event) => {
        console.error('Game websocket error:', event);
    };
}

world.onload = async () => {
    connectGameSocket();

    // Initialize UI overlays
    const body = document.body;
    if (body) {
        // Ensure body can be a positioning context
        body.style.position = body.style.position || 'relative';

        // Chat container (bottom-left)
        chatContainer = document.createElement('div');
        chatContainer.style.position = 'fixed';
        chatContainer.style.left = '10px';
        chatContainer.style.bottom = '10px';
        chatContainer.style.width = '600px';
        chatContainer.style.maxHeight = '220px';
        chatContainer.style.display = 'flex';
        chatContainer.style.flexDirection = 'column';
        chatContainer.style.background = 'rgba(0, 0, 0, 0.6)';
        chatContainer.style.border = '1px solid rgba(255, 255, 255, 0.25)';
        chatContainer.style.borderRadius = '4px';
        chatContainer.style.padding = '4px';
        chatContainer.style.boxSizing = 'border-box';

        chatMessagesDiv = document.createElement('div');
        chatMessagesDiv.style.flex = '1';
        chatMessagesDiv.style.overflowY = 'auto';
        chatMessagesDiv.style.marginBottom = '4px';
        chatMessagesDiv.style.fontFamily = 'sans-serif';
        chatMessagesDiv.style.fontSize = '12px';
        chatMessagesDiv.style.color = '#ffffff';

        chatInput = document.createElement('input');
        chatInput.type = 'text';
        chatInput.placeholder = 'Type message... ($ for admin command)';
        chatInput.style.width = '100%';
        chatInput.style.boxSizing = 'border-box';
        chatInput.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        chatInput.style.borderRadius = '3px';
        chatInput.style.padding = '2px 4px';
        chatInput.style.background = 'rgba(0, 0, 0, 0.8)';
        chatInput.style.color = '#ffffff';
        chatInput.style.fontFamily = 'sans-serif';
        chatInput.style.fontSize = '12px';

        chatInput.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') {
                const value = chatInput!.value.trim();
                if (value) {
                    sendGameMessage({ type: 'chat', text: value });
                    chatInput!.value = '';
                }
                ev.preventDefault();
                ev.stopPropagation();
            }
        });

        chatContainer.appendChild(chatMessagesDiv);
        chatContainer.appendChild(chatInput);
        body.appendChild(chatContainer);

        // Stats toggle button (near bottom-right of viewport)
        statsButton = document.createElement('button');
        statsButton.textContent = 'Stats';
        statsButton.style.position = 'fixed';
        statsButton.style.right = '280px';
        statsButton.style.bottom = '20px';
        statsButton.style.padding = '4px 8px';
        statsButton.style.fontSize = '12px';
        statsButton.style.fontFamily = 'sans-serif';
        statsButton.style.cursor = 'pointer';
        statsButton.style.background = 'rgba(0, 0, 0, 0.8)';
        statsButton.style.color = '#ffffff';
        statsButton.style.border = '1px solid rgba(255, 255, 255, 0.5)';
        statsButton.style.borderRadius = '3px';

        statsContainer = document.createElement('div');
        statsContainer.style.position = 'fixed';
        statsContainer.style.right = '20px';
        statsContainer.style.bottom = '120px';
        statsContainer.style.width = '260px';
        statsContainer.style.maxHeight = '300px';
        statsContainer.style.overflowY = 'auto';
        statsContainer.style.background = 'rgba(0, 0, 0, 0.85)';
        statsContainer.style.border = '1px solid rgba(255, 255, 255, 0.5)';
        statsContainer.style.borderRadius = '4px';
        statsContainer.style.padding = '8px';
        statsContainer.style.boxSizing = 'border-box';
        statsContainer.style.fontFamily = 'sans-serif';
        statsContainer.style.fontSize = '12px';
        statsContainer.style.color = '#ffffff';
        statsContainer.style.display = 'none';

        statsButton.addEventListener('click', () => {
            if (!statsContainer) return;
            const visible = statsContainer.style.display !== 'none';
            statsContainer.style.display = visible ? 'none' : 'block';
            if (!visible) {
                updateStatsPanel();
            }
        });

        body.appendChild(statsButton);
        body.appendChild(statsContainer);
    }

    requestAnimationFrame(gameLoop);
};

world.src = "/assets/world.png";

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

function updateStatsPanel() {
    if (!statsContainer || !gameState) return;
    const p = gameState.player;

    // Clear existing content
    statsContainer.innerHTML = '';

    const header = document.createElement('div');
    header.textContent = 'Stats';
    header.style.fontSize = '14px';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '6px';
    statsContainer.appendChild(header);

    const makeRow = (label: string, value: string, canSpend: boolean, statKey?: string) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.marginBottom = '4px';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        const valueSpan = document.createElement('span');
        valueSpan.textContent = value;

        row.appendChild(labelSpan);
        row.appendChild(valueSpan);

        if (canSpend && statKey) {
            const btn = document.createElement('button');
            btn.textContent = '+';
            btn.style.marginLeft = '6px';
            btn.style.padding = '0 4px';
            btn.style.fontSize = '11px';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => {
                if (!gameState) return;
                if (gameState.player.unallocatedPoints <= 0) return;
                spendStat(statKey as any);
            });
            row.appendChild(btn);
        }

        statsContainer!.appendChild(row);
    };

    // Primary stats with spend buttons
    makeRow('STR', String(p.STR), true, 'STR');
    makeRow('VIT', String(p.VIT), true, 'VIT');
    makeRow('DEX', String(p.DEX), true, 'DEX');
    makeRow('LUK', String(p.LUK), true, 'LUK');
    makeRow('INT', String(p.INT), true, 'INT');
    makeRow('WIS', String(p.WIS), true, 'WIS');

    // Derived stats / combat info
    const basePhys = 1 + 2 * p.STR + p.DEX;
    const baseMag = 1 + 2 * p.INT + p.WIS;
    const attackMin = Math.floor(basePhys * 0.8);
    const attackMax = Math.ceil(basePhys * 1.2);
    const magicMin = Math.floor(baseMag * 0.8);
    const magicMax = Math.ceil(baseMag * 1.2);
    makeRow('Attack', `${attackMin} - ${attackMax}`, false);
    makeRow('Magic Attack', `${magicMin} - ${magicMax}`, false);
    makeRow('Defense', String(p.defense), false);
    makeRow('Resistance', String(p.resistance), false);
    makeRow('Speed', String(p.speed), false);
    makeRow('Attack Speed', String(p.attackSpeed), false);

    const footer = document.createElement('div');
    footer.style.marginTop = '8px';
    footer.textContent = `Unallocated points: ${p.unallocatedPoints}`;
    statsContainer.appendChild(footer);
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

    // Enemy info panel (top-left)
    if (selectedEntity?.type === 'enemy') {
        const selected = selectedEntity;
        const enemy = gameState.enemies.find(e => e.id === selected.id);
        if (enemy) {
            drawSelectedEnemyPanel(enemy);
        }
    }

    // Player info panel (bottom-right)
    drawPlayerInfoPanel();
}

function drawPlayerInfoPanel() {
    if (!gameState) return;
    const p = gameState.player;

    const panelWidth = 260;
    const panelHeight = 90;
    const panelX = canvas.width - panelWidth - 10;
    const panelY = canvas.height - panelHeight - 10;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(p.name || 'Player', panelX + 10, panelY + 20);
    ctx.font = '12px sans-serif';
    ctx.fillText(`Level ${p.level}`, panelX + 10, panelY + 36);

    // Health
    ctx.fillText(`HP: ${p.currHealth}/${p.maxHealth}`, panelX + 10, panelY + 52);

    // Mana
    ctx.fillText(`MP: ${p.currMana}/${p.maxMana}`, panelX + 10, panelY + 66);

    // Experience
    const expText = `${p.experience}/${p.expToNextLevel}`;
    ctx.fillText(`EXP: ${expText}`, panelX + 10, panelY + 80);

    ctx.restore();
}

async function movePlayer(x?: number, y?: number, enemyId?: number) {
    if (typeof enemyId === 'number') {
        sendGameMessage({ type: 'move', enemyId });
    } else if (typeof x === 'number' && typeof y === 'number') {
        sendGameMessage({ type: 'move', x, y });
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
                // Always request attack; server will auto-attack when in range
                attackTargetEnemyId = enemy.id;
                if (!isWithinAttackRange(enemy)) {
                    // Ask server to move toward this enemy; coordinates are computed server-side
                    movePlayer(undefined, undefined, enemy.id);
                }
                startAttackLoop(enemy.id);
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
    movePlayer(x - 16, y - 16);
});