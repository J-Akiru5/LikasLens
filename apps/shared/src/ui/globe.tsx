"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Globe as CobeGlobe } from "cobe";

// ASEAN hub coordinates
const PH: [number, number] = [14.5995, 120.9842]; // Philippines — Phase 1 Live Hub
const ID: [number, number] = [-6.2088, 106.8456];  // Indonesia
const VN: [number, number] = [10.8231, 106.6297];  // Vietnam
const TH: [number, number] = [13.7563, 100.5018];  // Thailand
const MY: [number, number] = [3.139, 101.6869];    // Malaysia
const SG: [number, number] = [1.3521, 103.8198];   // Singapore
const MM: [number, number] = [16.8661, 96.1951];   // Myanmar
const KH: [number, number] = [11.5564, 104.9282];  // Cambodia

/**
 * Interactive 3D globe using cobe v2 API.
 * - Auto-rotates when idle (signals a live, dynamic system)
 * - Pauses and allows drag-to-rotate on pointer interaction
 * - Auto-resumes rotation 2s after user stops dragging
 * Industry standard: same pattern as Vercel, GitHub, Stripe globes.
 */
export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<CobeGlobe | null>(null);
  const rafRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Globe state — mutable refs for perf (no re-renders)
  const phiRef = useRef(4.8); // 4.8 radians centers Southeast Asia perfectly
  const thetaRef = useRef(0.25);
  const isDraggingRef = useRef(false);
  const isAutoRotatingRef = useRef(true);
  const lastPointerXRef = useRef(0);

  const destroy = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (globeRef.current) {
      globeRef.current.destroy();
      globeRef.current = null;
    }
    if (resumeTimerRef.current !== null) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let destroyed = false;
    let isVisible = false;

    // IntersectionObserver — only run globe when visible
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (!isVisible && rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        } else if (isVisible && globeRef.current && rafRef.current === null) {
          const animate = () => {
            if (destroyed || !isVisible) return;
            if (isAutoRotatingRef.current && !isDraggingRef.current) {
              phiRef.current += 0.004;
              globeRef.current!.update({ phi: phiRef.current, theta: thetaRef.current });
            }
            rafRef.current = requestAnimationFrame(animate);
          };
          rafRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );
    io.observe(container);

    // ── Pointer interaction handlers ─────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      isAutoRotatingRef.current = false;
      lastPointerXRef.current = e.clientX;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";

      // Cancel any pending auto-resume
      if (resumeTimerRef.current !== null) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !globeRef.current) return;
      const delta = e.clientX - lastPointerXRef.current;
      lastPointerXRef.current = e.clientX;
      // Sensitivity: divide by container width for consistent feel
      const sensitivity = 4 / (container.offsetWidth || 400);
      phiRef.current += delta * sensitivity;
      globeRef.current.update({ phi: phiRef.current, theta: thetaRef.current });
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      canvas.style.cursor = "grab";

      // Auto-resume rotation after 2 seconds of inactivity
      resumeTimerRef.current = setTimeout(() => {
        isAutoRotatingRef.current = true;
      }, 2000);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    // ── Globe initialisation ─────────────────────────────────────────────────
    const initGlobe = (width: number) => {
      if (destroyed || width <= 0) return;
      destroy();

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pxSize = Math.round(width * dpr);

      canvas.width = pxSize;
      canvas.height = pxSize;

      import("cobe").then((mod) => {
        if (destroyed || !canvas) return;
        const createGlobe = mod.default;

        const globe = createGlobe(canvas, {
          devicePixelRatio: dpr,
          width: pxSize,
          height: pxSize,
          phi: phiRef.current,
          theta: thetaRef.current,
          dark: 1,
          diffuse: 1.1,
          mapSamples: 20000,
          mapBrightness: 10,
          baseColor: [1, 1, 1],
          markerColor: [0.3, 0.75, 1], // Reverted back to blue for maximum visual impact
          glowColor: [1, 1, 1],
          markers: [
            // Phase 1 — Live (larger)
            { location: PH, size: 0.12 },
            // Phase 2
            { location: VN, size: 0.09 },
            { location: ID, size: 0.09 },
            // Phase 3
            { location: TH, size: 0.08 },
            { location: MY, size: 0.08 },
            { location: SG, size: 0.08 },
            // Phase 4 targets
            { location: MM, size: 0.06 },
            { location: KH, size: 0.06 },
            { location: [4.5353, 114.7277], size: 0.06 }, // Brunei
            { location: [19.8563, 102.4955], size: 0.06 }, // Laos
          ],
          arcs: [
            // Phase 1 -> Phase 2 (Active — blue)
            { from: PH, to: VN, color: [0.3, 0.75, 1] },
            { from: PH, to: ID, color: [0.3, 0.75, 1] },
            // Phase 2 -> Phase 3 (Planned — bright grey/white)
            { from: VN, to: TH, color: [0.8, 0.8, 0.8] },
            { from: ID, to: MY, color: [0.8, 0.8, 0.8] },
            { from: MY, to: SG, color: [0.8, 0.8, 0.8] },
            // Phase 3 -> Phase 4 (Future — medium grey)
            { from: TH, to: MM, color: [0.6, 0.6, 0.6] },
            { from: TH, to: KH, color: [0.6, 0.6, 0.6] },
            { from: VN, to: [19.8563, 102.4955], color: [0.6, 0.6, 0.6] }, // To Laos
            { from: MY, to: [4.5353, 114.7277], color: [0.6, 0.6, 0.6] }, // To Brunei
          ],
          arcColor: [0.3, 0.75, 1],
          arcWidth: 0.6,
          arcHeight: 0.12,
          markerElevation: 0.02,
        });

        globeRef.current = globe;

        // ── Animation loop ───────────────────────────────────────────────────
        const animate = () => {
          if (destroyed || !isVisible) return;
          if (isAutoRotatingRef.current && !isDraggingRef.current) {
            phiRef.current += 0.004; // slow, dignified auto-rotation
            globe.update({ phi: phiRef.current, theta: thetaRef.current });
          }
          rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);
      });
    };

    // ResizeObserver — init only when container has real dimensions
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) initGlobe(w);
      }
    });
    ro.observe(container);

    return () => {
      destroyed = true;
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      destroy();
    };
  }, [destroy]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-square ${className || ""}`}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          touchAction: "none", // prevent page scroll interfering with drag
        }}
      />
    </div>
  );
}
