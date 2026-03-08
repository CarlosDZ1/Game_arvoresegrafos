// =============================================================
//  main.js – Game Orchestrator / Entry Point
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================

import { initGraph, unlockEdge, lockEdge, DISTRICTS, getAdjacentNodes, dijkstra } from './graph.js';
import { getEvent } from './tree.js';
import { getState, resetState, applyEffects, moveToDistrict, recordChoice, markDistrictDone, setGameOver, isAlive } from './state.js';
import { initMap, render, showOptimalPath, clearOptimalPath } from './map.js';
import { showScreen, updateHUD, showEventCard, hideEventCard, showToast, showPathBanner, toggleAlgoPanel, updateAlgoPanel, showEndScreen } from './ui.js';
import { showExploration, hideExploration } from './exploration.js';
import { graphSelfTest } from './graph.js';
import { treeSelfTest } from './tree.js';

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // Self-tests (visible in DevTools)
    graphSelfTest();
    treeSelfTest();

    // Wire static buttons
    document.getElementById('btn-start')?.addEventListener('click', startGame);
    document.getElementById('btn-briefing-start')?.addEventListener('click', goToMap);
    document.getElementById('btn-restart')?.addEventListener('click', restartGame);
    document.getElementById('btn-optimal')?.addEventListener('click', handleOptimalRoute);
    document.getElementById('btn-algo')?.addEventListener('click', () => {
        const visible = toggleAlgoPanel();
        const btn = document.getElementById('btn-algo');
        if (btn) btn.textContent = visible ? '[ FECHAR PAINEL ]' : '[ PAINEL ALGO ]';
    });
    document.getElementById('btn-algo-close')?.addEventListener('click', () => {
        toggleAlgoPanel();
        const btn = document.getElementById('btn-algo');
        if (btn) btn.textContent = '[ PAINEL ]';
    });

    showScreen('screen-title');
});

// ── Game Flow ─────────────────────────────────────────────────
function startGame() {
    resetState();
    initGraph();
    showScreen('screen-briefing');
}

function restartGame() {
    resetState();
    initGraph();
    const svgEl = document.getElementById('city-map');
    if (svgEl) {
        initMap(svgEl, handleNodeClick);
    }
    showScreen('screen-map');
    updateHUD();
    hideEventCard();
    clearOptimalPath();
    showToast('Nova corrida iniciada. Entregue o pacote.', 'info');
}

function goToMap() {
    const state = getState();
    
    if (state.currentNode !== 'bridge') {
        moveToDistrict('bridge');
    }
    
    showScreen('screen-map');
    const svgEl = document.getElementById('city-map');
    if (svgEl) {
        initMap(svgEl, handleNodeClick);
    }
    updateHUD();

    setTimeout(() => {
        showToast('🔷 Courier aterrisado em SKYBRIDGE • Iniciando operação...', 'info');
        setTimeout(() => _enterDistrict('bridge'), 400);
    }, 400);
}

// ── Node Click Handler ────────────────────────────────────────
function handleNodeClick(districtId) {
    const state = getState();
    if (state.gameOver) return;

    const svgEl = document.getElementById('city-map');
    if (svgEl) svgEl.classList.add('fade-out');
    
    setTimeout(() => {
        moveToDistrict(districtId);
        clearOptimalPath();
        render();
        updateHUD();
        
        if (svgEl) {
            svgEl.classList.remove('fade-out');
            svgEl.classList.add('fade-in');
        }

        // Did the player die in transit?
        if (!isAlive()) {
            endGame(false);
            return;
        }

        // Enter district exploration (or skip if already completed)
        setTimeout(() => _enterDistrict(districtId), 300);
    }, 250);
}


function _getNextDistrict(leafNode = null) {
    const state = getState();
    const current = state.currentNode;
    
    const adjacent = getAdjacentNodes(current);
    const adjacentIds = adjacent.map(conn => conn.to);
    
    if (leafNode && leafNode.nextDistricts && leafNode.nextDistricts.length > 0) {
        const validOptions = leafNode.nextDistricts.filter(id => adjacentIds.includes(id));
        if (validOptions.length > 0) {
            const chosen = validOptions[Math.floor(Math.random() * validOptions.length)];
            console.log(`[AUTO-FLOW] Using decision route: ${current} → ${chosen}`);
            return chosen;
        }
    }
    
    // Strategy 2: Pick from adjacent districts that aren't yet completed
    const candidates = adjacent.filter(conn => {
        const id = conn.to;
        const notDone = !state.districtsDone.has(id);
        const hasEvent = getEvent(id) !== null;
        return notDone && hasEvent;
    });
    
    if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        console.log(`[AUTO-FLOW] Using adjacent unvisited: ${current} → ${chosen.to}`);
        return chosen.to;
    }

    if (adjacentIds.length === 0) {
        console.warn('[AUTO-FLOW] No reachable districts from', current);
        return null;
    }
    
    const allUndone = Object.keys(DISTRICTS).filter(id => 
        !state.districtsDone.has(id) && id !== current && getEvent(id)
    );
    if (allUndone.length === 0) return null;
    
    const { dist } = dijkstra(current);
    let closest = null;
    let minDist = Infinity;
    allUndone.forEach(id => {
        if (dist[id] < minDist) {
            minDist = dist[id];
            closest = id;
        }
    });
    
    console.log(`[AUTO-FLOW] Using Dijkstra fallback: ${current} → ${closest}`);
    return closest;
}


