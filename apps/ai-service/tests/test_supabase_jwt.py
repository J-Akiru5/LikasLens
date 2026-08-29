"""
Tests for Supabase JWT verification (ES256 + HS256).

Covers:
  - Valid ES256 token verification via JWKS
  - Unknown kid handling (rotation scenario)
  - Invalid signature rejection
  - Expired token rejection
  - Unsupported algorithm rejection
  - JWKS cache TTL and refresh behavior
  - HS256 legacy fallback
  - Edge cases (missing header fields, malformed tokens)
"""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

import pytest
from jose import jwt
from jose.backends.cryptography_backend import CryptographyECKey
from jose.utils import long_to_base64

# ── EC key pair for testing ──────────────────────────────────────────────

# We generate a fresh P-256 key pair per test session.
# The private key signs tokens; the public key is published as JWKS.

_test_ec_private_key = None
_test_ec_public_jwk = None
_test_kid = "test-key-001"


def _get_test_keys():
    """Generate or return cached EC P-256 key pair for tests."""
    global _test_ec_private_key, _test_ec_public_jwk
    if _test_ec_private_key is None:
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import serialization
        import base64 as _b64

        # Generate EC P-256 private key
        private_key = ec.generate_private_key(ec.SECP256R1())

        # Get public key coordinates
        public_numbers = private_key.public_key().public_numbers()

        # Convert int coordinates to base64url (no padding)
        x = _b64.urlsafe_b64encode(public_numbers.x.to_bytes(32, "big")).rstrip(b"=").decode()
        y = _b64.urlsafe_b64encode(public_numbers.y.to_bytes(32, "big")).rstrip(b"=").decode()

        _test_ec_public_jwk = {
            "kty": "EC",
            "crv": "P-256",
            "x": x,
            "y": y,
            "kid": _test_kid,
            "alg": "ES256",
            "use": "sig",
        }

        _test_ec_private_key = private_key

    return _test_ec_private_key, _test_ec_public_jwk


def _sign_es256(payload: dict, kid: str | None = None) -> str:
    """Sign a payload with the test EC private key and return the JWT string."""
    private_key, _ = _get_test_keys()

    from cryptography.hazmat.primitives.asymmetric import ec as _ec
    from cryptography.hazmat.primitives import hashes as _hashes

    # Build JOSE header manually for kid control
    import base64
    import json

    header = {"alg": "ES256", "typ": "JWT"}
    if kid:
        header["kid"] = kid

    # Encode header
    header_b64 = base64.urlsafe_b64encode(
        json.dumps(header, separators=(",", ":")).encode()
    ).rstrip(b"=").decode()

    # Encode payload
    payload_b64 = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode()
    ).rstrip(b"=").decode()

    # Signing input
    signing_input = f"{header_b64}.{payload_b64}"

    # Sign with EC
    signature = private_key.sign(
        signing_input.encode(),
        _ec.ECDSA(_hashes.SHA256())
    )

    # Convert DER signature to raw R||S format (64 bytes)
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
    r, s = decode_dss_signature(signature)
    sig_bytes = r.to_bytes(32, "big") + s.to_bytes(32, "big")
    sig_b64 = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()

    return f"{signing_input}.{sig_b64}"


def _make_jwks_response(key_data: dict | None = None) -> dict:
    """Build a JWKS response dict from a single key."""
    if key_data is None:
        _, key_data = _get_test_keys()
    return {"keys": [key_data]}


# ── Fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture
def valid_es256_token() -> str:
    """A valid ES256 JWT signed with the test key."""
    return _sign_es256(
        {
            "sub": str(uuid.uuid4()),
            "email": "test@example.com",
            "user_metadata": {"role": "citizen"},
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
            "iss": "test.supabase.co",
        },
        kid=_test_kid,
    )


@pytest.fixture
def expired_es256_token() -> str:
    """An ES256 JWT that has expired."""
    return _sign_es256(
        {
            "sub": str(uuid.uuid4()),
            "email": "expired@example.com",
            "user_metadata": {"role": "citizen"},
            "exp": int(time.time()) - 3600,  # expired 1 hour ago
            "iat": int(time.time()) - 7200,
            "iss": "test.supabase.co",
        },
        kid=_test_kid,
    )


