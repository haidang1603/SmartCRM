package com.smartcrm.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcrm.dto.CustomerCreateRequest;
import com.smartcrm.dto.LoginRequest;
import com.smartcrm.enums.CustomerStatus;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CustomerControllerIntegrationTest {

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
    @DisplayName("Should return seeded demo customers with pagination")
    void testGetCustomers_ReturnsSeededCustomers() throws Exception {
        mockMvc.perform(get("/api/v1/customers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(5))))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(5)));
    }

    @Test
    @DisplayName("Should create customer successfully with valid payload")
    void testCreateCustomer_Success() throws Exception {
        CustomerCreateRequest request = new CustomerCreateRequest();
        request.setFullName("Le Hoang Nam");
        request.setEmail("nam.le." + System.currentTimeMillis() + "@example.com");
        request.setPhoneNumber("0988776655");
        request.setCompanyName("Nam Hoang Media");
        request.setStatus(CustomerStatus.LEAD);

        mockMvc.perform(post("/api/v1/customers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Le Hoang Nam"))
                .andExpect(jsonPath("$.data.id").isNumber());
    }

    @Test
    @DisplayName("Should return 400 Bad Request with field errors when required fields are blank")
    void testCreateCustomer_ValidationFailure() throws Exception {
        CustomerCreateRequest request = new CustomerCreateRequest();
        // Missing fullName and email

        mockMvc.perform(post("/api/v1/customers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.validationErrors.fullName").exists())
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    @DisplayName("Should deny deletion when user has only ROLE_SALES")
    void testDeleteCustomer_ForbiddenForSales() throws Exception {
        mockMvc.perform(delete("/api/v1/customers/1")
                        .header("Authorization", "Bearer " + salesToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }
}
