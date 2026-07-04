// ===================================================
// 1. CONFIGURACIÓN DEL CANVAS Y MAPA
// ===================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function ajustarPantalla() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
ajustarPantalla();
window.addEventListener("resize", ajustarPantalla);

const TILE_SIZE = 48; 
const mapa = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// ===================================================
// 2. JUGADOR MODIFICADO CON EQUIPO Y BUFFS ACTIVOS
// ===================================================
const jugador = {
    gridX: 1, gridY: 1,
    pixelX: 48, pixelY: 48,
    baseVelocidad: 3,
    
    vida: 100, maxVida: 100,
    mana: 60, maxMana: 60,
    nivel: 1, exp: 0, maxExp: 100,
    puntosSkill: 0,
    puntosStat: 0, 
    
    stats: { fuerza: 10, destreza: 10, vitalidad: 10, magia: 10 },
    
    // Almacena qué item de EQUIPMENT_DATABASE está en cada slot
    equipo: {
        casco: null, collar: null, arma: null, armadura: null,
        escudo: null, guantes: null, pantalones: null, pendiente: null, botas: null
    },

    buffs: {
        velMovHasta: 0,
        velAtkHasta: 0
    },

    oro: 0, 
    direccion: "abajo",
    framesRecibiendoDano: 0,
    inventario: []
};

// --- ARBOL HABILIDADES ---
const arbolHabilidades = [
    { id: "bola_fuego", nombre: "Bola de Fuego", nivelRequerido: 1, puntos: 0, maxPuntos: 5, costoMP: 12, danoBase: 15, incremento: 6, animTipo: "fuego", desc: "Explosión ígnea lineal." },
    { id: "rafaga_hielo", nombre: "Ráfaga Hielo", nivelRequerido: 2, puntos: 0, maxPuntos: 5, costoMP: 18, danoBase: 22, incremento: 9, animTipo: "hielo", desc: "Ola helada circular." },
    { id: "tormenta", nombre: "Rayo Trueno", nivelRequerido: 3, puntos: 0, maxPuntos: 5, costoMP: 25, danoBase: 40, incremento: 15, animTipo: "rayo", desc: "Descarga eléctrica vertical." },
    { id: "curacion", nombre: "Curación", nivelRequerido: 4, puntos: 0, maxPuntos: 5, costoMP: 30, danoBase: 50, incremento: 20, animTipo: "luz", desc: "Restaura HP instantáneamente." },
    { id: "escudo_energia", nombre: "Mana Shield", nivelRequerido: 5, puntos: 0, maxPuntos: 5, costoMP: 35, danoBase: 0, incremento: 0, animTipo: "escudo", desc: "Absorbe daño temporalmente." }
];

const slotsAsignados = [null, null, null];
const TAMANO_INVENTARIO = 12;
const itemsEnSuelo = [];
const animacionesActivas = [];

// --- MONSTRUO DE PRUEBA ---
const monstruo = {
    gridX: 4, gridY: 1,
    pixelX: 4 * TILE_SIZE, pixelY: 1 * TILE_SIZE,
    velocidad: 2, vida: 80, maxVida: 80,
    vivo: true, color: "#ef4444",
    framesRecibiendoDano: 0, cooldownAtaque: 0
};

// ===================================================
// 3. TABLA GENERAL DE DROPS DINÁMICOS
// ===================================================
function spawnLoot(x, y) {
    // Drop Oro Oro
    const configMoneda = ITEMS_DATABASE.moneda;
    const cantidadOro = Math.floor(Math.random() * (configMoneda.dropMax - configMoneda.dropMin + 1)) + configMoneda.dropMin;
    itemsEnSuelo.push({ gridX: x, gridY: y, tipo: configMoneda.id, cantidad: cantidadOro, esEquipo: false, color: configMoneda.color });

    // Consumibles
    Object.keys(ITEMS_DATABASE.items).forEach(key => {
        const itemDb = ITEMS_DATABASE.items[key];
        if (Math.random() <= itemDb.chanceDrop) {
            itemsEnSuelo.push({ gridX: x, gridY: y, tipo: itemDb.id, esEquipo: false, color: itemDb.color, nombre: itemDb.nombre });
        }
    });

    // Equipamientos (Diablo 2 style loot)
    Object.keys(EQUIPMENT_DATABASE).forEach(key => {
        const eqDb = EQUIPMENT_DATABASE[key];
        if (Math.random() <= eqDb.chanceDrop) {
            itemsEnSuelo.push({ gridX: x, gridY: y, tipo: eqDb.id, esEquipo: true, color: eqDb.color, nombre: eqDb.nombre });
        }
    });
}

