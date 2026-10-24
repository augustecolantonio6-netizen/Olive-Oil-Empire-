import {
  BACKUP_KEY,
  COSTS,
  MILESTONES,
  NAMES,
  autoCost,
  fresh,
  growSeconds,
  loadGame,
  makePlot,
  multiplier,
  normalizeGameData,
  plotYield,
  shopPrice,
  stepGrowth,
  upgradeCost,
  writeGame,
  type Game,
} from "@/lib/olive/logic";

export type ModalId = "shop" | "progress" | "settings" | "reset" | null;

type UI = {
  selected: number;
  plotOpen: boolean;
  modal: ModalId;
  toast: string;
  toastOn: boolean;
  saveMsg: string;
  saveOk: boolean;
};

let game: Game = fresh();
let ui: UI = {
  selected: 0,
  plotOpen: false,
  modal: null,
  toast: "",
  toastOn: false,
  saveMsg: "Sauvegarde locale",
  saveOk: true,
};
let rev = 0;
let toastTimer = 0;
const listeners = new Set<() => void>();

function emit() {
  rev += 1;
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getRev() {
  return rev;
}

export function getGame() {
  return game;
}

export function getUI() {
  return ui;
}

export function boot() {
  const loaded = loadGame();
  game = loaded.game;
  ui = { ...ui, saveMsg: loaded.message, saveOk: loaded.ok };
  const written = writeGame(game, false);
  if (!written.ok) ui = { ...ui, saveMsg: written.message, saveOk: false };
  emit();
}

function persist() {
  const written = writeGame(game, true);
  ui = { ...ui, saveMsg: written.message, saveOk: written.ok };
}

export function save() {
  persist();
  emit();
}

export function refresh() {
  emit();
}

let lastToastAt = 0;
export function toast(message: string) {
  ui = { ...ui, toast: message, toastOn: true };
  lastToastAt = Date.now();
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (Date.now() - lastToastAt >= 2000) {
      ui = { ...ui, toastOn: false };
      emit();
    }
  }, 2100);
  emit();
}

export function tick(dt: number): number[] {
  return stepGrowth(game, dt);
}

export function harvest(index: number): number | null {
  const plot = game.plots[index];
  if (!plot?.unlocked || plot.stock < 1) return null;
  const amount = plotYield(game, plot, index) * plot.stock;
  game.olives += amount;
  plot.stock = 0;
  plot.grow = growSeconds(game, plot, index);
  ui = { ...ui, selected: index };
  persist();
  blip("harvest");
  emit();
  signal("harvest", { index, amount });
  return amount;
}

export function buyPlot(index: number): boolean {
  const plot = game.plots[index];
  if (!plot || plot.unlocked) return false;
  if (game.olives < COSTS[index]) {
    toast("Il manque " + (COSTS[index] - game.olives).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " kg d'olives.");
    return false;
  }
  game.olives -= COSTS[index];
  plot.unlocked = true;
  plot.grow = growSeconds(game, plot, index);
  ui = { ...ui, selected: index, plotOpen: true };
  persist();
  blip("buy");
  toast(NAMES[index] + " rejoint l'oliveraie.");
  return true;
}

export function openPlot(index: number) {
  ui = { ...ui, selected: index, plotOpen: true };
  emit();
}

export function closePlot() {
  if (!ui.plotOpen) return;
  ui = { ...ui, plotOpen: false };
  emit();
}

export function selectUnlocked(delta: number) {
  const unlocked = game.plots.map((p, i) => (p.unlocked ? i : -1)).filter((i) => i >= 0);
  if (!unlocked.length) return;
  const current = Math.max(0, unlocked.indexOf(ui.selected));
  const next = unlocked[(current + delta + unlocked.length) % unlocked.length];
  ui = { ...ui, selected: next, plotOpen: true };
  emit();
}

export function upgradeSelected() {
  const i = ui.selected;
  const plot = game.plots[i];
  if (!plot?.unlocked) return;
  const price = upgradeCost(game, plot, i);
  if (game.olives < price) {
    toast("Pas assez d'olives pour ce terroir.");
    return;
  }
  game.olives -= price;
  plot.level += 1;
  persist();
  blip("buy");
  toast(NAMES[i] + " passe au niveau " + plot.level + ".");
}

