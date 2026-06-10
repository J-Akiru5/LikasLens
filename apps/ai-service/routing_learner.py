"""
Routing Learner for LikasLens AI Service.
Tracks resolution times per (violation_type, lgu_id) pair and provides
learned routing weights based on historical LGU performance.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).parent / "data"
_SCORES_FILE = _DATA_DIR / "routing_scores.json"

# In-memory scoring table:
# {
#   "<violation_type>": {
#     "<lgu_id>": {
#       "total_hours": float,
#       "count": int,
#       "avg_hours": float,
#       "last_recorded": str (ISO timestamp)
#     }
#   }
# }
_scores: dict[str, dict[str, dict[str, float | int | str]]] = {}
_lock = threading.Lock()
_loaded = False


def _ensure_loaded() -> None:
    """Load scores from disk on first access."""
    global _scores, _loaded
    if _loaded:
        return
    with _lock:
        if _loaded:
            return
        if _SCORES_FILE.exists():
            try:
                with open(_SCORES_FILE, "r", encoding="utf-8") as f:
                    _scores = json.load(f)
                logger.info(
                    "Routing learner loaded %d violation types from %s",
                    len(_scores),
                    _SCORES_FILE,
                )
            except (json.JSONDecodeError, OSError) as exc:
                logger.warning("Failed to load routing scores, starting fresh: %s", exc)
                _scores = {}
        _loaded = True


def _persist() -> None:
    """Write current scores to disk."""
    try:
        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        tmp_path = _SCORES_FILE.with_suffix(".tmp")
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(_scores, f, indent=2, ensure_ascii=False)
        tmp_path.replace(_SCORES_FILE)
    except OSError as exc:
        logger.error("Failed to persist routing scores: %s", exc)


def record_resolution(violation_type: str, lgu_id: str, hours: float) -> None:
    """Record a resolution time for a (violation_type, lgu_id) pair.

    Args:
        violation_type: The violation code (e.g. "ILLEGAL_DUMPING").
        lgu_id: The LGU/NGO group ID that resolved the ticket.
        hours: How many hours it took to resolve from creation.
    """
    if not violation_type or not lgu_id or hours < 0:
        logger.warning(
            "record_resolution: invalid args — violation_type=%r, lgu_id=%r, hours=%r",
            violation_type,
            lgu_id,
            hours,
        )
        return

    _ensure_loaded()

    now_iso = datetime.now(timezone.utc).isoformat()

    with _lock:
        if violation_type not in _scores:
            _scores[violation_type] = {}

        vt_scores = _scores[violation_type]

        if lgu_id not in vt_scores:
            vt_scores[lgu_id] = {
                "total_hours": 0.0,
                "count": 0,
                "avg_hours": 0.0,
                "last_recorded": now_iso,
            }

        entry = vt_scores[lgu_id]
        entry["total_hours"] = float(entry["total_hours"]) + hours
        entry["count"] = int(entry["count"]) + 1
        entry["avg_hours"] = float(entry["total_hours"]) / int(entry["count"])
        entry["last_recorded"] = now_iso

        _persist()

    logger.info(
        "Routing learner recorded: violation=%s lgu=%s hours=%.1f (new avg=%.1f, n=%d)",
        violation_type,
        lgu_id,
        hours,
        entry["avg_hours"],
        entry["count"],
    )


def get_best_lgu(violation_type: str) -> Optional[str]:
    """Return the LGU with the best (lowest) average resolution time for a violation type.

    Returns None if no data exists for this violation type.
    """
    _ensure_loaded()

    with _lock:
        vt_scores = _scores.get(violation_type)
        if not vt_scores:
            return None

        best_lgu = None
        best_avg = float("inf")

        for lgu_id, entry in vt_scores.items():
            avg = float(entry["avg_hours"])
            if avg < best_avg:
                best_avg = avg
                best_lgu = lgu_id

        return best_lgu


def get_routing_weights(violation_type: str) -> dict[str, float]:
    """Return probability weights for all LGUs based on inverse average resolution time.

    LGUs with faster resolution times get higher weights.
    Returns an empty dict if no data exists for this violation type.

    The weights are normalized so they sum to 1.0 and can be used
    as selection probabilities.
    """
    _ensure_loaded()

    with _lock:
        vt_scores = _scores.get(violation_type)
        if not vt_scores:
            return {}

        # Inverse average: faster LGUs get higher weight
        inv_avgs: dict[str, float] = {}
        for lgu_id, entry in vt_scores.items():
            avg = float(entry["avg_hours"])
            if avg <= 0:
                # Edge case: zero avg means instant resolution — give max weight
                inv_avgs[lgu_id] = 1e6
            else:
                inv_avgs[lgu_id] = 1.0 / avg

        total = sum(inv_avgs.values())
        if total <= 0:
            return {}

        return {lgu_id: w / total for lgu_id, w in inv_avgs.items()}


def get_stats() -> dict:
    """Return the full routing performance data for the stats endpoint."""
    _ensure_loaded()

    with _lock:
        summary: dict[str, dict] = {}
        for violation_type, lgu_data in _scores.items():
            best_lgu = None
            best_avg = float("inf")
            total_records = 0

            lgus: dict[str, dict] = {}
            for lgu_id, entry in lgu_data.items():
                count = int(entry["count"])
                avg = float(entry["avg_hours"])
                total_records += count
                lgus[lgu_id] = {
                    "avg_hours": round(avg, 2),
                    "count": count,
                    "last_recorded": entry.get("last_recorded"),
                }
                if avg < best_avg:
                    best_avg = avg
                    best_lgu = lgu_id

            summary[violation_type] = {
                "best_lgu": best_lgu,
                "best_avg_hours": round(best_avg, 2) if best_lgu else None,
                "total_records": total_records,
                "lgus": lgus,
            }

        return {
            "violation_types": summary,
            "total_violation_types": len(summary),
            "scores_file": str(_SCORES_FILE),
        }


def has_data(violation_type: str) -> bool:
    """Check if we have any learned data for a given violation type."""
    _ensure_loaded()
    with _lock:
        return bool(_scores.get(violation_type))