// ===================================================
// 4. INTERFAZ DE USUARIO Y GESTIÓN DE EQUIPO
// ===================================================
const ventanaMenu = document.getElementById("ventana-menu");
const btnToggleInv = document.getElementById("btn-toggle-inv");
const btnCerrarInv = document.getElementById("btn-cerrar-inv");
const slotsContenedor = document.getElementById("slots-contenedor");
const arbolContenedor = document.getElementById("arbol-skills");
const modalAsignar = document.getElementById("modal-asignar");
const modalSkillNombre = document.getElementById("modal-skill-nombre");
let skillSeleccionadaParaBind = null;

btnToggleInv.addEventListener("click", () => ventanaMenu.classList.toggle("oculto"));
btnCerrarInv.addEventListener("click", () => ventanaMenu.classList.add("oculto"));

document.getElementById("tab-inv").addEventListener("click", (e) => { alternarPestanas(e.target, "contenido-inventario"); actualizarInterfazInventario(); });
document.getElementById("tab-skills").addEventListener("click", (e) => { alternarPestanas(e.target, "contenido-skills"); renderizarArbolSkills(); });
document.getElementById("tab-stats").addEventListener("click", (e) => { alternarPestanas(e.target, "contenido-stats"); actualizarInterfazStats(); });

function alternarPestanas(btnActivo, idSeccion) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("activa"));
    document.querySelectorAll(".seccion-menu").forEach(s => s.classList.add("oculto"));
    btnActivo.classList.add("activa");
    document.getElementById(idSeccion).classList.remove("oculto");
}

// --- CALCULAR ATRIBUTOS FINALES DINÁMICAMENTE ---
function obtenerStatsTotales() {
    let mods = { danoFisico: 0, defensa: 0, danoMagico: 0, velAtk: 0, velMov: 0, vidaMax: 0, magiaBonus: 0, destrezaBonus: 0, danoCritico: 0 };
    
    // Sumar los stats de cada pieza equipada
    Object.keys(jugador.equipo).forEach(slot => {
        const item = jugador.equipo[slot];
        if (item && item.statBonus) {
            if (item.statBonus.danoFisico) mods.danoFisico += item.statBonus.danoFisico;
            if (item.statBonus.defensa) mods.defensa += item.statBonus.defensa;
            if (item.statBonus.danoMagico) mods.danoMagico += item.statBonus.danoMagico;
            if (item.statBonus.velAtk) mods.velAtk += item.statBonus.velAtk;
            if (item.statBonus.velMov) mods.velMov += item.statBonus.velMov;
            if (item.statBonus.vidaMax) mods.vidaMax += item.statBonus.vidaMax;
            if (item.statBonus.magiaBonus) mods.magiaBonus += item.statBonus.magiaBonus;
            if (item.statBonus.destrezaBonus) mods.destrezaBonus += item.statBonus.destrezaBonus;
            if (item.statBonus.danoCritico) mods.danoCritico += item.statBonus.danoCritico;
        }
    });

    const fMagia = jugador.stats.magia + mods.magiaBonus;
    const fDestreza = jugador.stats.destreza + mods.destrezaBonus;

    // Buffs de pociones temporales
    let extraVelMov = Date.now() < jugador.buffs.velMovHasta ? 1.5 : 0;
    let extraVelAtk = Date.now() < jugador.buffs.velAtkHasta ? 25 : 0;

    return {
        maxVida: jugador.stats.vitalidad * 5 + mods.vidaMax,
        maxMana: fMagia * 3,
        danoFisico: 10 + jugador.stats.fuerza + mods.danoFisico,
        defensa: fDestreza + mods.defensa,
        danoMagico: fMagia + mods.danoMagico,
        velAtk: 100 + mods.velAtk + extraVelAtk,
        velMov: jugador.baseVelocidad + mods.velMov + extraVelMov,
        critico: mods.danoCritico
    };
}

