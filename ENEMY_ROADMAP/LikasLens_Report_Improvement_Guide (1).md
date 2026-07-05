# LikasLens — AI-Use & Ethics Report: Top 1% Improvement Guide
**ASEAN AI Hackathon 2026 · Climate Change Track**

---

## Overall Assessment

Your report is already above average — it's honest, culturally grounded, and technically specific. The Gemini fish corral incident (Section 6) is one of the strongest pieces of ethical reflection I've seen in a hackathon report. The issues below are the specific gaps that separate a strong submission from a top 1% one.

---

## 🔴 CRITICAL FIXES (Judge-Stoppers)

These are gaps that judges will likely flag. Fix these first.

---

### 1. You have ZERO performance metrics

This is the single biggest gap. The report describes what the AI *does* but never shows *how well* it works.

**What to add (even from limited testing):**
- YOLOv8 Nano mAP (mean Average Precision) on your test set — even a small one
- Precision and recall per detected class (bottles, nets, clearing events, etc.)
- Number of images processed in testing
- Confidence threshold values you actually used (e.g., "we set a threshold of 0.65 after testing showed X% false positives below this level")
- Number of AI-flagged alerts that passed vs. failed human validation in testing

**Example language to add in Section 4:**
> "In internal testing across 847 coastal imagery samples, YOLOv8 Nano achieved a mAP@0.5 of 0.71 on the five most common violation categories. Confidence thresholding at 0.65 reduced false positives by 34% at the cost of 12% recall — an acceptable tradeoff given mandatory human verification."

If you only have small-scale test numbers, that's fine — report what you have and be transparent about sample size. No numbers is worse than small numbers.

---

### 2. Missing: Carbon/Energy Footprint — For a CLIMATE CHANGE Track Submission

This is potentially a critical oversight that judges on this specific track will notice immediately.

Your system uses:
- **Google Gemini** (large cloud-based LLM — high energy cost per inference)
- **YOLOv8 Nano** (good, this is lightweight — lean into this)
- **FastAPI cloud deployment**

You need a dedicated paragraph in Section 3 or Section 4 addressing this. Options:

**Option A — Acknowledge and quantify (recommended):**
> "LikasLens is designed for minimal compute footprint. YOLOv8 Nano was selected over larger variants specifically to reduce inference energy cost — at approximately 4.2 GFLOPs per image, it is ~40x more efficient than YOLOv8x. Gemini API calls are triggered only on violation-confirmed events, not on every frame, reducing cloud inference volume. We acknowledge that Gemini's cloud infrastructure carries an energy cost we do not fully control, and post-hackathon development will evaluate locally hosted open-weight models (e.g., LLaMA 3, Phi-3) for the report generation layer."

**Option B — Minimum viable acknowledgment:**
> Add a bullet under Section 3: *"Compute sustainability: YOLOv8 Nano chosen for energy efficiency (4.2 GFLOPs vs. 640 for Nano vs. Large variants); Gemini calls are event-gated, not continuous. Energy tradeoffs of cloud LLM use are acknowledged and will be addressed in the localized model roadmap."*

---

### 3. "Safeguards are insufficient" — Fix the Framing

Section 4 Ghost Mode currently reads: *"We acknowledge these safeguards are insufficient as standalone measures."*

This is honest — but without a concrete plan, judges read it as "the system is unsafe and they know it." You need to either:

**(a) Add a concrete timeline for the planned safeguards:**
> "Phase 1 (current): AI confidence screening + mandatory LGU physical verification before any action. Phase 2 (Q3 2026): device-level rate limiting and community trust-scoring layer. Phase 3 (Q1 2027): formal appeals process with indigenous community oversight board integration."

**(b) Reframe the existing safeguards more strongly:**
Make it clear that the current safeguards are deliberate minimum viable protections chosen because the alternative (no whistleblowing mechanism) causes more harm than an imperfect one.

---

## 🟠 HIGH PRIORITY IMPROVEMENTS

