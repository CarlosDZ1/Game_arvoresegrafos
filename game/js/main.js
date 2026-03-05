// =============================================================
//  main.js – Game Orchestrator / Entry Point
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================

import { initGraph, unlockEdge, lockEdge, DISTRICTS } from './graph.js';
import { getEvent } from './tree.js';
import { getState, resetState, applyEffects, moveToDistrict, recordChoice, markDistrictDone, setGameOver, isAlive } from './state.js';
import { initMap, render, showOptimalPath, clearOptimalPath } from './map.js';
import { showScreen, updateHUD, showEventCard, hideEventCard, showToast, showPathBanner, toggleAlgoPanel, updateAlgoPanel, showEndScreen } from './ui.js';
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
        if (btn) btn.textContent = '[ PAINEL ALGO ]';
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
    showScreen('screen-map');
    const svgEl = document.getElementById('city-map');
    if (svgEl) {
        initMap(svgEl, handleNodeClick);
    }
    updateHUD();

    // Trigger arrival event for starting district immediately
    setTimeout(() => triggerDistrictEvent(getState().currentNode), 400);
}

// ── Node Click Handler ────────────────────────────────────────
function handleNodeClick(districtId) {
    const state = getState();
    if (state.gameOver) return;

    // Move the courier
    moveToDistrict(districtId);
    clearOptimalPath();
    render();
    updateHUD();

    // Did the player die in transit?
    if (!isAlive()) {
        endGame(false);
        return;
    }

    // Trigger district event
    triggerDistrictEvent(districtId);
}

// ── District Event ────────────────────────────────────────────
let _currentEventNode = null;

function triggerDistrictEvent(districtId) {
    const state = getState();
    if (state.districtsDone.has(districtId)) {
        // Already completed — just show a quick toast
        showToast(`${getState().currentNode === districtId ? 'Você está em' : 'Passando por'} ${districtNameOf(districtId)}. Sem novos eventos.`, 'info');
        return;
    }

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
