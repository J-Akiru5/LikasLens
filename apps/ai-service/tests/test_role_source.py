"""The AI service must read roles from app_metadata, never user_metadata.

Supabase lets a signed-in user write their own `user_metadata` — the mobile
register page does exactly that. Before this change `require_super_admin` read
`user_metadata.role`, so any citizen could call Supabase's `updateUser` with
`{ data: { role: "super_admin" } }` and then pass the gate.

These tests pin the corrected behaviour, including the escalation attempt itself,
so the old read path cannot come back unnoticed.
"""

import pytest
from fastapi import HTTPException

from auth.supabase_jwt import require_lgu_role, require_super_admin


def _token(**claims):
    return {"sub": "11111111-1111-1111-1111-111111111111", "email": "u@example.com", **claims}


# --- super admin gate -------------------------------------------------------


def test_super_admin_accepted_from_app_metadata():
    token = _token(app_metadata={"role": "super_admin"})
    assert require_super_admin(token) is token


def test_super_admin_claim_in_user_metadata_alone_is_rejected():
    """The escalation path: user_metadata is client-writable."""
    token = _token(user_metadata={"role": "super_admin"})
    with pytest.raises(HTTPException) as exc:
        require_super_admin(token)
    assert exc.value.status_code == 403


def test_user_metadata_cannot_override_a_lower_app_metadata_role():
    """Even with a forged user claim present, the authoritative one wins."""
    token = _token(
        app_metadata={"role": "citizen"},
        user_metadata={"role": "super_admin"},
    )
    with pytest.raises(HTTPException) as exc:
        require_super_admin(token)
    assert exc.value.status_code == 403


def test_missing_app_metadata_role_is_treated_as_citizen():
    with pytest.raises(HTTPException) as exc:
        require_super_admin(_token())
    assert exc.value.status_code == 403


# --- officer gate -----------------------------------------------------------


@pytest.mark.parametrize("role", ["lgu", "lgu_officer", "admin", "super_admin", "analyst"])
def test_staff_roles_accepted_from_app_metadata(role):
    token = _token(app_metadata={"role": role})
    assert require_lgu_role(token) is token


def test_citizen_rejected_from_officer_gate():
    with pytest.raises(HTTPException) as exc:
        require_lgu_role(_token(app_metadata={"role": "citizen"}))
    assert exc.value.status_code == 403


def test_forged_officer_claim_in_user_metadata_is_rejected():
    with pytest.raises(HTTPException) as exc:
        require_lgu_role(_token(user_metadata={"role": "lgu_officer"}))
    assert exc.value.status_code == 403