function actualizarBarrasEstado() {
    const totales = obtenerStatsTotales();
    jugador.maxVida = totales.maxVida;
    jugador.maxMana = totales.maxMana;
    if(jugador.vida > jugador.maxVida) jugador.vida = jugador.maxVida;
    if(jugador.mana > jugador.maxMana) jugador.mana = jugador.maxMana;

    document.getElementById("num-vida").innerText = `${Math.floor(jugador.vida)}/${jugador.maxVida} HP`;
    document.getElementById("num-mana").innerText = `${Math.floor(jugador.mana)}/${jugador.maxMana} MP`;
    document.getElementById("barra-vida").style.width = (jugador.vida / jugador.maxVida * 100) + "%";
    document.getElementById("barra-mana").style.width = (jugador.mana / jugador.maxMana * 100) + "%";
}

function actualizarInterfazStats() {
    document.getElementById("stat-puntos-valores").innerText = jugador.puntosStat;
    document.getElementById("val-fuerza").innerText = jugador.stats.fuerza;
    document.getElementById("val-destreza").innerText = jugador.stats.destreza;
    document.getElementById("val-vitalidad").innerText = jugador.stats.vitalidad;
    document.getElementById("val-magia").innerText = jugador.stats.magia;

    const t = obtenerStatsTotales();
    document.getElementById("total-dano-fisico").innerText = `${t.danoFisico} Pts`;
    document.getElementById("total-defensa").innerText = `+${t.defensa} Abs`;
    document.getElementById("total-dano-magico").innerText = `+${t.danoMagico} Hechizos`;
    document.getElementById("total-vel-atk").innerText = `${t.velAtk}%`;
    document.getElementById("total-crit").innerText = `+${t.critico}%`;

    document.querySelectorAll(".btn-subir-atrib").forEach(btn => btn.disabled = jugador.puntosStat <= 0);
}

// Subir atributos básicos
document.querySelectorAll(".btn-subir-atrib").forEach(btn => {
    btn.addEventListener("click", (e) => {
        if (jugador.puntosStat <= 0) return;
        const statSeleccionado = e.target.getAttribute("data-stat");
        jugador.puntosStat--;
        jugador.stats[statSeleccionado]++;
        
        actualizarAlertasNivel();
        actualizarInterfazStats();
        actualizarBarrasEstado();
    });
});

// ===================================================
// 5. GESTIÓN INTEGRAL DE INVENTARIO Y EQUIPAMIENTO
// ===================================================
function actualizarInterfazInventario() {
    slotsContenedor.innerHTML = "";
    for (let i = 0; i < TAMANO_INVENTARIO; i++) {
        const slotDiv = document.createElement("div");
        slotDiv.classList.add("slot");
        
        const item = jugador.inventario[i];
        if (item) {
            const itemDiv = document.createElement("div");
            itemDiv.classList.add("item-ui");
            itemDiv.style.backgroundColor = item.color || "#4b5563";
            itemDiv.innerText = item.esEquipo ? "🛡️" : "🧪";
            itemDiv.title = item.nombre;
            slotDiv.appendChild(itemDiv);
            slotDiv.addEventListener("click", () => interactuarMochila(i));
        }
        slotsContenedor.appendChild(slotDiv);
    }

    // Renderizar Slots de Equipamiento Superior
    Object.keys(jugador.equipo).forEach(slotName => {
        const box = document.getElementById(`eq-${slotName}`);
        const eqItem = jugador.equipo[slotName];
        if (box) {
            if (eqItem) {
                box.style.backgroundColor = eqItem.color;
                box.innerHTML = `<span style="font-size:10px; color:#111827;">⚔️</span><br>${eqItem.nombre.substring(0,6)}`;
            } else {
                box.style.backgroundColor = "#0b0f19";
                box.innerHTML = `<span class="placeholder-eq">${slotName.toUpperCase()}</span>`;
            }
        }
    });

    actualizarContadoresRapidos();
    document.getElementById("txt-oro").innerText = jugador.oro;
    actualizarBarrasEstado();
}

