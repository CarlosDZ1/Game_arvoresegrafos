// =============================================================
//  graph.js – City Graph Data + Dijkstra's Algorithm
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================

export const DISTRICTS = {
    nexus: { id: 'nexus', name: 'NEXUS CORE', color: '#00ffe7', x: 160, y: 140 },
    docks: { id: 'docks', name: 'IRON DOCKS', color: '#ff8c00', x: 290, y: 480 },
    ghost: { id: 'ghost', name: 'GHOST QUARTER', color: '#bf5fff', x: 95, y: 320 },
    bazaar: { id: 'bazaar', name: 'CHROME BAZAAR', color: '#f5c518', x: 820, y: 180 },
    slums: { id: 'slums', name: 'NEURAL SLUMS', color: '#ff2d78', x: 450, y: 350 },
    bridge: { id: 'bridge', name: 'SKYBRIDGE', color: '#00aaff', x: 420, y: 60 },
    helix: { id: 'helix', name: 'HELIX LAB', color: '#39ff14', x: 750, y: 420 },
    blackout: { id: 'blackout', name: 'BLACKOUT ZONE', color: '#ff4444', x: 650, y: 510 },
};

export const SUB_DISTRICTS = {
    
    nexus_vault: { id: 'nexus_vault', name: 'Vault Sector', color: '#0088aa', x: 200, y: 110, parent: 'nexus', accessible: false },
    nexus_server: { id: 'nexus_server', name: 'Server Farm', color: '#0088aa', x: 130, y: 190, parent: 'nexus', accessible: false },
    nexus_resonance: { id: 'nexus_resonance', name: 'Resonance', color: '#0088aa', x: 180, y: 240, parent: 'nexus', accessible: false },
    
    ghost_underground: { id: 'ghost_underground', name: 'Underground', color: '#7722aa', x: 45, y: 280, parent: 'ghost', accessible: false },
    ghost_ruins: { id: 'ghost_ruins', name: 'Ruins', color: '#7722aa', x: 80, y: 380, parent: 'ghost', accessible: false },
    ghost_void: { id: 'ghost_void', name: 'Void Sphere', color: '#7722aa', x: 140, y: 250, parent: 'ghost', accessible: false },
    
    docks_submarine: { id: 'docks_submarine', name: 'Sub Bay', color: '#cc6600', x: 240, y: 540, parent: 'docks', accessible: false },
    docks_warehouse: { id: 'docks_warehouse', name: 'Warehouse', color: '#cc6600', x: 330, y: 500, parent: 'docks', accessible: false },
    docks_spillway: { id: 'docks_spillway', name: 'Spillway', color: '#cc6600', x: 260, y: 430, parent: 'docks', accessible: false },
    
    bazaar_blackmarket: { id: 'bazaar_blackmarket', name: 'Black Market', color: '#cc9900', x: 880, y: 140, parent: 'bazaar', accessible: false },
    bazaar_syndicate: { id: 'bazaar_syndicate', name: 'Syndicate HQ', color: '#cc9900', x: 800, y: 240, parent: 'bazaar', accessible: false },
    bazaar_vault: { id: 'bazaar_vault', name: 'Vault Trade', color: '#cc9900', x: 760, y: 150, parent: 'bazaar', accessible: false },
    
    slums_underbelly: { id: 'slums_underbelly', name: 'Underbelly', color: '#cc0055', x: 380, y: 320, parent: 'slums', accessible: false },
    slums_gang_zone: { id: 'slums_gang_zone', name: 'Gang Zone', color: '#cc0055', x: 520, y: 380, parent: 'slums', accessible: false },
    slums_pit: { id: 'slums_pit', name: 'Pit Sector', color: '#cc0055', x: 480, y: 280, parent: 'slums', accessible: false },
    
    helix_restricted: { id: 'helix_restricted', name: 'Restricted', color: '#22cc00', x: 700, y: 360, parent: 'helix', accessible: false },
    helix_vault: { id: 'helix_vault', name: 'Bio-Vault', color: '#22cc00', x: 820, y: 480, parent: 'helix', accessible: false },
    helix_research: { id: 'helix_research', name: 'Research', color: '#22cc00', x: 760, y: 470, parent: 'helix', accessible: false },
    
    bridge_toll: { id: 'bridge_toll', name: 'Toll Station', color: '#0088cc', x: 460, y: 30, parent: 'bridge', accessible: false },
    bridge_overlook: { id: 'bridge_overlook', name: 'Overlook', color: '#0088cc', x: 340, y: 100, parent: 'bridge', accessible: false },
    
    blackout_core: { id: 'blackout_core', name: 'Event Horizon', color: '#cc2222', x: 600, y: 460, parent: 'blackout', accessible: false },
    blackout_void: { id: 'blackout_void', name: 'Void Apex', color: '#cc2222', x: 720, y: 540, parent: 'blackout', accessible: false },
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
