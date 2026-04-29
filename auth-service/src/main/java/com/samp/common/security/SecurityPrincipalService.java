package com.samp.common.security;

import java.util.UUID;

import com.samp.auth.service.JwtTokenService.TokenClaims;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SecurityPrincipalService {

    public AuthenticatedTenantContext requireCurrent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof TokenClaims claims)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated access token is required");
        }

        return new AuthenticatedTenantContext(
            UUID.fromString(claims.subject()),
            claims.tenantId(),
            claims.email()
        );
    }
}
