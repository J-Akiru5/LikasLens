#!/usr/bin/env node
/**
 * Add all missing impact page translation keys to en.json.
 * Covers: phase cards, roadmap, architecture layers, ROI, scale, legend, and remaining labels.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ep = path.join(ROOT, "apps/shared/src/i18n/messages/en.json");
const e = JSON.parse(fs.readFileSync(ep, "utf8"));

function set(obj, key, val) {
  if (!obj[key]) obj[key] = val;
}

if (!e.dashboard) e.dashboard = {};
const d = e.dashboard;

// ─── Phase card data ───────────────────────────────────────────────────
set(d, "phase1", "Phase 1");
set(d, "phase2", "Phase 2");
set(d, "phase3", "Phase 3");
set(d, "phase4", "Phase 4");
set(d, "philippines", "Philippines");
set(d, "vietnamIndonesia", "Vietnam · Indonesia");
set(d, "thailandMalaysiaSingapore", "Thailand · Malaysia · Singapore");
set(d, "all10AseanNations", "All 10 ASEAN Nations");
set(d, "live", "Live");
set(d, "phase1Desc", "Region 6 pilot · 278 incidents detected · YOLOv8 edge-deployed");
set(d, "phase2Desc", "Federated learning edge-nodes · Est. 150M citizens · Mekong + Java deltas");
set(d, "phase3Desc", "Satellite imagery integration · Gulf of Thailand + Borneo sensor mesh");
set(d, "phase4Desc", "Full grid coverage · 680M citizens protected · ASEAN Environment Ministers API");

// ─── ASEAN roadmap hero ────────────────────────────────────────────────
set(d, "aseanAiGridLive", "ASEAN AI Grid — Live");
set(d, "deploymentRoadmap", "Deployment Roadmap");
set(d, "deploymentYears", "2025 → 2027");
set(d, "federatedAiDesc", "Federated neuro-symbolic AI nodes across 10 nations");

// ─── Chart legend ──────────────────────────────────────────────────────
// reportsLabel and resolvedLower already exist in dashboard namespace

// ─── Province / Score ──────────────────────────────────────────────────
set(d, "score", "Score");

// ─── Carbon impact ─────────────────────────────────────────────────────
set(d, "carbonAnnualTarget", "68% of annual target (3.5t)");

// ─── AI model footer ───────────────────────────────────────────────────
set(d, "allModels", "All models");
set(d, "inference", "Inference");
set(d, "gpuEnabled", "GPU-enabled (T4)");
set(d, "lastRetrained", "Last retrained");

// ─── ROI ───────────────────────────────────────────────────────────────
set(d, "totalAnnualCost", "Total Annual Cost");
set(d, "month8", "Month 8");
set(d, "citizensImpacted", "4.2M citizens");

// ─── Architecture layers ───────────────────────────────────────────────
set(d, "webPlatformSecureApi", "Web Platform | Secure API");
set(d, "visionRoutingGenai", "Vision | Routing | GenAI");
set(d, "secureStorageGraphDb", "Secure Storage | Graph DB");
set(d, "vercelAzureSupabase", "Vercel | Azure | Supabase");

// ─── Scale cards ───────────────────────────────────────────────────────
set(d, "scale10kUsers", "10K users");
set(d, "scale100kUsers", "100K users");
set(d, "scale1mUsers", "1M users");
set(d, "scale10mUsers", "10M users");
set(d, "economiesOfScale", "demonstrating strong economies of scale through shared AI infrastructure and edge caching.");

fs.writeFileSync(ep, JSON.stringify(e, null, 2), "utf8");
console.log(`Added ${Object.keys(d).length} total keys to dashboard namespace`);
