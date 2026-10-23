-- SmartCRM Phase 3: Asynchronous Report Jobs Table
-- Version: V4__create_report_jobs_table.sql

CREATE TABLE IF NOT EXISTS report_jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_uuid VARCHAR(36) NOT NULL UNIQUE,
    report_type VARCHAR(32) NOT NULL,
    format VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    filter_criteria VARCHAR(1000),
    requested_by_id BIGINT NOT NULL,
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    row_count INT NOT NULL DEFAULT 0,
    error_message VARCHAR(1000),
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_jobs_user FOREIGN KEY (requested_by_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_report_jobs_user_status ON report_jobs (requested_by_id, status);
CREATE INDEX idx_report_jobs_status_created ON report_jobs (status, created_at);
CREATE INDEX idx_report_jobs_expires_at ON report_jobs (expires_at);
