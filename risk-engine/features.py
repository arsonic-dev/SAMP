from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


def _parse_request_time(raw_value: str | None) -> datetime:
    if not raw_value:
        return datetime.now(timezone.utc)

    parsed = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


@dataclass
class FeatureExtractor:
    redis_client: Any
    velocity_threshold: int = 10

    async def extract(self, payload: dict) -> dict:
        user_id = str(payload.get("user_id"))
        request_time = _parse_request_time(payload.get("request_time"))
        profile_key = f"profile:{user_id}"
        velocity_key = f"ratelimit:{user_id}"

        profile = await self.redis_client.get_json(profile_key) or {
            "last_ip": None,
            "last_device": None,
            "hour_counts": {},
        }

        request_velocity = await self.redis_client.incr_with_ttl(velocity_key, 60)
        ip_address = payload.get("ip_address")
        device_fingerprint = payload.get("device_fingerprint")
        hour = request_time.hour

        ip_changed = bool(profile.get("last_ip")) and profile.get("last_ip") != ip_address
        device_changed = bool(profile.get("last_device")) and profile.get("last_device") != device_fingerprint

        hour_counts = profile.get("hour_counts", {})
        active_hours = {
            int(raw_hour)
            for raw_hour, count in hour_counts.items()
            if int(count) >= 2
        }
        time_anomaly = len(active_hours) >= 3 and hour not in active_hours
        velocity_spike = request_velocity > self.velocity_threshold

        reasons: list[str] = []
        if ip_changed:
            reasons.append("IP address changed from recent activity")
        if device_changed:
            reasons.append("Device fingerprint changed from recent activity")
        if time_anomaly:
            reasons.append("Request time is outside historical active hours")
        if velocity_spike:
            reasons.append("Request velocity exceeded the baseline threshold")

        hour_counts[str(hour)] = int(hour_counts.get(str(hour), 0)) + 1
        await self.redis_client.set_json(
            profile_key,
            {
                "last_ip": ip_address,
                "last_device": device_fingerprint,
                "hour_counts": hour_counts,
            },
            ttl_seconds=60 * 60 * 24 * 14,
        )

        return {
            "user_id": user_id,
            "tenant_id": str(payload.get("tenant_id")),
            "ip_address": ip_address,
            "device_fingerprint": device_fingerprint,
            "request_time": request_time.isoformat(),
            "request_hour": hour,
            "request_velocity": request_velocity,
            "ip_changed": int(ip_changed),
            "device_changed": int(device_changed),
            "time_anomaly": int(time_anomaly),
            "velocity_spike": int(velocity_spike),
            "reasons": reasons,
        }
