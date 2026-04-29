package com.samp.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import org.junit.jupiter.api.Test;

class TokenHashServiceTest {

    private final TokenHashService tokenHashService = new TokenHashService();

    @Test
    void shouldHashDeterministically() {
        String token = "refresh-token";

        String first = tokenHashService.hash(token);
        String second = tokenHashService.hash(token);

        assertEquals(first, second);
        assertEquals(64, first.length());
    }

    @Test
    void shouldProduceDifferentHashesForDifferentTokens() {
        assertNotEquals(
            tokenHashService.hash("token-a"),
            tokenHashService.hash("token-b")
        );
    }
}
