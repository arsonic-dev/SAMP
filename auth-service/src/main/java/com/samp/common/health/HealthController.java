package com.samp.common.health;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final DataSource dataSource;
    private final StringRedisTemplate redisTemplate;

    public HealthController(DataSource dataSource, StringRedisTemplate redisTemplate) {
        this.dataSource = dataSource;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "auth-service");
        response.put("status", "UP");
        response.put("timestamp", OffsetDateTime.now().toString());
        response.put("database", databaseStatus());
        response.put("redis", redisStatus());
        return ResponseEntity.status(overallStatus(response)).body(response);
    }

    private Map<String, Object> databaseStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            status.put("status", "UP");
            status.put("product", connection.getMetaData().getDatabaseProductName());
        } catch (Exception exception) {
            status.put("status", "DOWN");
            status.put("error", exception.getMessage());
        }
        return status;
    }

    private Map<String, Object> redisStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        try (var connection = redisTemplate.getConnectionFactory().getConnection()) {
            String ping = connection.ping();
            status.put("status", "UP");
            status.put("ping", ping);
        } catch (Exception exception) {
            status.put("status", "DOWN");
            status.put("error", exception.getMessage());
        }
        return status;
    }

    private HttpStatus overallStatus(Map<String, Object> response) {
        Map<?, ?> database = (Map<?, ?>) response.get("database");
        Map<?, ?> redis = (Map<?, ?>) response.get("redis");
        if ("UP".equals(database.get("status")) && "UP".equals(redis.get("status"))) {
            return HttpStatus.OK;
        }
        response.put("status", "DEGRADED");
        return HttpStatus.SERVICE_UNAVAILABLE;
    }
}
