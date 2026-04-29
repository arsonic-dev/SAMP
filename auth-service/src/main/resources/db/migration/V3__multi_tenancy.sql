CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    client_id VARCHAR(100) NOT NULL,
    client_secret_hash VARCHAR(100) NOT NULL,
    allowed_scopes TEXT NOT NULL DEFAULT '[]',
    redirect_uris TEXT NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenants_client_id UNIQUE (client_id)
);

INSERT INTO tenants (
    id,
    name,
    client_id,
    client_secret_hash,
    allowed_scopes,
    redirect_uris,
    active
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Legacy Default Tenant',
    'legacy-default',
    'migration-backfill-only',
    '["openid","profile"]',
    '["http://localhost/legacy"]',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

UPDATE users
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

ALTER TABLE users
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS uq_users_email;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS fk_users_tenant;

ALTER TABLE users
    ADD CONSTRAINT fk_users_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'uq_users_tenant_email'
    ) THEN
        CREATE UNIQUE INDEX uq_users_tenant_email ON users (tenant_id, email);
    END IF;
END $$;

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

UPDATE refresh_tokens rt
SET tenant_id = u.tenant_id
FROM users u
WHERE rt.user_id = u.id
  AND rt.tenant_id IS NULL;

ALTER TABLE refresh_tokens
    ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE refresh_tokens
    DROP CONSTRAINT IF EXISTS fk_refresh_tokens_tenant;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_tenant_id
    ON refresh_tokens (tenant_id);
