package com.samp.common.health;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class StartupConnectivityVerifier implements ApplicationRunner {

    private final StringRedisTemplate redisTemplate;

    public StartupConnectivityVerifier(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (var connection = redisTemplate.getConnectionFactory().getConnection()) {
            connection.ping();
        } catch (Exception exception) {
            throw new DataAccessResourceFailureException("Redis connectivity check failed at startup", exception);
        }
    }
}
