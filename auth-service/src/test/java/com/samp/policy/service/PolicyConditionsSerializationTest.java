package com.samp.policy.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.samp.policy.PolicyModels.PolicyConditions;

import org.junit.jupiter.api.Test;

class PolicyConditionsSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void shouldRoundTripPolicyConditions() throws Exception {
        PolicyConditions conditions = new PolicyConditions(70, List.of("LOW", "MEDIUM"), "8", "18");

        String json = objectMapper.writeValueAsString(conditions);
        PolicyConditions restored = objectMapper.readValue(json, PolicyConditions.class);

        assertEquals(conditions, restored);
    }
}
