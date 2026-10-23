package com.smartcrm.messaging;

import com.smartcrm.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Component;

@Component
public class ReportMessageProducer {

    private static final Logger log = LoggerFactory.getLogger(ReportMessageProducer.class);

    private final RabbitTemplate rabbitTemplate;
    private final ReportService reportService;
    private final TaskExecutor taskExecutor;

    @Value("${app.reports.exchange-name:smartcrm.report.exchange}")
    private String exchangeName;

    @Value("${app.reports.routing-key:smartcrm.report.routingKey}")
    private String routingKey;

    public ReportMessageProducer(
            @Autowired(required = false) RabbitTemplate rabbitTemplate,
            @Lazy ReportService reportService,
            @Qualifier("applicationTaskExecutor") TaskExecutor taskExecutor
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.reportService = reportService;
        this.taskExecutor = taskExecutor;
    }

    /**
     * Dispatches report job message containing ONLY the Job UUID to RabbitMQ.
     * If RabbitMQ broker is unreachable, safely falls back to local asynchronous executor
     * ensuring high availability and zero user-facing HTTP errors.
     */
    public void dispatchReportJob(String jobUuid) {
        ReportMessage message = new ReportMessage(jobUuid);
        if (rabbitTemplate != null) {
            try {
                log.info("Dispatching report job to RabbitMQ exchange '{}' with routingKey '{}': {}", exchangeName, routingKey, jobUuid);
                rabbitTemplate.convertAndSend(exchangeName, routingKey, message);
                return;
            } catch (AmqpException ex) {
                log.warn("RabbitMQ broker connection unavailable ({}), falling back to resilient async executor for job: {}", ex.getMessage(), jobUuid);
            } catch (Exception ex) {
                log.error("Unexpected error publishing to RabbitMQ ({}), falling back to resilient async executor for job: {}", ex.getMessage(), jobUuid);
            }
        } else {
            log.info("RabbitTemplate not configured, using resilient async executor for job: {}", jobUuid);
        }

        // Resilient Fallback: Run asynchronously on thread pool so HTTP request is never blocked
        taskExecutor.execute(() -> {
            try {
                reportService.processReportJob(jobUuid);
            } catch (Exception e) {
                log.error("Fallback worker execution failed for job {}: {}", jobUuid, e.getMessage(), e);
            }
        });
    }
}