These will meaningfully elevate your score.

---

### 4. Technical Imprecision: "Gremlin graph databases"

Apache Gremlin is a **graph traversal language** (part of Apache TinkerPop), not a database system. This is like saying "you use SQL" without naming the database.

**Fix:** Name the actual database backend. If you're using:
- **JanusGraph** — say "JanusGraph with Apache Gremlin traversal"
- **Amazon Neptune** — say "Amazon Neptune (Gremlin-compatible)"
- **ArangoDB** — specify accordingly

Technical judges will catch this imprecision and it undermines Section 3's credibility.

---

### 5. "Six ASEAN Languages" — Name Them

Currently vague. **Specify which six.** Likely: Filipino/Tagalog, Bahasa Indonesia, Bahasa Malaysia, Thai, Vietnamese, and one more? 

Also address the gap you mentioned: if Hiligaynon and Cebuano are *not* among the six, say so explicitly and frame it as a known gap with a roadmap.

---

### 6. Missing: Data Governance & Community Data Rights

For a system collecting real-world environmental data in Filipino communities, this is ethically required. The Philippines has the **Data Privacy Act of 2012 (RA 10173)**.

**Add a short paragraph to Section 5 or as a new Section 5.5:**
> "Community data ownership: All environmental imagery collected through LikasLens remains the property of the submitting LGU or community organization. Data is retained for [X months] and may be deleted upon request by the submitting party. LikasLens does not share raw imagery with third parties, including Anthropic/Google, beyond inference processing. The system complies with the Philippine Data Privacy Act of 2012."

---

### 7. The Fish Corral Incident Should Be Your Hook, Not Buried in Section 6

This is the most compelling ethical story in the entire report. Consider:
- **Referencing it in the Introduction** as a teaser: "A system that flags traditional fish corrals as illegal infrastructure has failed its community — and we discovered this firsthand."
- **Starting Section 6 with it more prominently** rather than as a "reflection"

This incident shows your team actually encountered and *fixed* a real ethical failure. That is rare and valuable.

---

### 8. YOLOv8 Inconsistency: "YOLOv8" vs. "YOLOv8 Nano"

Section 3 says "YOLOv8" and Section 4 says "YOLOv8 Nano." Pick one (Nano is more precise and better justifies the latency/efficiency claims) and use it consistently throughout.

---

## 🟡 MEDIUM PRIORITY IMPROVEMENTS

These will polish the report from good to excellent.

---

### 9. Justify the "AI is the only solution" Claim

Section 1 states: "AI is not a convenience here — it is the only operationally viable solution."

This is a strong claim that needs at least one sentence of support. Add a comparison:
> "Manual ecological surveys in Southeast Asia cost $X per hectare and are conducted every 3–5 years; LikasLens enables continuous monitoring at effectively marginal cost per frame analyzed."

Even a rough cost/coverage comparison significantly strengthens this.

---

### 10. Add an Evaluation Methodology Paragraph

How did you validate that the system works? Judges want to know:
- Who labeled your test images? (Subject matter experts? LGU officers?)
- What was your test/validation split?
- How did you verify rule-based mappings are legally accurate?

Even a paragraph like: "Model outputs were validated against a 50-image expert-annotated test set prepared with guidance from [conservation partner/professor]. Rule-based policy mappings were reviewed against Republic Act 8550 (Philippine Fisheries Code) and verified by [professor name/LGU partner]."

---

### 11. Strengthen the Conclusion with a Concrete Roadmap

Current conclusion is well-written but generic. Add a 3-milestone roadmap:

> **Post-Hackathon Development Roadmap:**
> - *0–3 months:* Fine-tune YOLOv8 on ASEAN-curated coastal dataset with partner NGOs; expand language support to include Hiligaynon and Cebuano
> - *3–6 months:* Ghost Mode Phase 2 safeguards (rate limiting, trust scoring); indigenous co-design consultations for ancestral domain deployment guidelines
> - *6–12 months:* Pilot deployment with [LGU name if applicable]; publish bias audit findings as open dataset contribution to the ASEAN AI community

