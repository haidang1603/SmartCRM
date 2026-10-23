package com.smartcrm.messaging;

import com.smartcrm.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ReportWorkerListener {

    private static final Logger log = LoggerFactory.getLogger(ReportWorkerListener.class);

    private final ReportService reportService;

    public ReportWorkerListener(ReportService reportService) {
        this.reportService = reportService;
    }

    @RabbitListener(queues = "${app.reports.queue-name:smartcrm.report.queue}")
    public void onReportMessage(ReportMessage message) {
        if (message == null || message.getJobUuid() == null) {
            log.warn("Received empty or null report message, discarding");
            return;
        }

        log.info("RabbitMQ Worker received message for job: {}", message.getJobUuid());
        try {
            reportService.processReportJob(message.getJobUuid());
        } catch (Exception ex) {
            log.error("Worker processing failed for job {}: {}", message.getJobUuid(), ex.getMessage(), ex);
            throw ex; // Triggers Spring AMQP retry mechanism and DLQ routing when max retries exceeded
        }
    }
}