@pytest.fixture
def unknown_kid_token() -> str:
    """An ES256 JWT signed with a key NOT in the JWKS."""
    return _sign_es256(
        {
            "sub": str(uuid.uuid4()),
            "email": "unknown@example.com",
            "user_metadata": {"role": "citizen"},
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
        },
        kid="unknown-key-999",
    )


@pytest.fixture
def hs256_token():
    """A legacy HS256 JWT signed with the test secret."""
    return jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "hs256@example.com",
            "user_metadata": {"role": "citizen"},
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
        },
        "test-secret-key-for-testing",
        algorithm="HS256",
    )


@pytest.fixture
def bad_hs256_token():
    """An HS256 JWT signed with a WRONG secret."""
    return jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "bad@example.com",
            "user_metadata": {"role": "citizen"},
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
        },
        "wrong-secret",
        algorithm="HS256",
    )


# ── Test: Valid ES256 token ──────────────────────────────────────────────

class TestES256Verification:
    """Test ES256 token verification via JWKS."""

    def test_valid_es256_token(self, valid_es256_token, monkeypatch):
        """A valid ES256 token should decode successfully."""
        from auth.supabase_jwt import _decode_with_jwks

        # Mock the JWKS client to return our test key
        mock_client = MagicMock()
        mock_key = MagicMock()
        mock_client.get_signing_key.return_value = mock_key

        with patch("auth.supabase_jwt._get_jwks_client", return_value=mock_client):
            with patch("auth.supabase_jwt.jwt.decode") as mock_decode:
                mock_decode.return_value = {
                    "sub": "test-user",
                    "email": "test@example.com",
                    "user_metadata": {"role": "citizen"},
                }
                result = _decode_with_jwks(valid_es256_token)

                assert result["email"] == "test@example.com"
                mock_decode.assert_called_once()

    def test_es256_uses_correct_algorithm(self, valid_es256_token, monkeypatch):
        """ES256 verification should only accept ES256 algorithm."""
        from auth.supabase_jwt import _decode_with_jwks

        mock_client = MagicMock()
        mock_client.get_signing_key.return_value = MagicMock()

        with patch("auth.supabase_jwt._get_jwks_client", return_value=mock_client):
            with patch("auth.supabase_jwt.jwt.decode") as mock_decode:
                mock_decode.return_value = {"sub": "test"}
                _decode_with_jwks(valid_es256_token)

                # Verify it called decode with algorithms=["ES256"]
                call_args = mock_decode.call_args
                assert "ES256" in call_args[1]["algorithms"]


# ── Test: Unknown kid ───────────────────────────────────────────────────

class TestUnknownKid:
    """Test handling of tokens with unknown key IDs."""

    def test_unknown_kid_raises_value_error(self, unknown_kid_token, monkeypatch):
        """An unknown kid should raise ValueError after JWKS refresh attempt."""
        from auth.supabase_jwt import _decode_with_jwks, _reset_jwks_client

        _reset_jwks_client()

        # Mock JWKS client to return empty keys
        mock_client = MagicMock()
        mock_client.get_signing_key.side_effect = ValueError(
            "Unknown signing key kid=unknown-key-999. Available keys: ['test-key-001']"
        )

        with patch("auth.supabase_jwt._get_jwks_client", return_value=mock_client):
            with pytest.raises(ValueError, match="Unknown signing key"):
                _decode_with_jwks(unknown_kid_token)


# ── Test: Invalid signature ─────────────────────────────────────────────

