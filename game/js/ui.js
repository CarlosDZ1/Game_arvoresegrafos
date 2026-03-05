// =============================================================
//  ui.js – Screen Manager, HUD, Modals, Algorithm Panel
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================

import { getState } from './state.js';
import { DISTRICTS, buildAdjacency } from './graph.js';

// ── Screen Management ──────────────────────────────────────────
export function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('active');
        el.classList.remove('fade-in');
        void el.offsetWidth; // reflow
        el.classList.add('fade-in');
    }
}

// ── HUD ───────────────────────────────────────────────────────
export function updateHUD() {
    const s = getState();

    setEl('hud-district', DISTRICTS[s.currentNode]?.name || '—');
    setEl('hud-target', DISTRICTS[s.targetNode]?.name || '—');
    setEl('hud-time', `${s.time}h`);
    setEl('hud-credits', `₵${s.credits.toLocaleString()}`);

    const hp = document.getElementById('hud-health-bar');
    if (hp) {
        hp.style.width = `${s.health}%`;
        hp.style.background = s.health > 50 ? '#00ffe7' : s.health > 25 ? '#f5c518' : '#ff2d78';
    }
    setEl('hud-health-val', `${s.health}%`);

    // Color time when low
    const timeEl = document.getElementById('hud-time');
    if (timeEl) timeEl.style.color = s.time <= 12 ? '#ff2d78' : '#00ffe7';
}

// ── Event Card ────────────────────────────────────────────────
export function showEventCard(node, onChoice) {
    const panel = document.getElementById('event-panel');
    const title = document.getElementById('event-flavor');
    const body = document.getElementById('event-text');
    const choicesEl = document.getElementById('event-choices');

    if (!panel) return;

    if (title) title.textContent = node.flavor || '';
    if (body) body.textContent = node.text || '';

    if (choicesEl) {
        choicesEl.innerHTML = '';
        if (node.choices && node.choices.length > 0) {
            node.choices.forEach((c, i) => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.innerHTML = `<span class="choice-num">${String.fromCharCode(65 + i)}</span>${c.label}`;
                btn.addEventListener('click', () => onChoice(c, i));
                choicesEl.appendChild(btn);
            });
        } else {
            // Leaf node — show outcome only, no choices
            const cont = document.createElement('button');
            cont.className = 'choice-btn choice-continue';
            cont.textContent = '[ CONTINUAR ]';
            cont.addEventListener('click', () => onChoice(null, -1));
            choicesEl.appendChild(cont);
        }
    }

    panel.classList.remove('slide-in');
    void panel.offsetWidth;
    panel.classList.add('slide-in');
    panel.style.display = 'flex';
}

export function hideEventCard() {
    const panel = document.getElementById('event-panel');
    if (panel) {
        panel.classList.add('slide-out');
        setTimeout(() => {
            panel.style.display = 'none';
            panel.classList.remove('slide-out');
        }, 300);
    }
}

// ── Notification Toast ────────────────────────────────────────
export function showToast(text, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = text;
    toast.className = `toast toast-${type} show`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Dijkstra Path Banner ───────────────────────────────────────
export function showPathBanner(path, cost) {
    const el = document.getElementById('path-banner');
    if (!el) return;
    el.textContent = `⚡ CAMINHO ÓTIMO: ${path.map(id => DISTRICTS[id]?.name || id).join(' → ')}  [CUSTO: ${cost}]`;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
}

// ── Algorithm Panel ───────────────────────────────────────────
export function updateAlgoPanel() {
    const state = getState();

    // --- Graph panel ---
    const adjEl = document.getElementById('algo-adjacency');
    if (adjEl) {
        const adj = buildAdjacency();
        let out = '// LISTA DE ADJACÊNCIA (arestas desbloqueadas)\n';
        Object.entries(adj).forEach(([node, neighbors]) => {
            out += `\n${DISTRICTS[node]?.name || node}:\n`;
            neighbors.forEach(n => {
                out += `  → ${DISTRICTS[n.to]?.name || n.to}  [w=${n.weight}]\n`;
            });
        });
        adjEl.textContent = out;
    }

    // --- Dijkstra result ---
    const dijkEl = document.getElementById('algo-dijkstra');
    if (dijkEl && state.optimalPath && state.optimalPath.length > 0) {
        dijkEl.textContent = '// MENOR CAMINHO (Dijkstra)\n\n' +
            state.optimalPath.map(id => DISTRICTS[id]?.name || id).join('\n  ↓\n') +
            '\n\n// Caminho destacado no mapa ⬆';
    } else if (dijkEl) {
        dijkEl.textContent = '// Clique em "ROTA ÓTIMA" para executar Dijkstra\n// e destacar o menor caminho no mapa.';
    }

    // --- Decision tree panel ---
    const treeEl = document.getElementById('algo-tree');
    if (treeEl) {
        if (state.decisionPath.length > 0) {
            treeEl.textContent = '// CAMINHO DA ÁRVORE DE DECISÃO\n\n' +
                state.decisionPath.map((id, i) => `${'  '.repeat(i)}[${i}] ${id}`).join('\n');
        } else {
            treeEl.textContent = '// Nenhuma decisão tomada ainda.\n// Chegue a um distrito para ver\n// a árvore de decisão em ação.';
        }
    }
}

export function toggleAlgoPanel() {
    const panel = document.getElementById('algo-panel');
    if (!panel) return;
    const isVisible = panel.classList.toggle('visible');
    updateAlgoPanel();
    return isVisible;
}

// ── End Screen ────────────────────────────────────────────────
export function showEndScreen(won) {
    const state = getState();
    showScreen('screen-end');

    const title = document.getElementById('end-title');
    const sub = document.getElementById('end-subtitle');
    const stats = document.getElementById('end-stats');
    const screen = document.getElementById('screen-end');

    if (won) {
        if (title) title.textContent = 'ENTREGA COMPLETA';
        if (sub) sub.textContent = 'Os dados chegaram ao destino. Night City respira.';
        if (screen) screen.classList.add('end-win');
        screen?.classList.remove('end-lose');
    } else {
        if (title) title.textContent = 'SINAL PERDIDO';
        if (sub) sub.textContent = 'O pacote se foi. Mais um entregador morde a poeira.';
        if (screen) screen.classList.add('end-lose');
        screen?.classList.remove('end-win');
    }

    if (stats) {
        stats.innerHTML = `
      <div class="stat-row"><span>Distritos visitados</span><span>${state.visitedNodes.length} / 8</span></div>
      <div class="stat-row"><span>Tempo restante</span><span>${state.time}h</span></div>
      <div class="stat-row"><span>Créditos</span><span>₵${state.credits.toLocaleString()}</span></div>
      <div class="stat-row"><span>Saúde</span><span>${state.health}%</span></div>
      <div class="stat-row"><span>Decisões tomadas</span><span>${state.decisionPath.length}</span></div>
      <div class="stat-row"><span>Caminho percorrido</span><span>${state.pathTaken.map(id => DISTRICTS[id]?.name || id).join(' → ')}</span></div>
    `;
    }
}

// ── Util ──────────────────────────────────────────────────────
function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
