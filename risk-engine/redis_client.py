import json
import os
from dataclasses import dataclass
from typing import Any

from redis.asyncio import Redis


@dataclass(frozen=True)
class RedisSettings:
    app_env: str
    host: str
    port: int
    db: int
    password: str | None

    @classmethod
    def from_env(cls) -> "RedisSettings":
        return cls(
            app_env=os.getenv("APP_ENV", "local"),
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            db=int(os.getenv("REDIS_DB", "0")),
            password=os.getenv("REDIS_PASSWORD"),
        )


class RedisClient:
    def __init__(self, settings: RedisSettings):
        self.settings = settings
        self._client: Redis | None = None

    async def connect(self) -> None:
        self._client = Redis(
            host=self.settings.host,
            port=self.settings.port,
            db=self.settings.db,
            password=self.settings.password,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        await self._client.ping()

    async def ping(self) -> bool:
        if self._client is None:
            return False
        return bool(await self._client.ping())

    async def get(self, key: str) -> str | None:
        return await self._require_client().get(key)

    async def set(self, key: str, value: str, ttl_seconds: int | None = None) -> None:
        await self._require_client().set(key, value, ex=ttl_seconds)

    async def get_json(self, key: str) -> dict[str, Any] | None:
        raw_value = await self.get(key)
        return None if raw_value is None else json.loads(raw_value)

    async def set_json(self, key: str, value: dict[str, Any], ttl_seconds: int | None = None) -> None:
        await self.set(key, json.dumps(value), ttl_seconds)

    async def incr_with_ttl(self, key: str, ttl_seconds: int) -> int:
        client = self._require_client()
        current_value = await client.incr(key)
        if current_value == 1:
            await client.expire(key, ttl_seconds)
        return int(current_value)

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()

    def _require_client(self) -> Redis:
        if self._client is None:
            raise RuntimeError("Redis client has not been initialized")
        return self._client