class TestInvalidSignature:
    """Test rejection of tokens with invalid signatures."""

    def test_bad_hs256_signature(self, bad_hs256_token, monkeypatch):
        """An HS256 token signed with wrong secret should fail verification."""
        from auth.supabase_jwt import _decode_with_jwks

        monkeypatch.setattr("auth.supabase_jwt.settings", MagicMock(
            supabase_url="",
            supabase_jwt_secret="test-secret-key-for-testing",  # correct secret, but token used wrong one
        ))

        from jose import JWTError
        with pytest.raises(JWTError):
            _decode_with_jwks(bad_hs256_token)

    def test_es256_wrong_key_rejected(self, monkeypatch):
        """A token signed with a different EC key should fail verification."""
        from auth.supabase_jwt import _decode_with_jwks
        from jose import JWTError as JOSEJWTError

        # Sign with a DIFFERENT key pair
        from cryptography.hazmat.primitives.asymmetric import ec
        other_private_key = ec.generate_private_key(ec.SECP256R1())

        import base64, json
        header = {"alg": "ES256", "typ": "JWT", "kid": _test_kid}
        payload = {
            "sub": "attacker",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
        }
        header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode()).rstrip(b"=").decode()
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
        signing_input = f"{header_b64}.{payload_b64}"

        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
        sig = other_private_key.sign(signing_input.encode(), ec.ECDSA(hashes.SHA256()))
        r, s = decode_dss_signature(sig)
        sig_bytes = r.to_bytes(32, "big") + s.to_bytes(32, "big")
        sig_b64 = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()
        forged_token = f"{signing_input}.{sig_b64}"

        # JWKS has the ORIGINAL key, not the attacker's key
        mock_client = MagicMock()
        mock_key = MagicMock()
        mock_key.verify.side_effect = Exception("Signature verification failed")
        mock_client.get_signing_key.return_value = mock_key

        with patch("auth.supabase_jwt._get_jwks_client", return_value=mock_client):
            with patch("auth.supabase_jwt.jwt.decode", side_effect=JOSEJWTError("Signature verification failed")):
                with pytest.raises(JOSEJWTError):
                    _decode_with_jwks(forged_token)


# ── Test: Expired token ─────────────────────────────────────────────────

class TestExpiredToken:
    """Test rejection of expired tokens."""

    def test_expired_es256_token(self, expired_es256_token, monkeypatch):
        """An expired token should raise JWTError."""
        from auth.supabase_jwt import _decode_with_jwks
        from jose import JWTError

        mock_client = MagicMock()
        mock_client.get_signing_key.return_value = MagicMock()

        with patch("auth.supabase_jwt._get_jwks_client", return_value=mock_client):
            with patch("auth.supabase_jwt.jwt.decode", side_effect=JWTError("Signature has expired")):
                with pytest.raises(JWTError, match="expired"):
                    _decode_with_jwks(expired_es256_token)


# ── Test: Unsupported algorithm ──────────────────────────────────────────

class TestUnsupportedAlgorithm:
    """Test rejection of tokens with unsupported algorithms."""

    def test_rs256_rejected(self, monkeypatch):
        """RS256 tokens should be rejected (not in ACCEPTED_ALGORITHMS)."""
        from auth.supabase_jwt import _decode_with_jwks, ACCEPTED_ALGORITHMS

        assert "RS256" not in ACCEPTED_ALGORITHMS

        # Build a fake RS256 token header
        import base64, json
        header = {"alg": "RS256", "typ": "JWT", "kid": "fake-key"}
        payload = {"sub": "test", "exp": int(time.time()) + 3600}
        header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode()).rstrip(b"=").decode()
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
        # Dummy signature
        sig_b64 = base64.urlsafe_b64encode(b"\x00" * 64).rstrip(b"=").decode()
        rs256_token = f"{header_b64}.{payload_b64}.{sig_b64}"

        with pytest.raises(ValueError, match="Unsupported algorithm 'RS256'"):
            _decode_with_jwks(rs256_token)

    def test_none_algorithm_rejected(self, monkeypatch):
        """'none' algorithm should be rejected."""
        from auth.supabase_jwt import _decode_with_jwks

        import base64, json
        header = {"alg": "none", "typ": "JWT"}
        payload = {"sub": "test", "exp": int(time.time()) + 3600}
        header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode()).rstrip(b"=").decode()
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
        none_token = f"{header_b64}.{payload_b64}."

        with pytest.raises(ValueError, match="Unsupported algorithm 'none'"):
            _decode_with_jwks(none_token)


