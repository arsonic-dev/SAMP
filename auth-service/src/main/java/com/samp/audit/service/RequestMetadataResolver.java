package com.samp.audit.service;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class RequestMetadataResolver {

    public RequestMetadata current() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return new RequestMetadata(null, null, null);
        }

        HttpServletRequest request = attributes.getRequest();
        String forwardedFor = request.getHeader("X-Forwarded-For");
        String ipAddress = forwardedFor != null && !forwardedFor.isBlank()
            ? forwardedFor.split(",")[0].trim()
            : request.getRemoteAddr();

        return new RequestMetadata(
            ipAddress,
            request.getHeader("X-Device-Id"),
            request.getHeader("User-Agent")
        );
    }
}
