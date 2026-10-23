package com.smartcrm.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcrm.dto.BenchmarkRunRequest;
import com.smartcrm.dto.LoginRequest;
import com.smartcrm.enums.BenchmarkScenario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PerformanceLabControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String salesToken;

    @BeforeEach
    void setUp() throws Exception {
        if (adminToken == null) {
            adminToken = obtainToken("admin", "Admin@123");
            salesToken = obtainToken("sales", "Sales@123");
        }
    }

    private String obtainToken(String username, String password) throws Exception {
        LoginRequest request = new LoginRequest(username, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return root.path("data").path("token").asText();
    }

    @Test
    @DisplayName("Test 1: Read real-time system metrics (CPU, RAM, Cache, SLO)")
    void testGetRealtimeMetrics() throws Exception {
        mockMvc.perform(get("/api/v1/performance/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.jvmMemoryUsedMb").isNumber())
                .andExpect(jsonPath("$.data.availableProcessors").isNumber())
                .andExpect(jsonPath("$.data.targetSloP95Ms").value(500.0));
    }

    @Test
    @DisplayName("Test 2: Security RBAC - Only ADMIN can execute benchmark, Sales is rejected (403 Forbidden)")
    void testRunBenchmark_SecurityRbac() throws Exception {
        BenchmarkRunRequest req = new BenchmarkRunRequest();
        req.setScenarioName(BenchmarkScenario.DASHBOARD_METRICS);
        req.setVirtualUsers(2);
        req.setIterations(10);

        // Sales user attempts to trigger benchmark -> 403 Forbidden
        mockMvc.perform(post("/api/v1/performance/benchmarks")
                        .header("Authorization", "Bearer " + salesToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test 3: Admin executes benchmark successfully and receives latency percentiles")
    void testRunBenchmark_AdminSuccess() throws Exception {
        BenchmarkRunRequest req = new BenchmarkRunRequest();
        req.setScenarioName(BenchmarkScenario.CUSTOMER_SEARCH);
        req.setVirtualUsers(2);
        req.setIterations(10);
        req.setNotes("Controller integration test run");

        mockMvc.perform(post("/api/v1/performance/benchmarks")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRequests").value(20))
                .andExpect(jsonPath("$.data.successfulRequests").value(20))
                .andExpect(jsonPath("$.data.p50LatencyMs").isNumber())
                .andExpect(jsonPath("$.data.p95LatencyMs").isNumber())
                .andExpect(jsonPath("$.data.throughputRps").isNumber());
    }

    @Test
    @DisplayName("Test 4: Get baseline vs optimized comparisons with improvement metrics")
    void testGetComparisons() throws Exception {
        mockMvc.perform(get("/api/v1/performance/comparisons")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].scenarioDisplayName").isNotEmpty());
    }

    @Test
    @DisplayName("Test 5: Get paginated benchmark execution history")
    void testGetBenchmarkHistory() throws Exception {
        mockMvc.perform(get("/api/v1/performance/history?page=0&size=10")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));
    }
}