// Configurar listeners de desequipación en clicks del panel superior
Object.keys(jugador.equipo).forEach(slotName => {
    const box = document.getElementById(`eq-${slotName}`);
    if(box) {
        box.addEventListener("click", () => desequiparItem(slotName));
    }
});

function interactuarMochila(index) {
    const item = jugador.inventario[index];
    if (!item) return;

    if (item.esEquipo) {
        // Intentar equipar (Verificación Diablo 2)
        if (item.req) {
            if (item.req.lvl && jugador.nivel < item.req.lvl) return alert(`Nivel requerido: ${item.req.lvl}`);
            if (item.req.fuerza && jugador.stats.fuerza < item.req.fuerza) return alert(`Fuerza requerida: ${item.req.fuerza}`);
            if (item.req.destreza && jugador.stats.destreza < item.req.destreza) return alert(`Destreza requerida: ${item.req.destreza}`);
            if (item.req.magia && jugador.stats.magia < item.req.magia) return alert(`Magia requerida: ${item.req.magia}`);
        }

        const slotDestino = item.slot;
        const yaEquipado = jugador.equipo[slotDestino];

        // Swap (Intercambio)
        jugador.equipo[slotDestino] = item;
        if (yaEquipado) {
            jugador.inventario[index] = yaEquipado;
        } else {
            jugador.inventario.splice(index, 1);
        }
    } else {
        // Consumibles
        const config = ITEMS_DATABASE.items[item.tipo];
        if (config.tipoEfecto === "hp" && jugador.vida < jugador.maxVida) {
            jugador.vida = Math.min(jugador.maxVida, jugador.vida + config.valor);
            jugador.inventario.splice(index, 1);
        } else if (config.tipoEfecto === "mp" && jugador.mana < jugador.maxMana) {
            jugador.mana = Math.min(jugador.maxMana, jugador.mana + config.valor);
            jugador.inventario.splice(index, 1);
        } else if (config.tipoEfecto === "vel_mov") {
            jugador.buffs.velMovHasta = Date.now() + config.duracion;
            jugador.inventario.splice(index, 1);
        } else if (config.tipoEfecto === "vel_atk") {
            jugador.buffs.velAtkHasta = Date.now() + config.duracion;
            jugador.inventario.splice(index, 1);
        }
    }
    actualizarInterfazInventario();
}

function desequiparItem(slotName) {
    const item = jugador.equipo[slotName];
    if (!item) return;

    if (jugador.inventario.length < TAMANO_INVENTARIO) {
        jugador.inventario.push(item);
        jugador.equipo[slotName] = null;
        actualizarInterfazInventario();
    } else {
        alert("¡Mochila llena!");
    }
}

function actualizarContadoresRapidos() {
    let hp = 0, mp = 0;
    jugador.inventario.forEach(i => {
        if (!i.esEquipo) {
            if (i.tipo.includes("vida")) hp++;
            if (i.tipo.includes("mana")) mp++;
        }
    });
    document.getElementById("cant-quick-hp").innerText = hp;
    document.getElementById("cant-quick-mp").innerText = mp;
}

document.getElementById("quick-hp").addEventListener("click", () => consumirRapidoDinamico("vida"));
document.getElementById("quick-mp").addEventListener("click", () => consumirRapidoDinamico("mana"));

function consumirRapidoDinamico(familia) {
    const idx = jugador.inventario.findIndex(i => !i.esEquipo && i.tipo.includes(familia));
    if (idx !== -1) interactuarMochila(idx);
}

