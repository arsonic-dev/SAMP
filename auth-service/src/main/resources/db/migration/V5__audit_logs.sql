CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    tenant_id UUID,
    resource VARCHAR(150),
    action VARCHAR(100),
    decision VARCHAR(40) NOT NULL,
    risk_score DOUBLE PRECISION,
    ip VARCHAR(100),
    device_id VARCHAR(150),
    reason VARCHAR(300),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id
    ON audit_logs (tenant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON audit_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
    ON audit_logs (timestamp DESC);