export function automateSelected() {
  const i = ui.selected;
  const plot = game.plots[i];
  if (!plot?.unlocked || plot.auto) return;
  const price = autoCost(game, plot, i);
  if (game.olives < price) {
    toast("Pas assez d'olives pour le stockage.");
    return;
  }
  game.olives -= price;
  plot.auto = true;
  if (plot.grow === 0 && plot.stock < 1) plot.grow = growSeconds(game, plot, i);
  persist();
  blip("buy");
  toast("Les récoltes s'empilent. La cueillette reste à toi.");
}

export function pressMill() {
  if (game.olives < 10) {
    toast("Le moulin demande 10 kg. Il en manque.");
    return;
  }
  const previous = game.totalOil;
  game.olives -= 10;
  game.oil += 1;
  game.totalOil += 1;
  game.plots = Array.from({ length: 9 }, (_, i) => makePlot(i));
  game.plots[0].stock = 0;
  game.plots[0].grow = 4.5;
  ui = { ...ui, selected: 0, plotOpen: false };
  persist();
  blip("mill");
  const earned = MILESTONES.find((m) => previous < m.at && game.totalOil >= m.at);
  if (earned) toast(earned.name + " — " + earned.toast);
  else toast("Huile pressée. Rendement ×" + multiplier(game).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + ".");
  signal("mill", { amount: 1 });
}

export function buyUpgrade(kind: "power" | "speed" | "stack") {
  const level = game.upgrades[kind];
  if (level >= 15) {
    toast("Cette amélioration est au maximum.");
    return;
  }
  const price = shopPrice(kind, level);
  if (game.oil < price) {
    toast("Il te faut " + price + " huile.");
    return;
  }
  game.oil -= price;
  game.upgrades[kind] += 1;
  persist();
  blip("buy");
  toast("Amélioration permanente achetée.");
}

export function buyMaster() {
  if (game.totalOil < 10) {
    toast("La presse de maître s'ouvre à 10 huiles cumulées.");
    return;
  }
  if (game.upgrades.master) {
    toast("La presse de maître est déjà en place.");
    return;
  }
  if (game.oil < 8) {
    toast("Il te faut 8 huiles disponibles.");
    return;
  }
  game.oil -= 8;
  game.upgrades.master = 1;
  persist();
  blip("buy");
  toast("Presse de maître : +25 % de rendement à vie.");
}

export function openModal(modal: Exclude<ModalId, null>) {
  ui = { ...ui, modal };
  emit();
}

export function closeModal() {
  if (!ui.modal) return;
  ui = { ...ui, modal: null };
  emit();
}

export function resetGame() {
  game = fresh();
  ui = { ...ui, selected: 0, plotOpen: false, modal: null };
  persist();
  toast("Nouvelle partie.");
}

export function restoreBackup() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) throw new Error("missing");
    game = normalizeGameData(JSON.parse(raw));
    ui = { ...ui, selected: 0, plotOpen: false };
    const written = writeGame(game, false);
    ui = { ...ui, saveMsg: "Sauvegarde de secours restaurée.", saveOk: written.ok };
    toast("Partie restaurée.");
  } catch {
    ui = { ...ui, saveMsg: "Sauvegarde de secours absente ou invalide.", saveOk: false };
    toast("Restauration impossible.");
  }
}

export function exportPayload() {
  return JSON.stringify({ ...game, schemaVersion: 4, exportedAt: new Date().toISOString() }, null, 2);
}

export function importPayload(text: string) {
  const parsed = JSON.parse(text) as { game?: unknown };
  game = normalizeGameData(parsed.game || parsed);
  ui = { ...ui, selected: 0, plotOpen: false, modal: null, saveMsg: "Sauvegarde importée.", saveOk: true };
  persist();
  toast("Sauvegarde importée.");
}

export function hasBackup() {
  try {
    return Boolean(localStorage.getItem(BACKUP_KEY));
  } catch {
    return false;
  }
}

let audio: AudioContext | null = null;

function signal(type: "harvest" | "mill", detail: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("olive-fx", { detail: { type, ...detail } }));
}
function blip(kind: "harvest" | "buy" | "mill" | "tap") {
  try {
    const AC = window.AudioContext;
    if (!AC) return;
    audio ??= new AC();
    if (audio.state === "suspended") void audio.resume();
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = kind === "mill" ? "triangle" : "sine";
    const freq = kind === "harvest" ? 620 : kind === "mill" ? 246 : kind === "buy" ? 480 : 340;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * (kind === "mill" ? 1.5 : 1.25), now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.02 : 0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    /* audio is optional */
  }
}
