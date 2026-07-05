#!/usr/bin/env node
/**
 * Fix remaining hardcoded English strings in dashboard/impact/page.tsx
 * All strings are inside the ImpactPage component, so t() is available.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const f = "apps/frontend/src/app/[locale]/dashboard/impact/page.tsx";
const fp = path.join(ROOT, f);
let c = fs.readFileSync(fp, "utf8");
let n = 0;

function rp(a, b) {
  if (c.includes(a)) { c = c.split(a).join(b); n++; } else { console.log("NOT FOUND:", a.slice(0, 60)); }
}

// 1. Monthly trend chart legend
rp('> Reports\n                      </div>', '> {t("reportsLabel")}\n                      </div>');
rp('> Resolved\n                      </div>', '> {t("resolvedLower")}\n                      </div>');

// 2. Province breakdown "Score: "
rp('>Score: {p.score}</span>', '>{t("score")}: {p.score}</span>');

// 3. Carbon impact "68% of annual target (3.5t)"
rp('>68% of annual target (3.5t)</div>', '>{t("carbonAnnualTarget")}</div>');

// 4. AI model footer "All models:"
rp('>All models:</span>', '>{t("allModels")}:</span>');

// 5. "Inference:" + "GPU-enabled (T4)"
rp('>Inference:</span>\n                    <span className="font-bold">GPU-enabled (T4)</span>', '>{t("inference")}:</span>\n                    <span className="font-bold">{t("gpuEnabled")}</span>');

// 6. "Last retrained:" + "2026-05-28"
rp('>Last retrained:</span>\n                    <span className="font-bold">2026-05-28</span>', '>{t("lastRetrained")}:</span>\n                    <span className="font-bold">2026-05-28</span>');

// 7. "Total Annual Cost" (appears twice — cost of inaction + solution)
rp('>Total Annual Cost</span>\n                        <span className="font-mono font-bold text-red text-lg">₱ 53.0M</span>', '>{t("totalAnnualCost")}</span>\n                        <span className="font-mono font-bold text-red text-lg">₱ 53.0M</span>');
rp('>Total Annual Cost</span>\n                        <span className="font-mono font-bold text-green text-lg">₱ 6.1M</span>', '>{t("totalAnnualCost")}</span>\n                        <span className="font-mono font-bold text-green text-lg">₱ 6.1M</span>');

// 8. " — Region 6 Deployment" after fiveYearROIProjection
rp('{t("fiveYearROIProjection")} — Region 6 Deployment', '{t("fiveYearROIProjection")}');

// 9. "Month 8"
rp('>Month 8</span>', '>{t("month8")}</span>');

// 10. "4.2M citizens"
rp('>4.2M citizens</span>', '>{t("citizensImpacted")}</span>');

// 11. Step label "Step {item.step}" — keep as is (technical label)

// 12. Architecture sub-items
rp('items: "Web Platform | Secure API"', 'items: t("webPlatformSecureApi")');
rp('items: "Vision | Routing | GenAI"', 'items: t("visionRoutingGenai")');
rp('items: "Secure Storage | Graph DB"', 'items: t("secureStorageGraphDb")');
rp('items: "Vercel | Azure | Supabase"', 'items: t("vercelAzureSupabase")');

// 13. Scale card labels
rp('scale: "10K users"', 'scale: t("scale10kUsers")');
rp('scale: "100K users"', 'scale: t("scale100kUsers")');
rp('scale: "1M users"', 'scale: t("scale1mUsers")');
rp('scale: "10M users"', 'scale: t("scale10mUsers")');

// 14. Scale footer text
rp('{t("fullCoverage")} — demonstrating strong economies of scale through shared AI infrastructure and edge caching.', '{t("fullCoverage")} — {t("economiesOfScale")}');

// 15. Phase card data (inline array literals inside JSX — t() is available)
// Phase labels
rp('phase: "Phase 1"', 'phase: t("phase1")');
rp('phase: "Phase 2"', 'phase: t("phase2")');
rp('phase: "Phase 3"', 'phase: t("phase3")');
rp('phase: "Phase 4"', 'phase: t("phase4")');

// Phase countries
rp('countries: "Philippines"', 'countries: t("philippines")');
rp('countries: "Vietnam · Indonesia"', 'countries: t("vietnamIndonesia")');
rp('countries: "Thailand · Malaysia · Singapore"', 'countries: t("thailandMalaysiaSingapore")');
rp('countries: "All 10 ASEAN Nations"', 'countries: t("all10AseanNations")');

// Phase descriptions
rp('desc: "Region 6 pilot · 278 incidents detected · YOLOv8 edge-deployed"', 'desc: t("phase1Desc")');
rp('desc: "Federated learning edge-nodes · Est. 150M citizens · Mekong + Java deltas"', 'desc: t("phase2Desc")');
rp('desc: "Satellite imagery integration · Gulf of Thailand + Borneo sensor mesh"', 'desc: t("phase3Desc")');
rp('desc: "Full grid coverage · 680M citizens protected · ASEAN Environment Ministers API"', 'desc: t("phase4Desc")');

// Phase statuses
rp('status: "Live"', 'status: t("live")');
rp('status: "Q3 2026"', 'status: "Q3 2026"'); // keep as-is (date)
rp('status: "Q4 2026"', 'status: "Q4 2026"'); // keep as-is (date)
rp('status: "2027"', 'status: "2027"'); // keep as-is (date)

// 16. "ASEAN AI Grid — Live" badge
rp('>ASEAN AI Grid — Live', '>{t("aseanAiGridLive")}');

// 17. "Deployment Roadmap" heading
rp('>Deployment Roadmap<br', '>{t("deploymentRoadmap")}<br');

// 18. "2025 → 2027"
rp('>2025 → 2027</span></h3>', '>{t("deploymentYears")}</span></h3>');

// 19. "Federated neuro-symbolic AI nodes across 10 nations"
rp('>Federated neuro-symbolic AI nodes across 10 nations</p>', '>{t("federatedAiDesc")}</p>');

// 20. " — Region 6 Deployment" already handled above

fs.writeFileSync(fp, c, "utf8");
console.log(`Fixed ${f}: ${n} replacements`);