// ===================================================
// 6. HABILIDADES Y ESCALADO MATEMÁTICO POR STATS
// ===================================================
function renderizarArbolSkills() {
    arbolContenedor.innerHTML = "";
    arbolHabilidades.forEach((skill) => {
        const bloqueada = jugador.nivel < skill.nivelRequerido;
        const aprendida = skill.puntos > 0;
        const nodo = document.createElement("div");
        nodo.className = `skill-nodo ${bloqueada ? 'bloqueada' : ''} ${aprendida ? 'aprendida' : ''}`;
        
        nodo.innerHTML = `
            <div class="skill-info">
                <span class="skill-nombre">${skill.nombre} (${skill.puntos}/${skill.maxPuntos})</span>
                <span class="skill-detalles">Lvl Req: ${skill.nivelRequerido} | MP: ${skill.costoMP}</span>
                <span class="skill-detalles" style="color:#60a5fa">${skill.desc}</span>
            </div>
            <button class="btn-subir-skill" ${bloqueada || jugador.puntosSkill <= 0 || skill.puntos >= skill.maxPuntos ? 'disabled' : ''}>+</button>
        `;

        if (aprendida) {
            nodo.addEventListener("click", (e) => { if (!e.target.classList.contains("btn-subir-skill")) abrirModalAsignacion(skill); });
        }

        nodo.querySelector(".btn-subir-skill").addEventListener("click", (e) => {
            e.stopPropagation();
            if (jugador.puntosSkill > 0 && skill.puntos < skill.maxPuntos) {
                jugador.puntosSkill--; skill.puntos++;
                actualizarAlertasNivel(); renderizarArbolSkills(); actualizarBotonesAccionPantalla();
            }
        });
        arbolContenedor.appendChild(nodo);
    });
}

function abrirModalAsignacion(skill) { skillSeleccionadaParaBind = skill; modalSkillNombre.innerText = skill.nombre; modalAsignar.classList.remove("oculto"); }
document.getElementById("btn-cancelar-modal").addEventListener("click", () => modalAsignar.classList.add("oculto"));

document.querySelectorAll(".btn-bind-slot").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const slotIdx = parseInt(e.target.getAttribute("data-slot"));
        if (skillSeleccionadaParaBind) { slotsAsignados[slotIdx] = skillSeleccionadaParaBind; actualizarBotonesAccionPantalla(); modalAsignar.classList.add("oculto"); }
    });
});

function actualizarBotonesAccionPantalla() {
    for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`btn-skill-${i + 1}`); const skill = slotsAsignados[i];
        if (skill) { btn.classList.remove("muerto"); btn.innerText = skill.nombre.substring(0, 4).toUpperCase(); } 
        else { btn.classList.add("muerto"); btn.innerText = `S${i + 1}`; }
    }
}

// --- LOGICA EXPERIENCIA ---
function ganarExperiencia(cantidad) {
    jugador.exp += cantidad;
    if (jugador.exp >= jugador.maxExp) {
        jugador.exp -= jugador.maxExp;
        jugador.nivel++;
        jugador.puntosSkill++;
        jugador.puntosStat += 5; 
        jugador.maxExp = Math.floor(jugador.maxExp * 1.5);
        jugador.vida = jugador.maxVida;
        jugador.mana = jugador.maxMana;
    }
    actualizarAlertasNivel();
    actualizarBarrasEstado();
}

function actualizarAlertasNivel() {
    document.getElementById("txt-lvl").innerText = jugador.nivel;
    document.getElementById("txt-exp").innerText = jugador.exp;
    document.getElementById("txt-maxexp").innerText = jugador.maxExp;
    const alerta = document.getElementById("puntos-skill-alerta");
    if (jugador.puntosSkill > 0 || jugador.puntosStat > 0) alerta.classList.remove("oculto");
    else alerta.classList.add("oculto");
}

// ===================================================
// 7. MECANICAS DE COMBATE ADAPTADAS AL EQUIPO
// ===================================================
const input = { up: false, down: false, left: false, right: false };

function activarBotonMovimiento(idHtml, dir) {
    const btn = document.getElementById(idHtml); if (!btn) return;
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); input[dir] = true; });
    btn.addEventListener("touchend", (e) => { e.preventDefault(); input[dir] = false; });
    btn.addEventListener("mousedown", () => input[dir] = true);
    btn.addEventListener("mouseup", () => input[dir] = false);
}
activarBotonMovimiento("btn-up", "up"); activarBotonMovimiento("btn-down", "down");
activarBotonMovimiento("btn-left", "left"); activarBotonMovimiento("btn-right", "right");

