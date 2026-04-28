const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const world = new Image();

// Keep the game world's coordinate system stable (world units), regardless of screen size.
// We render the world with a view transform (scale + letterbox offset).
let worldWidth = 1536;
let worldHeight = 864;

let dpr = window.devicePixelRatio || 1;
let canvasCssWidth = window.innerWidth;
let canvasCssHeight = window.innerHeight;

// World -> screen transform (in CSS pixels)
let viewScale = 1;
let viewOffsetX = 0;
let viewOffsetY = 0;

function updateViewTransform() {
    viewScale = Math.min(canvasCssWidth / worldWidth, canvasCssHeight / worldHeight);
    viewOffsetX = (canvasCssWidth - worldWidth * viewScale) / 2;
    viewOffsetY = (canvasCssHeight - worldHeight * viewScale) / 2;
}

function setWorldTransform() {
    // World coords in "world units"; scale/offset to viewport; include DPR for crispness.
    ctx.setTransform(viewScale * dpr, 0, 0, viewScale * dpr, viewOffsetX * dpr, viewOffsetY * dpr);
}

function setUiTransform() {
    // UI coords in CSS pixels; include DPR for crispness.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resizeCanvasToScreen() {
    dpr = window.devicePixelRatio || 1;
    canvasCssWidth = window.innerWidth;
    canvasCssHeight = window.innerHeight;

    // Make the canvas match the viewport size.
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = `${canvasCssWidth}px`;
    canvas.style.height = `${canvasCssHeight}px`;

    canvas.width = Math.floor(canvasCssWidth * dpr);
    canvas.height = Math.floor(canvasCssHeight * dpr);

    updateViewTransform();
    layoutOverlayElements();
}

function screenToWorld(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const wx = (sx - viewOffsetX) / viewScale;
    const wy = (sy - viewOffsetY) / viewScale;
    return { x: wx, y: wy };
}

function getWorldViewportRectCss() {
    const width = worldWidth * viewScale;
    const height = worldHeight * viewScale;
    return {
        left: viewOffsetX,
        top: viewOffsetY,
        width,
        height,
        right: viewOffsetX + width,
        bottom: viewOffsetY + height,
    };
}

function layoutOverlayElements() {
    const vp = getWorldViewportRectCss();
    const outsideRight = Math.max(0, canvasCssWidth - vp.right);
    const outsideBottom = Math.max(0, canvasCssHeight - vp.bottom);

    // Keep DOM overlays inside the world viewport region (not in the letterbox bars)
    if (chatContainer) {
        const maxWidth = Math.max(280, vp.width - 20);
        chatContainer.style.left = `${vp.left + 10}px`;
        chatContainer.style.bottom = `${outsideBottom + 10}px`;
        chatContainer.style.width = `${Math.min(600, maxWidth)}px`;
    }

    // Avoid overlapping the canvas-drawn player status panel (bottom-right).
    // The player status panel is 260x90 and sits at (vp.right - 260 - 10, vp.bottom - 90 - 10).
    const playerPanelHeight = 90;
    const playerPanelMargin = 10;
    const buttonGapFromPlayerPanel = 12;
    const buttonBottom = outsideBottom + playerPanelHeight + playerPanelMargin + buttonGapFromPlayerPanel;

    const statsBtnHeight = statsButton?.offsetHeight ?? 24;
    const panelGapFromButtons = 10;
    const panelBottom = buttonBottom + statsBtnHeight + panelGapFromButtons;

    if (statsButton) {
        statsButton.style.right = `${outsideRight + 20}px`;
        statsButton.style.bottom = `${buttonBottom}px`;
    }

    if (optionsButton) {
        // to the left of the stats button
        optionsButton.style.right = `${outsideRight + 110}px`;
        optionsButton.style.bottom = `${buttonBottom}px`;
    }

    if (statsContainer) {
        statsContainer.style.right = `${outsideRight + 20}px`;
        statsContainer.style.bottom = `${panelBottom}px`;
    }

    if (optionsContainer) {
        // to the left of the stats panel
        optionsContainer.style.right = `${outsideRight + 20 + 270}px`;
        optionsContainer.style.bottom = `${panelBottom}px`;
    }
}

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
let optionsButton: HTMLButtonElement | null = null;
let optionsContainer: HTMLDivElement | null = null;

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

    lastLevelUp?: {
        level: number;
        timestamp: number;
    };
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

type AttackEvent = {
    playerId: string;
    enemyId: number;
    damage: number;
    timestamp: number;
    x: number;
    y: number;
    enemyDead: boolean;
};

