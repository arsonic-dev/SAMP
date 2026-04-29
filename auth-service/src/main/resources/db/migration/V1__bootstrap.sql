CREATE TABLE IF NOT EXISTS bootstrap_marker (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO bootstrap_marker (service_name)
VALUES ('auth-service')
ON CONFLICT (service_name) DO NOTHING;