document.getElementById("btn-ataque").addEventListener("click", () => ejecutarAccionCombate(null));

document.querySelectorAll(".btn-skill-accion").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const slotIdx = parseInt(e.target.getAttribute("data-index"));
        const skill = slotsAsignados[slotIdx];
        if (skill) ejecutarAccionCombate(skill);
    });
});

function ejecutarAccionCombate(hechizo) {
    const t = obtenerStatsTotales();
    let rangoX = jugador.gridX; let rangoY = jugador.gridY;
    if (jugador.direccion === "arriba") rangoY -= 1;
    if (jugador.direccion === "abajo") rangoY += 1;
    if (jugador.direccion === "izquierda") rangoX -= 1;
    if (jugador.direccion === "derecha") rangoX += 1;

    let danoFinal = 0;

    if (hechizo) {
        if (jugador.mana < hechizo.costoMP) return;
        if (hechizo.id === "curacion") {
            jugador.mana -= hechizo.costoMP;
            let cura = hechizo.danoBase + (hechizo.puntos * hechizo.incremento) + t.danoMagico;
            jugador.vida = Math.min(jugador.maxVida, jugador.vida + cura);
            crearEfectoVisual(jugador.gridX, jugador.gridY, "luz");
            actualizarBarrasEstado();
            return;
        } else if (hechizo.id === "escudo_energia") {
            jugador.mana -= hechizo.costoMP;
            crearEfectoVisual(jugador.gridX, jugador.gridY, "escudo");
            return;
        } else {
            jugador.mana -= hechizo.costoMP;
            danoFinal = hechizo.danoBase + ((hechizo.puntos - 1) * hechizo.incremento) + t.danoMagico;
            crearEfectoVisual(rangoX, rangoY, hechizo.animTipo);
        }
    } else {
        danoFinal = t.danoFisico;
        // Aplicar probabilidad de golpe crítico del equipo
        if (Math.random() * 100 < t.critico) {
            danoFinal = Math.floor(danoFinal * 1.5);
        }
        crearEfectoVisual(rangoX, rangoY, "fisico");
    }

    if (monstruo.vivo && monstruo.gridX === rangoX && monstruo.gridY === rangoY) {
        monstruo.vida -= danoFinal;
        monstruo.framesRecibiendoDano = 10;

        if (monstruo.vida <= 0) {
            monstruo.vivo = false;
            spawnLoot(monstruo.gridX, monstruo.gridY);
            ganarExperiencia(60);
            setTimeout(() => {
                monstruo.vida = monstruo.maxVida; monstruo.vivo = true;
                monstruo.gridX = 5; monstruo.gridY = 1;
                monstruo.pixelX = monstruo.gridX * TILE_SIZE; monstruo.pixelY = monstruo.gridY * TILE_SIZE;
            }, 4000);
        }
    }
    actualizarBarrasEstado();
}

function crearEfectoVisual(gx, gy, tipo) { animacionesActivas.push({ gridX: gx, gridY: gy, tipo: tipo, frame: 0, maxFrames: 25 }); }

// ===================================================
// 8. FÍSICAS, COLISIONES Y MOVIMIENTO
// ===================================================
setInterval(() => {
    if (!monstruo.vivo) return;
    if (monstruo.pixelX === monstruo.gridX * TILE_SIZE && monstruo.pixelY === monstruo.gridY * TILE_SIZE) {
        const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        const nX = monstruo.gridX + d.x, nY = monstruo.gridY + d.y;
        if (nY >= 0 && nY < mapa.length && nX >= 0 && nX < mapa[0].length && mapa[nY][nX] !== 1) {
            if (!(nX === jugador.gridX && nY === jugador.gridY)) { monstruo.gridX = nX; monstruo.gridY = nY; }
        }
    }
}, 1200);

