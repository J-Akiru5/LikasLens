# LikasLens — Demo Script

> **ASEAN AI Hackathon 2026**
> **Duration:** ~10 minutes (hard cap: 12 min)
> **Presenter:** Developer 4 (Integration Lead)

---

## Pre-Flight Checklist

- [ ] All 3 services running (Frontend :3000, Backend :8000, AI :8001)
- [ ] Demo data seeded (`php artisan db:seed --class=AseanLawSeeder`)
- [ ] Gremlin graph seeded (`python seed_graph.py`)
- [ ] Supabase auth configured and tested
- [ ] Browser incognito window open (clean session)
- [ ] Phone screen mirrored or emulator ready (if APK available)
- [ ] Backup screenshots in `docs/demo-backups/`
- [ ] Backup pre-recorded video of each flow (fallback if live fails)

---

## Flow 1 — Opening (1:00)

| Time | Action | Screen |
|------|--------|--------|
| 0:00 | **"Every citizen's phone is an environmental sensor."** | LikasLens landing page |
| 0:15 | Point out: ASEAN positioning tagline in hero, live metrics counter showing total reports from PH + ASEAN countries | Scroll to metrics section |
| 0:30 | Mention: "LikasLens combines citizen reporting, neuro-symbolic AI, and a graph database spanning 6 ASEAN countries to trace environmental crimes back to the laws they violate." | Hero section |
| 0:45 | *Transition:* "Let me show you how a citizen in the field makes a report — even without internet." | Navigate to `/report` |

**Key line:** *"We bridge the gap between what citizens see and what regulators need."*

---

## Flow 2 — Citizen Report Flow (3:00)

| Time | Action | Screen |
|------|--------|--------|
| 1:00 | Open `/report` page. Camera view activates automatically. | Camera feed |
| 1:15 | Point phone camera at a sample scene (or use a pre-loaded image). Tap **Capture**. | Photo captured, GPS coordinates appear |
| 1:30 | Explain: "The camera captures evidence. GPS auto-tags the location. EXIF metadata is stripped for privacy." | Location pin on map |
| 1:50 | Select incident type: **Illegal Logging** from dropdown. Add a short description: *"Observed unauthorized tree cutting near protected forest boundary, Negros Occidental."* | Form fills |
| 2:10 | Tap **Submit Report**. Triage pre-check runs — explain: "Before submission, the backend runs a triage check against our AI pipeline to flag high-risk indicators." | Triage loading spinner |
| 2:30 | **Edge Interceptor Modal** appears because the hazard is high-risk. Explain: "The AI detected elevated risk — it recommends Ghost Mode for reporter safety." | Interceptor modal with warning icons |
| 2:50 | *Decision point:* Choose **"Proceed in Ghost Mode."** Theme transitions to dark palette. | Ghost Mode transition |

**Key line:** *"Environmental whistleblowers face real danger. Ghost Mode protects their identity end-to-end."*

---

## Flow 3 — Ghost Mode Demo (2:00)

| Time | Action | Screen |
|------|--------|--------|
| 3:00 | Toggle is now in Ghost Mode. UI is dark — note the shift. | Dark-themed `/report` |
| 3:15 | EXIF stripping toast appears. Explain: "Ghost Mode strips all metadata from the image — GPS, device info, timestamp — before transmission." | Toast notification |
| 3:30 | Tap **Submit**. Report is submitted anonymously. | Success toast |
| 3:45 | Show the response payload: *no user_id, no identifying information.* | API response |
| 4:10 | Explain: "Even our servers never see who submitted this. The report exists as pure evidence, unlinked to any citizen identity." | — |
| 4:45 | *Transition:* "Now let's see what happens after submission — how LikasLens routes the report through our neuro-symbolic engine." | Navigate to dashboard |

**Key line:** *"Zero-knowledge architecture. The report is real. The reporter is invisible."*

---

## Flow 4 — AI Pipeline & Dashboard (2:00)

| Time | Action | Screen |
|------|--------|--------|
| 4:50 | Navigate to **Impact Dashboard** (`/dashboard`). | Dashboard overview |
| 5:05 | Show the **resolution rate** chart and geographic heat map. Point out hotspots. | Charts |
| 5:20 | Explain the neuro-symbolic pipeline: *"When a report comes in, YOLOv8 classifies the hazard visually. The Gremlin graph traces from hazard → law → enforcement agency. Gemini 2.5 Flash generates a natural-language incident brief."* | Pipeline diagram (have this on a second tab or slide) |
| 5:40 | Show a sample incident: The Illegal Logging report maps to **PD 705 (Revised Forestry Code)** → enforced by **Forest Watch Negros** → jurisdiction **PH-NATIONAL**. | Graph traversal result |
| 6:00 | Explain ASEAN expansion: *"The same graph now spans 6 ASEAN countries. If a haze crosses from Indonesia to Singapore, the graph traces it through transboundary laws."* | ASEAN jurisdiction map |
| 6:30 | *Transition:* "Let's test failure resilience — what happens when the AI service is unavailable?" | Disconnect AI service |