function _autoAdvanceToNextDistrict(leafNode = null) {
    const nextId = _getNextDistrict(leafNode);
    if (!nextId) {
        console.log('[AUTO-FLOW] No next district available.');
        return false;
    }
    
    const state = getState();
    const currentName = DISTRICTS[state.currentNode]?.name || state.currentNode;
    const nextName = DISTRICTS[nextId]?.name || nextId;
    
    const svgEl = document.getElementById('city-map');
    if (svgEl) svgEl.classList.add('fade-out');
    
    setTimeout(() => {
        moveToDistrict(nextId);
        clearOptimalPath();
        render();
        updateHUD();
        
        if (svgEl) {
            svgEl.classList.remove('fade-out');
            svgEl.classList.add('fade-in');
        }
        
        showToast(`🔄 Courier moveu automaticamente: ${currentName} → ${nextName}`, 'info');
        
        setTimeout(() => _enterDistrict(nextId), 300);
    }, 250);
    
    return true;
}

// ── District Exploration & Event ──────────────────────────────
let _currentEventNode = null;

function _enterDistrict(districtId) {
    const state = getState();
    if (state.districtsDone.has(districtId)) {
        // Already completed — just show a quick toast
        showToast(`${getState().currentNode === districtId ? 'Você está em' : 'Passando por'} ${districtNameOf(districtId)}. Sem novos eventos.`, 'info');
        return;
    }

    const eventTree = getEvent(districtId);
    if (!eventTree) return;

    // Show interactive exploration — NPC interaction triggers the event
    showExploration(districtId, () => {
        triggerDistrictEvent(districtId);
    });
}

function triggerDistrictEvent(districtId) {
    const eventTree = getEvent(districtId);
    if (!eventTree) return;

    _currentEventNode = eventTree;
    showEventCard(_currentEventNode, handleEventChoice);
}

function handleEventChoice(choiceNode, idx) {
    if (!_currentEventNode) return;

    if (idx === -1 || choiceNode === null) {
        // Leaf node was reached — apply effects and close
        _applyLeafEffects(_currentEventNode);
        return;
    }

    // Record choice in tree path
    recordChoice(choiceNode.id);

    // Navigate to next node
    _currentEventNode = choiceNode;

    if (!choiceNode.choices || choiceNode.choices.length === 0) {
        // This choice IS a leaf — apply effects, then close
        _applyLeafEffects(choiceNode);
    } else {
        // Show next level of tree
        showEventCard(_currentEventNode, handleEventChoice);
    }

    updateAlgoPanel();
}

function _applyLeafEffects(node) {
    // Apply resource effects
    applyEffects(node.effects);

    // Apply edge unlock/lock
    (node.unlocks || []).forEach(e => unlockEdge(e.from, e.to));
    (node.locks || []).forEach(e => lockEdge(e.from, e.to));

    // Mark district done
    markDistrictDone(getState().currentNode);

    // Show unlock toast
    if (node.unlocks?.length) {
        showToast('🔓 Nova rota desbloqueada no mapa!', 'success');
    }
    if (node.locks?.length) {
        showToast('🔒 Uma rota foi fechada.', 'warning');
    }

    hideEventCard();
    render();
    updateHUD();

    // Win / Lose check
    if (node.win) { endGame(true); return; }
    if (node.lose) { endGame(false); return; }
    if (!isAlive()) { endGame(false); return; }
    
    setTimeout(() => {
        const advanced = _autoAdvanceToNextDistrict(node);
        if (!advanced) {
            showToast('✦ Awaiting next decision...', 'info');
        }
    }, 800);
}

// ── Optimal Route ─────────────────────────────────────────────
function handleOptimalRoute() {
    const state = getState();
    const { path, cost } = showOptimalPath(state.currentNode, state.targetNode);
    if (path.length < 2) {
        showToast('Nenhum caminho encontrado para a Blackout Zone!', 'warning');
        return;
    }
    showPathBanner(path, cost);
    showToast('Caminho de Dijkstra destacado no mapa.', 'info');
    updateAlgoPanel();
}

// ── End Game ──────────────────────────────────────────────────
function endGame(won) {
    setGameOver(won);
    hideEventCard();
    setTimeout(() => showEndScreen(won), 800);
}

// ── Util ──────────────────────────────────────────────────────
function districtNameOf(id) {
    return DISTRICTS[id]?.name || id;
}