function actualizarFisicas() {
    const t = obtenerStatsTotales();
    const destX = jugador.gridX * TILE_SIZE, destY = jugador.gridY * TILE_SIZE;
    
    if (jugador.pixelX === destX && jugador.pixelY === destY) {
        let sigX = jugador.gridX; let sigY = jugador.gridY;
        if (input.up) { jugador.direccion = "arriba"; sigY--; }
        else if (input.down) { jugador.direccion = "abajo"; sigY++; }
        else if (input.left) { jugador.direccion = "izquierda"; sigX--; }
        else if (input.right) { jugador.direccion = "derecha"; sigX++; }

        if (sigX !== jugador.gridX || sigY !== jugador.gridY) {
            const esMuro = mapa[sigY][sigX] === 1;
            const esEnemigo = monstruo.vivo && (sigX === monstruo.gridX && sigY === monstruo.gridY);
            if (!esMuro && !esEnemigo) { jugador.gridX = sigX; jugador.gridY = sigY; }
        }
        revisarRecogidaLoot();
    }

    // El paso de píxeles usa la velocidad modificada de la tabla total
    if (jugador.pixelX < destX) jugador.pixelX += Math.min(t.velMov, destX - jugador.pixelX);
    if (jugador.pixelX > destX) jugador.pixelX -= Math.min(t.velMov, jugador.pixelX - destX);
    if (jugador.pixelY < destY) jugador.pixelY += Math.min(t.velMov, destY - jugador.pixelY);
    if (jugador.pixelY > destY) jugador.pixelY -= Math.min(t.velMov, jugador.pixelY - destY);

    if (monstruo.vivo) {
        const mX = monstruo.gridX * TILE_SIZE, mY = monstruo.gridY * TILE_SIZE;
        if (monstruo.pixelX < mX) monstruo.pixelX += monstruo.velocidad;
        if (monstruo.pixelX > mX) monstruo.pixelX -= monstruo.velocidad;
        if (monstruo.pixelY < mY) monstruo.pixelY += monstruo.velocidad;
        if (monstruo.pixelY > mY) monstruo.pixelY -= monstruo.velocidad;

        if (Math.abs(monstruo.gridX - jugador.gridX) + Math.abs(monstruo.gridY - jugador.gridY) === 1) {
            if (monstruo.cooldownAtaque <= 0) {
                const danoBaseMonstruo = 22;
                const dañoSufrido = Math.max(1, danoBaseMonstruo - t.defensa);
                
                jugador.vida = Math.max(0, jugador.vida - dañoSufrido);
                jugador.framesRecibiendoDano = 10;
                // Cooldown escalado con velocidad de ataque simulada en frames
                monstruo.cooldownAtaque = Math.max(20, 60 - Math.floor(t.velAtk / 5));
                actualizarBarrasEstado();
            }
        }
        if (monstruo.cooldownAtaque > 0) monstruo.cooldownAtaque--;
    }
}

function revisarRecogidaLoot() {
    for (let i = itemsEnSuelo.length - 1; i >= 0; i--) {
        const item = itemsEnSuelo[i];
        if (jugador.gridX === item.gridX && jugador.gridY === item.gridY) {
            if (item.tipo === "oro") {
                jugador.oro += item.cantidad; itemsEnSuelo.splice(i, 1); actualizarInterfazInventario();
            } else if (jugador.inventario.length < TAMANO_INVENTARIO) {
                if (item.esEquipo) {
                    const template = EQUIPMENT_DATABASE[item.tipo];
                    jugador.inventario.push({ ...template, esEquipo: true });
                } else {
                    jugador.inventario.push({ tipo: item.tipo, esEquipo: false, color: item.color, nombre: item.nombre });
                }
                itemsEnSuelo.splice(i, 1);
                actualizarInterfazInventario();
            }
        }
    }
}

