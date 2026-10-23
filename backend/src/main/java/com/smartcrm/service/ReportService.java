package com.smartcrm.service;

import com.smartcrm.dto.PageResponse;
import com.smartcrm.dto.ReportCreateRequest;
import com.smartcrm.dto.ReportJobDto;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

public interface ReportService {

    ReportJobDto createReportJob(ReportCreateRequest request, String currentUsername);

    ReportJobDto getJobStatus(String jobUuid, String currentUsername);

    PageResponse<ReportJobDto> getUserReports(String currentUsername, Pageable pageable);

    ResponseEntity<Resource> downloadReportFile(String jobUuid, String currentUsername);

    void processReportJob(String jobUuid);

    void cleanupExpiredAndStaleReports();
}