type GameState = {
    // authoritative fields
    players: Record<string, Player>;
    enemies: Enemy[];
    selectedTargets?: Record<string, number | null>;
    lastAttackEvents?: AttackEvent[];

    // per-client fields
    selfId: string;
    player: Player;
    selectedEnemyId: number | null;

    lastAttackResult?: {
        enemyId: number;
        damage: number;
        timestamp: number;
        x: number;
        y: number;
        enemyDead: boolean;
    };
    lastIncomingHit?: {
        damage: number;
        timestamp: number;
        x: number;
        y: number;
    };
}

let gameState: GameState | null = null;
const sprites: Map<string, HTMLImageElement> = new Map();
let selectedEntity:
    | { type: 'player'; id: string }
    | { type: 'enemy'; id: number }
    | null = null;
let attackTargetEnemyId: number | null = null;
let attackIntervalId: number | null = null;
let gameStatePollId: number | null = null;
let lastProcessedAttackTimestamp: number = 0;
let lastProcessedIncomingHitTimestamp: number = 0;
let hasInitializedAttackHistory = false;

const lastProcessedLevelUpByPlayerId: Record<string, number> = {};

let showOtherPlayersDamage = (localStorage.getItem('showOtherPlayersDamage') ?? '0') === '1';
let lastProcessedOtherAttackEventTimestamp = 0;
const processedOtherAttackEventKeys = new Map<string, number>();
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
    color: string;
};

let damageNumbers: DamageNumber[] = [];

