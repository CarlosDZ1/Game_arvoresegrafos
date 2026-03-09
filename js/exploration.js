// =============================================================
//  exploration.js – Interactive District Exploration
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================

import { DISTRICTS } from './graph.js';

// ── District Scene Data ───────────────────────────────────────
const SCENES = {
    nexus: {
        title: 'NEXUS CORE',
        subtitle: 'Centro neural da cidade — torres de dados e neon infinito',
        bgClass: 'scene-nexus',
        bgImage: 'sprites/backgrounds/NexusCore.png',
        npcName: 'INTERMEDIÁRIA',
        npcIcon: '👤',
        npcImage: 'sprites/NPC/Intermediaria(NexusCore).png',
        npcX: 75,
        npcY: -30, // ajuste vertical em px (positivo = mais alto, negativo = mais baixo)
        npcScale: 1.2, // escala do NPC (1 = 100%, 1.5 = 150%, 0.8 = 80%)
        objects: [],
    },
    docks: {
        title: 'IRON DOCKS',
        subtitle: 'Porto enferrujado — barcaças e carga ilegal',
        bgClass: 'scene-docks',
        bgImage: 'sprites/backgrounds/IronDocks.png',
        npcName: 'LÍDER DA GANGUE',
        npcIcon: '🔧',
        npcImage: 'sprites/NPC/LiderDeGangue.png',
        npcX: 70,
        npcY: -40,
        npcScale: 1.4,
        objects: [],
    },
    ghost: {
        title: 'GHOST QUARTER',
        subtitle: 'Lar dos esquecidos — fantasmas holográficos na névoa',
        bgClass: 'scene-ghost',
        bgImage: 'sprites/backgrounds/GhostQuarter.png',
        npcName: 'MÉDICA CLANDESTINA',
        npcIcon: '💉',
        npcImage: 'sprites/NPC/MedicaClantestina.png',
        npcX: 65,
        npcY: 30,
        npcScale: 1,
        objects: [],
    },
    bazaar: {
        title: 'CHROME BAZAAR',
        subtitle: 'Mil vendedores, mil golpes — ferro de solda e macarrão',
        bgClass: 'scene-bazaar',
        bgImage: 'sprites/backgrounds/ChromeBazaar.png',
        npcName: 'VENDEDOR CHROME',
        npcIcon: '🔩',
        npcImage: 'sprites/NPC/Vendedor.png',
        npcX: 60,
        npcY: 90,
        npcScale: 0.6,
        objects: [],
    },
    slums: {
        title: 'NEURAL SLUMS',
        subtitle: 'Superlotadas, sobrecarregadas — eternamente em chamas',
        bgClass: 'scene-slums',
        bgImage: 'sprites/backgrounds/NeuralSlums.png',
        npcName: 'CORREDORA LOCAL',
        npcIcon: '🏃',
        npcImage: 'sprites/NPC/corredora.png',
        npcX: 72,
        npcY: -30,
        npcScale: 1.2,
        objects: [],
    },
    bridge: {
        title: 'SKYBRIDGE',
        subtitle: 'Rodovia elevada acima das nuvens — vista da cidade inteira',
        bgClass: 'scene-bridge',
        bgImage: 'sprites/backgrounds/SkyBridge.png',
        npcName: 'OPERADOR DA PONTE',
        npcIcon: '🔑',
        npcImage: 'sprites/NPC/OperadorPonte.png',
        npcX: 68,
        npcY: -25,
        npcScale: 1.2,
        objects: [],
    },
    helix: {
        title: 'HELIX LAB',
        subtitle: 'Campus da megacorp — corredores estéreis e guardas',
        bgClass: 'scene-helix',
        bgImage: 'sprites/backgrounds/HelixLab.png',
        npcName: 'GUARDA DO LAB',
        npcIcon: '🔬',
        npcImage: 'sprites/NPC/GuardaLab.png',
        npcX: 74,
        npcY: -15,
        npcScale: 1.25,
        objects: [],
    },
    blackout: {
        title: 'BLACKOUT ZONE',
        subtitle: 'Sem sinal, sem lei — o ponto de entrega final',
        bgClass: 'scene-blackout',
        bgImage: 'sprites/backgrounds/BlackoutZone.png',
        npcName: 'RECEPTOR',
        npcIcon: '📡',
        npcImage: 'sprites/NPC/Receptor.png',
        npcX: 78,
        npcY: -20,
        npcScale: 1,
        objects: [],
    },
};

