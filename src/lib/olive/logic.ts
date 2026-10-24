export type Plot = {
  unlocked: boolean;
  level: number;
  auto: boolean;
  stock: number;
  grow: number;
};

export type Upgrades = {
  power: number;
  speed: number;
  stack: number;
  master: number;
};

export type Game = {
  olives: number;
  oil: number;
  totalOil: number;
  plots: Plot[];
  upgrades: Upgrades;
};

export const SAVE_KEY = "olive-oil-empire-save-v4";
export const BACKUP_KEY = "olive-oil-empire-backup-v4";
const LEGACY_KEYS = ["olive-oil-empire-save-v3", "olive-oil-empire-save-v2", "olive-oil-empire-save-v1"];

export const NAMES = [
  "Olive sauvage",
  "Aglandau",
  "Picholine",
  "Cailletier",
  "Lucques",
  "Bouteillan",
  "Grossane",
  "Salonenque",
  "Tanche",
];

export const TREE_COUNTS = [1, 1, 2, 2, 2, 3, 3, 3, 4];
const YIELDS = [1, 1.35, 1.8, 2.4, 3.2, 4.3, 5.8, 7.8, 10.5];
export const COSTS = [0, 15, 90, 540, 3240, 19440, 116640, 699840, 4199040];

export type Milestone = {
  at: number;
  name: string;
  bonus: number;
  stack: number;
  growth: number;
  reward: string;
  toast: string;
};

export const MILESTONES: Milestone[] = [
  { at: 1, name: "Premier cru", bonus: 0.1, stack: 0, growth: 0, reward: "+10 % de rendement permanent", toast: "+10 % de rendement permanent" },
  { at: 5, name: "Oliviers dorés", bonus: 0.15, stack: 0, growth: 0, reward: "+15 % de rendement et éclats dorés", toast: "+15 % de rendement et oliviers dorés" },
  { at: 10, name: "Presse de maître", bonus: 0.2, stack: 2, growth: 0, reward: "+20 % de rendement, +2 de stockage, presse exclusive", toast: "+20 % de rendement, +2 de stockage et presse exclusive" },
  { at: 25, name: "Moulin historique", bonus: 0.25, stack: 0, growth: 0.15, reward: "+25 % de rendement, pousse 15 % plus rapide", toast: "+25 % de rendement et pousse accélérée" },
  { at: 50, name: "Empire oléicole", bonus: 0.35, stack: 2, growth: 0.1, reward: "+35 % de rendement, +2 de stockage, pousse plus rapide", toast: "+35 % de rendement, stockage et pousse améliorés" },
  { at: 100, name: "Grand cru légendaire", bonus: 0.5, stack: 0, growth: 0.1, reward: "+50 % de rendement et halo de prestige", toast: "+50 % de rendement et prestige légendaire" },
];

export function makePlot(i: number): Plot {
  return { unlocked: i === 0, level: 1, auto: false, stock: i === 0 ? 1 : 0, grow: i === 0 ? 0 : 7 };
}

export function fresh(): Game {
  return {
    olives: 0,
    oil: 0,
    totalOil: 0,
    plots: Array.from({ length: 9 }, (_, i) => makePlot(i)),
    upgrades: { power: 0, speed: 0, stack: 0, master: 0 },
  };
}

export function fmt(n: number): string {
  const v = Number(n || 0);
  const abs = Math.abs(v);
  if (abs >= 1e9) return trimNum(v / 1e9) + " Md";
  if (abs >= 1e6) return trimNum(v / 1e6) + " M";
  if (abs >= 1e4) return trimNum(v / 1e3) + " k";
  return v.toLocaleString("fr-FR", { maximumFractionDigits: abs >= 100 ? 0 : 1 });
}

function trimNum(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: n >= 100 ? 0 : 1 });
}

export function milestoneYieldBonus(game: Game): number {
  return 1 + MILESTONES.reduce((sum, m) => sum + (game.totalOil >= m.at ? m.bonus : 0), 0);
}

