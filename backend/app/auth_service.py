
import os
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError


bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def get_jwks_client():
    """Create a cached client for Supabase's public signing keys."""

    supabase_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")

    if not supabase_url:
        raise RuntimeError("SUPABASE_URL is not configured.")

    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"

    return PyJWKClient(jwks_url, cache_keys=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Validate a Supabase access token and return its claims."""

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
            options={
                "require": ["exp", "sub", "aud"],
            },
        )

        if not payload.get("sub"):
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token.",
            )

        return payload

    except HTTPException:
        raise
    except (PyJWTError, Exception) as exc:
        # Invalid, expired, or unverifiable tokens must not be accepted.
        if isinstance(exc, HTTPException):
            raise

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
