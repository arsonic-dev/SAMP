from dataclasses import dataclass, field

import numpy as np
from sklearn.ensemble import IsolationForest


def _baseline_samples(sample_count: int = 1000) -> np.ndarray:
    rng = np.random.default_rng(42)
    hours = rng.integers(8, 21, sample_count)
    velocity = rng.integers(1, 5, sample_count)
    ip_changed = rng.choice([0, 1], sample_count, p=[0.92, 0.08])
    device_changed = rng.choice([0, 1], sample_count, p=[0.94, 0.06])
    time_anomaly = rng.choice([0, 1], sample_count, p=[0.95, 0.05])
    velocity_spike = rng.choice([0, 1], sample_count, p=[0.97, 0.03])

    return np.column_stack(
        [
            hours / 23.0,
            velocity / 20.0,
            ip_changed,
            device_changed,
            time_anomaly,
            velocity_spike,
        ]
    )


@dataclass
class RiskModel:
    model_name: str = "isolation-forest"
    model: IsolationForest = field(init=False)
    training_size: int = field(default=0, init=False)

    def __post_init__(self) -> None:
        self.train()

    def train(self, sample_count: int = 1000) -> dict:
        training_data = _baseline_samples(sample_count)
        self.model = IsolationForest(
            n_estimators=200,
            contamination=0.08,
            random_state=42,
        )
        self.model.fit(training_data)
        self.training_size = len(training_data)
        return self.metadata()

    def score(self, features: dict) -> dict:
        vector = np.array(
            [
                features["request_hour"] / 23.0,
                min(features["request_velocity"], 20) / 20.0,
                features["ip_changed"],
                features["device_changed"],
                features["time_anomaly"],
                features["velocity_spike"],
            ]
        ).reshape(1, -1)

        anomaly_signal = -float(self.model.score_samples(vector)[0])
        risk_score = max(0.0, min(100.0, round((anomaly_signal + 0.6) * 62.5, 2)))

        if features["velocity_spike"]:
            risk_score = min(100.0, risk_score + 12.0)
        if features["time_anomaly"]:
            risk_score = min(100.0, risk_score + 10.0)
        if features["ip_changed"]:
            risk_score = min(100.0, risk_score + 8.0)
        if features["device_changed"]:
            risk_score = min(100.0, risk_score + 8.0)

        return {
            "risk_score": round(risk_score, 2),
            "risk_level": self._level(risk_score),
        }

    def metadata(self) -> dict:
        return {
            "model_name": self.model_name,
            "trained": True,
            "training_size": self.training_size,
        }

    def _level(self, risk_score: float) -> str:
        if risk_score > 70:
            return "HIGH"
        if risk_score >= 30:
            return "MEDIUM"
        return "LOW"