export function milestoneStackBonus(game: Game): number {
  return MILESTONES.reduce((sum, m) => sum + (game.totalOil >= m.at ? m.stack : 0), 0);
}

export function milestoneGrowthMultiplier(game: Game): number {
  const reduction = MILESTONES.reduce((sum, m) => sum + (game.totalOil >= m.at ? m.growth || 0 : 0), 0);
  return Math.max(0.55, 1 - reduction);
}

export function multiplier(game: Game): number {
  return (
    (1 + game.totalOil * 0.2) *
    (1 + game.upgrades.power * 0.25) *
    (1 + (game.upgrades.master || 0) * 0.25) *
    milestoneYieldBonus(game)
  );
}

export function stackLimit(game: Game): number {
  return 3 + game.upgrades.stack * 2 + milestoneStackBonus(game);
}

export function nextMilestone(game: Game): Milestone | null {
  return MILESTONES.find((m) => game.totalOil < m.at) ?? null;
}

export function milestoneProgress(game: Game): number {
  const next = nextMilestone(game);
  if (!next) return 100;
  const previous = [...MILESTONES].reverse().find((m) => game.totalOil >= m.at);
  const start = previous ? previous.at : 0;
  return Math.max(0, Math.min(100, ((game.totalOil - start) / (next.at - start)) * 100));
}

export function growSeconds(game: Game, plot: Plot, i: number): number {
  return Math.max(
    1.25,
    (7 / (1 + game.totalOil * 0.12 + game.upgrades.speed * 0.38 + (plot.level - 1) * 0.1 + i * 0.055)) *
      milestoneGrowthMultiplier(game),
  );
}

export function treeYield(game: Game, plot: Plot, i: number): number {
  return YIELDS[i] * plot.level * multiplier(game);
}

export function plotYield(game: Game, plot: Plot, i: number): number {
  return treeYield(game, plot, i) * TREE_COUNTS[i];
}

export function upgradeCost(game: Game, plot: Plot, i: number): number {
  return Math.ceil((3 + YIELDS[i] * TREE_COUNTS[i] * 0.8) * Math.pow(plot.level, 1.55) * Math.pow(1.05, i) * multiplier(game));
}

export function autoCost(game: Game, plot: Plot, i: number): number {
  return Math.ceil((8 + YIELDS[i] * TREE_COUNTS[i] * 0.6) * Math.pow(1.1, i) * Math.pow(plot.level, 0.15) * multiplier(game));
}

export function shopPrice(kind: "power" | "speed" | "stack", level: number): number {
  const base = kind === "power" ? 1 : kind === "speed" ? 2 : 3;
  return Math.ceil(base * Math.pow(1.8, level));
}

export function unlockedCount(game: Game): number {
  return game.plots.filter((p) => p.unlocked).length;
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number, integer = false): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const safe = Math.max(min, Math.min(max, n));
  return integer ? Math.floor(safe) : safe;
}

