/**
 * POST /api/v1/ai/chat
 *
 * Backend API endpoint for Liksi chat.
 * Proxies requests through the AI Gateway with automatic failover.
 *
 * Flow:
 *   Client → This route → AI Gateway → Render (primary) / Local (fallback)
 */

import { NextRequest, NextResponse } from "next/server";
import { AIGateway, type AIGatewayConfig } from "@likaslens/shared/ai-gateway";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getConfig(): AIGatewayConfig {
  return {
    primaryUrl:
      process.env.AI_SERVICE_URL ||
      process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
      process.env.RENDER_AI_URL ||
      "",
    fallbackUrl: process.env.LOCAL_AI_URL || "http://127.0.0.1:8001",
    timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || "120000", 10),
    healthCacheTtlMs: parseInt(process.env.AI_HEALTH_CACHE_TTL || "30000", 10),
    apiKey: process.env.AI_SERVICE_API_KEY || undefined,
  };
}function generateLiksiFallbackReply(message: string, locale: string = "en"): string {
  const q = message.toLowerCase().trim();
  const isFil = locale === "fil" || /^(ano|paano|saan|bakit|sino|kumusta|magandang|paki|tulungan|oo|opo|salamat)/.test(q);

  // 1. Greetings & Identity
  if (
    q === "hi" || q === "hello" || q.includes("kumusta") || q.includes("kamusta") || q.includes("magandang") || q.includes("sino ka") || q.includes("who are you") || q.includes("what is likaslens") || q.includes("ano ang likaslens") || q.includes("about") || q.includes("tungkol")
  ) {
    if (isFil) {
      return "Magandang araw po! Ako po si Liksi, ang inyong mapagkumbabang AI gabay sa LikasLens. 🌿\n\nLikasLens ay isang civic reporting platform na tumutulong sa mga mamamayan na mag-ulat ng mga environmental concerns — mula sa illegal dumping hanggang sa water pollution. Ang aming AI ay agad na sumusuri sa inyong litrato, kinikilala ang naaangkop na batas (RA 9003, RA 9275, RA 8749, PD 705), at ipinapadala ang ulat sa tamang ahensya (DENR, CENRO, PCG).\n\nMatutulungan ko po kayo sa:\n• Pagsusuri ng mga environmental laws\n• Paano mag-file ng report\n• Ang proseso ng AI triage at agency routing\n• Ghost Mode para sa anonymous reporting\n\nAno po ang maipaglilingkod ko sa inyo ngayon?";
    }
    return "Hello po! I'm Liksi, your humble AI environmental guide for LikasLens. 🌿\n\nLikasLens is a civic reporting platform that helps citizens document environmental concerns — from illegal dumping to water pollution. Our AI instantly analyzes your photo, identifies applicable Philippine environmental laws (RA 9003, RA 9275, RA 8749, PD 705), and dispatches the report to the correct agency (DENR, CENRO, PCG).\n\nI can help you with:\n• Understanding environmental statutes and penalties\n• How to file a report step-by-step\n• The AI triage and agency routing process\n• Ghost Mode for anonymous reporting\n\nHow may I assist you today?";
  }

  // 2. Solid Waste & Illegal Dumping / Open Burning (RA 9003)
  if (
    q.includes("9003") || q.includes("basura") || q.includes("waste") || q.includes("dump") || q.includes("tapon") || q.includes("burning") || q.includes("siga") || q.includes("plastic") || q.includes("litter") || q.includes("segregation") || q.includes("recycl")
  ) {
    if (isFil) {
      return "Ayon po sa **Republic Act 9003 (Ecological Solid Waste Management Act of 2000)**:\n\n• **Ipinagbabawal**: Open dumping, littering sa mga pampublikong lugar, at open burning (siga) ng solid waste.\n• **Parusa**: Multa mula ₱300 hanggang ₱1,000,000, community service (1–15 araw), o pagkakakulong depende sa bigat ng paglabag.\n• **Hurisdiksyon**: Barangay at CENRO/LGU, katuwang ang DENR-EMB.\n• **Segregation Requirement**: Ang lahat ng household ay kailangang mag-segregate ng basura sa tatlong kategorya: biodegradable, recyclable, at residual.\n\nKung may nasasaksihan po kayong illegal dumping o open burning, maaari po kayong magsumite ng verified report gamit ang LikasLens camera. Ang AI ay awtomatikong mag-klasipika at magpapadala sa tamang ahensya.";
    }
    return "Under **Republic Act 9003 (Ecological Solid Waste Management Act of 2000)**:\n\n• **Prohibited Acts**: Open dumping, littering in public spaces, open burning (siga) of solid waste, and failure to segregate waste.\n• **Penalties**: Fines from ₱300 up to ₱1,000,000, community service (1–15 days), or imprisonment depending on severity.\n• **Jurisdiction**: LGUs (Barangay & CENRO) in coordination with DENR-EMB.\n• **Segregation**: All households must segregate waste into biodegradable, recyclable, and residual categories.\n\nYou can document and file an evidentiary report through LikasLens. Our AI will classify the violation and dispatch it to the correct authority.";
  }

  // 3. Clean Water Act (RA 9275)
  if (
    q.includes("9275") || q.includes("water") || q.includes("tubig") || q.includes("river") || q.includes("ilog") || q.includes("dagat") || q.includes("ocean") || q.includes("sewage") || q.includes("wastewater") || q.includes("coastal") || q.includes("marine") || q.includes("fish") || q.includes("coral") || q.includes("oil spill") || q.includes("flood")
  ) {
    if (isFil) {
      return "Ayon po sa **Republic Act 9275 (Philippine Clean Water Act of 2004)**:\n\n• **Ipinagbabawal**: Ang pagpapadaloy ng maruming wastewater sa mga ilog, lawa, at dagat nang walang treatment.\n• **Parusa**: ₱10,000 hanggang ₱200,000 bawat araw ng patuloy na paglabag, plus closure order.\n• **Hurisdiksyon**: DENR-EMB, LLDA (Laguna de Bay), at PCG (maritime waters).\n• **Kasama rin**: Oil spills, coastal pollution, at damage sa coral reefs at marine habitats.\n\nKung nakakita kayo ng water pollution, oil spill, o coastal damage, mag-file ng report sa LikasLens at ipapadala namin ito sa DENR-EMB o PCG.";
    }
    return "Under **Republic Act 9275 (Philippine Clean Water Act of 2004)**:\n\n• **Prohibited Acts**: Discharging untreated wastewater into rivers, lakes, aquifers, or coastal waters.\n• **Penalties**: ₱10,000 to ₱200,000 per day of violation, plus cease-and-desist orders.\n• **Jurisdiction**: DENR-EMB, LLDA (lake basins), and PCG (maritime).\n• **Also covers**: Oil spills, coastal pollution, coral reef damage, and marine habitat destruction.\n\nIf you witness water pollution, oil spills, or coastal damage, file a report through LikasLens and we'll dispatch it to DENR-EMB or PCG.";
  }

  // 4. Forestry & Illegal Logging (PD 705)
  if (
    q.includes("705") || q.includes("puno") || q.includes("tree") || q.includes("log") || q.includes("logging") || q.includes("forest") || q.includes("gubat") || q.includes("timber") || q.includes("deforest") || q.includes("mangrove") || q.includes("wildlife") || q.includes("poach") || q.includes("hunt") || q.includes("endanger") || q.includes("t保护区")
  ) {
    if (isFil) {
      return "Ayon sa **Presidential Decree 705 (Revised Forestry Code)** at **RA 9147 (Wildlife Resources Conservation Act)**:\n\n**PD 705 — Illegal Logging:**\n• **Ipinagbabawal**: Pagputol o pag-aari ng kahoy nang walang DENR permit.\n• **Parusa**: Qualified theft — pagkakakulong + pagkumpiska sa lahat ng kahoy at sasakyan.\n• **Ahensya**: DENR Forest Management Bureau (FMB), PENRO/CENRO, PNP.\n\n**RA 9147 — Wildlife Protection:**\n• **Ipinagbabawal**: Paghuhuli, pagpatay, o pangangalakal ng wildlife (plant o animal) na nasa threat list.\n• **Parusa**: ₱50,000–₱500,000 multa at 1–12 taon pagkakakulong.\n\nKung may nakita kayong illegal logging o wildlife poaching, mag-file ng report sa LikasLens.";
    }
    return "Under **PD 705 (Forestry Code)** and **RA 9147 (Wildlife Resources Conservation Act)**:\n\n**PD 705 — Illegal Logging:**\n• Cutting or possessing timber without a DENR permit is **qualified theft**.\n• Penalty: Imprisonment + confiscation of timber, tools, and vehicles.\n• Agency: DENR-FMB, PENRO/CENRO, PNP.\n\n**RA 9147 — Wildlife Protection:**\n• Hunting, killing, or trading protected wildlife is prohibited.\n• Penalty: ₱50,000–₱500,000 fine + 1–12 years imprisonment.\n• Covers endangered species, coral reefs, and marine habitats.\n\nIf you witness illegal logging or wildlife poaching, file a report through LikasLens.";
  }

  // 5. Clean Air Act (RA 8749)
  if (
    q.includes("8749") || q.includes("air") || q.includes("hangin") || q.includes("usok") || q.includes("smoke") || q.includes("emission") || q.includes("pabrika") || q.includes("factory") || q.includes("pollution") || q.includes("pollute") || q.includes("quality")
  ) {
    if (isFil) {
      return "Ayon po sa **Republic Act 8749 (Philippine Clean Air Act of 1999)**:\n\n• **Ipinagbabawal**: Labis na usok mula sa sasakyan (smoke belching), pabrika, at pagsusunog ng hazardous waste.\n• **Parusa**: Multa, suspensyon ng vehicle registration o business permit, at sapilitang compliance action.\n• **Hurisdiksyon**: DENR-EMB (air quality), LTO (vehicular emission), LGU.\n• **Ambient Standards**: Ang hangin ay dapat sumunod sa Philippine Ambient Air Quality Guidelines.\n\nKung nakakita kayo ng matinding usok mula sa pabrika o sasakyan, mag-file ng report at ipapadala namin sa DENR-EMB.";
    }
    return "Under **Republic Act 8749 (Philippine Clean Air Act of 1999)**:\n\n• **Prohibited Acts**: Excessive industrial emissions, vehicle smoke-belching, and incineration of hazardous waste.\n• **Penalties**: Fines, suspension of vehicle registration or business permits, and mandatory compliance.\n• **Jurisdiction**: DENR-EMB (air quality), LTO (vehicular), LGUs.\n• **Standards**: Must meet Philippine Ambient Air Quality Guidelines.\n\nIf you see heavy smoke from factories or vehicles, file a report through LikasLens and we'll route it to DENR-EMB.";
  }

  // 6. Mining violations
  if (q.includes("mining") || q.includes("mina") || q.includes("quarry") || q.includes("mineral") || q.includes("7942") || q.includes("tunnel") || q.includes("excavat")) {
    if (isFil) {
      return "Ayon po sa **Republic Act 7942 (Philippine Mining Act of 1995)**:\n\n• **Ipinagbabawal**: Illegal mining, quarrying, o pagkuha ng mineral resources nang walang kaukulang permit.\n• **Parusa**: Mula ₱50,000 hanggang ₱5,000,000 multa, pagkakakulong, at pagkumpiska ng kagamitan.\n• **Hurisdiksyon**: DENR Mines and Geosciences Bureau (MGB), LGU.\n\nKung may nakita kayong illegal mining o quarrying na walang permit, mag-file ng report sa LikasLens.";
    }
    return "Under **Republic Act 7942 (Philippine Mining Act of 1995)**:\n\n• **Prohibited**: Mining, quarrying, or mineral extraction without proper DENR permits.\n• **Penalties**: ₱50,000–₱5,000,000 fine, imprisonment, and confiscation of equipment.\n• **Jurisdiction**: DENR Mines and Geosciences Bureau (MGB), LGU.\n\nIf you witness illegal mining or quarrying, file a report through LikasLens.";
  }

  // 7. Ghost Mode / Privacy / Anonymous reporting
  if (q.includes("ghost") || q.includes("anonymous") || q.includes("privacy") || q.includes("hide") || q.includes("identity") || q.includes("protect") || q.includes("exif") || q.includes("metadata") || q.includes("safe") || q.includes("secur")) {
    if (isFil) {
      return "**Ghost Mode sa LikasLens** 🔒\n\nAng Ghost Mode ay nagbibigay ng **100% anonymity** sa inyong ulat:\n\n• **Tanggalin ang pangalan** — Hindi ipapakita ang inyong identity\n• **Strip EXIF data** — Ang GPS coordinates at device info ay tinatanggal bago ang submission\n• **No account required** — Maaari kang mag-report nang hindi nag-login\n• **Tamper-proof** — Ang evidence ay naka-encrypt at secure\n\nPaano i-enable:\n1. Mag-open ng Submit Report page\n2. Piliin ang **Ghost Mode** card\n3. Magpatuloy sa pagkuha ng litrato — awtomatikong mai-strip ang personal data\n\nLigtas po kayo sa LikasLens. Ang inyong pagiging anonymous ay garantisado.";
    }
    return "**Ghost Mode in LikasLens** 🔒\n\nGhost Mode provides **100% anonymous reporting**:\n\n• **Identity hidden** — Your name is never shown\n• **EXIF stripped** — GPS coordinates and device info removed before submission\n• **No account needed** — Report without logging in\n• **Tamper-proof** — Evidence is encrypted and secure\n\nHow to enable:\n1. Open the Submit Report page\n2. Select the **Ghost Mode** card\n3. Continue taking your photo — personal data is automatically stripped\n\nYour safety is guaranteed. Anonymous reporting is fully supported.";
  }

  // 8. How to report / Reporting process
  if (q.includes("report") || q.includes("ulat") || q.includes("sumbong") || q.includes("camera") || q.includes("paano") || q.includes("how to") || q.includes("submit") || q.includes("file") || q.includes("step")) {
    if (isFil) {
      return "**Paano Mag-File ng Report sa LikasLens** 📸\n\n1. **Pumunta sa Submit Report** — I-click ang Camera icon sa bottom nav\n2. **Pumili ng Mode** — Civic Mode (may pangalan) o Ghost Mode (anonymous)\n3. **Kumuha ng Litrato** — Ang camera ay awtomatikong mag-capture ng evidence\n4. **AI Auto-Detection** — Susuriin ng AI ang litrato at mag-classify ng violation\n5. **Mag-Confirm ng Category** — Maaari mong baguhin kung hindi tama ang AI\n6. **Mag-Set ng Location** — I-click ang map para i-pin ang exact na lokasyon\n7. **Review & Submit** — I-review at i-submit ang report\n\nAng AI ay agad na mag-a-analyze, mag-a-assign ng batas, at magpapadala sa tamang ahensya (DENR/CENRO/PCG). Maaari mong i-track ang status sa **My Submissions**.";
    }
    return "**How to File a Report on LikasLens** 📸\n\n1. **Go to Submit Report** — Tap the Camera icon in the bottom navigation\n2. **Choose Mode** — Civic Mode (with your name) or Ghost Mode (anonymous)\n3. **Take a Photo** — The camera captures evidentiary photo evidence\n4. **AI Auto-Detection** — Our AI analyzes the photo and classifies the violation\n5. **Confirm Category** — You can override if the AI classification is wrong\n6. **Set Location** — Tap the map to pin the exact incident location\n7. **Review & Submit** — Review and submit your report\n\nThe AI instantly analyzes, assigns the applicable law, and dispatches to the correct agency (DENR/CENRO/PCG). Track status in **My Submissions**.";
  }

  // 9. AI Triage / How AI works
  if (q.includes("ai") || q.includes("triage") || q.includes("yolo") || q.includes("detect") || q.includes("classif") || q.includes("analyz") || q.includes("machine") || q.includes("artificial") || q.includes("intelligence")) {
    if (isFil) {
      return "**Paano Gumagana ang AI ng LikasLens** 🤖\n\n1. **Photo Analysis (YOLOv8)** — Ang AI ay tumitingin sa inyong litrato at kinikilala ang uri ng violation (illegal dumping, water pollution, logging, etc.)\n2. **Legal Mapping** — Awtomatikong ini-match ang violation sa tamang Philippine environmental law\n3. **Agency Routing** — Batay sa lokasyon at kategorya, ipinapadala sa tamang ahensya\n4. **Urgency Scoring** — Sinusuri ang severity at assigns priority score\n\nAng AI ay hindi perpekto — maaari mong i-override ang auto-detected category bago mag-submit. Ang final decision ay nasa inyo!";
    }
    return "**How LikasLens AI Works** 🤖\n\n1. **Photo Analysis (YOLOv8)** — Our AI examines your photo and identifies the violation type (illegal dumping, water pollution, logging, etc.)\n2. **Legal Mapping** — Automatically matches the violation to the correct Philippine environmental law\n3. **Agency Routing** — Based on location and category, dispatches to the right authority\n4. **Urgency Scoring** — Assesses severity and assigns a priority score\n\nThe AI isn't perfect — you can override the auto-detected category before submitting. The final decision is yours!";
  }

  // 10. What happens after submission
  if (q.includes("after") || q.includes("happen") || q.includes("next") || q.includes("track") || q.includes("status") || q.includes("resolv") || q.includes("follow") || q.includes("update") || q.includes("ano mangyayari")) {
    if (isFil) {
      return "**Ano ang Mangyayari Pagkatapos ng Submission** 📋\n\n1. **AI Analysis** — Susuriin ng AI ang litrato at mag-a-assign ng batas\n2. **Agency Dispatch** — Ipapadala sa tamang ahensya (DENR/CENRO/PCG/LGU)\n3. **Inspector Notification** — Ma-notify ang mga local inspector para sa site visit\n4. **On-Site Inspection** — Pupunta ang team sa lokasyon para suriin at ayusin\n5. **Resolution** — Kapag naayos na, ma-mark as resolved at makikita sa Public Record\n\nMaaari mong i-track ang status sa **My Submissions** page. Makakatanggap ka ng notification kapag nag-update ang status.";
    }
    return "**What Happens After You Submit** 📋\n\n1. **AI Analysis** — The AI analyzes your photo and assigns the applicable law\n2. **Agency Dispatch** — Report sent to the correct authority (DENR/CENRO/PCG/LGU)\n3. **Inspector Notification** — Local inspectors are notified for site visit\n4. **On-Site Inspection** — Team visits the location to investigate and resolve\n5. **Resolution** — Once fixed, marked as resolved and published on Public Record\n\nTrack your report status in **My Submissions**. You'll receive notifications when the status updates.";
  }

  // 11. Wildlife / Poaching / Endangered species
  if (q.includes("wildlife") || q.includes("poach") || q.includes("hunt") || q.includes("endanger") || q.includes("animal") || q.includes("species") || q.includes("9147") || q.includes("biodiversit") || q.includes("bird") || q.includes("marine life")) {
    if (isFil) {
      return "Ayon sa **Republic Act 9147 (Wildlife Resources Conservation and Protection Act)**:\n\n• **Ipinagbabawal**: Paghuhuli, pagpatay, o pangangalakal ng wildlife na nasa threatened/endangered list.\n• **Parusa**: ₱50,000–₱500,000 multa at 1–12 taon pagkakakulong.\n• **Coverage**: Lahat ng terrestrial at aquatic species, kasama ang mga coral at marine life.\n• **Ahensya**: DENR-BMB (Biodiversity Management Bureau).\n\nKung may nakita kayong wildlife crime, mag-file ng report sa LikasLens at ipapadala namin sa DENR-BMB.";
    }
    return "Under **Republic Act 9147 (Wildlife Resources Conservation and Protection Act)**:\n\n• **Prohibited**: Hunting, killing, or trading threatened/endangered wildlife.\n• **Penalties**: ₱50,000–₱500,000 fine + 1–12 years imprisonment.\n• **Coverage**: All terrestrial and aquatic species, including coral reefs and marine life.\n• **Agency**: DENR-BMB (Biodiversity Management Bureau).\n\nIf you witness wildlife crime, file a report through LikasLens and we'll dispatch it to DENR-BMB.";
  }

  // 12. Platform features (offline, public records, etc.)
  if (q.includes("offline") || q.includes("queue") || q.includes("public record") || q.includes("dashboard") || q.includes("map") || q.includes("install") || q.includes("pwa") || q.includes("app") || q.includes("feature")) {
    if (isFil) {
      return "**Mga Feature ng LikasLens** ✨\n\n• **Offline Mode** — Maaari kang mag-report kahit walang internet. Auto-sync pagbalik online.\n• **Public Record** — Lahat ng resolved reports ay makikita ng publiko para sa transparency.\n• **Live Heatmap** — Makita ang mga environmental hotspots sa inyong lugar.\n• **My Submissions** — I-track ang status ng inyong mga ulat.\n• **PWA Install** — I-install ang LikasLens sa inyong phone home screen (walang app store needed).\n• **Ghost Mode** — 100% anonymous reporting.\n\nAng LikasLens ay gumagana sa kahit anong browser at device!";
    }
    return "**LikasLens Features** ✨\n\n• **Offline Mode** — Report even without internet. Auto-sync when back online.\n• **Public Record** — All resolved reports are publicly visible for transparency.\n• **Live Heatmap** — See environmental hotspots in your area.\n• **My Submissions** — Track the status of your reports.\n• **PWA Install** — Install LikasLens on your phone home screen (no app store needed).\n• **Ghost Mode** — 100% anonymous reporting.\n\nLikasLens works on any browser and device!";
  }

  // 13. Specific penalty/fine questions
  if (q.includes("penalty") || q.includes("fine") || q.includes("multa") || q.includes("kulong") || q.includes("jail") || q.includes("prison") || q.includes("punish") || q.includes("sanction")) {
    if (isFil) {
      return "**Mga Parusa sa Philippine Environmental Laws** ⚖️\n\n| Batas | Paglabag | Parusa |\n|---|---|---|\n| **RA 9003** | Illegal dumping, open burning | ₱300–₱1M multa, 1–15 araw community service |\n| **RA 9275** | Water pollution | ₱10K–₱200K/araw ng paglabag |\n| **RA 8749** | Air pollution, smoke belching | Hanggang ₱100K/araw + permit suspension |\n| **PD 705** | Illegal logging | Qualified theft — pagkakakulong + 8x stumpage value |\n| **RA 7942** | Illegal mining | ₱50K–₱5M multa + pagkakakulong |\n| **RA 9147** | Wildlife poaching | ₱50K–₱500K multa + 1–12 taon pagkakakulong |\n\nAng bawat ulat sa LikasLens ay auto-mapped sa tamang batas.";
    }
    return "**Penalties Under Philippine Environmental Laws** ⚖️\n\n| Law | Violation | Penalty |\n|---|---|---|\n| **RA 9003** | Illegal dumping, open burning | ₱300–₱1M fine, 1–15 days community service |\n| **RA 9275** | Water pollution | ₱10K–₱200K per day of violation |\n| **RA 8749** | Air pollution, smoke belching | Up to ₱100K/day + permit suspension |\n| **PD 705** | Illegal logging | Qualified theft — imprisonment + 8x stumpage value |\n| **RA 7942** | Illegal mining | ₱50K–₱5M fine + imprisonment |\n| **RA 9147** | Wildlife poaching | ₱50K–₱500K fine + 1–12 years imprisonment |\n\nEach LikasLens report is auto-mapped to the applicable statute.";
  }

  // 14. Agency routing / DENR / CENRO / PCG
  if (q.includes("route") || q.includes("dispatch") || q.includes("agency") || q.includes("denr") || q.includes("cenro") || q.includes("emb") || q.includes("pcg") || q.includes("office") || q.includes("ahensya") || q.includes("send") || q.includes("who") || q.includes("sino") || q.includes("where") || q.includes("saan")) {
    if (isFil) {
      return "**Agency Routing sa LikasLens** 🏛️\n\nAng AI ay awtomatikong nag-papadala ng ulat sa tamang ahensya:\n\n• **DENR-EMB** — Industrial pollution, air quality, hazardous waste\n• **CENRO/PENRO** — Local waste, illegal dumping, forestry violations\n• **PCG** — Maritime pollution, coastal damage, oil spills\n• **LLDA** — Lake basin pollution (Laguna de Bay)\n• **DENR-BMB** — Wildlife crimes, biodiversity violations\n• **LGU** — Local enforcement, barangay-level concerns\n\nAng routing ay base sa GPS coordinates at AI classification. Maaari mong i-track ang status sa My Submissions.";
    }
    return "**Agency Routing in LikasLens** 🏛️\n\nThe AI automatically routes reports to the correct authority:\n\n• **DENR-EMB** — Industrial pollution, air quality, hazardous waste\n• **CENRO/PENRO** — Local waste, illegal dumping, forestry violations\n• **PCG** — Maritime pollution, coastal damage, oil spills\n• **LLDA** — Lake basin pollution (Laguna de Bay)\n• **DENR-BMB** — Wildlife crimes, biodiversity violations\n• **LGU** — Local enforcement, barangay-level concerns\n\nRouting is based on GPS coordinates + AI classification. Track status in My Submissions.";
  }

  // 15. Thank you
  if (q.includes("thank") || q.includes("salamat") || q.includes("thanks") || q.includes("ty")) {
    if (isFil) {
      return "Walang anuman po! Masaya akong nakatulong. 🌿 Kung may iba pa po kayong katanungan tungkol sa LikasLens, environmental laws, o paano mag-file ng report, huwag mahiyang magtanong. Ingat po kayo at salamat sa pagmamalasakit sa ating kalikasan!";
    }
    return "You're welcome! I'm glad I could help. 🌿 If you have any more questions about LikasLens, environmental laws, or how to file reports, don't hesitate to ask. Take care and thank you for caring about our environment!";
  }

  // 16. General / Default
  if (isFil) {
    return "Salamat po sa inyong pagtatanong! Handa po akong magpaliwanag tungkol sa:\n\n• 🌿 **Mga batas pangkalikasan** — RA 9003 (Waste), RA 9275 (Water), RA 8749 (Air), PD 705 (Forestry), RA 7942 (Mining), RA 9147 (Wildlife)\n• 📸 **Paano mag-file ng report** — Step-by-step guide gamit ang LikasLens camera\n• 🔒 **Ghost Mode** — 100% anonymous reporting para sa inyong seguridad\n• 🤖 **AI Triage** — Paano gumagana ang aming AI sa pag-classify at pag-route\n• 🏛️ **Agency Routing** — Paano ipinapadala ang ulat sa DENR, CENRO, PCG, o LGU\n• ✨ **Mga Feature** — Offline mode, public records, heatmap, PWA install\n\nMay partikular po ba kayong nais itanong?";
  }
  return "Thank you for reaching out! I can help you with:\n\n• 🌿 **Environmental Laws** — RA 9003 (Waste), RA 9275 (Water), RA 8749 (Air), PD 705 (Forestry), RA 7942 (Mining), RA 9147 (Wildlife)\n• 📸 **How to Report** — Step-by-step guide using the LikasLens camera\n• 🔒 **Ghost Mode** — 100% anonymous reporting for your safety\n• 🤖 **AI Triage** — How our AI classifies and routes reports\n• 🏛️ **Agency Routing** — How reports are sent to DENR, CENRO, PCG, or LGU\n• ✨ **Features** — Offline mode, public records, heatmap, PWA install\n\nWhat would you like to know?";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let requestedMessage = "";
  let requestedLocale = "en";

  try {
    const body = await request.json();
    requestedMessage = body.message || "";
    requestedLocale = body.locale || "en";

    if (!requestedMessage || typeof requestedMessage !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const gateway = new AIGateway(getConfig());
    try {
      const result = await gateway.chat({
        message: body.message,
        locale: requestedLocale,
        messages: body.messages || [],
        ticket_id: body.ticket_id,
        conversation_id: body.conversation_id,
        authToken: session?.access_token ?? undefined,
      });

      return NextResponse.json(result);
    } catch {
      // Graceful fallback to built-in intelligent engine
      const reply = generateLiksiFallbackReply(requestedMessage, requestedLocale);
      return NextResponse.json({
        reply,
        success: true,
      });
    }
  } catch (err: unknown) {
    console.error("[/api/v1/ai/chat] Error:", err);
    const reply = generateLiksiFallbackReply(requestedMessage, requestedLocale);
    return NextResponse.json({
      reply,
      success: true,
    });
  }
}
