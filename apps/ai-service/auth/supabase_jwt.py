"""
Supabase JWT verification with asymmetric (ES256) support via JWKS.

Architecture:
  1. Read JWT header WITHOUT verification → extract kid + alg
  2. Fetch Supabase JWKS from {SUPABASE_URL}/auth/v1/.well-known/jwks.json
  3. Resolve public key by matching kid
  4. Verify signature using the resolved public JWK
  5. JWKS is cached (default 1 hour) with automatic refresh on unknown kid

Accepts:
  - ES256 (ECDSA P-256) — Supabase current default
  - HS256 (HMAC) — legacy fallback via SUPABASE_JWT_SECRET (optional)

Algorithm restriction:
  Only ES256 and HS256 are accepted. Other algorithms (RS256, PS256, none, etc.)
  are rejected even if the JWT header claims them. This prevents algorithm
  confusion attacks.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from config import settings

from .jwks_client import JWKSClient, get_jwks_client

logger = logging.getLogger(__name__)

# ── Accepted algorithms (explicitly restrict) ────────────────────────────
ACCEPTED_ALGORITHMS = ("ES256", "HS256")

# ── JWKS client (module-level singleton, lazily initialized) ─────────────
_jwks_client: JWKSClient | None = None


def _get_jwks_client() -> JWKSClient | None:
    """Get or create the JWKS client singleton."""
    global _jwks_client
    if _jwks_client is None and settings.supabase_url:
        jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = get_jwks_client(
            jwks_url=jwks_url,
            cache_ttl=settings.jwks_cache_ttl_seconds,
        )
    return _jwks_client


def _reset_jwks_client() -> None:
    """Reset the JWKS client (for testing)."""
    global _jwks_client
    if _jwks_client is not None:
        _jwks_client.clear_cache()
    _jwks_client = None


def _decode_with_jwks(token: str) -> dict[str, Any]:
    """
    Decode a JWT using JWKS-based asymmetric verification.

    Flow:
      1. Read header (no verification) → kid, alg
      2. Reject unsupported algorithms immediately
      3. Resolve public key from JWKS by kid
      4. Verify signature + standard claims (exp, iat, iss, etc.)
    """
    # Step 1: Read header without verification
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise ValueError(f"Malformed JWT header: {e}") from e

    kid = header.get("kid")
    alg = header.get("alg")

    if not alg:
        raise ValueError("JWT header missing 'alg' claim")

    # Step 2: Reject unsupported algorithms
    if alg not in ACCEPTED_ALGORITHMS:
        raise ValueError(
            f"Unsupported algorithm '{alg}'. "
            f"Accepted algorithms: {ACCEPTED_ALGORITHMS}"
        )

    # Step 3: For ES256, use JWKS client
    if alg == "ES256":
        if not kid:
            raise ValueError("ES256 JWT header missing 'kid' claim")

        client = _get_jwks_client()
        if client is None:
            raise ValueError(
                "ES256 token received but SUPABASE_URL not configured. "
                "Cannot fetch JWKS for verification."
            )

        signing_key = client.get_signing_key(kid, alg)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
        return payload

    # Step 4: For HS256, use legacy shared secret
    if alg == "HS256":
        secret = settings.supabase_jwt_secret
        if not secret:
            raise ValueError(
                "HS256 token received but SUPABASE_JWT_SECRET not configured. "
                "Cannot verify legacy shared-secret token."
            )
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload

    # Should not reach here due to ACCEPTED_ALGORITHMS check above
    raise ValueError(f"Unhandled algorithm: {alg}")


def _decode_with_shared_secret(token: str) -> dict[str, Any]:
    """Fallback: decode using legacy HS256 shared secret (if configured)."""
    secret = settings.supabase_jwt_secret
    if not secret:
        raise ValueError("SUPABASE_JWT_SECRET not configured")
    return jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )


# ── FastAPI dependencies ─────────────────────────────────────────────────

security = HTTPBearer(auto_error=False)


def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """
    FastAPI dependency. Returns the decoded JWT payload.
    Raises 401 if token is missing or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
        )

    token = credentials.credentials
    try:
        payload = _decode_with_jwks(token)
        return payload
    except (JWTError, ValueError) as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


def optional_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """Like verify_supabase_token but returns None instead of raising for public endpoints."""
    if not credentials:
        return None
    try:
        return _decode_with_jwks(credentials.credentials)
    except (JWTError, ValueError):
        return None


def require_lgu_role(token: dict = Depends(verify_supabase_token)) -> dict:
    """Require the user to be officer staff (LGU / analyst / admin)."""
    role = token.get("user_metadata", {}).get("role", "citizen")
    if role not in ("lgu", "lgu_officer", "admin", "super_admin", "analyst"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="LGU officer access required",
        )
    return token


def require_super_admin(token: dict = Depends(verify_supabase_token)) -> dict:
    """Require the user to have role = super_admin. Used for user/role management."""
    role = token.get("user_metadata", {}).get("role", "citizen")
    if role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )
    return token
