package com.smartcrm.service;

import com.smartcrm.dto.ReportCreateRequest;
import com.smartcrm.dto.ReportJobDto;
import com.smartcrm.entity.ReportJob;
import com.smartcrm.entity.User;
import com.smartcrm.enums.ReportFormat;
import com.smartcrm.enums.ReportJobStatus;
import com.smartcrm.enums.ReportType;
import com.smartcrm.exception.BadRequestException;
import com.smartcrm.repository.ReportJobRepository;
import com.smartcrm.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class ReportServiceTest {

    @Autowired
    private ReportService reportService;

    @Autowired
    private ReportJobRepository reportJobRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Worker Idempotency: Duplicate message delivery does not re-execute completed job")
    @Transactional
    void testWorkerIdempotency_DuplicateDelivery() {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        ReportJob job = new ReportJob();
        job.setJobUuid(UUID.randomUUID().toString());
        job.setReportType(ReportType.CUSTOMERS);
        job.setFormat(ReportFormat.CSV);
        job.setStatus(ReportJobStatus.COMPLETED);
        job.setRowCount(42);
        job.setRequestedBy(admin);
        job.setFilePath("some/path/file.csv");
        job.setFileName("file.csv");
        job.setFileSizeBytes(1024L);
        reportJobRepository.save(job);

        // Process already completed job (simulating duplicate delivery)
        reportService.processReportJob(job.getJobUuid());

        ReportJob updated = reportJobRepository.findByJobUuid(job.getJobUuid()).orElseThrow();
        assertEquals(ReportJobStatus.COMPLETED, updated.getStatus());
        assertEquals(42, updated.getRowCount(), "Row count must remain intact without re-execution");
    }

    @Test
    @DisplayName("Timeout and Expired Cleanup: Stale RUNNING jobs marked FAILED, expired files removed")
    @Transactional
    void testCleanupExpiredAndStaleReports() throws IOException {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        // 1. Stale job stuck in RUNNING for 30 minutes
        ReportJob staleJob = new ReportJob();
        staleJob.setJobUuid(UUID.randomUUID().toString());
        staleJob.setReportType(ReportType.DEALS);
        staleJob.setFormat(ReportFormat.CSV);
        staleJob.setStatus(ReportJobStatus.RUNNING);
        staleJob.setStartedAt(Instant.now().minus(30, ChronoUnit.MINUTES));
        staleJob.setRequestedBy(admin);
        reportJobRepository.save(staleJob);

        // 2. Expired completed job with physical file
        File tempFile = File.createTempFile("smartcrm_test_expire_", ".csv");
        assertTrue(tempFile.exists());

        ReportJob expiredJob = new ReportJob();
        expiredJob.setJobUuid(UUID.randomUUID().toString());
        expiredJob.setReportType(ReportType.CUSTOMERS);
        expiredJob.setFormat(ReportFormat.CSV);
        expiredJob.setStatus(ReportJobStatus.COMPLETED);
        expiredJob.setFilePath(tempFile.getAbsolutePath());
        expiredJob.setFileName(tempFile.getName());
        expiredJob.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
        expiredJob.setRequestedBy(admin);
        reportJobRepository.save(expiredJob);

        // Run scheduled cleanup
        reportService.cleanupExpiredAndStaleReports();

        ReportJob checkedStale = reportJobRepository.findByJobUuid(staleJob.getJobUuid()).orElseThrow();
        assertEquals(ReportJobStatus.FAILED, checkedStale.getStatus());
        assertTrue(checkedStale.getErrorMessage().contains("Worker Timeout"));

        ReportJob checkedExpired = reportJobRepository.findByJobUuid(expiredJob.getJobUuid()).orElseThrow();
        assertEquals(ReportJobStatus.EXPIRED, checkedExpired.getStatus());
        assertFalse(tempFile.exists(), "Physical file must be deleted upon expiration");
    }

    @Test
    @DisplayName("Concurrency Limiting: Rejects 4th active job when user already has 3 pending jobs")
    void testConcurrencyRateLimiting() {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        // Seed 3 QUEUED jobs
        for (int i = 0; i < 3; i++) {
            ReportJob j = new ReportJob();
            j.setJobUuid(UUID.randomUUID().toString());
            j.setReportType(ReportType.CUSTOMERS);
            j.setFormat(ReportFormat.CSV);
            j.setStatus(ReportJobStatus.QUEUED);
            j.setRequestedBy(admin);
            reportJobRepository.save(j);
        }

        ReportCreateRequest req = new ReportCreateRequest();
        req.setReportType(ReportType.DEALS);
        req.setFormat(ReportFormat.CSV);

        // 4th request must be rejected
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                reportService.createReportJob(req, "admin")
        );
        assertTrue(ex.getMessage().contains("đang xử lý"));
    }
}
