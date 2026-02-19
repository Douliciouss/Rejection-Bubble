"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BubbleInput } from "@/types/database";

const MIN_R = 24;
const MAX_R = 80;

function rejectionToRadius(rejections: number, minRej: number, maxRej: number): number {
  if (maxRej <= minRej) return MIN_R + (MAX_R - MIN_R) / 2;
  const t = (rejections - minRej) / (maxRej - minRej);
  const eased = Math.sqrt(Math.max(0, Math.min(1, t)));
  return MIN_R + eased * (MAX_R - MIN_R);
}

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  data: BubbleInput;
  _highlight?: boolean;
  img?: HTMLImageElement | null;
}

export interface BubbleFieldProps {
  companies: BubbleInput[];
  topN?: number;
  onCompanyClick: (id: string) => void;
  highlightedId: string | null;
  onHighlightChange: (id: string | null) => void;
}

export function BubbleField({
  companies,
  topN = 5,
  onCompanyClick,
  highlightedId,
  onHighlightChange,
}: BubbleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ name: string; rejections: number; x: number; y: number } | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const mouseRef = useRef<{ x: number; y: number; dragged: Bubble | null; offsetX: number; offsetY: number }>({
    x: 0,
    y: 0,
    dragged: null,
    offsetX: 0,
    offsetY: 0,
  });
  const cameraRef = useRef({ scale: 1, tx: 0, ty: 0 });
  const boundsRef = useRef({ w: 800, h: 600 });
  const rafRef = useRef<number>(0);
  const fitScheduledRef = useRef(false);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      const c = cameraRef.current;
      const b = boundsRef.current;
      return {
        x: (sx - b.w / 2 - c.tx) / c.scale,
        y: (sy - b.h / 2 - c.ty) / c.scale,
      };
    },
    []
  );

  const updateFitScale = useCallback(() => {
    const bubbles = bubblesRef.current;
    if (bubbles.length === 0) return;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const b of bubbles) {
      minX = Math.min(minX, b.x - b.r);
      maxX = Math.max(maxX, b.x + b.r);
      minY = Math.min(minY, b.y - b.r);
      maxY = Math.max(maxY, b.y + b.r);
    }
    const padding = 80;
    const contentW = maxX - minX + 2 * padding;
    const contentH = maxY - minY + 2 * padding;
    const scale = Math.min(boundsRef.current.w / contentW, boundsRef.current.h / contentH, 1.2);
    const tx = -(minX + maxX) / 2 * scale;
    const ty = -(minY + maxY) / 2 * scale;
    cameraRef.current.scale = scale;
    cameraRef.current.tx = tx;
    cameraRef.current.ty = ty;
  }, []);

  const resolveCollisions = useCallback((bubbles: Bubble[]) => {
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const a = bubbles[i];
        const b = bubbles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.r + b.r + 4;
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= (nx * overlap * b.r) / (a.r + b.r);
          a.y -= (ny * overlap * b.r) / (a.r + b.r);
          b.x += (nx * overlap * a.r) / (a.r + b.r);
          b.y += (ny * overlap * a.r) / (a.r + b.r);
        }
      }
    }
  }, []);

  const initBubbles = useCallback(() => {
    const list = companies;
    if (list.length === 0) {
      bubblesRef.current = [];
      return;
    }
    const minRej = Math.min(...list.map((c) => c.rejections));
    const maxRej = Math.max(...list.map((c) => c.rejections));
    const bubbles: Bubble[] = list.map((c, i) => {
      const angle = (2 * Math.PI * i) / list.length + 0.1;
      const r = rejectionToRadius(c.rejections, minRej, maxRej);
      return {
        x: Math.cos(angle) * 120,
        y: Math.sin(angle) * 120,
        vx: 0,
        vy: 0,
        r,
        data: c,
        img: null,
      };
    });
    resolveCollisions(bubbles);
    bubblesRef.current = bubbles;
    list.forEach((c, i) => {
      if (c.logo) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          bubbles[i].img = img;
        };
        img.src = c.logo;
      }
    });
    fitScheduledRef.current = true;
  }, [companies, resolveCollisions]);

  useEffect(() => {
    initBubbles();
  }, [initBubbles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      boundsRef.current = { w, h };
      canvas.width = w;
      canvas.height = h;
      fitScheduledRef.current = true;
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    function animate() {
      if (!running || !ctx || !canvas) return;
      const bubbles = bubblesRef.current;
      const mouse = mouseRef.current;
      const c = cameraRef.current;
      const b = boundsRef.current;

      if (fitScheduledRef.current && bubbles.length > 0) {
        updateFitScale();
        fitScheduledRef.current = false;
      }

      const center = { x: 0, y: 0 };
      for (const bubble of bubbles) {
        if (mouse.dragged === bubble) continue;
        bubble.vx += (center.x - bubble.x) * 0.0004;
        bubble.vy += (center.y - bubble.y) * 0.0004;
        bubble.vx *= 0.9;
        bubble.vy *= 0.9;
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
      }
      resolveCollisions(bubbles);

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#0f0f12";
      ctx.fillRect(0, 0, b.w, b.h);
      ctx.restore();

      ctx.save();
      ctx.translate(b.w / 2 + c.tx, b.h / 2 + c.ty);
      ctx.scale(c.scale, c.scale);

      for (const bubble of bubbles) {
        const highlight = bubble.data.id === highlightedId || bubble._highlight;
        if (highlight) {
          ctx.shadowColor = "rgba(167, 139, 250, 0.6)";
          ctx.shadowBlur = 20;
        }
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
        ctx.fillStyle = "#27272a";
        ctx.fill();
        if (highlight) {
          ctx.shadowBlur = 0;
        }
        ctx.strokeStyle = highlight ? "#a78bfa" : "#3f3f46";
        ctx.lineWidth = highlight ? 2 : 1;
        ctx.stroke();
        ctx.save();
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
        ctx.clip();
        if (bubble.img) {
          const s = bubble.r * 2;
          ctx.drawImage(
            bubble.img,
            bubble.x - bubble.r,
            bubble.y - bubble.r,
            s,
            s
          );
        } else {
          ctx.fillStyle = "#18181c";
          ctx.fillRect(bubble.x - bubble.r, bubble.y - bubble.r, bubble.r * 2, bubble.r * 2);
          ctx.fillStyle = "#71717a";
          ctx.font = `${Math.min(14, bubble.r / 2)}px system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            bubble.data.name.slice(0, 8),
            bubble.x,
            bubble.y
          );
        }
        ctx.restore();
      }

      ctx.restore();

      const worldMouse = screenToWorld(mouse.x, mouse.y);
      let hovered: Bubble | null = null;
      if (mouse.dragged == null) {
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const bubble = bubbles[i];
          const dx = worldMouse.x - bubble.x;
          const dy = worldMouse.y - bubble.y;
          if (Math.hypot(dx, dy) < bubble.r) {
            hovered = bubble;
            break;
          }
        }
      }
      if (hovered) {
        setTooltip({
          name: hovered.data.name,
          rejections: hovered.data.rejections,
          x: mouse.x,
          y: mouse.y,
        });
      } else {
        setTooltip(null);
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [highlightedId, screenToWorld, updateFitScale, resolveCollisions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const getMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseMove = (e: MouseEvent) => {
      const p = getMouse(e);
      mouseRef.current.x = p.x;
      mouseRef.current.y = p.y;
      if (mouseRef.current.dragged) {
        const w = screenToWorld(p.x, p.y);
        mouseRef.current.dragged.x = w.x - mouseRef.current.offsetX;
        mouseRef.current.dragged.y = w.y - mouseRef.current.offsetY;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const p = getMouse(e);
      const w = screenToWorld(p.x, p.y);
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const bubble = bubblesRef.current[i];
        if (Math.hypot(w.x - bubble.x, w.y - bubble.y) < bubble.r) {
          mouseRef.current.dragged = bubble;
          mouseRef.current.offsetX = w.x - bubble.x;
          mouseRef.current.offsetY = w.y - bubble.y;
          break;
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!mouseRef.current.dragged) return;
      const p = getMouse(e);
      const w = screenToWorld(p.x, p.y);
      const bubble = mouseRef.current.dragged;
      const dx = w.x - bubble.x;
      const dy = w.y - bubble.y;
      if (Math.hypot(dx, dy) < 15) {
        onCompanyClick(bubble.data.id);
      }
      mouseRef.current.dragged = null;
    };

    const onMouseLeave = () => {
      mouseRef.current.dragged = null;
      setTooltip(null);
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mouseleave", onMouseLeave);
    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [onCompanyClick, screenToWorld]);

  const top5 = [...companies]
    .sort((a, b) => b.rejections - a.rejections)
    .slice(0, topN);

  return (
    <div className="relative w-full h-full flex">
      <div
        className={`bubble-canvas-container flex-1 ${tooltip ? "cursor-pointer" : ""}`}
        style={{ position: "relative" }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        {tooltip && (
          <div
            ref={tooltipRef}
            className="fixed pointer-events-none z-10 px-3 py-2 rounded-lg bg-bubble-surface border border-bubble-border text-sm"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            <div className="font-medium">{tooltip.name}</div>
            <div className="text-bubble-muted">{tooltip.rejections} rejection{tooltip.rejections !== 1 ? "s" : ""}</div>
            <div className="text-bubble-accent text-xs mt-1">Click to open details</div>
          </div>
        )}
      </div>
      <div className="w-52 shrink-0 pl-4 flex flex-col gap-2 border-l border-bubble-border">
        <div className="text-xs font-medium text-bubble-muted uppercase tracking-wider">Top by rejections</div>
        {top5.length === 0 ? (
          <p className="text-sm text-bubble-muted">No companies yet</p>
        ) : (
          top5.map((c) => (
            <button
              key={c.id}
              type="button"
              className="text-left px-3 py-2 rounded-lg text-sm bg-bubble-surface border border-transparent hover:border-bubble-border focus:border-bubble-accent focus:outline-none transition-colors"
              onMouseEnter={() => {
                onHighlightChange(c.id);
                bubblesRef.current.forEach((b) => {
                  b._highlight = b.data.id === c.id;
                });
              }}
              onMouseLeave={() => {
                onHighlightChange(null);
                bubblesRef.current.forEach((b) => {
                  b._highlight = false;
                });
              }}
              onClick={() => onCompanyClick(c.id)}
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-bubble-muted ml-1">({c.rejections})</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
