---
description: Design and UI Implementation instructions for LikasLens. Enforces "The Vigilant Earth" aesthetic, Ghost Mode protocols, and Eco-Brutalist components.
applyTo: apps/frontend/**/*
---

# 🌿 LIKASLENS - DESIGN & UI CONSTITUTION

## 1. THE VISUAL IDENTITY (THE VIGILANT EARTH)
You must adhere strictly to the established color palette and typography to maintain "technological authority"[cite: 3]. **NEVER** use colors outside of these specific HEX codes:
* [cite_start]**Primary (Forest Guard):** `#1B4332` — Deep green for authority[cite: 4].
* [cite_start]**Secondary (Tech Cyan):** `#2DE1C2` — Representing modern efficiency and the AI Brain[cite: 5].
* **Safety Accent (Ghost Amber):** `#FFB703` — For "Ghost Mode" alerts and high visibility[cite: 6].
* [cite_start]**Neutral Base (Concrete):** `#F8F9FA` — For clean data readability[cite: 7].
* [cite_start]**Deep Neutral (Night Shadow):** `#081C15` — For high-contrast text and "Ghost Mode" UI[cite: 8].

## 2. TYPOGRAPHY & LEDGER STRATEGY
[cite_start]Typography must reinforce a "digital ledger" feel for accountability[cite: 10]. Implement local fallbacks for all fonts:
* [cite_start]**Headers:** `Montserrat` (Extra Bold) or `Archivo Black` for strength[cite: 11].
* **Data/Scoreboard:** `Space Mono` or `JetBrains Mono` for the "AI Brain" concept[cite: 12].
* [cite_start]**Body Text:** `Inter` or `Helvetica Now` for minimalist clarity[cite: 13].

## 3. COMPONENT & UI PROTOCOLS
[cite_start]All UI elements must blend **Eco-Brutalism** with **Cyber-Safety**[cite: 15].
* **AI Bionic Framing:** Use thin, technical border lines for components involving image scanning to show the AI is checking local laws[cite: 18].
* [cite_start]**Public Scoreboard:** Use high-contrast visualizations, strict grids, and `Space Mono` for all numerical data[cite: 12, 16].
* [cite_start]**Ghost Mode Transition:** When toggled, shift the background to `Night Shadow`[cite: 8]. [cite_start]Implement a "flicker and smoke" CSS animation to signify high-danger reporting status[cite: 17].

## 4. TECHNICAL CONSTRAINTS (FRONTEND)
* **Scope:** Operate exclusively within `apps/frontend` using **Next.js 14+ (App Router)** and **Tailwind CSS**.
* **Reusability:** Every design element must be built as a modular, reusable React component.
* **Mock Data:** Use local JSON objects for the initial implementation of the Scoreboard to verify visual performance.
* **PWA Readiness:** Ensure all layouts are mobile-responsive and accessible, adhering to the PWA developer's requirements.

