from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os

from fastapi import FastAPI
from pydantic import BaseModel, Field
import uvicorn

from features import FeatureExtractor
from model import RiskModel
from redis_client import RedisClient, RedisSettings


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = RedisSettings.from_env()
    redis_client = RedisClient(settings)
    await redis_client.connect()
    app.state.redis_client = redis_client
    app.state.feature_extractor = FeatureExtractor(redis_client)
    app.state.risk_model = RiskModel()
    try:
        yield
    finally:
        await redis_client.close()


app = FastAPI(title="SAMP Risk Engine", version="0.0.1", lifespan=lifespan)


from typing import Any
class ScoreRequest(BaseModel):
    user_id: str
    ip_address: str | None = None
    device_fingerprint: str | None = None
    request_time: Any = None
    tenant_id: str


class ScoreResponse(BaseModel):
    risk_score: float
    risk_level: str
    reasons: list[str] = Field(default_factory=list)


class TrainResponse(BaseModel):
    status: str
    metadata: dict


@app.get("/health")
async def health() -> dict:
    redis_client = app.state.redis_client
    redis_ok = await redis_client.ping()
    return {
        "service": "risk-engine",
        "environment": redis_client.settings.app_env,
        "status": "UP" if redis_ok else "DEGRADED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "redis": {
            "status": "UP" if redis_ok else "DOWN",
            "host": redis_client.settings.host,
            "port": redis_client.settings.port,
        },
    }


from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print(f"Validation error for body: {body}")
    return JSONResponse(status_code=422, content={"detail": exc.errors(), "body": body.decode()})

@app.post("/score", response_model=ScoreResponse)
async def score(request: ScoreRequest) -> ScoreResponse:
    features = await app.state.feature_extractor.extract(request.model_dump())
    scored = app.state.risk_model.score(features)

    reasons = list(features["reasons"])
    if not reasons:
        reasons.append("No significant anomaly signals detected")

    await app.state.redis_client.set(
        f"risk:{request.user_id}",
        str(scored["risk_score"]),
        ttl_seconds=300,
    )

    return ScoreResponse(
        risk_score=float(scored["risk_score"]),
        risk_level=str(scored["risk_level"]),
        reasons=reasons,
    )


@app.post("/train", response_model=TrainResponse)
async def train() -> TrainResponse:
    metadata = app.state.risk_model.train()
    return TrainResponse(status="retrained", metadata=metadata)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("RISK_ENGINE_PORT", "8001")),
        reload=os.getenv("APP_ENV", "local").lower() == "local",
    )
