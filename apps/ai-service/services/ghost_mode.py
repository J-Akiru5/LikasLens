"""
Ghost Mode identity enforcement.
Ports LocationFuzzService + ReportController ghost logic from Laravel.
"""

from typing import Optional


def fuzz_location(lat: float, lon: float) -> tuple[float, float]:
    """
    Snap GPS coordinates to a ~1km grid cell to prevent exact location identification.
    The Laravel LocationFuzzService used barangay centroid lookup — this is the MVP equivalent.
    """
    precision = 0.01  # ~1km grid
    fuzzed_lat = round(round(lat / precision) * precision, 4)
    fuzzed_lon = round(round(lon / precision) * precision, 4)
    return fuzzed_lat, fuzzed_lon


def sanitize_report_payload(
    *,
    reporter_user_id: Optional[str],
    ghost_mode: bool,
    latitude: Optional[float],
    longitude: Optional[float],
) -> dict:
    """
    Apply Ghost Mode rules before storing a report.
    - Identity becomes NULL
    - Location is fuzzed to ~1km grid
    Returns a dict of the safe fields to persist.
    """
    if ghost_mode:
        safe_user_id = None
        location_fuzzed = False
        if latitude is not None and longitude is not None:
            latitude, longitude = fuzz_location(latitude, longitude)
            location_fuzzed = True
    else:
        safe_user_id = reporter_user_id
        location_fuzzed = False

    return {
        "reporter_user_id": safe_user_id,
        "ghost_mode": ghost_mode,
        "latitude": latitude,
        "longitude": longitude,
        "location_fuzzed": location_fuzzed,
    }


# Fields that must NEVER appear in public or LGU responses
IDENTITY_FIELDS = frozenset(["reporter_user_id", "reporter_email", "reporter_phone", "reporter_ip", "ghost_mode"])


def sanitize_for_public(ticket_dict: dict) -> dict:
    """Strip all identity fields from a ticket dict before returning in a public response."""
    return {k: v for k, v in ticket_dict.items() if k not in IDENTITY_FIELDS}


def get_reporter_display(ghost_mode: bool, reporter_name: Optional[str]) -> str:
    """Get display name for reporter — Anonymous for ghost mode."""
    return "Anonymous Reporter" if ghost_mode else (reporter_name or "Unknown")