// ── State ─────────────────────────────────────────────────────
let _active = false;
let _districtId = null;
let _onInteract = null;
let _playerX = 15; // % from left
let _playerDir = 1; // 1 = right, -1 = left
let _isWalking = false;
let _interactable = false;
let _keys = {};
let _animFrame = null;
let _rainDrops = [];
let _walkFrame = 0;
let _walkTick = 0;

// Jump state
let _isJumping = false;
let _jumpVelocity = 0;
let _jumpY = 0; // current jump height offset in px
let _jumpFrame = 0;

const PLAYER_SPEED = 0.35; // % per frame (~60fps)
const WALK_FRAMES = 6;
const WALK_FRAME_RATE = 8; // change frame every N game ticks (~133ms at 60fps)
const INTERACT_RANGE = 8; // % distance to NPC to interact
const JUMP_VELOCITY = -12; // initial upward velocity (negative = up)
const JUMP_GRAVITY = 0.6;  // gravity pull per frame
const JUMP_FRAMES = 3;
const IDLE_FRAMES = 2;
const IDLE_FRAME_RATE = 40; // change frame every N ticks (~670ms at 60fps)

let _idleFrame = 0;
let _idleTick = 0;

// ── Public API ────────────────────────────────────────────────
export function showExploration(districtId, onInteract) {
    const scene = SCENES[districtId];
    if (!scene) { onInteract(); return; } // fallback

    _districtId = districtId;
    _onInteract = onInteract;
    _active = true;
    _playerX = 15;
    _playerDir = 1;
    _isWalking = false;
    _interactable = false;
    _keys = {};
    _walkFrame = 0;
    _walkTick = 0;
    _isJumping = false;
    _jumpVelocity = 0;
    _jumpY = 0;
    _jumpFrame = 0;
    _idleFrame = 0;
    _idleTick = 0;

    _buildScene(scene, districtId);
    _startLoop();
    _bindKeys();

    // Show screen  
    const el = document.getElementById('screen-exploration');
    if (el) {
        el.style.display = 'flex';
        el.classList.remove('fade-in');
        void el.offsetWidth;
        el.classList.add('fade-in');
    }
}

export function hideExploration() {
    _active = false;
    _unbindKeys();
    _stopLoop();

    const el = document.getElementById('screen-exploration');
    if (el) {
        el.classList.add('exploration-exit');
        setTimeout(() => {
            el.style.display = 'none';
            el.classList.remove('exploration-exit');
            el.innerHTML = '';
        }, 400);
    }
}

