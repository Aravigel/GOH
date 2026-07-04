// ===================================================
// BASE DE DATOS RETRO - SIN ICONOS (SOLO COLORES)
// ===================================================

const ITEMS_DATABASE = {
    moneda: { id: "oro", nombre: "Oro", dropMin: 15, dropMax: 45, color: "#eab308", abr: "ORO" },
    items: {
        pocion_vida_p: { id: "pocion_vida_p", nombre: "Poción HP", tipoEfecto: "hp", valor: 30, chanceDrop: 0.35, color: "#ef4444", abr: "P.HP" },
        pocion_mana_p: { id: "pocion_mana_p", nombre: "Poción MP", tipoEfecto: "mp", valor: 20, chanceDrop: 0.35, color: "#3b82f6", abr: "P.MP" },
        elixir_furia: { id: "elixir_furia", nombre: "Elíxir Furia", tipoEfecto: "vel_atk", valor: 25, duracion: 10000, chanceDrop: 0.12, color: "#a855f7", abr: "E.FUR" },
        elixir_velocidad: { id: "elixir_velocidad", nombre: "Elíxir Vel", tipoEfecto: "vel_mov", valor: 1.5, duracion: 10000, chanceDrop: 0.12, color: "#22c55e", abr: "E.VEL" }
    }
};

const EQUIPMENT_DATABASE = {
    espada_bronce: { id: "espada_bronce", nombre: "Espada Bronce", slot: "arma", req: { lvl: 1 }, statBonus: { danoFisico: 6, velAtk: 5 }, chanceDrop: 0.15, color: "#f97316", abr: "ESPA" },
    escudo_madera: { id: "escudo_madera", nombre: "Escudo Madera", slot: "escudo", req: { lvl: 1 }, statBonus: { defensa: 4, vidaMax: 15 }, chanceDrop: 0.15, color: "#854d0e", abr: "ESCU" },
    tunica_mago: { id: "tunica_mago", nombre: "Túnica Mago", slot: "armadura", req: { lvl: 1, magia: 12 }, statBonus: { danoMagico: 5, magiaBonus: 3 }, chanceDrop: 0.10, color: "#8b5cf6", abr: "PETO" },
    casco_hierro: { id: "casco_hierro", nombre: "Yelmo Hierro", slot: "casco", req: { lvl: 2, fuerza: 14 }, statBonus: { defensa: 7, vidaMax: 25 }, chanceDrop: 0.08, color: "#64748b", abr: "YELM" },
    botas_cuero: { id: "botas_cuero", nombre: "Botas Cuero", slot: "botas", req: { lvl: 1 }, statBonus: { velMov: 0.5, destrezaBonus: 2 }, chanceDrop: 0.14, color: "#a16207", abr: "BOTA" },
    anillo_critico: { id: "anillo_critico", nombre: "Anillo Crítico", slot: "pendiente", req: { lvl: 3, destreza: 16 }, statBonus: { danoCritico: 8, velAtk: 10 }, chanceDrop: 0.05, color: "#f43f5e", abr: "ANIL" }
};
