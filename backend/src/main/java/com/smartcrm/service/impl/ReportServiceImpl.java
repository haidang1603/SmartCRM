package com.smartcrm.service.impl;

import com.smartcrm.dto.PageResponse;
import com.smartcrm.dto.ReportCreateRequest;
import com.smartcrm.dto.ReportJobDto;
import com.smartcrm.entity.Customer;
import com.smartcrm.entity.Deal;
import com.smartcrm.entity.ReportJob;
import com.smartcrm.entity.User;
import com.smartcrm.enums.CustomerStatus;
import com.smartcrm.enums.DealStage;
import com.smartcrm.enums.ReportFormat;
import com.smartcrm.enums.ReportJobStatus;
import com.smartcrm.enums.RoleName;
import com.smartcrm.exception.BadRequestException;
import com.smartcrm.exception.ResourceNotFoundException;
import com.smartcrm.messaging.ReportMessageProducer;
import com.smartcrm.repository.CustomerRepository;
import com.smartcrm.repository.DealRepository;
import com.smartcrm.repository.ReportJobRepository;
import com.smartcrm.repository.UserRepository;
import com.smartcrm.service.ReportService;
import com.smartcrm.service.report.ReportExporter;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ReportServiceImpl implements ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportServiceImpl.class);

    private final ReportJobRepository reportJobRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final DealRepository dealRepository;
    private final ReportExporter reportExporter;
    private final ReportMessageProducer messageProducer;

    @Value("${app.reports.storage-dir:./storage/reports}")
    private String storageDir;

    @Value("${app.reports.expiration-hours:24}")
    private int expirationHours;

    @Value("${app.reports.max-concurrent-jobs-per-user:3}")
    private int maxConcurrentJobsPerUser;

    @Value("${app.reports.timeout-minutes:15}")
    private int timeoutMinutes;

    public ReportServiceImpl(
            ReportJobRepository reportJobRepository,
            UserRepository userRepository,
            CustomerRepository customerRepository,
            DealRepository dealRepository,
            ReportExporter reportExporter,
            ReportMessageProducer messageProducer
    ) {
        this.reportJobRepository = reportJobRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.dealRepository = dealRepository;
        this.reportExporter = reportExporter;
        this.messageProducer = messageProducer;
    }

    @Override
    @Transactional
    public ReportJobDto createReportJob(ReportCreateRequest request, String currentUsername) {
        // 1. Validation: date range
        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getStartDate().isAfter(request.getEndDate())) {
                throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
            }
        }

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng hiện tại không tồn tại: " + currentUsername));

        // 2. Role restriction: ROLE_SALES can only export their own assigned records
        boolean isSalesOnly = isSalesUserOnly(currentUser);
        Long effectiveAssignedToId = request.getAssignedToId();
        if (isSalesOnly) {
            effectiveAssignedToId = currentUser.getId();
        }

        // 3. Concurrency check: limit number of active jobs per user to prevent abuse
        long activeJobs = reportJobRepository.countByRequestedByIdAndStatusIn(
                currentUser.getId(),
                List.of(ReportJobStatus.QUEUED, ReportJobStatus.RUNNING)
        );
        if (activeJobs >= maxConcurrentJobsPerUser) {
            throw new BadRequestException("Bạn đang có " + activeJobs + " báo cáo đang xử lý. Vui lòng chờ hoàn thành trước khi tạo thêm.");
        }

        // 4. Create and persist ReportJob entity
        ReportJob job = new ReportJob();
        job.setJobUuid(UUID.randomUUID().toString());
        job.setReportType(request.getReportType());
        job.setFormat(request.getFormat());
        job.setStatus(ReportJobStatus.QUEUED);
        job.setStartDate(request.getStartDate());
        job.setEndDate(request.getEndDate());
        job.setRequestedBy(currentUser);
        job.setExpiresAt(Instant.now().plus(expirationHours, ChronoUnit.HOURS));

        // Build filter criteria summary
        Map<String, Object> filters = new HashMap<>();
        if (request.getStatusFilter() != null && !request.getStatusFilter().isBlank()) {
            filters.put("statusFilter", request.getStatusFilter());
        }
        if (effectiveAssignedToId != null) {
            filters.put("assignedToId", effectiveAssignedToId);
        }
        job.setFilterCriteria(filters.isEmpty() ? null : filters.toString());

        ReportJob savedJob = reportJobRepository.save(job);
        log.info("Created report job {} for user {}", savedJob.getJobUuid(), currentUsername);

        // 5. Asynchronously dispatch job via RabbitMQ (non-blocking, < 50ms)
        messageProducer.dispatchReportJob(savedJob.getJobUuid());

        return ReportJobDto.fromEntity(savedJob);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportJobDto getJobStatus(String jobUuid, String currentUsername) {
        ReportJob job = reportJobRepository.findByJobUuidWithUser(jobUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu báo cáo với ID: " + jobUuid));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + currentUsername));

        verifyJobAccess(job, currentUser);

        return ReportJobDto.fromEntity(job);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReportJobDto> getUserReports(String currentUsername, Pageable pageable) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + currentUsername));

        Page<ReportJob> page;
        if (isManagerOrAdmin(currentUser)) {
            page = reportJobRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            page = reportJobRepository.findByRequestedByIdOrderByCreatedAtDesc(currentUser.getId(), pageable);
        }

        List<ReportJobDto> dtoList = page.getContent().stream()
                .map(ReportJobDto::fromEntity)
                .toList();

        return new PageResponse<>(
                dtoList,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional
    public ResponseEntity<Resource> downloadReportFile(String jobUuid, String currentUsername) {
        ReportJob job = reportJobRepository.findByJobUuidWithUser(jobUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu báo cáo: " + jobUuid));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + currentUsername));

        // 1. Security access verification
        verifyJobAccess(job, currentUser);

        // 2. State & expiration verification
        if (job.getStatus() == ReportJobStatus.FAILED) {
            throw new BadRequestException("Báo cáo đã thất bại: " + (job.getErrorMessage() != null ? job.getErrorMessage() : "Không có thông tin lỗi"));
        }
        if (job.getStatus() == ReportJobStatus.QUEUED || job.getStatus() == ReportJobStatus.RUNNING) {
            throw new BadRequestException("Báo cáo đang trong quá trình xử lý, vui lòng chờ trong giây lát.");
        }
        if (job.getStatus() == ReportJobStatus.EXPIRED || (job.getExpiresAt() != null && job.getExpiresAt().isBefore(Instant.now()))) {
            if (job.getStatus() != ReportJobStatus.EXPIRED) {
                job.setStatus(ReportJobStatus.EXPIRED);
                reportJobRepository.save(job);
            }
            throw new BadRequestException("Báo cáo đã hết hạn và file đã bị xóa theo chính sách bảo mật dữ liệu.");
        }

        // 3. Physical file verification & Path Traversal Prevention
        if (job.getFilePath() == null) {
            throw new ResourceNotFoundException("File báo cáo không tồn tại.");
        }

        File file = new File(job.getFilePath());
        try {
            File baseDir = new File(storageDir).getCanonicalFile();
            if (!file.getCanonicalFile().toPath().startsWith(baseDir.toPath())) {
                log.error("Security violation: Path traversal attempt detected on report download. Path: {}", job.getFilePath());
                throw new SecurityException("Phát hiện truy cập file ngoài phạm vi lưu trữ cho phép.");
            }
        } catch (IOException e) {
            throw new ResourceNotFoundException("Không thể xác minh đường dẫn file báo cáo: " + e.getMessage());
        }

        if (!file.exists() || !file.canRead()) {
            throw new ResourceNotFoundException("File báo cáo không tồn tại trên hệ thống lưu trữ.");
        }

        Resource resource = new FileSystemResource(file);
        String contentType = job.getFormat() == ReportFormat.CSV
                ? "text/csv; charset=UTF-8"
                : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + job.getFileName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(file.length()))
                .body(resource);
    }

    @Override
    @Transactional
    public void processReportJob(String jobUuid) {
        Optional<ReportJob> jobOpt = reportJobRepository.findByJobUuidWithUser(jobUuid);
        if (jobOpt.isEmpty()) {
            log.warn("Report job with uuid {} not found in database, skipping", jobUuid);
            return;
        }

        ReportJob job = jobOpt.get();

        // Idempotency check: avoid redundant processing on duplicate message redelivery
        if (job.getStatus() == ReportJobStatus.COMPLETED) {
            log.info("Report job {} is already COMPLETED. Ignoring duplicate message.", jobUuid);
            return;
        }
        if (job.getStatus() == ReportJobStatus.FAILED && job.getRetryCount() >= job.getMaxRetries()) {
            log.warn("Report job {} has exceeded maximum retries. Ignoring.", jobUuid);
            return;
        }

        // Transition to RUNNING
        job.setStatus(ReportJobStatus.RUNNING);
        job.setStartedAt(Instant.now());
        reportJobRepository.save(job);

        try {
            // Ensure storage directory exists thread-safely
            File dir = new File(storageDir);
            java.nio.file.Files.createDirectories(dir.toPath());

            String extension = job.getFormat().getFileExtension();
            String fileName = "SmartCRM_" + job.getReportType().name() + "_" + job.getJobUuid().substring(0, 8) + "_" + System.currentTimeMillis() + extension;
            File targetFile = new File(dir, fileName);

            int rowCount = 0;
            try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                switch (job.getReportType()) {
                    case CUSTOMERS -> {
                        List<Customer> customers = fetchCustomersForReport(job);
                        rowCount = customers.size();
                        if (job.getFormat() == ReportFormat.CSV) {
                            reportExporter.exportCustomersCsv(customers, fos);
                        } else {
                            reportExporter.exportCustomersExcel(customers, fos);
                        }
                    }
                    case DEALS -> {
                        List<Deal> deals = fetchDealsForReport(job);
                        rowCount = deals.size();
                        if (job.getFormat() == ReportFormat.CSV) {
                            reportExporter.exportDealsCsv(deals, fos);
                        } else {
                            reportExporter.exportDealsExcel(deals, fos);
                        }
                    }
                    case REVENUE_SUMMARY -> {
                        List<ReportExporter.RevenueSummaryRow> rows = generateRevenueSummaryRows();
                        rowCount = rows.size();
                        if (job.getFormat() == ReportFormat.CSV) {
                            reportExporter.exportRevenueSummaryCsv(rows, fos);
                        } else {
                            reportExporter.exportRevenueSummaryExcel(rows, fos);
                        }
                    }
                }
            }

            // Verify file landed properly
            if (!targetFile.exists() || targetFile.length() == 0) {
                throw new IOException("Target report file was not written or is 0 bytes: " + targetFile.getAbsolutePath());
            }

            // Mark COMPLETED ONLY AFTER successful file writing
            job.setStatus(ReportJobStatus.COMPLETED);
            job.setCompletedAt(Instant.now());
            job.setFilePath(targetFile.getAbsolutePath());
            job.setFileName(fileName);
            job.setFileSizeBytes(targetFile.length());
            job.setRowCount(rowCount);
            job.setErrorMessage(null);
            reportJobRepository.save(job);

            log.info("Successfully finished report job {}. Rows: {}, Size: {} bytes", jobUuid, rowCount, targetFile.length());

        } catch (Exception ex) {
            log.error("Failed processing report job {}: {}", jobUuid, ex.getMessage(), ex);
            int newRetry = job.getRetryCount() + 1;
            job.setRetryCount(newRetry);

            if (newRetry >= job.getMaxRetries()) {
                job.setStatus(ReportJobStatus.FAILED);
                job.setCompletedAt(Instant.now());
                job.setErrorMessage("Xử lý thất bại sau " + newRetry + " lần thử: " + ex.getMessage());
                reportJobRepository.save(job);
            } else {
                job.setStatus(ReportJobStatus.QUEUED);
                job.setErrorMessage("Thử lại lần " + newRetry + "/" + job.getMaxRetries() + ": " + ex.getMessage());
                reportJobRepository.save(job);
                throw new RuntimeException("Worker failed, scheduling retry: " + ex.getMessage(), ex);
            }
        }
    }

    @Override
    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void cleanupExpiredAndStaleReports() {
        log.info("Running scheduled cleanup for expired and stale reports...");

        // 1. Clean up expired completed reports
        List<ReportJob> expiredJobs = reportJobRepository.findByStatusAndExpiresAtBefore(ReportJobStatus.COMPLETED, Instant.now());
        for (ReportJob job : expiredJobs) {
            if (job.getFilePath() != null) {
                File file = new File(job.getFilePath());
                if (file.exists() && file.delete()) {
                    log.info("Deleted expired report file: {}", job.getFilePath());
                }
            }
            job.setStatus(ReportJobStatus.EXPIRED);
            reportJobRepository.save(job);
        }

        // 2. Mark stuck RUNNING jobs as FAILED (worker crash recovery)
        Instant timeoutThreshold = Instant.now().minus(timeoutMinutes, ChronoUnit.MINUTES);
        List<ReportJob> stuckJobs = reportJobRepository.findByStatusAndStartedAtBefore(ReportJobStatus.RUNNING, timeoutThreshold);
        for (ReportJob job : stuckJobs) {
            log.warn("Report job {} timed out after {} minutes, marking as FAILED", job.getJobUuid(), timeoutMinutes);
            job.setStatus(ReportJobStatus.FAILED);
            job.setCompletedAt(Instant.now());
            job.setErrorMessage("Quá thời gian xử lý (" + timeoutMinutes + " phút) - Worker Timeout");
            reportJobRepository.save(job);
        }
    }

    private List<Customer> fetchCustomersForReport(ReportJob job) {
        Specification<Customer> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (job.getStartDate() != null) {
                Instant startInstant = job.getStartDate().atStartOfDay().toInstant(ZoneOffset.UTC);
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startInstant));
            }
            if (job.getEndDate() != null) {
                Instant endInstant = job.getEndDate().atTime(LocalTime.MAX).toInstant(ZoneOffset.UTC);
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endInstant));
            }

            // Extract filters
            Long assignedToId = extractLongFilter(job.getFilterCriteria(), "assignedToId");
            if (assignedToId != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            }

            String statusFilter = extractStringFilter(job.getFilterCriteria(), "statusFilter");
            if (statusFilter != null && !statusFilter.isBlank()) {
                try {
                    CustomerStatus status = CustomerStatus.valueOf(statusFilter);
                    predicates.add(cb.equal(root.get("status"), status));
                } catch (IllegalArgumentException ignored) {}
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return customerRepository.findAll(spec, Pageable.unpaged()).getContent();
    }

    private List<Deal> fetchDealsForReport(ReportJob job) {
        Specification<Deal> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (job.getStartDate() != null) {
                Instant startInstant = job.getStartDate().atStartOfDay().toInstant(ZoneOffset.UTC);
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startInstant));
            }
            if (job.getEndDate() != null) {
                Instant endInstant = job.getEndDate().atTime(LocalTime.MAX).toInstant(ZoneOffset.UTC);
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endInstant));
            }

            Long assignedToId = extractLongFilter(job.getFilterCriteria(), "assignedToId");
            if (assignedToId != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            }

            String statusFilter = extractStringFilter(job.getFilterCriteria(), "statusFilter");
            if (statusFilter != null && !statusFilter.isBlank()) {
                try {
                    DealStage stage = DealStage.valueOf(statusFilter);
                    predicates.add(cb.equal(root.get("stage"), stage));
                } catch (IllegalArgumentException ignored) {}
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return dealRepository.findAll(spec, Pageable.unpaged()).getContent();
    }

    private List<ReportExporter.RevenueSummaryRow> generateRevenueSummaryRows() {
        List<Object[]> aggs = dealRepository.getStageAggregations();
        BigDecimal totalAllValue = BigDecimal.ZERO;
        for (Object[] row : aggs) {
            BigDecimal val = (BigDecimal) row[2];
            if (val != null) totalAllValue = totalAllValue.add(val);
        }

        List<ReportExporter.RevenueSummaryRow> rows = new ArrayList<>();
        for (DealStage stage : DealStage.values()) {
            long count = 0;
            BigDecimal val = BigDecimal.ZERO;
            for (Object[] r : aggs) {
                if (r[0] == stage) {
                    count = ((Number) r[1]).longValue();
                    val = (BigDecimal) r[2];
                    break;
                }
            }
            double percentage = totalAllValue.compareTo(BigDecimal.ZERO) > 0
                    ? val.multiply(BigDecimal.valueOf(100)).divide(totalAllValue, 2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            String stageName = switch (stage) {
                case NEW -> "Mới tạo (New)";
                case CONSULTING -> "Tư vấn & Báo giá";
                case NEGOTIATION -> "Đàm phán hợp đồng";
                case WON -> "Thành công (Won)";
                case LOST -> "Thất bại (Lost)";
            };

            rows.add(new ReportExporter.RevenueSummaryRow(stageName, count, val, percentage));
        }
        return rows;
    }

    private void verifyJobAccess(ReportJob job, User currentUser) {
        if (!isManagerOrAdmin(currentUser)) {
            if (!job.getRequestedBy().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Bạn không có quyền truy cập hoặc tải xuống báo cáo này.");
            }
        }
    }

    private boolean isManagerOrAdmin(User user) {
        return user.getRoles().stream().anyMatch(r ->
                r.getName().equals(RoleName.ROLE_ADMIN.name()) || r.getName().equals(RoleName.ROLE_MANAGER.name())
        );
    }

    private boolean isSalesUserOnly(User user) {
        return user.getRoles().stream().anyMatch(r -> r.getName().equals(RoleName.ROLE_SALES.name()))
                && !isManagerOrAdmin(user);
    }

    private Long extractLongFilter(String criteria, String key) {
        if (criteria == null || !criteria.contains(key)) return null;
        try {
            int idx = criteria.indexOf(key + "=");
            if (idx == -1) return null;
            int start = idx + key.length() + 1;
            int end = criteria.indexOf(",", start);
            if (end == -1) end = criteria.indexOf("}", start);
            if (end == -1) end = criteria.length();
            return Long.parseLong(criteria.substring(start, end).trim());
        } catch (Exception e) {
            return null;
        }
    }

    private String extractStringFilter(String criteria, String key) {
        if (criteria == null || !criteria.contains(key)) return null;
        try {
            int idx = criteria.indexOf(key + "=");
            if (idx == -1) return null;
            int start = idx + key.length() + 1;
            int end = criteria.indexOf(",", start);
            if (end == -1) end = criteria.indexOf("}", start);
            if (end == -1) end = criteria.length();
            return criteria.substring(start, end).trim();
        } catch (Exception e) {
            return null;
        }
    }
}