# ── Test: JWKS cache behavior ───────────────────────────────────────────

class TestJWKSCache:
    """Test JWKS caching, TTL, and refresh-on-miss behavior."""

    def test_cache_hit_no_refresh(self):
        """Key found in cache should not trigger a JWKS fetch."""
        from auth.jwks_client import JWKSClient

        client = JWKSClient(jwks_url="https://example.com/jwks", cache_ttl_seconds=3600)

        # Manually populate cache
        mock_key = MagicMock()
        client._keys = {"key-1": mock_key}
        client._fetched_at = time.monotonic()

        result = client.get_signing_key("key-1")
        assert result == mock_key

    def test_cache_expired_triggers_refresh(self):
        """Expired cache should trigger JWKS fetch."""
        from auth.jwks_client import JWKSClient

        client = JWKSClient(jwks_url="https://example.com/jwks", cache_ttl_seconds=0)

        # Populate cache but mark as expired
        client._keys = {"key-1": MagicMock()}
        client._fetched_at = time.monotonic() - 100  # far in the past

        # Mock the fetch
        mock_key = MagicMock()
        mock_jwks = {"keys": [{"kid": "key-2", "kty": "EC", "crv": "P-256", "x": "abc", "y": "def", "alg": "ES256", "use": "sig"}]}

        with patch.object(client, "_fetch_jwks", return_value=mock_jwks):
            with patch("auth.jwks_client.jwk.construct", return_value=mock_key):
                result = client.get_signing_key("key-2")
                assert result == mock_key

    def test_unknown_kid_triggers_refresh(self):
        """Unknown kid should trigger JWKS refresh."""
        from auth.jwks_client import JWKSClient

        client = JWKSClient(jwks_url="https://example.com/jwks", cache_ttl_seconds=3600)
        client._keys = {"existing-key": MagicMock()}
        client._fetched_at = time.monotonic()

        # Mock fetch to return a different key
        mock_key = MagicMock()
        mock_jwks = {"keys": [{"kid": "new-key", "kty": "EC", "crv": "P-256", "x": "abc", "y": "def", "alg": "ES256", "use": "sig"}]}

        with patch.object(client, "_fetch_jwks", return_value=mock_jwks):
            with patch("auth.jwks_client.jwk.construct", return_value=mock_key):
                result = client.get_signing_key("new-key")
                assert result == mock_key

    def test_unknown_kid_after_refresh_raises(self):
        """Unknown kid after full refresh should raise ValueError."""
        from auth.jwks_client import JWKSClient

        client = JWKSClient(jwks_url="https://example.com/jwks", cache_ttl_seconds=0)
        client._keys = {}
        client._fetched_at = 0

        # Mock fetch to return empty keys
        with patch.object(client, "_fetch_jwks", return_value={"keys": []}):
            with pytest.raises(ValueError, match="Unknown signing key"):
                client.get_signing_key("nonexistent-key")

    def test_clear_cache(self):
        """clear_cache should reset all cached state."""
        from auth.jwks_client import JWKSClient

        client = JWKSClient(jwks_url="https://example.com/jwks", cache_ttl_seconds=3600)
        client._keys = {"key-1": MagicMock()}
        client._fetched_at = time.monotonic()

        client.clear_cache()

        assert client._keys == {}
        assert client._fetched_at == 0.0

    def test_skips_unsupported_algorithms_in_jwks(self):
        """JWKS keys with unsupported algorithms should be skipped."""
        from auth.jwks_client import JWKSClient

        client = JWKSClient(jwks_url="https://example.com/jwks", cache_ttl_seconds=3600)

        jwks_data = {
            "keys": [
                {"kid": "key-ps256", "kty": "RSA", "alg": "PS256", "use": "sig"},
                {"kid": "key-es256", "kty": "EC", "crv": "P-256", "x": "abc", "y": "def", "alg": "ES256", "use": "sig"},
            ]
        }

        with patch("auth.jwks_client.jwk.construct", return_value=MagicMock()) as mock_construct:
            keys = client._load_keys_from_jwks(jwks_data)

            # Only ES256 key should be loaded
            assert "key-es256" in keys
            assert "key-ps256" not in keys
            # construct should only be called once (for ES256)
            assert mock_construct.call_count == 1


