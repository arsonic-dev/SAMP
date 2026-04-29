package com.samp.audit.service;

public record RequestMetadata(
    String ipAddress,
    String deviceId,
    String userAgent
) {
}
