// =============================================================
//  map.js – SVG City Map Renderer & Interaction
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================

import { DISTRICTS, getEdges, dijkstra, getPath, getAdjacentNodes } from './graph.js';
import { getState, setOptimalPath } from './state.js';

const SVG_W = 960;
const SVG_H = 580;

let _svg = null;
let _onNodeClick = null;
let _animFrames = [];

export function initMap(svgElement, onNodeClick) {
    _svg = svgElement;
    _onNodeClick = onNodeClick;
    _svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
    _svg.setAttribute('width', '100%');
    _svg.setAttribute('height', '100%');
    render();
}

export function render() {
    if (!_svg) return;
    _svg.innerHTML = '';

    _appendDefs();
    _drawGrid();
    _drawEdges();
    _drawNodes();
}

function _appendDefs() {
    const defs = _el('defs');

    // Glow filters for each district color
    Object.values(DISTRICTS).forEach(d => {
        const filter = _el('filter', { id: `glow-${d.id}`, x: '-50%', y: '-50%', width: '200%', height: '200%' });
        const fe = _el('feDropShadow', { dx: '0', dy: '0', stdDeviation: '8', 'flood-color': d.color, 'flood-opacity': '0.9' });
        filter.appendChild(fe);
        defs.appendChild(filter);
    });

    // Generic cyan glow
    const gf = _el('filter', { id: 'glow-cyan', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    gf.appendChild(_el('feDropShadow', { dx: '0', dy: '0', stdDeviation: '6', 'flood-color': '#00ffe7', 'flood-opacity': '0.8' }));
    defs.appendChild(gf);

    // Path pulse animation marker
    const marker = _el('marker', { id: 'arrow', markerWidth: '6', markerHeight: '6', refX: '3', refY: '3', orient: 'auto' });
    const poly = _el('polygon', { points: '0 0, 6 3, 0 6', fill: '#00ffe7', opacity: '0.8' });
    marker.appendChild(poly);
    defs.appendChild(marker);

    _svg.appendChild(defs);
}

function _drawGrid() {
    const g = _el('g', { class: 'grid', opacity: '0.06' });
    for (let x = 0; x < SVG_W; x += 40) {
        g.appendChild(_el('line', { x1: x, y1: 0, x2: x, y2: SVG_H, stroke: '#00ffe7', 'stroke-width': '0.5' }));
    }
    for (let y = 0; y < SVG_H; y += 40) {
        g.appendChild(_el('line', { x1: 0, y1: y, x2: SVG_W, y2: y, stroke: '#00ffe7', 'stroke-width': '0.5' }));
    }
    _svg.appendChild(g);
}

function _drawEdges() {
    const state = getState();
    const edges = getEdges();
    const adjacent = getAdjacentNodes(state.currentNode).map(a => a.to);
    const g = _el('g', { class: 'edges' });

    // Draw unique undirected edges only
    const drawn = new Set();
    edges.forEach(e => {
        const key = [e.from, e.to].sort().join('-');
        if (drawn.has(key)) return;
        drawn.add(key);

        const a = DISTRICTS[e.from];
        const b = DISTRICTS[e.to];

        const isOptimal = _isOnOptimalPath(e.from, e.to, state.optimalPath);
        const isAdjacent = !e.locked && (
            (e.from === state.currentNode && adjacent.includes(e.to)) ||
            (e.to === state.currentNode && adjacent.includes(e.from))
        );
        const isLocked = e.locked;

        let stroke = '#1a2a3a';
        let strokeW = '1.5';
        let dash = '6 4';
        let opacity = '0.4';
        let filter = '';

        if (isLocked) {
            stroke = '#441122';
            dash = '2 6';
            opacity = '0.3';
        } else if (isOptimal) {
            stroke = '#00ffe7';
            strokeW = '3';
            dash = 'none';
            opacity = '1';
            filter = 'url(#glow-cyan)';
        } else if (isAdjacent) {
            stroke = '#ffffff';
            strokeW = '2';
            dash = '5 3';
            opacity = '0.7';
        }

        const line = _el('line', {
            x1: a.x, y1: a.y, x2: b.x, y2: b.y,
            stroke, 'stroke-width': strokeW,
            'stroke-dasharray': dash, opacity, filter,
            class: isOptimal ? 'optimal-edge' : '',
        });
        g.appendChild(line);

        // Weight label on non-locked edges
        if (!isLocked) {
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const weight = e.time + e.danger;
            const wt = _el('text', {
                x: mx, y: my - 6,
                fill: isOptimal ? '#00ffe7' : '#556677',
                'font-size': '10', 'font-family': 'Share Tech Mono', 'text-anchor': 'middle',
                opacity: isOptimal ? '1' : '0.6',
            });
            wt.textContent = `${weight}`;
            g.appendChild(wt);
        }
    });
    _svg.appendChild(g);
}

function _isOnOptimalPath(a, b, path) {
    if (!path || path.length < 2) return false;
    for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === a && path[i + 1] === b) || (path[i] === b && path[i + 1] === a)) return true;
    }
    return false;
}

