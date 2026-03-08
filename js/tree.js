// =============================================================
//  tree.js – Decision Tree Data + Traversal
//  NIGHT_COURIER | Árvores e Grafos – UniEVANGÉLICA
// =============================================================
//
//  Tree Node Schema:
//  {
//    id:       string,
//    text:     string,          // narrative text shown to player
//    flavor:   string,          // short atmospheric subtitle
//    choices:  [ ChoiceNode ],  // empty = leaf (outcome)
//    // Leaf-only fields:
//    effects:  { time, credits, health },  // delta to game state
//    unlocks:  [ {from,to} ],   // edges to unlock
//    locks:    [ {from,to} ],   // edges to lock
//  }
//
//  Each district has one root EventNode. The player traverses
//  by picking choices until reaching a leaf (outcome).
// =============================================================

export const EVENT_TREES = {

    // ── NEXUS CORE ──────────────────────────────────────────────
    nexus: {
        id: 'nexus_root',
        text: 'As torres de neon do Nexus Core piscam enquanto drones da milícia varrem o céu. Uma intermediária de casaco cromado acena para você de uma porta.',
        flavor: '[ NEXUS CORE — HORA 02 ]',
        choices: [
            {
                label: 'Aceitar a dica da intermediária',
                id: 'nexus_a',
                text: 'A intermediária desliza um datachip pelo balcão. "Ghost Quarter está em lockdown, mas existe uma sub-rede oculta que ninguém patrulha." Você confia nela?',
                flavor: '[ Intel Oculta Detectada ]',
                choices: [
                    {
                        label: 'Confiar nela — seguir pela sub-rede',
                        id: 'nexus_a1',
                        text: 'A dica compensa. Você se esgueira por um túnel de fibra esquecido sob a cidade. Rota desbloqueada.',
                        flavor: '[ Acesso à Sub-Rede Concedido ]',
                        choices: [],
                        effects: { time: -2, credits: -150, health: 0 },
                        unlocks: [{ from: 'ghost', to: 'bazaar' }],
                        locks: [],
                        nextDistricts: ['ghost', 'docks'],
                    },
                    {
                        label: 'Recusar — arriscado demais',
                        id: 'nexus_a2',
                        text: 'Você vai embora. Esperto. A intermediária era isca corporativa. Sem perda de tempo, mas sem atalho também.',
                        flavor: '[ Ameaça Evitada ]',
                        choices: [],
                        effects: { time: 0, credits: 0, health: 0 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['docks', 'ghost'],
                    },
                ],
            },
            {
                label: 'Ignorar e seguir rápido',
                id: 'nexus_b',
                text: 'Sem tempo para intermediários. Você avança pela multidão. Um checkpoint da milícia te atrasa.',
                flavor: '[ Checkpoint Encontrado ]',
                choices: [
                    {
                        label: 'Subornar o guarda',
                        id: 'nexus_b1',
                        text: 'Créditos trocados, passagem garantida. Caro, mas limpo.',
                        flavor: '[ Transação Completa ]',
                        choices: [],
                        effects: { time: -1, credits: -300, health: 0 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['docks', 'bazaar'],
                    },
                    {
                        label: 'Forçar passagem — aguentar o tranco',
                        id: 'nexus_b2',
                        text: 'Você arrebenta a barreira. Alarmes disparam. Você passa — ensanguentado, mas se movendo.',
                        flavor: '[ ALERTA: Scan Biométrico Ativo ]',
                        choices: [],
                        effects: { time: 0, credits: 0, health: -20 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['docks', 'slums'],
                    },
                ],
            },
        ],
    },

    // ── IRON DOCKS ──────────────────────────────────────────────
    docks: {
        id: 'docks_root',
        text: 'Barcaças enferrujadas e drones de carga lotam o Iron Docks. Uma gangue de estivadores bloqueia a passagem principal.',
        flavor: '[ IRON DOCKS — HORA 06 ]',
        choices: [
            {
                label: 'Negociar passagem',
                id: 'docks_a',
                text: 'O líder deles escaneia sua carga. "Quinhentos créditos ou você nada." O que você faz?',
                flavor: '[ Pedágio da Gangue ]',
                choices: [
                    {
                        label: 'Pagar o pedágio',
                        id: 'docks_a1',
                        text: 'Você paga. Eles abrem um atalho portuário secreto — mais rápido que qualquer rota no mapa.',
                        flavor: '[ Atalho Portuário Revelado ]',
                        choices: [],
                        effects: { time: -3, credits: -500, health: 0 },
                        unlocks: [{ from: 'docks', to: 'blackout' }],
                        locks: [],
                        nextDistricts: ['ghost', 'bazaar'],
                    },
                    {
                        label: 'Recusar e procurar outro caminho',
                        id: 'docks_a2',
                        text: 'Você segue pelo caminho longo através do cinturão de ferrugem. Seguro, mas lento.',
                        flavor: '[ Rota Alternativa ]',
                        choices: [],
                        effects: { time: 3, credits: 0, health: 0 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['ghost', 'slums'],
                    },
                ],
            },
            {
                label: 'Furtivamente pelo compartimento de carga',
                id: 'docks_b',
                text: 'Você rasteja por dentro de um contêiner. Escuro. Cheiro de plástico queimado. Mas você passa sem ser detectado.',
                flavor: '[ Furtividade Bem-Sucedida ]',
                choices: [],
                effects: { time: 1, credits: 0, health: -10 },
                unlocks: [],
                locks: [],
                nextDistricts: ['ghost', 'bazaar', 'slums'],
            },
        ],
    },

    // ── GHOST QUARTER ───────────────────────────────────────────
    ghost: {
        id: 'ghost_root',
        text: 'Ghost Quarter: lar dos não-registrados e dos esquecidos. Fantasmas holográficos cintilam nas portas — memórias persistentes dos apagados da rede.',
        flavor: '[ GHOST QUARTER — HORA 10 ]',
        choices: [
            {
                label: 'Visitar a clínica clandestina',
                id: 'ghost_a',
                text: 'Uma médica clandestina se oferece para te remendar — por um preço.',
                flavor: '[ Médicos do Mercado Negro ]',
                choices: [
                    {
                        label: 'Pagar pelo tratamento completo',
                        id: 'ghost_a1',
                        text: 'Ela sutura os ferimentos e injeta estimulantes. Você se sente quase humano de novo.',
                        flavor: '[ Saúde Restaurada ]',
                        choices: [],
                        effects: { time: 2, credits: -400, health: 35 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['bazaar', 'slums'],
                    },
                    {
                        label: 'Só o básico',
                        id: 'ghost_a2',
                        text: 'Um remendo rápido. Melhor que nada.',
                        flavor: '[ Recuperação Parcial ]',
                        choices: [],
                        effects: { time: 1, credits: -150, health: 15 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['bazaar', 'slums'],
                    },
                ],
            },
            {
                label: 'Seguir em frente sem parar',
                id: 'ghost_b',
                text: 'Sem tempo para desvios. Você atravessa Ghost Quarter a toda velocidade. Uma patrulha corp te avista.',
                flavor: '[ Patrulha Corp Detectada ]',
                choices: [],
                effects: { time: -1, credits: 0, health: -15 },
                unlocks: [],
                locks: [],
                nextDistricts: ['bazaar', 'slums', 'helix'],
            },
        ],
    },

    // ── CHROME BAZAAR ───────────────────────────────────────────
    bazaar: {
        id: 'bazaar_root',
        text: 'Chrome Bazaar — mil vendedores, mil golpes. O ar cheira a ferro de solda e macarrão de rua.',
        flavor: '[ CHROME BAZAAR — HORA 16 ]',
        choices: [
            {
                label: 'Comprar um mod de velocidade para sua moto',
                id: 'bazaar_a',
                text: 'Um vendedor de dentes cromados mostra um upgrade de motor de grau militar. "Corta o tempo de viagem pela metade — se não explodir."',
                flavor: '[ Hardware do Mercado Negro ]',
                choices: [
                    {
                        label: 'Comprar',
                        id: 'bazaar_a1',
                        text: 'O mod aguenta. Você rasga pelas ruas da cidade com o dobro da velocidade anterior.',
                        flavor: '[ Boost de Velocidade Ativo ]',
                        choices: [],
                        effects: { time: -5, credits: -600, health: 0 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['slums', 'helix'],
                    },
                    {
                        label: 'Passar — não é confiável',
                        id: 'bazaar_a2',
                        text: 'Decisão sábia. O próximo entregador que comprou um desses dele agora é uma cratera na Helix Road.',
                        flavor: '[ Golpe Evitado ]',
                        choices: [],
                        effects: { time: 0, credits: 0, health: 0 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['slums', 'helix'],
                    },
                ],
            },
            {
                label: 'Vender intel sobre a sub-rede oculta',
                id: 'bazaar_b',
                text: 'Você vaza as informações da sub-rede para um corretor de dados por dinheiro rápido. Mas agora a rota será patrulhada.',
                flavor: '[ Intel Negociada ]',
                choices: [],
                effects: { time: 0, credits: 500, health: 0 },
                unlocks: [],
                locks: [{ from: 'ghost', to: 'bazaar' }],
                nextDistricts: ['slums', 'helix'],
            },
        ],
    },

    // ── NEURAL SLUMS ────────────────────────────────────────────
    slums: {
        id: 'slums_root',
        text: 'As Neural Slums — superlotadas, sobrecarregadas e eternamente em chamas. Crianças com implantes neurais brincam em água de enchente.',
        flavor: '[ NEURAL SLUMS — HORA 20 ]',
        choices: [
            {
                label: 'Pedir orientação a um corredor local',
                id: 'slums_a',
                text: 'Uma corredora adolescente se oferece para guiá-lo pelo labirinto de vielas das favelas — por uma parte da sua carga.',
                flavor: '[ Conhecimento Local ]',
                choices: [
                    {
                        label: 'Aceitar o acordo',
                        id: 'slums_a1',
                        text: 'Ela conhece cada atalho. Você perde alguns créditos, mas economiza horas preciosas.',
                        flavor: '[ Atalho Tomado ]',
                        choices: [],
                        effects: { time: -4, credits: -200, health: 0 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['helix', 'bazaar'],
                    },
                    {
                        label: 'Ir sozinho',
                        id: 'slums_a2',
                        text: 'Você vaga pelo labirinto das favelas por duas horas antes de encontrar a saída.',
                        flavor: '[ Perdido no Labirinto ]',
                        choices: [],
                        effects: { time: 4, credits: 0, health: 0 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['helix', 'bazaar'],
                    },
                ],
            },
            {
                label: 'Ficar quieto e esperar a patrulha passar',
                id: 'slums_b',
                text: 'Paciência salva sua pele. Você espera em um prédio desabado até a patrulha se afastar.',
                flavor: '[ Evasão Bem-Sucedida ]',
                choices: [],
                effects: { time: 2, credits: 0, health: 0 },
                unlocks: [],
                locks: [],
                nextDistricts: ['helix', 'bazaar', 'ghost'],
            },
        ],
    },

    // ── SKYBRIDGE ───────────────────────────────────────────────
    bridge: {
        id: 'bridge_root',
        text: 'Skybridge — uma rodovia elevada acima das nuvens. A cidade lá embaixo parece quase bonita daqui.',
        flavor: '[ SKYBRIDGE — HORA 24 ]',
        choices: [
            {
                label: 'Correr pela ponte aberta',
                id: 'bridge_a',
                text: 'Campo aberto e rápido — mas exposto. Drones atiradores escaneiam das torres.',
                flavor: '[ Travessia Exposta ]',
                choices: [
                    {
                        label: 'Velocidade máxima — apostar no timing',
                        id: 'bridge_a1',
                        text: 'Você atinge 200 km/h e passa pela janela do scan. Coração disparado. Conseguiu.',
                        flavor: '[ ESCAPADA POR POUCO ]',
                        choices: [],
                        effects: { time: -3, credits: 0, health: -10 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['ghost', 'bazaar', 'slums'],
                    },
                    {
                        label: 'Mover-se na cobertura de um comboio de carga',
                        id: 'bridge_a2',
                        text: 'Você se esconde atrás de um caminhão de carga. Mais lento, mais seguro.',
                        flavor: '[ Cobertura do Comboio ]',
                        choices: [],
                        effects: { time: 1, credits: 0, health: 0 },
                        unlocks: [],
                        locks: [],                        nextDistricts: ['ghost', 'bazaar', 'slums'],                    },
                ],
            },
            {
                label: 'Subornar o operador da ponte',
                id: 'bridge_b',
                text: 'O operador desativa a varredura de drones por 30 segundos. Mais que suficiente.',
                flavor: '[ Anulação do Sistema ]',
                choices: [],
                effects: { time: -2, credits: -350, health: 0 },
                unlocks: [],
                locks: [],
                nextDistricts: ['ghost', 'bazaar', 'slums'],
            },
        ],
    },

    // ── HELIX LAB ───────────────────────────────────────────────
    helix: {
        id: 'helix_root',
        text: 'Helix Lab — campus de pesquisa da megacorp. Corredores estéreis e guardas armados por toda parte.',
        flavor: '[ HELIX LAB — HORA 32 ]',
        choices: [
            {
                label: 'Infiltrar o laboratório por um atalho',
                id: 'helix_a',
                text: 'Uma entrada de serviço está desprotegida. Lá dentro pode haver um túnel direto para a Blackout Zone.',
                flavor: '[ Tentativa de Infiltração ]',
                choices: [
                    {
                        label: 'Entrar',
                        id: 'helix_a1',
                        text: 'O túnel existe. Mas um guarda te acerta na saída — ferimento leve.',
                        flavor: '[ Sucesso Parcial ]',
                        choices: [],
                        effects: { time: -4, credits: 0, health: -20 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['blackout'],
                    },
                    {
                        label: 'Abortar — arriscado demais',
                        id: 'helix_a2',
                        text: 'Você recua. Nenhum dano. Hora de encontrar outra rota.',
                        flavor: '[ Missão Abortada ]',
                        choices: [],
                        effects: { time: 0, credits: 0, health: 0 },
                        unlocks: [],
                        locks: [],
                        nextDistricts: ['bazaar', 'slums'],
                    },
                ],
            },
            {
                label: 'Se passar por um técnico de entregas',
                id: 'helix_b',
                text: 'Seu ID falso funciona. Você caminha pelo campus como se fosse dono do lugar. Um pesquisador até segura a porta para você.',
                flavor: '[ Infiltração Bem-Sucedida ]',
                choices: [],
                effects: { time: -2, credits: -100, health: 0 },
                unlocks: [],
                locks: [],
                nextDistricts: ['blackout'],
            },
        ],
    },

    // ── BLACKOUT ZONE (DESTINATION) ─────────────────────────────
    blackout: {
        id: 'blackout_root',
        text: 'Blackout Zone. A rede está morta aqui — sem câmeras, sem sinal, sem lei. É aqui que está o ponto de entrega. Um último obstáculo entre você e a entrega.',
        flavor: '[ BLACKOUT ZONE — HORA FINAL ]',
        choices: [
            {
                label: 'Fazer contato com o receptor',
                id: 'final_a',
                text: 'Uma figura emerge da escuridão. Ela estende um scanner. "Autentique o pacote."',
                flavor: '[ Entrega Final ]',
                choices: [
                    {
                        label: 'Autenticar — completar a entrega',
                        id: 'final_a1',
                        text: '✓ ENTREGA CONFIRMADA. Os dados foram transferidos. A cidade respira. Você conseguiu.',
                        flavor: '[ MISSÃO COMPLETA ]',
                        choices: [],
                        effects: { time: 0, credits: 1000, health: 0 },
                        unlocks: [],
                        locks: [],
                        win: true,
                    },
                    {
                        label: 'Exigir mais pagamento primeiro',
                        id: 'final_a2',
                        text: 'Ela assente lentamente... e então dispara um stunner em você. Você acorda em uma lixeira. Os dados se foram.',
                        flavor: '[ ERRO FATAL ]',
                        choices: [],
                        effects: { time: 0, credits: -1000, health: -100 },
                        unlocks: [],
                        locks: [],
                        lose: true,
                    },
                ],
            },
            {
                label: 'Verificar a zona por armadilhas primeiro',
                id: 'final_b',
                text: 'Bom instinto. Você encontra uma mina de detonação remota perto do ponto de entrega e a desativa.',
                flavor: '[ Ameaça Neutralizada ]',
                choices: [
                    {
                        label: 'Prosseguir para a entrega',
                        id: 'final_b1',
                        text: '✓ ENTREGA CONFIRMADA. Inteligente e metódico — exatamente por isso você é o melhor entregador de Night City.',
                        flavor: '[ MISSÃO COMPLETA — CORRIDA PERFEITA ]',
                        choices: [],
                        effects: { time: 1, credits: 1500, health: 0 },
                        unlocks: [],
                        locks: [],
                        win: true,
                    },
                ],
            },
        ],
    },
};

/** Get root event node for a district */
export function getEvent(districtId) {
    return EVENT_TREES[districtId] || null;
}

/** Walk the tree to a specific node by id (BFS) */
export function findNode(root, nodeId) {
    if (!root) return null;
    if (root.id === nodeId) return root;
    for (const choice of (root.choices || [])) {
        const found = findNode(choice, nodeId);
        if (found) return found;
    }
    return null;
}

/** Collect all leaf nodes from a subtree (for self-test) */
function collectLeaves(node, path = [], results = []) {
    if (!node.choices || node.choices.length === 0) {
        results.push({ path: [...path, node.id], effects: node.effects, win: node.win, lose: node.lose });
        return;
    }
    for (const child of node.choices) {
        collectLeaves(child, [...path, node.id], results);
    }
    return results;
}

// =============================================================
//  SELF-TEST
// =============================================================
export function treeSelfTest() {
    console.group('[TREE SELF-TEST] All decision paths');
    Object.entries(EVENT_TREES).forEach(([districtId, root]) => {
        const leaves = [];
        collectLeaves(root, [], leaves);
        console.group(`  District: ${districtId}`);
        leaves.forEach(l => {
            console.log(`    Path: ${l.path.join(' → ')}  |  Effects: time${l.effects?.time >= 0 ? '+' : ''}${l.effects?.time} credits${l.effects?.credits >= 0 ? '+' : ''}${l.effects?.credits} health${l.effects?.health >= 0 ? '+' : ''}${l.effects?.health}${l.win ? '  ✓ WIN' : ''}${l.lose ? '  ✗ LOSE' : ''}`);
        });
        console.groupEnd();
    });
    console.groupEnd();
}
