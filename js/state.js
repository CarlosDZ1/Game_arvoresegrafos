// =============================================================
//  state.js – Game State Manager
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================

const INITIAL_STATE = {
    currentNode: 'bridge',
    targetNode: 'blackout',
    time: 48,      // hours remaining
    credits: 2000,
    health: 100,
    visitedNodes: ['bridge'],
    decisionPath: [],     // list of choice ids made (for algo panel)
    pathTaken: ['bridge'],
    optimalPath: [],
    gameOver: false,
    won: false,
    districtsDone: new Set(), // districts where event was completed
};

let _state = { ...INITIAL_STATE, visitedNodes: ['bridge'], decisionPath: [], pathTaken: ['bridge'], districtsDone: new Set() };

export function getState() { return _state; }

export function resetState() {
    _state = {
        ...INITIAL_STATE,
        visitedNodes: ['bridge'],
        decisionPath: [],
        pathTaken: ['bridge'],
        districtsDone: new Set(),
        optimalPath: [],
    };
}

export function applyEffects(effects) {
    if (!effects) return;
    _state.time = Math.max(0, _state.time - (effects.time || 0));
    _state.credits = Math.max(0, _state.credits + (effects.credits || 0));
    _state.health = Math.min(100, Math.max(0, _state.health + (effects.health || 0)));
}

export function moveToDistrict(nodeId) {
    _state.currentNode = nodeId;
    if (!_state.visitedNodes.includes(nodeId)) _state.visitedNodes.push(nodeId);
    _state.pathTaken.push(nodeId);
}

export function recordChoice(choiceId) {
    _state.decisionPath.push(choiceId);
}

export function markDistrictDone(districtId) {
    _state.districtsDone.add(districtId);
}

export function setOptimalPath(path) {
    _state.optimalPath = path;
}

export function setGameOver(won) {
    _state.gameOver = true;
    _state.won = won;
}

export function isAlive() {
    return _state.health > 0 && _state.time > 0;
}
