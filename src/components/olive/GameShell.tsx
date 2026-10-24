import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Droplet, ScrollText, Settings, Store, X } from "lucide-react";
import { Orchard } from "@/components/olive/Orchard";
import {
  MILESTONES,
  NAMES,
  TREE_COUNTS,
  autoCost,
  fmt,
  growRatio,
  growSeconds,
  milestoneProgress,
  multiplier,
  nextMilestone,
  plotYield,
  shopPrice,
  stackLimit,
  unlockedCount,
  upgradeCost,
} from "@/lib/olive/logic";
import {
  automateSelected,
  buyMaster,
  buyUpgrade,
  closeModal,
  closePlot,
  exportPayload,
  getGame,
  getRev,
  getUI,
  harvest,
  hasBackup,
  importPayload,
  openModal,
  openPlot,
  pressMill,
  resetGame,
  restoreBackup,
  save,
  selectUnlocked,
  subscribe,
  toast,
  upgradeSelected,
} from "@/lib/olive/store";

function useOlive() {
  const rev = useSyncExternalStore(subscribe, getRev, getRev);
  return { rev, game: getGame(), ui: getUI() };
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function GameShell() {
  const { game, ui } = useOlive();
  const plot = game.plots[ui.selected];
  const mult = multiplier(game);
  const unlocked = unlockedCount(game);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        selectUnlocked(e.key === "ArrowRight" ? 1 : -1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const picked = getUI().selected;
        const plot = getGame().plots[picked];
        if (plot?.stock > 0) harvest(picked);
        else if (plot?.unlocked) openPlot(picked);
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        pressMill();
      } else if (e.key === "Escape") {
        if (getUI().modal) closeModal();
        else closePlot();
      }
    };
    const onHide = () => {
      if (document.hidden) save();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  const ripeSomewhere = game.plots.some((p) => p.unlocked && p.stock > 0);

  return (
    <main className="relative h-dvh overflow-hidden bg-meadow text-ink">
      <Orchard />
      <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-20 px-3">
        <div className="flex items-center justify-between gap-2">
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="grid size-11 place-items-center rounded-2xl bg-olive-deep font-display text-xl italic text-paper">O</span>
            <div className="hidden leading-none sm:block">
              <div className="font-display text-lg italic text-ink">Oliva</div>
              <div className="mt-1 text-xs text-muted">Provence</div>
            </div>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => pressMill()}
              className={cx(
                "flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold",
                game.olives >= 10 ? "bg-olive text-paper" : "bg-paper text-muted ring-1 ring-line",
              )}
            >
              <Droplet className="size-4" />
              Moulin
            </button>
            <IconButton label="Boutique" onClick={() => openModal("shop")}>
              <Store className="size-5" />
            </IconButton>
            <IconButton label="Journal" onClick={() => openModal("progress")}>
              <ScrollText className="size-5" />
            </IconButton>
            <IconButton label="Options" onClick={() => openModal("settings")}>
              <Settings className="size-5" />
            </IconButton>
          </div>
        </div>
        <div className="pointer-events-auto mt-2 flex justify-center">
          <div className="flex items-center gap-1 rounded-full bg-paper/95 p-1 shadow-soft ring-1 ring-line">
            <Resource icon="/art/crate.png" label="Olives en réserve" value={fmt(game.olives) + " kg"} />
            <span className="h-6 w-px bg-line" />
            <Resource icon="/art/crate.png" label="Huile disponible" value={fmt(game.oil) + " kg"} oil />
            <span className="h-6 w-px bg-line" />
            <div className="px-2.5 py-1 text-center" title={"Rendement ×" + mult.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}>
              <div className="text-sm font-semibold tabular-nums text-gold-deep">×{mult.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted">{unlocked}/9</div>
            </div>
          </div>
        </div>
      </header>

      {!ui.plotOpen && !ui.modal && (
        <p className="pointer-events-none absolute inset-x-0 bottom-4 z-20 px-4 text-center text-sm text-ink-soft">
          <span className="rounded-full bg-paper/80 px-3 py-1.5 shadow-soft">
            {ripeSomewhere ? "Touche ou glisse sur un arbre doré." : "Les olives mûrissent toutes seules."}
          </span>
        </p>
      )}

      <section
        className={cx(
          "safe-bottom absolute inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md rounded-t-3xl bg-paper px-4 pt-3 shadow-soft ring-1 ring-line transition-transform duration-200",
          ui.plotOpen ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        aria-hidden={!ui.plotOpen}
      >
        {plot?.unlocked && (
          <>
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-wide text-muted">TERROIR {ui.selected + 1}</div>
                <h2 className="font-display text-2xl italic text-ink">{NAMES[ui.selected]}</h2>
              </div>
              <button type="button" className="grid size-11 place-items-center rounded-full text-ink-soft" onClick={() => closePlot()} aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-muted">
              {TREE_COUNTS[ui.selected]} olivier{TREE_COUNTS[ui.selected] > 1 ? "s" : ""} · {fmt(plotYield(game, plot, ui.selected))} kg par récolte
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Rendement" value={fmt(plotYield(game, plot, ui.selected)) + " kg"} />
              <Stat label="Niveau" value={String(plot.level)} />
              <Stat label="Stock" value={plot.stock > 0 ? "×" + plot.stock : "pousse"} />
            </div>
            {plot.stock < 1 && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2">
                <div className="h-full rounded-full bg-leaf" style={{ width: Math.round(growRatio(game, plot, ui.selected) * 100) + "%" }} />
              </div>
            )}
            <div className="mt-3 grid gap-2 pb-3">
              {plot.stock > 0 && (
                <button type="button" className="flex h-12 items-center justify-between rounded-2xl bg-gold px-4 text-sm font-semibold text-ink" onClick={() => harvest(ui.selected)}>
                  <span>Récolter</span>
                  <span>+{fmt(plotYield(game, plot, ui.selected) * plot.stock)} kg</span>
                </button>
              )}
              <button
                type="button"
                className="flex h-12 items-center justify-between rounded-2xl bg-olive px-4 text-sm font-semibold text-paper disabled:opacity-40"
                disabled={game.olives < upgradeCost(game, plot, ui.selected)}
                onClick={() => upgradeSelected()}
              >
                <span>Améliorer le terroir</span>
                <span>{fmt(upgradeCost(game, plot, ui.selected))} kg</span>
              </button>
              <button
                type="button"
                className="flex h-12 items-center justify-between rounded-2xl bg-paper-2 px-4 text-sm font-semibold text-ink-soft disabled:opacity-40"
                disabled={plot.auto || game.olives < autoCost(game, plot, ui.selected)}
                onClick={() => automateSelected()}
              >
                <span>{plot.auto ? "Stockage actif" : "Empiler les récoltes"}</span>
                <span>{plot.auto ? "jusqu'à " + stackLimit(game) : fmt(autoCost(game, plot, ui.selected)) + " kg"}</span>
              </button>
            </div>
            <p className="sr-only">Pousse d'environ {Math.round(growSeconds(game, plot, ui.selected))} secondes.</p>
          </>
        )}
      </section>

      {ui.toastOn && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-50 flex justify-center px-4" role="status">
          <p className="rounded-full bg-olive-deep px-4 py-2 text-sm text-paper shadow-soft">{ui.toast}</p>
        </div>
      )}

      {ui.modal && (
        <div className="absolute inset-0 z-40 flex items-end justify-center bg-olive-deep/45 p-3 sm:items-center" onClick={() => closeModal()} role="presentation">
          <div className="safe-bottom max-h-[86%] w-full max-w-md overflow-auto rounded-3xl bg-paper p-5 shadow-soft" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {ui.modal === "shop" && <Shop gameOil={game.oil} power={game.upgrades.power} speed={game.upgrades.speed} stack={game.upgrades.stack} master={game.upgrades.master} total={game.totalOil} />}
            {ui.modal === "progress" && <Journal total={game.totalOil} mult={mult} />}
            {ui.modal === "settings" && <SettingsPanel message={ui.saveMsg} ok={ui.saveOk} />}
            {ui.modal === "reset" && (
              <>
                <Eyebrow>Attention</Eyebrow>
                <h2 className="font-display text-3xl italic text-ink">Effacer la partie ?</h2>
                <p className="mt-2 text-sm text-muted">La sauvegarde de ce navigateur sera remplacée. Exporte-la avant si tu veux la garder.</p>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className="h-11 rounded-full px-4 text-sm font-semibold text-ink-soft" onClick={() => closeModal()}>Annuler</button>
                  <button type="button" className="h-11 rounded-full bg-olive px-4 text-sm font-semibold text-paper" onClick={() => resetGame()}>Effacer</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-11 place-items-center rounded-full bg-paper text-ink shadow-soft ring-1 ring-line">
      {children}
    </button>
  );
}

function Resource({ icon, label, value, oil }: { icon: string; label: string; value: string; oil?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1" title={label}>
      {oil ? (
        <span className="grid size-8 place-items-center rounded-full bg-gold text-gold-deep">
          <Droplet className="size-4" />
        </span>
      ) : (
        <img src={icon} alt="" className="size-8 object-contain" />
      )}
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper-2 px-2 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-xs font-semibold tracking-wide text-muted">{children}</div>;
}

function Shop({
  gameOil,
  power,
  speed,
  stack,
  master,
  total,
}: {
  gameOil: number;
  power: number;
  speed: number;
  stack: number;
  master: number;
  total: number;
}) {
  const rows = [
    { kind: "power" as const, level: power, title: "Terroirs fertiles", copy: "+25 % de rendement sur tout le domaine." },
    { kind: "speed" as const, level: speed, title: "Soleil provençal", copy: "Tous les oliviers poussent plus vite." },
    { kind: "stack" as const, level: stack, title: "Paniers plus grands", copy: "Deux récoltes de plus peuvent s'empiler." },
  ];
  return (
    <>
      <Eyebrow>Huile</Eyebrow>
      <h2 className="font-display text-3xl italic text-ink">La boutique</h2>
      <p className="mt-2 text-sm text-muted">Ces achats restent acquis après chaque pression du moulin.</p>
      <div className="mt-2">
        {rows.map((row) => {
          const price = shopPrice(row.kind, row.level);
          return (
            <div key={row.kind} className="flex items-center gap-3 border-t border-line py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{row.title}</div>
                <div className="text-xs text-muted">Niveau {row.level} · {row.copy}</div>
              </div>
              <button
                type="button"
                className="h-11 shrink-0 rounded-full bg-gold px-3 text-sm font-semibold text-ink disabled:opacity-40"
                disabled={gameOil < price || row.level >= 15}
                onClick={() => buyUpgrade(row.kind)}
              >
                {row.level >= 15 ? "Max" : price + " huile"}
              </button>
            </div>
          );
        })}
        {total >= 10 && (
          <div className="flex items-center gap-3 border-t border-line py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Presse de maître</div>
              <div className="text-xs text-muted">Achat unique. +25 % de rendement à vie.</div>
            </div>
            <button type="button" className="h-11 shrink-0 rounded-full bg-gold px-3 text-sm font-semibold text-ink disabled:opacity-40" disabled={master > 0 || gameOil < 8} onClick={() => buyMaster()}>
              {master ? "Active" : "8 huiles"}
            </button>
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-end">
        <button type="button" className="h-11 rounded-full px-4 text-sm font-semibold text-ink-soft" onClick={() => closeModal()}>Retour à la ferme</button>
      </div>
    </>
  );
}

function Journal({ total, mult }: { total: number; mult: number }) {
  const next = nextMilestone(getGame());
  const progress = milestoneProgress(getGame());
  return (
    <>
      <Eyebrow>Progression</Eyebrow>
      <h2 className="font-display text-3xl italic text-ink">La route de l'huile</h2>
      <p className="mt-2 text-sm text-muted">10 kg d'olives donnent 1 kg d'huile. Les parcelles repartent, le bonus reste.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Huile à vie" value={fmt(total) + " kg"} />
        <Stat label="Bonus" value={"×" + mult.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
      </div>
      <div className="mt-3 rounded-2xl bg-paper-2 p-3">
        <div className="flex items-center justify-between text-sm">
          <span>{next ? next.name : "Tous les paliers sont acquis"}</span>
          <span className="text-xs text-muted">{next ? fmt(total) + " / " + next.at : fmt(total)}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
          <div className="h-full rounded-full bg-gold" style={{ width: progress + "%" }} />
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {MILESTONES.map((m) => {
          const on = total >= m.at;
          return (
            <div key={m.at} className={cx("rounded-2xl px-3 py-2 ring-1", on ? "bg-paper-2 ring-leaf" : "ring-line")}>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{m.name}</span>
                <span className="text-xs font-medium text-muted">{m.at} huile{m.at > 1 ? "s" : ""}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{m.reward}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-end">
        <button type="button" className="h-11 rounded-full px-4 text-sm font-semibold text-ink-soft" onClick={() => closeModal()}>Continuer</button>
      </div>
    </>
  );
}

function SettingsPanel({ message, ok }: { message: string; ok: boolean }) {
  return (
    <>
      <Eyebrow>Options</Eyebrow>
      <h2 className="font-display text-3xl italic text-ink">Sauvegarde</h2>
      <p className="mt-2 text-sm text-muted">Tout reste dans ce navigateur. Rien ne pousse tant que l'onglet est caché.</p>
      <p className={cx("mt-3 rounded-2xl px-3 py-2 text-sm", ok ? "bg-paper-2 text-ink-soft" : "bg-gold text-ink")}>{message}</p>
      <div className="mt-3 grid gap-2">
        {hasBackup() && (
          <button type="button" className="h-12 rounded-2xl bg-paper-2 px-4 text-left text-sm font-semibold" onClick={() => restoreBackup()}>Restaurer la sauvegarde de secours</button>
        )}
        <button
          type="button"
          className="h-12 rounded-2xl bg-paper-2 px-4 text-left text-sm font-semibold"
          onClick={() => {
            const blob = new Blob([exportPayload()], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "olive-oil-empire-save.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Exporter un fichier JSON
        </button>
        <label className="flex h-12 cursor-pointer items-center rounded-2xl bg-paper-2 px-4 text-sm font-semibold">
          Importer un fichier JSON
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                importPayload(await file.text());
              } catch {
                toast("Fichier de sauvegarde invalide.");
              }
            }}
          />
        </label>
        <button type="button" className="h-12 rounded-2xl bg-olive px-4 text-left text-sm font-semibold text-paper" onClick={() => openModal("reset")}>Recommencer la partie</button>
      </div>
      <p className="mt-3 text-xs text-muted">Clavier : flèches pour changer de terroir, Entrée pour récolter, M pour le moulin, Échap pour fermer.</p>
      <div className="mt-3 flex justify-end">
        <button type="button" className="h-11 rounded-full px-4 text-sm font-semibold text-ink-soft" onClick={() => closeModal()}>Retour</button>
      </div>
    </>
  );
}