function _drawNodes() {
    const state = getState();
    const adjacent = getAdjacentNodes(state.currentNode).map(a => a.to);
    const g = _el('g', { class: 'nodes' });

    Object.values(DISTRICTS).forEach(d => {
        const isCurrent = d.id === state.currentNode;
        const isTarget = d.id === state.targetNode;
        const isVisited = state.visitedNodes.includes(d.id);
        const isAdj = adjacent.includes(d.id);
        const isDone = state.districtsDone.has(d.id);

        const r = isCurrent ? 22 : isTarget ? 20 : 16;
        const opacity = (isAdj || isCurrent || isTarget) ? 1 : isVisited ? 0.6 : 0.35;

        // Outer ring (pulsing for current)
        if (isCurrent) {
            const pulse = _el('circle', {
                cx: d.x, cy: d.y, r: 32,
                fill: 'none', stroke: d.color,
                'stroke-width': '2', opacity: '0.4',
                class: 'pulse-ring',
            });
            g.appendChild(pulse);
        }

        // Clickable hit area (for adjacent nodes)
        if (isAdj && !isCurrent) {
            const hit = _el('circle', {
                cx: d.x, cy: d.y, r: 28,
                fill: 'transparent', cursor: 'pointer',
                class: 'node-hitarea',
                'data-id': d.id,
            });
            hit.addEventListener('click', () => _onNodeClick && _onNodeClick(d.id));
            g.appendChild(hit);

            // Hover ring
            const hr = _el('circle', {
                cx: d.x, cy: d.y, r: 24,
                fill: 'none', stroke: d.color,
                'stroke-width': '1.5', opacity: '0.3',
                class: 'hover-ring',
            });
            g.appendChild(hr);
        }

        // Main node circle
        const circle = _el('circle', {
            cx: d.x, cy: d.y, r,
            fill: isCurrent ? d.color : '#0a0a1a',
            stroke: d.color,
            'stroke-width': isCurrent ? '0' : isTarget ? '3' : '2',
            opacity,
            filter: `url(#glow-${d.id})`,
            class: isAdj ? 'clickable-node' : '',
            style: isAdj ? 'cursor:pointer' : '',
        });
        if (isAdj) circle.addEventListener('click', () => _onNodeClick && _onNodeClick(d.id));
        g.appendChild(circle);

        // Done checkmark
        if (isDone && !isCurrent) {
            const check = _el('text', { x: d.x, y: d.y + 4, 'text-anchor': 'middle', fill: d.color, 'font-size': '12', opacity: '0.9' });
            check.textContent = '✓';
            g.appendChild(check);
        }

        // Target icon
        if (isTarget && !isCurrent) {
            const tgt = _el('text', { x: d.x, y: d.y + 5, 'text-anchor': 'middle', fill: d.color, 'font-size': '14' });
            tgt.textContent = '◎';
            g.appendChild(tgt);
        }

        // Node label
        const label = _el('text', {
            x: d.x, y: d.y + r + 16,
            fill: d.color, 'font-family': 'Orbitron, monospace',
            'font-size': isCurrent ? '10' : '9', 'text-anchor': 'middle',
            opacity: opacity.toString(),
            'letter-spacing': '1',
        });
        label.textContent = d.name;
        g.appendChild(label);

        // Courier icon on current node
        if (isCurrent) {
            const icon = _el('text', { x: d.x, y: d.y + 5, 'text-anchor': 'middle', fill: '#0a0a1a', 'font-size': '14' });
            icon.textContent = '▲';
            g.appendChild(icon);
        }
    });

    _svg.appendChild(g);
}

export function showOptimalPath(from, to) {
    const { dist, prev } = dijkstra(from);
    const path = getPath(prev, to);
    setOptimalPath(path);
    render();
    return { path, cost: dist[to] };
}

export function clearOptimalPath() {
    setOptimalPath([]);
    render();
}

// ── Helper ─────────────────────────────────────────────────────
function _el(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}
