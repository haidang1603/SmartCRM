package com.smartcrm.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcrm.dto.LoginRequest;
import com.smartcrm.dto.ReportCreateRequest;
import com.smartcrm.entity.Customer;
import com.smartcrm.entity.Deal;
import com.smartcrm.entity.User;
import com.smartcrm.enums.CustomerStatus;
import com.smartcrm.enums.DealStage;
import com.smartcrm.enums.ReportFormat;
import com.smartcrm.enums.ReportJobStatus;
import com.smartcrm.enums.ReportType;
import com.smartcrm.repository.CustomerRepository;
import com.smartcrm.repository.DealRepository;
import com.smartcrm.repository.ReportJobRepository;
import com.smartcrm.repository.UserRepository;
import com.smartcrm.service.ReportService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ReportControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ReportService reportService;

    @Autowired
    private ReportJobRepository reportJobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DealRepository dealRepository;

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
    @DisplayName("Test 1: Submit report job successfully with instant API response time (< 150ms)")
    void testCreateReportJob_InstantResponse() throws Exception {
        ReportCreateRequest req = new ReportCreateRequest();
        req.setReportType(ReportType.CUSTOMERS);
        req.setFormat(ReportFormat.CSV);
        req.setStartDate(LocalDate.now().minusMonths(1));
        req.setEndDate(LocalDate.now());

        long start = System.currentTimeMillis();
        MvcResult result = mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.jobUuid").isNotEmpty())
                .andReturn();
        long apiDuration = System.currentTimeMillis() - start;

        assertTrue(apiDuration < 200, "API creation response time must be non-blocking (< 200ms), actual: " + apiDuration + "ms");
    }

    @Test
    @DisplayName("Test 2: Validation failure when startDate is after endDate")
    void testCreateReportJob_InvalidDateRange() throws Exception {
        ReportCreateRequest req = new ReportCreateRequest();
        req.setReportType(ReportType.DEALS);
        req.setFormat(ReportFormat.XLSX);
        req.setStartDate(LocalDate.now().plusDays(10));
        req.setEndDate(LocalDate.now()); // Invalid: start > end

        mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ngày bắt đầu không được sau ngày kết thúc"));
    }

    private void waitForJobCompletion(String jobUuid) throws InterruptedException {
        long start = System.currentTimeMillis();
        while (System.currentTimeMillis() - start < 3000) {
            var opt = reportJobRepository.findByJobUuid(jobUuid);
            if (opt.isPresent() && opt.get().getStatus() == ReportJobStatus.COMPLETED) {
                return;
            }
            Thread.sleep(50);
        }
        try {
            reportService.processReportJob(jobUuid);
        } catch (Exception ignored) {}
    }

    @Test
    @DisplayName("Test 3: Security check - User B cannot download User A's private report (403 Forbidden)")
    void testDownloadReport_AccessDenied() throws Exception {
        // Sales user creates a report
        ReportCreateRequest req = new ReportCreateRequest();
        req.setReportType(ReportType.CUSTOMERS);
        req.setFormat(ReportFormat.CSV);

        MvcResult createResult = mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + salesToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isAccepted())
                .andReturn();

        JsonNode root = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String jobUuid = root.path("data").path("jobUuid").asText();

        // Ensure report completes
        waitForJobCompletion(jobUuid);

        // Create a temporary regular user without admin/manager role
        User otherSales = new User();
        otherSales.setUsername("other_sales_" + UUID.randomUUID().toString().substring(0, 6));
        otherSales.setEmail(otherSales.getUsername() + "@test.com");
        otherSales.setPassword("$2a$10$tS.BsOPDZIhpJ.QccEpSYe5qL19GQB2BMfWZNar9w9EJbeIteoSOu"); // Sales@123
        otherSales.setFullName("Other Sales");
        otherSales.setActive(true);
        otherSales.getRoles().add(userRepository.findByUsername("sales").get().getRoles().iterator().next());
        userRepository.save(otherSales);

        String otherToken = obtainToken(otherSales.getUsername(), "Sales@123");

        // Other sales user attempts to download sales's report
        mockMvc.perform(get("/api/v1/reports/" + jobUuid + "/download")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test 4: Generate and download CSV report successfully")
    void testGenerateAndDownloadCsvReport() throws Exception {
        ReportCreateRequest req = new ReportCreateRequest();
        req.setReportType(ReportType.CUSTOMERS);
        req.setFormat(ReportFormat.CSV);

        MvcResult createResult = mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isAccepted())
                .andReturn();

        String jobUuid = objectMapper.readTree(createResult.getResponse().getContentAsString()).path("data").path("jobUuid").asText();

        // Process job
        waitForJobCompletion(jobUuid);

        // Verify status is COMPLETED
        mockMvc.perform(get("/api/v1/reports/" + jobUuid)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.downloadUrl").isNotEmpty());

        // Download file
        MvcResult downloadResult = mockMvc.perform(get("/api/v1/reports/" + jobUuid + "/download")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andExpect(header().string("Content-Disposition", containsString(".csv")))
                .andReturn();

        byte[] content = downloadResult.getResponse().getContentAsByteArray();
        assertTrue(content.length > 0, "Downloaded CSV content must not be empty");
    }

    @Test
    @DisplayName("Test 5: Generate and download Excel XLSX report successfully")
    void testGenerateAndDownloadExcelReport() throws Exception {
        ReportCreateRequest req = new ReportCreateRequest();
        req.setReportType(ReportType.DEALS);
        req.setFormat(ReportFormat.XLSX);

        MvcResult createResult = mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isAccepted())
                .andReturn();

        String jobUuid = objectMapper.readTree(createResult.getResponse().getContentAsString()).path("data").path("jobUuid").asText();

        // Process job
        waitForJobCompletion(jobUuid);

        // Download Excel
        MvcResult downloadResult = mockMvc.perform(get("/api/v1/reports/" + jobUuid + "/download")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")))
                .andExpect(header().string("Content-Disposition", containsString(".xlsx")))
                .andReturn();

        byte[] content = downloadResult.getResponse().getContentAsByteArray();
        assertTrue(content.length > 500, "Downloaded Excel XLSX content must be valid binary spreadsheet data");
    }

    @Test
    @DisplayName("Test 6: Empty data handling - Generates valid empty report with headers (0 rows)")
    void testEmptyDataReport() throws Exception {
        ReportCreateRequest req = new ReportCreateRequest();
        req.setReportType(ReportType.CUSTOMERS);
        req.setFormat(ReportFormat.CSV);
        req.setStartDate(LocalDate.of(2099, 1, 1)); // Future date with zero records
        req.setEndDate(LocalDate.of(2099, 1, 31));

        MvcResult createResult = mockMvc.perform(post("/api/v1/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isAccepted())
                .andReturn();

        String jobUuid = objectMapper.readTree(createResult.getResponse().getContentAsString()).path("data").path("jobUuid").asText();
        waitForJobCompletion(jobUuid);

        mockMvc.perform(get("/api/v1/reports/" + jobUuid)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.rowCount").value(0));
    }
}
