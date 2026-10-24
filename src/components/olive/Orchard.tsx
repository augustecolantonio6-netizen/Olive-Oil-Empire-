import { useEffect, useRef } from "react";
import { COSTS, fmt, growRatio, TREE_COUNTS } from "@/lib/olive/logic";
import { buyPlot, getGame, getUI, harvest, openPlot, refresh, save, tick } from "@/lib/olive/store";

type SpriteKey = "grass" | "locked" | "young" | "ancient" | "house" | "crate";

const SRC: Record<SpriteKey, string> = {
  grass: "/art/plot-grass.png",
  locked: "/art/plot-locked.png",
  young: "/art/tree-young.png",
  ancient: "/art/tree-ancient.png",
  house: "/art/house.png",
  crate: "/art/crate.png",
};

const TILE_ASPECT = 441 / 578;
const PLANT = 0.4;

type PlotPoint = { x: number; y: number };
type Prop = { x: number; y: number; w: number };
type Layout = {
  tw: number;
  th: number;
  hw: number;
  hh: number;
  plots: PlotPoint[];
  house: Prop | null;
  crate: Prop | null;
};

type FloatText = { x: number; y: number; text: string; at: number };
type OliveBit = { x: number; y: number; tx: number; ty: number; r: number; at: number; life: number; color: string };
type Point = { x: number; y: number };

const palette = {
  skyTop: "#e7f1d6",
  skyMid: "#d5e4bc",
  skyBot: "#c3d7a4",
  field: "rgba(126, 158, 86, 0.28)",
  hill: "rgba(168, 196, 132, 0.9)",
  shadow: "rgba(36, 56, 44, 0.18)",
  gold: "#e6c27a",
  goldDeep: "#8a6430",
  ink: "#24382c",
  paper: "#f7f3ea",
  leaf: "#5f8f3d",
  track: "#efe6d4",
};

function computeLayout(w: number, h: number): Layout {
  const portrait = w < 820;
  const header = Math.max(122, Math.min(156, h * (portrait ? 0.155 : 0.14)));
  const footer = portrait ? 70 : 44;
  const margin = portrait ? 12 : 36;
  const gapRatio = portrait ? 0.1 : 0.072;
  const side = portrait ? 0 : Math.min(292, w * 0.25);

  let tw = (w - margin * 2 - side) / (3 + 4 * gapRatio);
  tw = Math.max(74, Math.min(tw, portrait ? 132 : 180));

  const metrics = (size: number) => {
    const th = size * TILE_ASPECT;
    const hw = size / 2;
    const hh = th / 2;
    const gap = size * gapRatio;
    const stepX = hw + gap;
    const stepY = hh * 0.9 + gap * 0.42;
    const treeOver = size * 1.2;
    return { th, hw, hh, gap, stepX, stepY, treeOver };
  };

  let m = metrics(tw);
  const availH = h - header - footer - (portrait ? 64 : 6);
  const block = m.treeOver + 4 * m.stepY + m.hh;
  if (block > availH && availH > 90) {
    tw *= availH / block;
    m = metrics(tw);
  }

  const cx = portrait ? w * 0.57 : (margin + side + w - margin) / 2;
  let cy = header + m.treeOver + (portrait ? 28 : 6);
  const bottom = cy + 4 * m.stepY + m.hh * 0.7;
  const maxBottom = h - footer - (portrait ? 58 : 2);
  if (bottom > maxBottom) cy -= bottom - maxBottom;

  const plots = Array.from({ length: 9 }, (_, i) => {
    const c = i % 3;
    const r = Math.floor(i / 3);
    return { x: cx + (c - r) * m.stepX, y: cy + (c + r) * m.stepY };
  });

  let house: Prop | null = null;
  let crate: Prop | null = null;
  const houseAspect = 825 / 768;

  if (portrait) {
    const span = plots[8].y - plots[0].y;
    const floor = h - footer - tw * 0.72;
    const want = floor - plots[0].y;
    if (span > 8 && want > span + 16) {
      const scale = Math.min(1.38, want / span);
      const y0 = plots[0].y;
      plots.forEach((p) => {
        p.y = y0 + (p.y - y0) * scale;
      });
    }
    let houseW = Math.min(tw * 1.42, w * 0.42);
    let houseH = houseW * houseAspect;
    const maxH = plots[0].y - tw * 0.12 - header - 8;
    if (maxH > 78 && houseH > maxH) {
      houseH = maxH;
      houseW = houseH / houseAspect;
    }
    house = { x: margin + houseW * 0.46, y: header + 8 + houseH, w: houseW };
    const crateW = Math.min(tw * 0.62, 86);
    crate = {
      x: w - margin - crateW * 0.4,
      y: Math.min(h - footer - 2, plots[8].y + m.hh + tw * 0.36),
      w: crateW,
    };
  } else {
    const gridLeft = Math.min(...plots.map((p) => p.x)) - m.hw;
    const houseW = Math.min(Math.max(148, gridLeft - margin - 32), 268);
    const foot = plots[6].y - m.hh * 0.02;
    house = { x: margin + houseW * 0.5, y: foot, w: houseW };
    const crateW = Math.min(tw * 0.46, 92);
    const gridClear = gridLeft - crateW * 0.62;
    crate = {
      x: Math.min(house.x + houseW * 0.22, gridClear),
      y: foot + houseW * 0.16,
      w: crateW,
    };
  }

  return { tw, th: m.th, hw: m.hw, hh: m.hh, plots, house, crate };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function blit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  ax = 0.5,
  ay = 0.99,
) {
  const height = width * (img.naturalHeight / img.naturalWidth);
  ctx.drawImage(img, x - width * ax, y - height * ay, width, height);
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(2, rx), Math.max(2, ry), 0, 0, Math.PI * 2);
  ctx.fill();
}