// ── Scene Builder ─────────────────────────────────────────────
function _buildScene(scene, districtId) {
    const container = document.getElementById('screen-exploration');
    if (!container) return;

    const districtColor = DISTRICTS[districtId]?.color || '#00ffe7';

    container.innerHTML = `
        <div class="exploration-scene ${scene.bgClass}">
            ${scene.bgImage ? `<div class="exploration-bg-image" style="background-image:url('${scene.bgImage}')"></div>` : ''}

            <!-- Rain particles -->
            <div class="exploration-rain" id="expl-rain"></div>

            <!-- Ambient neon lights -->
            <div class="exploration-ambient">
                <div class="ambient-glow ambient-glow-1" style="background:${districtColor}"></div>
                <div class="ambient-glow ambient-glow-2" style="background:${districtColor}"></div>
            </div>

            <!-- Background buildings/objects -->
            <div class="exploration-bg-objects" id="expl-bg-objects"></div>

            <!-- Ground / floor -->
            <div class="exploration-ground"></div>
            <div class="exploration-ground-line"></div>
            <div class="exploration-ground-reflection"></div>

            <!-- NPC -->
            <div class="exploration-npc" id="expl-npc" style="left:${scene.npcX}%; bottom:calc(22% + ${scene.npcY || 0}px)">
                <div class="npc-glow" style="background:${districtColor}"></div>
                <img class="npc-sprite-img" src="${scene.npcImage}" alt="${scene.npcName}" draggable="false" style="height:${140 * (scene.npcScale || 1)}px" />
                <div class="npc-name" style="color:${districtColor}">${scene.npcName}</div>
                <div class="npc-interact-prompt" id="npc-prompt" style="border-color:${districtColor}; color:${districtColor}">
                    [ E ] INTERAGIR
                </div>
            </div>

            <!-- Player Character -->
            <div class="exploration-player ${districtId === 'ghost' ? 'player-adjust-ghost' : districtId === 'slums' ? 'player-adjust-slums' : ''}" id="expl-player" style="left:${_playerX}%">
                <div class="player-glow"></div>
                <img class="player-sprite-img" id="player-sprite-img" src="sprites/PlayerIdle/Idle1.png" alt="courier" draggable="false" />
                <div class="player-shadow"></div>
            </div>

            <!-- HUD -->
            <div class="exploration-hud">
                <div class="expl-hud-location">
                    <span class="expl-hud-icon" style="color:${districtColor}">◆</span>
                    <span class="expl-hud-title" style="color:${districtColor}">${scene.title}</span>
                </div>
                <div class="expl-hud-subtitle">${scene.subtitle}</div>
            </div>

            <!-- Controls hint -->
            <div class="exploration-controls">
                <span class="ctrl-key">W A S D</span> ou <span class="ctrl-key">← →</span> mover
                &nbsp;&nbsp;
                <span class="ctrl-key">E</span> interagir
            </div>
        </div>
    `;

    // Build background objects
    _buildBgObjects(scene, districtColor);

    // Create rain
    _createRain();
}

function _buildBgObjects(scene, color) {
    const container = document.getElementById('expl-bg-objects');
    if (!container) return;

    (scene.objects || []).forEach(obj => {
        if (obj.type === 'building') {
            const el = document.createElement('div');
            el.className = 'bg-building';
            el.style.cssText = `
                left: ${obj.x}%;
                height: ${obj.h}%;
                width: ${obj.w}%;
                background: ${obj.color};
                border: 1px solid ${obj.color.replace(/[\d.]+\)$/, '0.3)')};
            `;
            // Add random window lights
            const windowCount = Math.floor(Math.random() * 5) + 2;
            for (let i = 0; i < windowCount; i++) {
                const win = document.createElement('div');
                win.className = 'bg-window';
                win.style.cssText = `
                    top: ${10 + Math.random() * 70}%;
                    left: ${10 + Math.random() * 60}%;
                    background: ${color};
                    opacity: ${0.2 + Math.random() * 0.4};
                    animation-delay: ${Math.random() * 5}s;
                `;
                el.appendChild(win);
            }
            container.appendChild(el);
        } else if (obj.type === 'sign') {
            const el = document.createElement('div');
            el.className = 'bg-sign';
            el.style.cssText = `
                left: ${obj.x}%;
                color: ${obj.color};
                text-shadow: 0 0 10px ${obj.color}, 0 0 30px ${obj.color};
                border-color: ${obj.color};
            `;
            el.textContent = obj.text;
            container.appendChild(el);
        } else if (obj.type === 'stall') {
            const el = document.createElement('div');
            el.className = 'bg-stall';
            el.style.cssText = `
                left: ${obj.x}%;
                border-color: ${obj.color};
                box-shadow: 0 0 15px ${obj.color}40;
            `;
            container.appendChild(el);
        } else if (obj.type === 'crane') {
            const el = document.createElement('div');
            el.className = 'bg-crane';
            el.style.cssText = `left: ${obj.x}%;`;
            container.appendChild(el);
        }
    });
}

function _createRain() {
    const container = document.getElementById('expl-rain');
    if (!container) return;
    container.innerHTML = '';
    const count = 60;
    for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        drop.style.cssText = `
            left: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 2}s;
            animation-duration: ${0.4 + Math.random() * 0.4}s;
            opacity: ${0.15 + Math.random() * 0.25};
        `;
        container.appendChild(drop);
    }
}

// ── Game Loop ─────────────────────────────────────────────────
function _startLoop() {
    _stopLoop();
    function loop() {
        if (!_active) return;
        _update();
        _animFrame = requestAnimationFrame(loop);
    }
    _animFrame = requestAnimationFrame(loop);
}

