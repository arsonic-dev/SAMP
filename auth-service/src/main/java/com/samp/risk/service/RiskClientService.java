package com.samp.risk.service;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.samp.audit.service.RequestMetadata;
import com.samp.risk.config.RiskEngineProperties;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class RiskClientService {

    private final StringRedisTemplate redisTemplate;
    private final RiskEngineProperties riskEngineProperties;
    private final RestClient restClient;

    public RiskClientService(
        StringRedisTemplate redisTemplate,
        RiskEngineProperties riskEngineProperties,
        RestClient.Builder restClientBuilder
    ) {
        this.redisTemplate = redisTemplate;
        this.riskEngineProperties = riskEngineProperties;
        this.restClient = restClientBuilder.baseUrl(riskEngineProperties.getBaseUrl()).build();
    }

    public RiskAssessment resolveRisk(UUID tenantId, UUID userId, RequestMetadata metadata, OffsetDateTime requestTime) {
        String cacheKey = riskCacheKey(userId);
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            double score = Double.parseDouble(cached);
            return new RiskAssessment(score, level(score), java.util.List.of("redis-cache"), true);
        }

        RiskScoreResponse response;
        try {
            response = restClient.post()
                .uri("/score")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RiskScoreRequest(
                    userId,
                    metadata.ipAddress(),
                    metadata.deviceId() == null ? metadata.userAgent() : metadata.deviceId(),
                    requestTime,
                    tenantId
                ))
                .retrieve()
                .body(RiskScoreResponse.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Risk engine is unavailable", exception);
        }

        if (response == null || response.riskScore() == null) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Risk engine returned an invalid response");
        }

        redisTemplate.opsForValue().set(
            cacheKey,
            Double.toString(response.riskScore()),
            riskEngineProperties.getCacheTtl().toMillis(),
            TimeUnit.MILLISECONDS
        );
        return new RiskAssessment(response.riskScore(), response.riskLevel(), response.reasons(), false);
    }

    public boolean requiresStepUp(double riskScore) {
        return riskScore >= riskEngineProperties.getStepUpThreshold()
            && riskScore <= riskEngineProperties.getDenyThreshold();
    }

    public boolean shouldDeny(double riskScore) {
        return riskScore > riskEngineProperties.getDenyThreshold();
    }

    public String riskCacheKey(UUID userId) {
        return "risk:" + userId;
    }

    private String level(double score) {
        if (score > riskEngineProperties.getDenyThreshold()) {
            return "HIGH";
        }
        if (score >= riskEngineProperties.getStepUpThreshold()) {
            return "MEDIUM";
        }
        return "LOW";
    }

    public record RiskScoreRequest(
        @JsonProperty("user_id")
        UUID userId,
        @JsonProperty("ip_address")
        String ipAddress,
        @JsonProperty("device_fingerprint")
        String deviceFingerprint,
        @JsonProperty("request_time")
        OffsetDateTime requestTime,
        @JsonProperty("tenant_id")
        UUID tenantId
    ) {
    }

    public record RiskScoreResponse(
        @JsonProperty("risk_score")
        Double riskScore,
        @JsonProperty("risk_level")
        String riskLevel,
        java.util.List<String> reasons
    ) {
    }

    public record RiskAssessment(
        double riskScore,
        String riskLevel,
        java.util.List<String> reasons,
        boolean fromCache
    ) {
    }
}
