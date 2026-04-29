package com.samp.tenant.service;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.samp.tenant.TenantModels.TenantRegistrationRequest;
import com.samp.tenant.TenantModels.TenantRegistrationResponse;
import com.samp.tenant.domain.Tenant;
import com.samp.tenant.repository.TenantRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TenantService {

    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };

    private final TenantRepository tenantRepository;
    private final TenantCredentialService tenantCredentialService;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public TenantService(
        TenantRepository tenantRepository,
        TenantCredentialService tenantCredentialService,
        PasswordEncoder passwordEncoder,
        ObjectMapper objectMapper
    ) {
        this.tenantRepository = tenantRepository;
        this.tenantCredentialService = tenantCredentialService;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public TenantRegistrationResponse registerTenant(TenantRegistrationRequest request) {
        String clientId = uniqueClientId();
        String clientSecret = tenantCredentialService.generateClientSecret();

        Tenant tenant = new Tenant();
        tenant.setName(request.name().trim());
        tenant.setClientId(clientId);
        tenant.setClientSecretHash(passwordEncoder.encode(clientSecret));
        tenant.setAllowedScopes(writeList(request.allowedScopes()));
        tenant.setRedirectUris(writeList(request.redirectUris()));
        tenant.setActive(true);

        Tenant savedTenant = tenantRepository.save(tenant);
        return new TenantRegistrationResponse(
            savedTenant.getId(),
            savedTenant.getName(),
            savedTenant.getClientId(),
            clientSecret,
            readStringList(savedTenant.getAllowedScopes()),
            readStringList(savedTenant.getRedirectUris()),
            savedTenant.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public Tenant requireActiveTenant(UUID tenantId) {
        return tenantRepository.findByIdAndActiveTrue(tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant was not found"));
    }

    @Transactional(readOnly = true)
    public List<String> readStringList(String rawValue) {
        try {
            return objectMapper.readValue(rawValue, STRING_LIST);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to parse stored tenant metadata", exception);
        }
    }

    private String uniqueClientId() {
        String clientId = tenantCredentialService.generateClientId();
        while (tenantRepository.existsByClientId(clientId)) {
            clientId = tenantCredentialService.generateClientId();
        }
        return clientId;
    }

    private String writeList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values.stream().map(String::trim).toList());
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to serialize tenant metadata", exception);
        }
    }
}