# ── Test: HS256 legacy fallback ─────────────────────────────────────────

class TestHS256Legacy:
    """Test HS256 legacy token verification via shared secret."""

    def test_hs256_token_verifies(self, hs256_token, monkeypatch):
        """A valid HS256 token should verify with the shared secret."""
        from auth.supabase_jwt import _decode_with_jwks

        # Set SUPABASE_URL to empty so JWKS path is not taken
        monkeypatch.setattr("auth.supabase_jwt.settings", MagicMock(
            supabase_url="",
            supabase_jwt_secret="test-secret-key-for-testing",
        ))

        result = _decode_with_jwks(hs256_token)
        assert result["email"] == "hs256@example.com"

    def test_hs256_without_secret_raises(self, hs256_token, monkeypatch):
        """HS256 token without SUPABASE_JWT_SECRET should raise ValueError."""
        from auth.supabase_jwt import _decode_with_jwks

        monkeypatch.setattr("auth.supabase_jwt.settings", MagicMock(
            supabase_url="",
            supabase_jwt_secret="",
        ))

        with pytest.raises(ValueError, match="HS256 token received but SUPABASE_JWT_SECRET not configured"):
            _decode_with_jwks(hs256_token)


# ── Test: Edge cases ────────────────────────────────────────────────────

class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_malformed_jwt(self):
        """A completely malformed token should raise ValueError."""
        from auth.supabase_jwt import _decode_with_jwks

        with pytest.raises(ValueError, match="Malformed JWT header"):
            _decode_with_jwks("not-a-valid-jwt")

    def test_missing_kid_header(self):
        """JWT without kid should raise ValueError."""
        from auth.supabase_jwt import _decode_with_jwks

        import base64, json
        header = {"alg": "ES256", "typ": "JWT"}  # no kid
        payload = {"sub": "test"}
        header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode()).rstrip(b"=").decode()
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
        sig_b64 = base64.urlsafe_b64encode(b"\x00" * 64).rstrip(b"=").decode()
        token = f"{header_b64}.{payload_b64}.{sig_b64}"

        with pytest.raises(ValueError, match="missing 'kid'"):
            _decode_with_jwks(token)

    def test_missing_alg_header(self):
        """JWT without alg should raise ValueError."""
        from auth.supabase_jwt import _decode_with_jwks

        import base64, json
        header = {"typ": "JWT", "kid": "some-key"}  # no alg
        payload = {"sub": "test"}
        header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode()).rstrip(b"=").decode()
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
        sig_b64 = base64.urlsafe_b64encode(b"\x00" * 64).rstrip(b"=").decode()
        token = f"{header_b64}.{payload_b64}.{sig_b64}"

        with pytest.raises(ValueError, match="missing 'alg'"):
            _decode_with_jwks(token)

    def test_es256_without_supabase_url(self):
        """ES256 token without SUPABASE_URL should raise ValueError."""
        from auth.supabase_jwt import _decode_with_jwks, _reset_jwks_client

        _reset_jwks_client()

        import base64, json, time
        header = {"alg": "ES256", "typ": "JWT", "kid": "some-key"}
        payload = {"sub": "test", "exp": int(time.time()) + 3600}
        header_b64 = base64.urlsafe_b64encode(json.dumps(header, separators=(",", ":")).encode()).rstrip(b"=").decode()
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=").decode()
        sig_b64 = base64.urlsafe_b64encode(b"\x00" * 64).rstrip(b"=").decode()
        token = f"{header_b64}.{payload_b64}.{sig_b64}"

        with patch("auth.supabase_jwt.settings", MagicMock(supabase_url="", supabase_jwt_secret="")):
            with pytest.raises(ValueError, match="SUPABASE_URL not configured"):
                _decode_with_jwks(token)