// ===================================================
// 9. RENDERIZACIÓN GRÁFICA GENERAL
// ===================================================
function buclePrincipal() {
    actualizarFisicas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const camaraX = (canvas.width / 2) - jugador.pixelX - (TILE_SIZE / 2);
    const camaraY = (canvas.height / 2) - jugador.pixelY - (TILE_SIZE / 2);
    ctx.save(); ctx.translate(camaraX, camaraY);

    for (let f = 0; f < mapa.length; f++) {
        for (let c = 0; c < mapa[f].length; c++) {
            if (mapa[f][c] === 1) { ctx.fillStyle = "#2d3748"; ctx.fillRect(c * TILE_SIZE, f * TILE_SIZE, TILE_SIZE, TILE_SIZE); } 
            else { ctx.fillStyle = "#14532d"; ctx.fillRect(c * TILE_SIZE, f * TILE_SIZE, TILE_SIZE, TILE_SIZE); }
        }
    }

    itemsEnSuelo.forEach(item => {
        ctx.fillStyle = item.color || "#fff";
        ctx.beginPath();
        ctx.arc(item.gridX * TILE_SIZE + 24, item.gridY * TILE_SIZE + 24, 8, 0, Math.PI * 2);
        ctx.fill();
    });

    if (monstruo.vivo) {
        ctx.fillStyle = monstruo.framesRecibiendoDano > 0 ? "#ffffff" : monstruo.color; if(monstruo.framesRecibiendoDano > 0) monstruo.framesRecibiendoDano--;
        ctx.fillRect(monstruo.pixelX + 4, monstruo.pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = "#374151"; ctx.fillRect(monstruo.pixelX, monstruo.pixelY - 12, TILE_SIZE, 6);
        ctx.fillStyle = "#22c55e"; ctx.fillRect(monstruo.pixelX, monstruo.pixelY - 12, TILE_SIZE * (monstruo.vida / monstruo.maxVida), 6);
    }

    ctx.fillStyle = jugador.framesRecibiendoDano > 0 ? "#f87171" : "#3b82f6"; if(jugador.framesRecibiendoDano > 0) jugador.framesRecibiendoDano--;
    ctx.fillRect(jugador.pixelX + 4, jugador.pixelY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    
    ctx.fillStyle = "#fbbf24"; let fx = jugador.pixelX + 18, fy = jugador.pixelY + 18;
    if (jugador.direccion === "arriba") fy -= 14; if (jugador.direccion === "abajo") fy += 14; if (jugador.direccion === "izquierda") fx -= 14; if (jugador.direccion === "derecha") fx += 14;
    ctx.fillRect(fx, fy, 12, 12);

    for (let i = animacionesActivas.length - 1; i >= 0; i--) {
        const anim = animacionesActivas[i]; anim.frame++; const cenX = anim.gridX * TILE_SIZE + 24; const cenY = anim.gridY * TILE_SIZE + 24; ctx.save();
        if (anim.tipo === "fuego") { ctx.fillStyle = `rgba(239, 68, 68, ${1 - (anim.frame / anim.maxFrames)})`; ctx.beginPath(); ctx.arc(cenX, cenY, (anim.frame / anim.maxFrames) * 32, 0, Math.PI * 2); ctx.fill(); }
        else if (anim.tipo === "hielo") { ctx.fillStyle = `rgba(96, 165, 250, ${1 - (anim.frame / anim.maxFrames)})`; ctx.beginPath(); ctx.arc(cenX, cenY, (anim.frame / anim.maxFrames) * 32, 0, Math.PI * 2); ctx.fill(); }
        else if (anim.tipo === "rayo") { ctx.strokeStyle = `rgba(251, 191, 36, ${1 - (anim.frame / anim.maxFrames)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cenX, cenY - 40); ctx.lineTo(cenX, cenY + 10); ctx.stroke(); }
        else if (anim.tipo === "luz") { ctx.fillStyle = `rgba(255, 255, 255, ${1 - (anim.frame / anim.maxFrames)})`; ctx.beginPath(); ctx.arc(cenX, cenY, 20, 0, Math.PI * 2); ctx.fill(); }
        else if (anim.tipo === "escudo") { ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cenX, cenY, 24, 0, Math.PI * 2); ctx.stroke(); }
        else if (anim.tipo === "fisico") { ctx.strokeStyle = `rgba(255, 255, 255, ${1 - (anim.frame / anim.maxFrames)})`; ctx.strokeRect(cenX - 12, cenY - 12, 24, 24); }
        ctx.restore(); if (anim.frame >= anim.maxFrames) animacionesActivas.splice(i, 1);
    }

    ctx.restore(); requestAnimationFrame(buclePrincipal);
}

actualizarInterfazInventario();
buclePrincipal();