function _stopLoop() {
    if (_animFrame) {
        cancelAnimationFrame(_animFrame);
        _animFrame = null;
    }
}

function _update() {
    // Movement
    let moving = false;
    if (_keys['ArrowRight'] || _keys['KeyD']) {
        _playerX = Math.min(90, _playerX + PLAYER_SPEED);
        _playerDir = 1;
        moving = true;
    }
    if (_keys['ArrowLeft'] || _keys['KeyA']) {
        _playerX = Math.max(5, _playerX - PLAYER_SPEED);
        _playerDir = -1;
        moving = true;
    }

    // Jump trigger (Space, W, or ArrowUp)
    if ((_keys['Space'] || _keys['KeyW'] || _keys['ArrowUp']) && !_isJumping) {
        _isJumping = true;
        _jumpVelocity = JUMP_VELOCITY;
        _jumpFrame = 0;
    }

    // Jump physics
    if (_isJumping) {
        _jumpVelocity += JUMP_GRAVITY;
        _jumpY += _jumpVelocity;

        // Determine jump sprite frame based on arc phase
        if (_jumpVelocity < -2) {
            _jumpFrame = 0; // ascending -> Jump1
        } else if (_jumpVelocity < 2) {
            _jumpFrame = 1; // peak -> Jump2
        } else {
            _jumpFrame = 2; // descending -> Jump3
        }

        // Land
        if (_jumpY >= 0) {
            _jumpY = 0;
            _jumpVelocity = 0;
            _isJumping = false;
            _jumpFrame = 0;
        }
    }

    _isWalking = moving && !_isJumping;

    // Update player position & animation
    const playerEl = document.getElementById('expl-player');
    if (playerEl) {
        playerEl.style.left = `${_playerX}%`;
        playerEl.style.transform = `scaleX(${_playerDir}) translateY(${_jumpY}px)`;
        if (_isWalking) {
            playerEl.classList.add('walking');
        } else {
            playerEl.classList.remove('walking');
        }
    }

    // Sprite frame animation
    const spriteImg = document.getElementById('player-sprite-img');
    if (spriteImg) {
        if (_isJumping) {
            // Jump sprites
            spriteImg.src = `sprites/PlayerJump/Jump${_jumpFrame + 1}.png`;
        } else if (moving) {
            // Walk sprites
            _walkTick++;
            if (_walkTick >= WALK_FRAME_RATE) {
                _walkTick = 0;
                _walkFrame = (_walkFrame + 1) % WALK_FRAMES;
            }
            spriteImg.src = `sprites/PlayerWalk/Walkfix_${_walkFrame + 1}.png`;
        } else {
            // Idle breathing
            _walkFrame = 0;
            _walkTick = 0;
            _idleTick++;
            if (_idleTick >= IDLE_FRAME_RATE) {
                _idleTick = 0;
                _idleFrame = (_idleFrame + 1) % IDLE_FRAMES;
            }
            spriteImg.src = `sprites/PlayerIdle/Idle${_idleFrame + 1}.png`;
        }
    }

    // Check NPC proximity
    const scene = SCENES[_districtId];
    if (scene) {
        const dist = Math.abs(_playerX - scene.npcX);
        _interactable = dist < INTERACT_RANGE;

        const prompt = document.getElementById('npc-prompt');
        if (prompt) {
            prompt.classList.toggle('visible', _interactable);
        }
    }

    // Interact
    if (_interactable && _keys['KeyE']) {
        _keys['KeyE'] = false; // prevent repeat
        _triggerInteraction();
    }
}

function _triggerInteraction() {
    if (!_onInteract) return;
    const callback = _onInteract;
    _onInteract = null;

    // Small delay for visual feedback
    const npc = document.getElementById('expl-npc');
    if (npc) npc.classList.add('npc-activated');

    setTimeout(() => {
        hideExploration();
        setTimeout(() => callback(), 450);
    }, 300);
}

// ── Key Bindings ──────────────────────────────────────────────
function _onKeyDown(e) {
    if (!_active) return;
    _keys[e.code] = true;

    // Prevent scrolling with WASD/arrows
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
}

function _onKeyUp(e) {
    _keys[e.code] = false;
}

function _bindKeys() {
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
}

function _unbindKeys() {
    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
    _keys = {};
}
