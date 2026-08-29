"""
JWKS (JSON Web Key Set) client for Supabase asymmetric JWT verification.

Fetches and caches the Supabase project's public signing keys from:
  {SUPABASE_URL}/auth/v1/.well-known/jwks.json

Supports:
  - ES256 (ECDSA P-256) — current Supabase default
  - RS256 (RSA) — if Supabase ever rotates to RSA
  - Cache with configurable TTL
  - Automatic refresh on unknown kid (key rotation)
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Any

import httpx
from jose import JOSEError, jwk

logger = logging.getLogger(__name__)

# Thread lock for cache operations
_cache_lock = threading.Lock()


class JWKSClient:
    """
    Thread-safe JWKS client with TTL-based caching and rotation-aware refresh.

    Flow:
      1. Look up kid in cache
      2. If miss → fetch JWKS from Supabase, retry once
      3. If still miss → raise (unknown key, possible compromise)
    """

    def __init__(
        self,
        jwks_url: str,
        cache_ttl_seconds: int = 3600,
        timeout_seconds: float = 10.0,
    ):
        self.jwks_url = jwks_url
        self.cache_ttl = cache_ttl_seconds
        self.timeout = timeout_seconds

        # Cache state: {kid: jose.JWK}
        self._keys: dict[str, Any] = {}
        self._fetched_at: float = 0.0

    @property
    def _cache_expired(self) -> bool:
        return (time.monotonic() - self._fetched_at) > self.cache_ttl

    def _fetch_jwks(self) -> dict[str, Any]:
        """Fetch the JWKS from Supabase. Returns the raw JSON."""
        try:
            resp = httpx.get(
                self.jwks_url,
                timeout=self.timeout,
                headers={"Accept": "application/json"},
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as exc:
            logger.error("Failed to fetch JWKS from %s: %s", self.jwks_url, exc)
            raise

    def _load_keys_from_jwks(self, jwks_data: dict[str, Any]) -> dict[str, Any]:
        """
        Parse JWKS response into {kid: JWK} mapping.
        Only loads keys with algorithms we actually verify (ES256, RS256).
        """
        keys: dict[str, Any] = {}
        for key_data in jwks_data.get("keys", []):
            kid = key_data.get("kid")
            alg = key_data.get("alg", "")
            kty = key_data.get("kty", "")

            # Only load algorithms we explicitly support
            if alg not in ("ES256", "RS256"):
                logger.debug("Skipping unsupported key kid=%s alg=%s kty=%s", kid, alg, kty)
                continue

            if not kid:
                logger.warning("JWKS key missing kid, skipping: %s", key_data)
                continue

            try:
                keys[kid] = jwk.construct(key_data)
            except JOSEError as exc:
                logger.warning("Failed to construct JWK for kid=%s: %s", kid, exc)

        return keys

    def _refresh(self) -> None:
        """Fetch JWKS and update cache."""
        jwks_data = self._fetch_jwks()
        new_keys = self._load_keys_from_jwks(jwks_data)
        with _cache_lock:
            self._keys = new_keys
            self._fetched_at = time.monotonic()
        logger.info("JWKS refreshed: %d keys loaded (url=%s)", len(new_keys), self.jwks_url)

    def get_signing_key(self, kid: str, alg: str = "ES256") -> Any:
        """
        Resolve the signing key for a given kid and algorithm.

        Returns a jose JWK that can be used for signature verification.
        Raises ValueError if the key is not found after refresh.
        """
        # Check cache (fast path, no lock needed for reads of immutable references)
        if kid in self._keys and not self._cache_expired:
            return self._keys[kid]

        # Cache miss or expired → refresh outside lock
        self._refresh()

        if kid in self._keys:
            return self._keys[kid]

        # Key not found after refresh — could be rotation in progress or unknown kid
        # One more attempt after forced expiry
        logger.warning("kid=%s not found after JWKS refresh, retrying with forced fetch", kid)
        with _cache_lock:
            self._fetched_at = 0.0  # Force expiry
        self._refresh()

        if kid in self._keys:
            return self._keys[kid]

        available = list(self._keys.keys())
        raise ValueError(
            f"Unknown signing key kid={kid}. Available keys: {available}"
        )

    def clear_cache(self) -> None:
        """Clear the key cache. Useful for testing."""
        with _cache_lock:
            self._keys.clear()
            self._fetched_at = 0.0


def get_jwks_client(jwks_url: str, cache_ttl: int = 3600) -> JWKSClient:
    """Factory for creating a JWKSClient."""
    return JWKSClient(jwks_url=jwks_url, cache_ttl_seconds=cache_ttl)