**Key line:** *"Neuro-symbolic means the AI doesn't just classify — it reasons across laws, agencies, and borders."*

---

## Flow 5 — Failure Resilience (1:00)

| Time | Action | Screen |
|------|--------|--------|
| 6:35 | Kill the AI service (`uvicorn` process). | Terminal showing process killed |
| 6:45 | Submit another report from the frontend. Report still saves successfully. | Success toast |
| 6:55 | Explain: "The submission pipeline degrades gracefully. Reports queue in the database. When AI service comes back, pending triage jobs process automatically." | — |
| 7:15 | *Transition:* "Offline resilience is equally important. Let's test the PWA offline queue." | Disconnect WiFi |

**Key line:** *"Every component can fail independently. The report never gets lost."*

---

## Flow 6 — Offline PWA Demo (1:30)

| Time | Action | Screen |
|------|--------|--------|
| 7:20 | Toggle airplane mode or disconnect WiFi. **Offline Banner** slides down (red) with `WifiSlash` icon. | Red offline banner |
| 7:30 | Navigate to `/laws` and `/scoreboard` — pages still load from service worker cache. | Cached pages |
| 7:45 | Return to `/report`. Submit a report while offline. "You are offline — report queued securely" toast. | Queue toast |
| 7:55 | Reconnect WiFi. **Green "Connection restored" banner** slides down with checkmark. Reports auto-sync. | Green banner + sync toast |
| 8:10 | Explain: "The PWA uses three-tier caching: Cache-First for static assets, Stale-While-Revalidate for legal data, Network-First for dynamic data. Reports queue in IndexedDB." | — |
| 8:45 | *Transition:* "Finally, let's see the social layer — leaderboard, achievements, and eco-credits." | Navigate to leaderboard |

**Key line:** *"Out in the field, internet isn't guaranteed. The PWA works regardless."*

---

## Flow 7 — Closing: Leaderboard & Credits (1:00)

| Time | Action | Screen |
|------|--------|--------|
| 8:50 | Navigate to **Scoreboard** (`/scoreboard`). | Public leaderboard |
| 9:00 | Show: top eco-citizens by reward points, recent reports, resolution stats. | Scoreboard entries |
| 9:15 | Navigate to **Profile** (`/profile`). Show: achievements unlocked, rank progress bar, eco-credit balance. | Profile page |
| 9:30 | Closing message: *"LikasLens turns every citizen's phone into an environmental sensor. Neuro-symbolic AI connects evidence to laws. Ghost Mode protects the vulnerable. And ASEAN scalability means this works from Manila to Jakarta, Bangkok to Singapore."* | Landing page again |
| 9:45 | End. | — |

**Key line:** *"One platform. Six countries. Every citizen is an environmental sensor."*

---

## Backup Plans (Per Flow)

| If this fails... | ...do this instead |
|---|---|
| Camera doesn't activate | Upload a pre-saved evidence photo from filesystem |
| GPS doesn't resolve | Enter coordinates manually (form has manual entry field) |
| Triage check hangs | Skip triage; explain it's async and report still saves |
| AI service is down | Show loading states, explain graceful degradation |
| Supabase auth slow | Show cached profile from token; explain session persistence |
| Internet drops | Already demoing offline queue — use it as a feature, not a bug |
| APK doesn't build | Use Chrome DevTools mobile view as fallback |
| Everything breaks | Play the pre-recorded backup video for that flow |

---

## Post-Demo Q&A Prep

- **"How is this different from existing reporting apps?"** → Neuro-symbolic reasoning (not just classification). The graph traces hazard→law→agency→jurisdiction. And Ghost Mode is zero-knowledge.
- **"How do you verify reports?"** → Trust score system (citizen credibility scoring). AI cross-references with satellite imagery. Multiple reports from different citizens in same geo-zone raise confidence.
- **"Is this actually deployed?"** → Yes — frontend on Vercel, backend on Azure, AI service on Azure Container Apps. Cosmos DB Gremlin for the graph. Supabase for auth.
- **"What's next after the hackathon?"** → In-field NGO partnerships in Negros Occidental pilot region. Mobile APK distribution to local communities. Additional ASEAN country laws and agency data.