function getEntityAt(x: number, y: number) {
    if (!gameState) return null;

    const playerWidth = 32;
    const playerHeight = 32;

    // Prefer other players over self if overlapping.
    const players = Object.values(gameState.players ?? {});

    for (const p of players) {
        if (p.id === gameState.selfId) continue;
        if (x >= p.x && x <= p.x + playerWidth && y >= p.y && y <= p.y + playerHeight) {
            return { type: 'player' as const, id: p.id };
        }
    }

    // Self
    const self = gameState.player;
    if (x >= self.x && x <= self.x + playerWidth && y >= self.y && y <= self.y + playerHeight) {
        return { type: 'player' as const, id: self.id };
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

function drawNameTag(x: number, y: number, width: number, name: string) {
    const text = `<${name}>`;
    const textX = x + width / 2;
    const textY = y - 6;

    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillStyle = 'white';
    ctx.strokeText(text, textX, textY);
    ctx.fillText(text, textX, textY);
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
    const vp = getWorldViewportRectCss();
    const panelX = vp.left + 10;
    const panelY = vp.top + 10;
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

function isWithinPlayerAttackRange(target: Player) {
    if (!gameState) return false;
    const attacker = gameState.player;
    if (!attacker) return false;

    const attackerCenterX = attacker.x + 16;
    const attackerCenterY = attacker.y + 16;
    const targetCenterX = target.x + 16;
    const targetCenterY = target.y + 16;
    const dx = targetCenterX - attackerCenterX;
    const dy = targetCenterY - attackerCenterY;
    return Math.hypot(dx, dy) <= attacker.attackRange;
}

function drawSelectedPlayerPanel(player: Player) {
    const vp = getWorldViewportRectCss();
    const panelX = vp.left + 10;
    const panelY = vp.top + 10;
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
    ctx.fillText(player.name || `Player`, panelX + 10, panelY + 22);
    ctx.font = '12px sans-serif';
    ctx.fillText(`Level ${player.level}`, panelX + 10, panelY + 38);
    ctx.fillText(`HP: ${player.currHealth}/${player.maxHealth}`, panelX + 10, panelY + 54);

    const status = isWithinPlayerAttackRange(player) ? 'In range' : 'Out of range';
    ctx.fillStyle = status === 'In range' ? 'lightgreen' : 'lightcoral';
    ctx.fillText(status, panelX + 10, panelY + 70);

    // Draw player sprite on the right side of the panel
    const spriteImg = sprites.get(player.sprite);
    const spriteSize = 32;
    const spriteX = panelX + panelWidth - spriteSize - 8;
    const spriteY = panelY + (panelHeight - spriteSize) / 2;
    if (spriteImg) {
        ctx.drawImage(spriteImg, spriteX, spriteY, spriteSize, spriteSize);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
    }

    ctx.restore();
}

function stopAttackLoop() {
    if (attackIntervalId !== null) {
        clearInterval(attackIntervalId);
        attackIntervalId = null;
    }
    attackTargetEnemyId = null;
    // Tell the server to stop auto-attacking on our behalf
    sendGameMessage({ type: 'stopAttack' });
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
    // local player
    spriteUrls.add(gameState.player.sprite);
    // other players
    Object.values(gameState.players ?? {}).forEach(p => spriteUrls.add(p.sprite));
    // enemies
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

    // Avoid replaying old attack events on initial load: initialize baselines
    // from the first snapshot without spawning damage numbers.
    if (!hasInitializedAttackHistory) {
        if (gameState.lastAttackResult) {
            lastProcessedAttackTimestamp = gameState.lastAttackResult.timestamp;
        }
        if (gameState.lastIncomingHit) {
            lastProcessedIncomingHitTimestamp = gameState.lastIncomingHit.timestamp;
        }

        // Initialize level-up baselines so we don't replay old level-ups on first snapshot
        for (const p of Object.values(gameState.players ?? {})) {
            if (p.lastLevelUp) {
                lastProcessedLevelUpByPlayerId[p.id] = p.lastLevelUp.timestamp;
            }
        }

        // Initialize other-player damage baselines so we don't replay old events
        const eventsInit = gameState.lastAttackEvents ?? [];
        if (eventsInit.length) {
            lastProcessedOtherAttackEventTimestamp = Math.max(...eventsInit.map(e => e.timestamp ?? 0));
        }

        hasInitializedAttackHistory = true;
    } else if (gameState.lastAttackResult && gameState.lastAttackResult.timestamp > lastProcessedAttackTimestamp) {
        lastProcessedAttackTimestamp = gameState.lastAttackResult.timestamp;
        const ar = gameState.lastAttackResult;
        // Player -> enemy damage numbers (white)
        spawnDamageNumber(ar.x + 12, ar.y, ar.damage.toString(), 'white');

        // If the last attack killed the enemy, stop auto-attacking and clear selection.
        // This prevents automatically re-attacking or auto-selecting when the mob respawns.
        if (ar.enemyDead) {
            stopAttackLoop();
            if (selectedEntity?.type === 'enemy' && selectedEntity.id === ar.enemyId) {
                selectedEntity = null;
            }
        }
    }

    // Incoming damage from enemies
    const incoming = gameState.lastIncomingHit;
    if (incoming && incoming.timestamp > lastProcessedIncomingHitTimestamp) {
        lastProcessedIncomingHitTimestamp = incoming.timestamp;
        // Enemy -> player damage numbers (red)
        spawnDamageNumber(incoming.x + 16, incoming.y, incoming.damage.toString(), 'red');
    }

    // Level-up effects (green floating text) for any player
    for (const p of Object.values(gameState.players ?? {})) {
        const evt = p.lastLevelUp;
        if (!evt) continue;
        const lastTs = lastProcessedLevelUpByPlayerId[p.id] ?? 0;
        if (evt.timestamp > lastTs) {
            lastProcessedLevelUpByPlayerId[p.id] = evt.timestamp;
            spawnDamageNumber(p.x + 16, p.y, `Level ${evt.level}!`, 'lime');
        }
    }

    // Other-player outgoing damage numbers (light grey) (optional)
    if (showOtherPlayersDamage) {
        const now = Date.now();
        const events = gameState.lastAttackEvents ?? [];

        // prune processed keys (keep ~10s)
        for (const [k, ts] of processedOtherAttackEventKeys.entries()) {
            if (now - ts > 10_000) {
                processedOtherAttackEventKeys.delete(k);
            }
        }

        for (const evt of events) {
            if (!evt) continue;
            if (evt.playerId === gameState.selfId) continue;
            if (typeof evt.damage !== 'number' || evt.damage <= 0) continue;

            // Only process events that are at/after our baseline.
            // We still use a key set to avoid duplicates (multiple events can share the same timestamp).
            if (evt.timestamp < lastProcessedOtherAttackEventTimestamp) continue;

            const key = `${evt.timestamp}:${evt.playerId}:${evt.enemyId}:${evt.damage}`;
            if (processedOtherAttackEventKeys.has(key)) continue;
            processedOtherAttackEventKeys.set(key, evt.timestamp);

            spawnDamageNumber(evt.x + 12, evt.y, String(evt.damage), '#d0d0d0');
        }

        // Advance baseline (monotonic)
        if (events.length) {
            const maxTs = Math.max(...events.map(e => e.timestamp ?? 0));
            if (maxTs > lastProcessedOtherAttackEventTimestamp) {
                lastProcessedOtherAttackEventTimestamp = maxTs;
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
    if (optionsContainer && optionsContainer.style.display !== 'none') {
        updateOptionsPanel();
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
            } else if (data.type === 'bonk') {
                const x = typeof data.x === 'number' ? data.x : undefined;
                const y = typeof data.y === 'number' ? data.y : undefined;
                if (x !== undefined && y !== undefined) {
                    spawnDamageNumber(x + 16, y, 'bonk', 'white');
                }
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
    // Use actual world image size if available
    if (world.naturalWidth && world.naturalHeight) {
        worldWidth = world.naturalWidth;
        worldHeight = world.naturalHeight;
    }

    resizeCanvasToScreen();
    window.addEventListener('resize', () => {
        resizeCanvasToScreen();
    });

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
        chatInput.placeholder = 'Type message...';
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

        // Options toggle button (near stats)
        optionsButton = document.createElement('button');
        optionsButton.textContent = 'Options';
        optionsButton.style.position = 'fixed';
        optionsButton.style.right = '360px';
        optionsButton.style.bottom = '20px';
        optionsButton.style.padding = '4px 8px';
        optionsButton.style.fontSize = '12px';
        optionsButton.style.fontFamily = 'sans-serif';
        optionsButton.style.cursor = 'pointer';
        optionsButton.style.background = 'rgba(0, 0, 0, 0.8)';
        optionsButton.style.color = '#ffffff';
        optionsButton.style.border = '1px solid rgba(255, 255, 255, 0.5)';
        optionsButton.style.borderRadius = '3px';

        optionsContainer = document.createElement('div');
        optionsContainer.style.position = 'fixed';
        // sit just to the left of the stats panel
        optionsContainer.style.right = '290px';
        optionsContainer.style.bottom = '120px';
        optionsContainer.style.width = '260px';
        optionsContainer.style.maxHeight = '300px';
        optionsContainer.style.overflowY = 'auto';
        optionsContainer.style.background = 'rgba(0, 0, 0, 0.85)';
        optionsContainer.style.border = '1px solid rgba(255, 255, 255, 0.5)';
        optionsContainer.style.borderRadius = '4px';
        optionsContainer.style.padding = '8px';
        optionsContainer.style.boxSizing = 'border-box';
        optionsContainer.style.fontFamily = 'sans-serif';
        optionsContainer.style.fontSize = '12px';
        optionsContainer.style.color = '#ffffff';
        optionsContainer.style.display = 'none';

        optionsButton.addEventListener('click', () => {
            if (!optionsContainer) return;
            const visible = optionsContainer.style.display !== 'none';
            optionsContainer.style.display = visible ? 'none' : 'block';
            if (!visible) {
                updateOptionsPanel();
            }
        });

        body.appendChild(optionsButton);
        body.appendChild(optionsContainer);

        body.appendChild(statsButton);
        body.appendChild(statsContainer);

        // Position overlays inside the world viewport (not in letterboxing)
        layoutOverlayElements();
    }

    requestAnimationFrame(gameLoop);
};

world.src = "/assets/world.png";

let lastTime: number = 0;

function gameLoop(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    updateDamageNumbers(deltaTime);

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

function updateOptionsPanel() {
    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';

    const header = document.createElement('div');
    header.textContent = 'Options';
    header.style.fontSize = '14px';
    header.style.fontWeight = 'bold';
    header.style.marginBottom = '6px';
    optionsContainer.appendChild(header);

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.gap = '8px';

    const label = document.createElement('span');
    label.textContent = "Show other players' damage";

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = showOtherPlayersDamage;
    checkbox.addEventListener('change', () => {
        showOtherPlayersDamage = checkbox.checked;
        localStorage.setItem('showOtherPlayersDamage', showOtherPlayersDamage ? '1' : '0');

        // When enabling, set baselines to "now" so we don't replay old events.
        if (showOtherPlayersDamage && gameState) {
            processedOtherAttackEventKeys.clear();
            const events = gameState.lastAttackEvents ?? [];
            if (events.length) {
                lastProcessedOtherAttackEventTimestamp = Math.max(...events.map(e => e.timestamp ?? 0));
            } else {
                lastProcessedOtherAttackEventTimestamp = Date.now();
            }
        }
    });

    row.appendChild(label);
    row.appendChild(checkbox);
    optionsContainer.appendChild(row);

    const hint = document.createElement('div');
    hint.style.marginTop = '8px';
    hint.style.opacity = '0.8';
    hint.textContent = 'Shows outgoing damage numbers for other players (light grey).';
    optionsContainer.appendChild(hint);
}

function spawnDamageNumber(x: number, y: number, text: string, color: string = 'white') {
    damageNumbers.push({
        text,
        startX: x,
        startY: y,
        elapsed: 0,
        duration: 0.9,
        amplitude: 10,
        frequency: 3,
        color,
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
        ctx.fillStyle = damage.color || 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 2;
        ctx.strokeText(damage.text, x, y);
        ctx.fillText(damage.text, x, y);
        ctx.restore();
    });
}

function render() {
    if (!gameState) return;

    // Clear (device pixels)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill letterbox area
    setUiTransform();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasCssWidth, canvasCssHeight);

    // --- World space ---
    setWorldTransform();

    // Draw the world background in world coordinates
    ctx.drawImage(world, 0, 0, worldWidth, worldHeight);

    const showAttackRange =
        selectedEntity?.type === 'enemy' ||
        selectedEntity?.type === 'player' ||
        attackTargetEnemyId !== null ||
        attackIntervalId !== null;
    if (showAttackRange) {
        drawAttackRangeCircle(gameState.player.attackRange);
    }

    // Draw other players first (so local player is on top)
    for (const p of Object.values(gameState.players ?? {})) {
        if (p.id === gameState.selfId) continue;

        const img = sprites.get(p.sprite);
        if (img) {
            ctx.drawImage(img, p.x, p.y, 32, 32);
        } else {
            ctx.fillStyle = 'rgba(0, 140, 255, 0.65)';
            ctx.fillRect(p.x, p.y, 32, 32);
        }

        if (p.name) {
            drawNameTag(p.x, p.y, 32, p.name);
        }

        if (selectedEntity?.type === 'player' && selectedEntity.id === p.id) {
            drawOutline(p.x, p.y, 32, 32);
        }
    }

    // Draw local player
    const playerImg = sprites.get(gameState.player.sprite);
    if (playerImg) {
        ctx.drawImage(playerImg, gameState.player.x, gameState.player.y, 32, 32);
    } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(gameState.player.x, gameState.player.y, 32, 32);
    }

    // Name tag above local player
    if (gameState.player.name) {
        drawNameTag(gameState.player.x, gameState.player.y, 32, gameState.player.name);
    }

    if (selectedEntity?.type === 'player' && selectedEntity.id === gameState.selfId) {
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

    // --- UI space ---
    setUiTransform();

    // Enemy/player info panel (top-left)
    if (selectedEntity && selectedEntity.type === 'enemy') {
        const selectedEnemyId = selectedEntity.id;
        const enemy = gameState.enemies.find(e => e.id === selectedEnemyId);
        if (enemy) {
            drawSelectedEnemyPanel(enemy);
        }
    } else if (selectedEntity && selectedEntity.type === 'player') {
        const selectedPlayerId = selectedEntity.id;
        const p = gameState.players[selectedPlayerId];
        if (p && p.id !== gameState.selfId) {
            drawSelectedPlayerPanel(p);
        }
    }

    // Player info panel (bottom-right)
    drawPlayerInfoPanel();
}

function drawPlayerInfoPanel() {
    if (!gameState) return;
    const p = gameState.player;

    const vp = getWorldViewportRectCss();

    const panelWidth = 260;
    const panelHeight = 90;
    const panelX = vp.right - panelWidth - 10;
    const panelY = vp.bottom - panelHeight - 10;

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
    const pt = screenToWorld(event.clientX, event.clientY);
    if (pt.x < 0 || pt.y < 0 || pt.x > worldWidth || pt.y > worldHeight) {
        // Clicked outside the world (letterboxed area)
        return;
    }

    const x = pt.x;
    const y = pt.y;

    const hit = getEntityAt(x, y);
    if (hit?.type === 'enemy' && gameState) {
        const enemy = gameState.enemies.find(e => e.id === hit.id);
        if (enemy) {
            // Alt+click: put the enemy instance (DB) id into the chat input for admin commands.
            if (event.altKey) {
                if (chatInput) {
                    chatInput.value = String(enemy.id);
                    chatInput.focus();
                    chatInput.select();
                }
                appendChatMessage({
                    text: `Enemy instance id: ${enemy.id}`,
                    system: true,
                    timestamp: Date.now(),
                });
                return;
            }

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

    if (hit?.type === 'player' && gameState) {
        // Selecting a player target is separate from enemy auto-attack.
        stopAttackLoop();

        // If we're clicking the already-targeted player again, attempt a "bonk".
        if (hit.id !== gameState.selfId && selectedEntity?.type === 'player' && selectedEntity.id === hit.id) {
            const target = gameState.players[hit.id];
            if (target && isWithinPlayerAttackRange(target)) {
                sendGameMessage({ type: 'bonkPlayer', targetPlayerId: hit.id });
            }
            return;
        }

        // Otherwise just target them.
        selectedEntity = hit;
        return;
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