"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Globe as CobeGlobe } from "cobe";

const PH: [number, number] = [14.5995, 120.9842];
const ID: [number, number] = [-6.2088, 106.8456];
const VN: [number, number] = [10.8231, 106.6297];
const TH: [number, number] = [13.7563, 100.5018];
const MY: [number, number] = [3.139, 101.6869];
const SG: [number, number] = [1.3521, 103.8198];
const MM: [number, number] = [16.8661, 96.1951];
const KH: [number, number] = [11.5564, 104.9282];

export function Globe3D({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<CobeGlobe | null>(null);
  const rafRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phiRef = useRef(4.8);
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

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      isAutoRotatingRef.current = false;
      lastPointerXRef.current = e.clientX;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      if (resumeTimerRef.current !== null) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !globeRef.current) return;
      const delta = e.clientX - lastPointerXRef.current;
      lastPointerXRef.current = e.clientX;
      const sensitivity = 4 / (container.offsetWidth || 400);
      phiRef.current += delta * sensitivity;
      globeRef.current.update({ phi: phiRef.current, theta: thetaRef.current });
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      canvas.style.cursor = "grab";
      resumeTimerRef.current = setTimeout(() => {
        isAutoRotatingRef.current = true;
      }, 2000);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

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
          mapSamples: 16000,
          mapBrightness: 8,
          baseColor: [1, 1, 1],
          markerColor: [0.3, 0.75, 1],
          glowColor: [1, 1, 1],
          markers: [
            { location: PH, size: 0.1 },
            { location: VN, size: 0.07 },
            { location: ID, size: 0.07 },
            { location: TH, size: 0.06 },
            { location: MY, size: 0.06 },
            { location: SG, size: 0.06 },
            { location: MM, size: 0.05 },
            { location: KH, size: 0.05 },
            { location: [4.5353, 114.7277], size: 0.05 },
            { location: [19.8563, 102.4955], size: 0.05 },
          ],
          arcs: [
            { from: PH, to: VN, color: [0.3, 0.75, 1] },
            { from: PH, to: ID, color: [0.3, 0.75, 1] },
            { from: VN, to: TH, color: [0.8, 0.8, 0.8] },
            { from: ID, to: MY, color: [0.8, 0.8, 0.8] },
            { from: MY, to: SG, color: [0.8, 0.8, 0.8] },
            { from: TH, to: MM, color: [0.6, 0.6, 0.6] },
            { from: TH, to: KH, color: [0.6, 0.6, 0.6] },
          ],
          arcColor: [0.3, 0.75, 1],
          arcWidth: 0.5,
          arcHeight: 0.12,
          markerElevation: 0.02,
        });

        globeRef.current = globe;

        const animate = () => {
          if (destroyed || !isVisible) return;
          if (isAutoRotatingRef.current && !isDraggingRef.current) {
            phiRef.current += 0.004;
            globe.update({ phi: phiRef.current, theta: thetaRef.current });
          }
          rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
      });
    };

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
    <div ref={containerRef} className={`relative w-full aspect-square ${className || ""}`}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
      />
    </div>
  );
}
