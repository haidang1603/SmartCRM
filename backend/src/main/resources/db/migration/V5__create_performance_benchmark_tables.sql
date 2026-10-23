-- SmartCRM Phase 4: Performance Lab & Observability Schema
-- Version: V5__create_performance_benchmark_tables.sql

CREATE TABLE IF NOT EXISTS performance_benchmarks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_uuid VARCHAR(36) NOT NULL UNIQUE,
    scenario_name VARCHAR(60) NOT NULL,
    run_type VARCHAR(30) NOT NULL, -- BASELINE, OPTIMIZED, SIMULATED
    environment VARCHAR(30) NOT NULL DEFAULT 'LOCAL_TEST',
    virtual_users INT NOT NULL DEFAULT 1,
    iterations INT NOT NULL DEFAULT 50,
    total_requests INT NOT NULL,
    successful_requests INT NOT NULL,
    failed_requests INT NOT NULL DEFAULT 0,
    duration_ms BIGINT NOT NULL,
    throughput_rps DOUBLE NOT NULL,
    min_latency_ms DOUBLE NOT NULL,
    avg_latency_ms DOUBLE NOT NULL,
    p50_latency_ms DOUBLE NOT NULL,
    p95_latency_ms DOUBLE NOT NULL,
    p99_latency_ms DOUBLE NOT NULL,
    max_latency_ms DOUBLE NOT NULL,
    error_rate DOUBLE NOT NULL DEFAULT 0.0,
    cpu_usage_pct DOUBLE,
    memory_used_mb DOUBLE,
    cache_hit_ratio DOUBLE,
    executed_by VARCHAR(100) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_perf_scenario_type ON performance_benchmarks (scenario_name, run_type);
CREATE INDEX idx_perf_created_at ON performance_benchmarks (created_at DESC);

-- Seed initial empirical Phase 1 Baseline & Phase 2 Optimized benchmark reference runs
INSERT INTO performance_benchmarks (
    run_uuid, scenario_name, run_type, environment, virtual_users, iterations,
    total_requests, successful_requests, failed_requests, duration_ms, throughput_rps,
    min_latency_ms, avg_latency_ms, p50_latency_ms, p95_latency_ms, p99_latency_ms, max_latency_ms,
    error_rate, cpu_usage_pct, memory_used_mb, cache_hit_ratio, executed_by, notes, created_at
) VALUES 
('base-dash-001', 'DASHBOARD_METRICS', 'BASELINE', 'LOCAL_TEST', 5, 50, 50, 50, 0, 3000, 16.7, 45.2, 58.6, 60.0, 85.4, 112.0, 125.0, 0.0, 18.5, 420.0, 0.0, 'system_baseline', 'Phase 1 Baseline (No Redis, Full In-Memory Stream Filter)', CURRENT_TIMESTAMP),
('opt-dash-001', 'DASHBOARD_METRICS', 'OPTIMIZED', 'LOCAL_TEST', 5, 50, 50, 50, 0, 8, 6250.0, 0.01, 0.03, 0.03, 0.04, 0.10, 0.15, 0.0, 4.2, 310.0, 100.0, 'system_benchmark', 'Phase 2 Optimized (Redis Cache Hit + SQL Pushdown LIMIT 5)', CURRENT_TIMESTAMP),

('base-cust-001', 'CUSTOMER_PAGINATION', 'BASELINE', 'LOCAL_TEST', 5, 50, 50, 50, 0, 1900, 26.3, 24.1, 37.8, 38.0, 52.3, 76.5, 88.0, 0.0, 14.2, 435.0, 0.0, 'system_baseline', 'Phase 1 Baseline (N+1 Query on assignedTo, No Composite Index)', CURRENT_TIMESTAMP),
('opt-cust-001', 'CUSTOMER_PAGINATION', 'OPTIMIZED', 'LOCAL_TEST', 5, 50, 50, 50, 0, 215, 232.5, 1.47, 2.55, 2.28, 4.71, 7.59, 12.4, 0.0, 5.1, 315.0, 0.0, 'system_benchmark', 'Phase 2 Optimized (EntityGraph Single JOIN + V3 Composite Index)', CURRENT_TIMESTAMP),

('base-kanb-001', 'DEAL_PIPELINE_FILTER', 'BASELINE', 'LOCAL_TEST', 5, 50, 50, 50, 0, 2100, 23.8, 28.5, 41.2, 42.0, 63.4, 95.0, 108.0, 0.0, 15.6, 440.0, 0.0, 'system_baseline', 'Phase 1 Baseline (Repeated Stage Filtering in RAM)', CURRENT_TIMESTAMP),
('opt-kanb-001', 'DEAL_PIPELINE_FILTER', 'OPTIMIZED', 'LOCAL_TEST', 5, 50, 50, 50, 0, 442, 113.1, 4.06, 8.84, 6.55, 18.27, 49.68, 54.0, 0.0, 6.3, 320.0, 0.0, 'system_benchmark', 'Phase 2 Optimized (Database-level Group Aggregations + V3 Indexes)', CURRENT_TIMESTAMP);