---

### 12. Add a Bias/Risk Summary Table in Section 4

Convert the narrative risk assessment into a structured table. This makes it scannable and shows systematic thinking:

| Risk | Likelihood | Impact | Current Mitigation | Status |
|------|------------|--------|--------------------|--------|
| COCO dataset Western bias | High | Medium | Confidence thresholding + human review | Active gap — fine-tuning planned |
| Indigenous practice misclassification | Medium | High | Rule-based filter; cultural review | Partial — co-design needed |
| Ghost Mode abuse | Medium | High | Confidence screen + LGU verification | Phase 1 only — Phase 2 planned |
| Linguistic gap (Hiligaynon/Cebuano) | High | Medium | Acknowledged — roadmap item | Active gap |
| Gemini data sovereignty | Low-Med | Medium | API-only, no PII ingestion | Accepted tradeoff — local model roadmap |

---

## 🟢 NICE TO HAVE (If You Have Time)

These won't make or break the report but will impress sophisticated judges.

---

### 13. Add a System Architecture Diagram

A single diagram showing the data flow: Camera/Field Input → FastAPI → YOLOv8 Nano → Gremlin rule engine → Confidence threshold → Human validation queue → LGU dashboard. This makes the neuro-symbolic pipeline tangible and is far more memorable than text alone.

### 14. Include at Least One Stakeholder Quote

Even one sentence from an LGU officer, conservation biologist, or community member observed during testing: *"[Name], Fisheries Officer, Municipality of [X]: 'Being able to see alerts on my phone means I don't have to wait for the quarterly report to know if something has changed.'"*

If you haven't done user testing with real stakeholders, acknowledge this as a gap in Section 5 and include it in the roadmap.

### 15. Add a "Why This AI Approach" Comparison Note

A 2-sentence note in Section 3 justifying why you chose YOLOv8 over alternatives (DETR, CLIP, SAM) and Gemini over locally hosted models shows you evaluated options rather than defaulting to familiar tools.

---

## Priority Order Summary

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 🔴 #1 | Add performance metrics (even small-scale) | Medium | Very High |
| 🔴 #2 | Add carbon/energy footprint paragraph | Low | Very High |
| 🔴 #3 | Fix Ghost Mode "insufficient safeguards" framing | Low | High |
| 🟠 #4 | Fix "Gremlin" technical imprecision | Very Low | High |
| 🟠 #5 | Name the 6 ASEAN languages | Very Low | Medium |
| 🟠 #6 | Add data governance paragraph | Low | High |
| 🟠 #7 | Elevate the fish corral incident | Low | High |
| 🟠 #8 | Fix YOLOv8 vs YOLOv8 Nano inconsistency | Very Low | Medium |
| 🟡 #9 | Justify "AI is the only solution" claim | Very Low | Medium |
| 🟡 #10 | Add evaluation methodology | Low | Medium |
| 🟡 #11 | Add post-hackathon roadmap to conclusion | Low | Medium |
| 🟡 #12 | Add risk/bias summary table | Low | Medium |
| 🟢 #13 | Architecture diagram | Medium | Medium |
| 🟢 #14 | Stakeholder quote | Medium | High |
| 🟢 #15 | AI tool comparison note | Very Low | Low |

---

## What You're Already Doing Right (Don't Remove These)

- The neuro-symbolic architecture explanation is technically substantive — keep it
- The COCO dataset bias admission is excellent and shows genuine self-awareness
- The dual-layer human oversight (technical + operational) is well-described
- The specific latency figure (250ms) and ASEAN statistics (12 million fisherfolk) are effective
- Section 6's fish corral reflection is your report's most valuable content
- Acknowledging data sovereignty tradeoffs with Gemini shows maturity
- "AI cannot initiate legal action" is a clear, powerful statement

---

*Good luck — this project is already doing something real and important. These fixes are about making sure the judges see what you've actually built.*
