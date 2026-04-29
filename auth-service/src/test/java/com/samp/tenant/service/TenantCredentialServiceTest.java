package com.samp.tenant.service;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TenantCredentialServiceTest {

    private final TenantCredentialService tenantCredentialService = new TenantCredentialService();

    @Test
    void shouldGenerateClientIdWithExpectedPrefix() {
        String clientId = tenantCredentialService.generateClientId();

        assertTrue(clientId.startsWith("samp_"));
        assertTrue(clientId.length() > "samp_".length());
    }

    @Test
    void shouldGenerateDistinctSecrets() {
        String first = tenantCredentialService.generateClientSecret();
        String second = tenantCredentialService.generateClientSecret();

        assertNotEquals(first, second);
    }
}
