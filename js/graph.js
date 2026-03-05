// =============================================================
//  graph.js – City Graph Data + Dijkstra's Algorithm
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================

export const DISTRICTS = {
    nexus: { id: 'nexus', name: 'NEXUS CORE', color: '#00ffe7', x: 500, y: 300 },
    docks: { id: 'docks', name: 'IRON DOCKS', color: '#ff8c00', x: 200, y: 420 },
    ghost: { id: 'ghost', name: 'GHOST QUARTER', color: '#bf5fff', x: 180, y: 160 },
    bazaar: { id: 'bazaar', name: 'CHROME BAZAAR', color: '#f5c518', x: 760, y: 200 },
    slums: { id: 'slums', name: 'NEURAL SLUMS', color: '#ff2d78', x: 480, y: 480 },
    bridge: { id: 'bridge', name: 'SKYBRIDGE', color: '#00aaff', x: 400, y: 120 },
    helix: { id: 'helix', name: 'HELIX LAB', color: '#39ff14', x: 740, y: 390 },
    blackout: { id: 'blackout', name: 'BLACKOUT ZONE', color: '#ff4444', x: 660, y: 510 },
};

// Adjacency list – each edge: { to, time, danger, label, locked }
// weight = time + danger  (composite cost)
export const EDGES_BASE = [
    { from: 'nexus', to: 'docks', time: 4, danger: 3, label: 'Canal Rd' },
    { from: 'nexus', to: 'ghost', time: 5, danger: 2, label: 'Uplink Ave' },
    { from: 'nexus', to: 'bazaar', time: 3, danger: 4, label: 'Neon Highway' },
    { from: 'nexus', to: 'slums', time: 6, danger: 5, label: 'Undercity Pass' },
    { from: 'nexus', to: 'bridge', time: 2, danger: 1, label: 'Sky Ramp' },
    { from: 'docks', to: 'slums', time: 3, danger: 6, label: 'Rust Belt' },
    { from: 'docks', to: 'ghost', time: 5, danger: 3, label: 'Fog Lane' },
    { from: 'ghost', to: 'bridge', time: 3, danger: 2, label: 'Ghost Wire' },
    { from: 'bridge', to: 'bazaar', time: 4, danger: 1, label: 'Trade Conduit' },
    { from: 'bazaar', to: 'helix', time: 2, danger: 2, label: 'Lab Corridor' },
    { from: 'bazaar', to: 'blackout', time: 5, danger: 7, label: 'Dark Alley' },
    { from: 'slums', to: 'blackout', time: 4, danger: 8, label: 'Sewer Run' },
    { from: 'helix', to: 'blackout', time: 3, danger: 4, label: 'Research Rd' },
    { from: 'helix', to: 'nexus', time: 6, danger: 2, label: 'Backway Loop' },
    // Locked edges (unlocked via events)
    { from: 'ghost', to: 'bazaar', time: 2, danger: 1, label: 'Hidden Subnet', locked: true },
    { from: 'docks', to: 'blackout', time: 3, danger: 5, label: 'Port Shortcut', locked: true },
];

// Runtime edge state (locked edges can be unlocked during play)
let _edges = [];

export function initGraph() {
    _edges = EDGES_BASE.map(e => ({ ...e }));
}

export function getEdges() { return _edges; }

export function unlockEdge(from, to) {
    const e = _edges.find(e => e.from === from && e.to === to);
    if (e) e.locked = false;
}

export function lockEdge(from, to) {
    const e = _edges.find(e => e.from === from && e.to === to);
    if (e) e.locked = true;
}

/** Returns adjacency map { nodeId: [ {to, weight, label} ] } for unlocked edges */
export function buildAdjacency() {
    const adj = {};
    Object.keys(DISTRICTS).forEach(id => adj[id] = []);
    _edges.forEach(e => {
        if (!e.locked) {
            adj[e.from].push({ to: e.to, weight: e.time + e.danger, label: e.label });
            adj[e.to].push({ to: e.from, weight: e.time + e.danger, label: e.label });
        }
    });
    return adj;
}

// =============================================================
//  DIJKSTRA'S ALGORITHM
//  Returns { dist: {nodeId: number}, prev: {nodeId: nodeId|null} }
// =============================================================
export function dijkstra(startId) {
    const adj = buildAdjacency();
    const nodes = Object.keys(DISTRICTS);

    const dist = {};
    const prev = {};
    const visited = new Set();

    nodes.forEach(n => { dist[n] = Infinity; prev[n] = null; });
    dist[startId] = 0;

    // Simple min-priority queue using a sorted array
    const pq = [{ id: startId, d: 0 }];

    while (pq.length > 0) {
        pq.sort((a, b) => a.d - b.d);
        const { id: u } = pq.shift();

        if (visited.has(u)) continue;
        visited.add(u);

        for (const { to: v, weight } of adj[u]) {
            if (visited.has(v)) continue;
            const alt = dist[u] + weight;
            if (alt < dist[v]) {
                dist[v] = alt;
                prev[v] = u;
                pq.push({ id: v, d: alt });
            }
        }
    }

    return { dist, prev };
}

/** Reconstructs path array from dijkstra result */
export function getPath(prev, targetId) {
    const path = [];
    let cur = targetId;
    while (cur !== null) {
        path.unshift(cur);
        cur = prev[cur];
    }
    return path;
}

/** Returns reachable adjacent nodes from current position */
export function getAdjacentNodes(fromId) {
    const adj = buildAdjacency();
    return adj[fromId] || [];
}

// =============================================================
//  SELF-TEST (runs on import in dev)
// =============================================================
export function graphSelfTest() {
    initGraph();
    console.group('[GRAPH SELF-TEST] Dijkstra from NEXUS CORE');
    const { dist, prev } = dijkstra('nexus');
    Object.keys(DISTRICTS).forEach(id => {
        const path = getPath(prev, id);
        console.log(`  → ${DISTRICTS[id].name}: cost=${dist[id]}  path=[${path.join(' → ')}]`);
    });
    console.groupEnd();
}
