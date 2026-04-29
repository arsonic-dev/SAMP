package com.samp.risk.config;

import java.time.Duration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.risk-engine")
public class RiskEngineProperties {

    @NotBlank
    private String baseUrl;

    @NotNull
    private Duration cacheTtl = Duration.ofMinutes(5);

    @NotNull
    private Double stepUpThreshold = 30.0;

    @NotNull
    private Double denyThreshold = 70.0;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public Duration getCacheTtl() {
        return cacheTtl;
    }

    public void setCacheTtl(Duration cacheTtl) {
        this.cacheTtl = cacheTtl;
    }

    public Double getStepUpThreshold() {
        return stepUpThreshold;
    }

    public void setStepUpThreshold(Double stepUpThreshold) {
        this.stepUpThreshold = stepUpThreshold;
    }

    public Double getDenyThreshold() {
        return denyThreshold;
    }

    public void setDenyThreshold(Double denyThreshold) {
        this.denyThreshold = denyThreshold;
    }
}
