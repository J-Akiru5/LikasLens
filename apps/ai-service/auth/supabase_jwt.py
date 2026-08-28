"""
Supabase JWT verification.
Replaces Laravel Sanctum completely.
The frontend sends the Supabase access token in Authorization: Bearer <token>.
We verify it against the Supabase JWT secret.
"""

import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

security = HTTPBearer(auto_error=False)


def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """
    FastAPI dependency. Returns the decoded JWT payload.
    Raises 401 if token is missing or invalid.
    """
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET not configured",
        )

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required",
        )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


def optional_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """Like verify_supabase_token but returns None instead of raising for public endpoints."""
    if not credentials or not SUPABASE_JWT_SECRET:
        return None
    try:
        return jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError:
        return None


def require_lgu_role(token: dict = Depends(verify_supabase_token)) -> dict:
    """Require the user to have role = lgu_officer or admin."""
    role = token.get("user_metadata", {}).get("role", "citizen")
    if role not in ("lgu_officer", "admin", "super_admin", "analyst"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="LGU officer access required",
        )
    return token