export function Orchard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<Layout | null>(null);
  const spritesRef = useRef<Partial<Record<SpriteKey, HTMLImageElement>>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let alive = true;
    (Object.keys(SRC) as SpriteKey[]).forEach((key) => {
      const img = new Image();
      img.decoding = "async";
      img.src = SRC[key];
      img.onload = () => {
        if (alive) spritesRef.current[key] = img;
      };
    });

    const floats: FloatText[] = [];
    const olives: OliveBit[] = [];
    const shakes = new Map<number, number>();
    let last = 0;
    let lastSave = 0;
    let lastUi = 0;
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const spawnOlives = (index: number, now: number) => {
      const layout = layoutRef.current;
      if (!layout) return;
      const p = layout.plots[index];
      const colors = ["#7eaa3c", "#9fbd43", "#d1ad36", "#668b33"];
      const target = layout.crate ?? { x: p.x, y: p.y - layout.tw };
      const n = Math.min(14, 7 + TREE_COUNTS[index]);
      for (let k = 0; k < n; k++) {
        olives.push({
          x: p.x + (Math.random() - 0.5) * layout.tw * 0.28,
          y: p.y - layout.tw * 0.35,
          tx: target.x + (Math.random() - 0.5) * 18,
          ty: target.y - layout.tw * 0.08,
          r: 2.2 + Math.random() * 1.5,
          at: now + k * 16,
          life: 680 + Math.random() * 180,
          color: colors[k % colors.length],
        });
      }
      shakes.set(index, now);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w < 2 || h < 2) return;
      const dt = last ? Math.min((now - last) / 1000, 0.08) : 0;
      last = now;
      if (!document.hidden && dt > 0) {
        const ripened = tick(dt);
        if (!reduce) ripened.forEach((i) => shakes.set(i, now));
      }
      if (now - lastSave > 4000) {
        save();
        lastSave = now;
      }
      if (now - lastUi > 320) {
        refresh();
        lastUi = now;
      }

      const layout = computeLayout(w, h);
      layoutRef.current = layout;
      const sprites = spritesRef.current;
      const game = getGame();
      const ui = getUI();

      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, palette.skyTop);
      sky.addColorStop(0.45, palette.skyMid);
      sky.addColorStop(1, palette.skyBot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      const gx = layout.plots[4]?.x ?? w / 2;
      const gy = layout.plots[4]?.y ?? h / 2;
      ctx.fillStyle = palette.hill;
      ctx.beginPath();
      ctx.ellipse(w * 0.22, gy + layout.tw * 0.2, w * 0.38, layout.tw * 0.55, 0, 0, Math.PI * 2);
      ctx.ellipse(w * 0.84, gy + layout.tw * 0.05, w * 0.42, layout.tw * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.field;
      ctx.beginPath();
      ctx.ellipse(gx, gy + 8, layout.tw * 2.05, layout.tw * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      if (layout.house && sprites.house) {
        shadow(ctx, layout.house.x, layout.house.y + 4, layout.house.w * 0.36, layout.tw * 0.07);
        blit(ctx, sprites.house, layout.house.x, layout.house.y, layout.house.w);
      }

      const order = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort((a, b) => layout.plots[a].y - layout.plots[b].y);
      for (const i of order) {
        const plot = game.plots[i];
        const pt = layout.plots[i];
        const tile = sprites[plot.unlocked ? "grass" : "locked"];
        const tileMidY = pt.y + layout.th * (0.5 - PLANT);
        shadow(ctx, pt.x, tileMidY + layout.hh * 0.55, layout.hw * 0.72, layout.hh * 0.22);
        if (tile) blit(ctx, tile, pt.x, pt.y, layout.tw, 0.5, PLANT);

        if (plot.unlocked) {
          const ripe = plot.stock > 0;
          const tree = sprites[ripe ? "ancient" : "young"];
          const ratio = ripe ? 1 : growRatio(game, plot, i);
          const started = shakes.get(i);
          const age = started == null ? 9999 : now - started;
          const strength = !reduce && age < 480 ? 1 - age / 480 : 0;
          const wobble = Math.sin(age / 18) * strength * 4;
          const sway = reduce ? 0 : Math.sin(now / 900 + i * 1.7) * 0.7;
          if (tree) {
            const height = layout.tw * (ripe ? 1.16 : 0.64 + 0.26 * ratio);
            const width = height * (tree.naturalWidth / tree.naturalHeight);
            shadow(ctx, pt.x, pt.y + 3, width * 0.18, layout.hh * 0.16);
            ctx.save();
            ctx.translate(pt.x + wobble + sway, pt.y);
            if (strength) ctx.rotate(Math.sin(age / 24) * strength * 0.045);
            ctx.drawImage(tree, -width / 2, -height * 0.985, width, height);
            ctx.restore();
          }
          if (ripe) {
            pill(ctx, pt.x, tileMidY + layout.hh * 0.55, plot.stock > 1 ? "Prêt ×" + plot.stock : "Prêt", palette.gold, palette.goldDeep);
          } else {
            const bw = layout.tw * 0.38;
            const bx = pt.x - bw / 2;
            const by = tileMidY + layout.hh * 0.42;
            roundRect(ctx, bx, by, bw, 5, 2.5);
            ctx.fillStyle = palette.track;
            ctx.fill();
            roundRect(ctx, bx, by, Math.max(3, bw * ratio), 5, 2.5);
            ctx.fillStyle = palette.leaf;
            ctx.fill();
          }
        } else {
          pill(ctx, pt.x, tileMidY + layout.hh * 0.58, fmt(COSTS[i]) + " kg", palette.paper, "#cbb98a");
        }

        if (i === ui.selected) {
          ctx.beginPath();
          ctx.moveTo(pt.x, tileMidY - layout.hh);
          ctx.lineTo(pt.x + layout.hw, tileMidY);
          ctx.lineTo(pt.x, tileMidY + layout.hh);
          ctx.lineTo(pt.x - layout.hw, tileMidY);
          ctx.closePath();
          ctx.strokeStyle = palette.goldDeep;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      if (layout.crate && sprites.crate) {
        shadow(ctx, layout.crate.x, layout.crate.y + 3, layout.crate.w * 0.34, layout.tw * 0.055);
        blit(ctx, sprites.crate, layout.crate.x, layout.crate.y, layout.crate.w);
      }

      for (let k = olives.length - 1; k >= 0; k--) {
        const bit = olives[k];
        const age = now - bit.at;
        if (age < 0) continue;
        if (age > bit.life) {
          olives.splice(k, 1);
          continue;
        }
        const t = age / bit.life;
        const x = bit.x + (bit.tx - bit.x) * t;
        const y = bit.y + (bit.ty - bit.y) * t - Math.sin(t * Math.PI) * 28;
        ctx.globalAlpha = Math.max(0, 1 - t * t);
        ctx.fillStyle = bit.color;
        ctx.beginPath();
        ctx.ellipse(x, y, bit.r, bit.r * 1.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (let k = floats.length - 1; k >= 0; k--) {
        const item = floats[k];
        const age = (now - item.at) / 1000;
        if (age > 1.05) {
          floats.splice(k, 1);
          continue;
        }
        ctx.globalAlpha = 1 - age;
        ctx.font = "700 16px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = palette.paper;
        ctx.strokeText(item.text, item.x, item.y - age * 42);
        ctx.fillStyle = palette.ink;
        ctx.fillText(item.text, item.x, item.y - age * 42);
        ctx.globalAlpha = 1;
      }

      canvas.dataset.frame = "1";
    };

    const localPoint = (e: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const hitPlot = (pt: Point): number | null => {
      const layout = layoutRef.current;
      if (!layout) return null;
      let best = -1;
      let bestY = -Infinity;
      layout.plots.forEach((plot, i) => {
        const tileMidY = plot.y + layout.th * (0.5 - PLANT);
        const inside = Math.abs(pt.x - plot.x) / layout.hw + Math.abs(pt.y - tileMidY) / layout.hh <= 1.12;
        const treeTop = plot.y - layout.tw * 1.2;
        const onTree =
          pt.x > plot.x - layout.tw * 0.36 &&
          pt.x < plot.x + layout.tw * 0.36 &&
          pt.y > treeTop &&
          pt.y < plot.y + layout.hh * 0.15;
        if ((inside || onTree) && plot.y >= bestY) {
          best = i;
          bestY = plot.y;
        }
      });
      return best >= 0 ? best : null;
    };

    let held = false;
    let swiped = new Set<number>();
    let start: Point | null = null;
    let moved = false;

    const act = (index: number, pt: Point, fromSwipe: boolean) => {
      const plot = getGame().plots[index];
      if (!plot.unlocked) {
        if (!fromSwipe) buyPlot(index);
        return;
      }
      if (plot.stock > 0) {
        harvest(index);
        return;
      }
      if (!fromSwipe) openPlot(index);
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture?.(e.pointerId);
      const pt = localPoint(e);
      held = true;
      moved = false;
      start = pt;
      swiped = new Set();
      const index = hitPlot(pt);
      if (index != null && getGame().plots[index].unlocked && getGame().plots[index].stock > 0) {
        swiped.add(index);
        act(index, pt, false);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!held || !start) return;
      const pt = localPoint(e);
      if (Math.hypot(pt.x - start.x, pt.y - start.y) > 8) moved = true;
      if (!moved) return;
      const index = hitPlot(pt);
      if (index == null || swiped.has(index)) return;
      const plot = getGame().plots[index];
      if (plot.unlocked && plot.stock > 0) {
        swiped.add(index);
        act(index, pt, true);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!held) return;
      const pt = localPoint(e);
      const index = hitPlot(pt);
      held = false;
      if (!moved && index != null && !swiped.has(index)) act(index, pt, false);
      swiped = new Set();
    };

    const onFx = (event: Event) => {
      const detail = (event as CustomEvent<{ type: string; index?: number; amount?: number }>).detail;
      if (!detail) return;
      const layout = layoutRef.current;
      const now = performance.now();
      if (detail.type === "harvest" && layout && detail.index != null && detail.amount != null) {
        const pt = layout.plots[detail.index];
        floats.push({ x: pt.x, y: pt.y - layout.tw * 0.35, text: "+" + fmt(detail.amount) + " kg", at: now });
        if (!reduce) spawnOlives(detail.index, now);
      }
      if (detail.type === "mill" && layout) {
        const anchor = layout.plots[4] ?? { x: 0, y: 0 };
        floats.push({ x: anchor.x, y: anchor.y - layout.tw * 0.2, text: "+1 huile", at: now });
      }
    };
    window.addEventListener("olive-fx", onFx);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("olive-fx", onFx);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
      aria-label="Oliveraie. Touche un arbre doré pour récolter, une parcelle pour l'améliorer, ou le moulin pour presser l'huile."
    />
  );
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fill: string, stroke: string) {
  ctx.font = "600 12px Outfit, sans-serif";
  const width = Math.max(54, ctx.measureText(text).width + 16);
  roundRect(ctx, x - width / 2, y - 10, width, 20, 10);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 0.5);
  ctx.textBaseline = "alphabetic";
}