export function normalizeGameData(data: unknown): Game {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Structure de sauvegarde invalide");
  const raw = data as Record<string, unknown>;
  const plots = raw.plots;
  if (!Array.isArray(plots) || !raw.upgrades || typeof raw.upgrades !== "object" || Array.isArray(raw.upgrades)) {
    throw new Error("Structure de sauvegarde invalide");
  }
  const normalized = fresh();
  normalized.olives = finiteNumber(raw.olives, 0, 0, 1e18, false);
  normalized.oil = finiteNumber(raw.oil, 0, 0, 1e12, true);
  normalized.totalOil = Math.max(normalized.oil, finiteNumber(raw.totalOil, normalized.oil, 0, 1e12, true));
  const upgrades = raw.upgrades as Record<string, unknown>;
  normalized.upgrades = {
    power: finiteNumber(upgrades.power, 0, 0, 15, true),
    speed: finiteNumber(upgrades.speed, 0, 0, 15, true),
    stack: finiteNumber(upgrades.stack, 0, 0, 15, true),
    master: finiteNumber(upgrades.master, 0, 0, 1, true),
  };
  normalized.plots = Array.from({ length: 9 }, (_, i) => {
    const src = plots[i] && typeof plots[i] === "object" ? (plots[i] as Record<string, unknown>) : {};
    const unlocked = i === 0 || src.unlocked === true;
    const auto = unlocked && src.auto === true;
    let stock = unlocked ? finiteNumber(src.stock, 0, 0, 1000, true) : 0;
    if (!auto) stock = Math.min(stock, 1);
    let grow = unlocked ? finiteNumber(src.grow, 0, 0, 3600, false) : 0;
    if (unlocked && stock === 0 && grow === 0) grow = 1.5;
    return { unlocked, level: finiteNumber(src.level, 1, 1, 1000000, true), auto, stock, grow };
  });
  normalized.plots[0].unlocked = true;
  return normalized;
}

export function loadGame(): { game: Game; message: string; ok: boolean } {
  if (typeof localStorage === "undefined") return { game: fresh(), message: "Nouvelle partie", ok: true };
  let invalidFound = false;
  let storageFailed = false;
  for (const key of [SAVE_KEY, BACKUP_KEY, ...LEGACY_KEYS]) {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      storageFailed = true;
      break;
    }
    if (!raw) continue;
    try {
      const game = normalizeGameData(JSON.parse(raw));
      return {
        game,
        ok: true,
        message:
          key === BACKUP_KEY
            ? "Partie récupérée depuis la sauvegarde de secours."
            : key !== SAVE_KEY
              ? "Ancienne sauvegarde récupérée et mise à niveau."
              : "Sauvegarde locale chargée.",
      };
    } catch {
      invalidFound = true;
    }
  }
  if (storageFailed) return { game: fresh(), ok: false, message: "Le navigateur bloque le stockage local. Exporte un JSON pour garder la partie." };
  if (invalidFound) return { game: fresh(), ok: false, message: "Sauvegarde illisible : nouvelle partie. Vérifie ton export si tu en as un." };
  return { game: fresh(), ok: true, message: "Nouvelle partie. La sauvegarde reste dans ce navigateur." };
}

export function writeGame(game: Game, makeBackup: boolean): { ok: boolean; message: string } {
  try {
    if (makeBackup) {
      const previous = localStorage.getItem(SAVE_KEY);
      if (previous) {
        try {
          localStorage.setItem(BACKUP_KEY, previous);
        } catch {
          /* backup is best-effort */
        }
      }
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...game, schemaVersion: 4 }));
    return { ok: true, message: "Sauvegarde locale OK · " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) };
  } catch {
    return { ok: false, message: "Écriture impossible. Exporte ta sauvegarde pour ne pas la perdre." };
  }
}

export function stepGrowth(game: Game, dt: number): number[] {
  const ripened: number[] = [];
  game.plots.forEach((plot, i) => {
    if (!plot.unlocked) return;
    const cap = plot.auto ? stackLimit(game) : 1;
    if (plot.grow > 0) {
      plot.grow = Math.max(0, plot.grow - dt);
      if (plot.grow === 0 && plot.stock < cap) {
        plot.stock += 1;
        ripened.push(i);
        if (plot.auto && plot.stock < stackLimit(game)) plot.grow = growSeconds(game, plot, i);
      }
    } else if (plot.stock < cap && (plot.stock === 0 || plot.auto)) {
      plot.grow = growSeconds(game, plot, i);
    }
  });
  return ripened;
}

export function growRatio(game: Game, plot: Plot, i: number): number {
  if (plot.stock > 0 && !plot.auto) return 1;
  const total = growSeconds(game, plot, i);
  if (plot.stock > 0 && plot.grow <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - (plot.grow || total) / total));
}
