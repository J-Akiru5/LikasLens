#!/usr/bin/env python
"""
Kokoro TTS worker for the LikasLens AVP.

Reads a job list on stdin, writes one 24 kHz WAV per job. Runs entirely
locally — kokoro-onnx is Apache-2.0 and there is no cloud TTS anywhere in
this pipeline (brief section 1).

Job list format::

    {"jobs": [{"id": "s1", "text": "...", "voice": "af_heart", "speed": 0.78, "out": "C:/.../s1.wav"}]}

Called by narration/synthesize.mjs, which handles pronunciation substitution,
resampling to 48 kHz mono and duration measurement.
"""

import json
import sys
from pathlib import Path


def main() -> int:
    payload = json.load(sys.stdin)
    model = payload["model"]
    voices = payload["voices"]
    jobs = payload["jobs"]

    for path, label in ((model, "model"), (voices, "voices")):
        if not Path(path).exists():
            print(f"MISSING {label}: {path}", file=sys.stderr)
            return 2

    try:
        from kokoro_onnx import Kokoro
    except ImportError:
        print(
            "kokoro-onnx is not installed in this interpreter.\n"
            "Run: python -m venv demo-video/.venv && "
            "demo-video/.venv/Scripts/python -m pip install kokoro-onnx soundfile numpy",
            file=sys.stderr,
        )
        return 2

    import soundfile as sf

    kokoro = Kokoro(model, voices)
    results = []

    for job in jobs:
        text = (job.get("text") or "").strip()
        if not text:
            results.append({"id": job["id"], "skipped": True, "reason": "empty narration"})
            continue

        samples, sample_rate = kokoro.create(
            text,
            voice=job.get("voice", "af_heart"),
            speed=float(job.get("speed", 1.0)),
            lang=job.get("lang", "en-us"),
        )

        out = Path(job["out"])
        out.parent.mkdir(parents=True, exist_ok=True)
        sf.write(str(out), samples, sample_rate)

        # Basic clipping check — brief step 7 asks for "no clipping".
        peak = float(max(abs(float(s)) for s in samples)) if len(samples) else 0.0
        results.append(
            {
                "id": job["id"],
                "out": str(out),
                "sampleRate": int(sample_rate),
                "samples": int(len(samples)),
                "peak": round(peak, 4),
                "clipped": peak >= 0.999,
            }
        )

    json.dump({"results": results}, sys.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
