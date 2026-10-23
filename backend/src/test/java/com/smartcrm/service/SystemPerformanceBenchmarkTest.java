package com.smartcrm.service;

import com.smartcrm.dto.CustomerSummaryDto;
import com.smartcrm.dto.DashboardMetricsDto;
import com.smartcrm.dto.DealKanbanColumnDto;
import com.smartcrm.entity.Customer;
import com.smartcrm.entity.Deal;
import com.smartcrm.entity.User;
import com.smartcrm.enums.CustomerStatus;
import com.smartcrm.enums.DealStage;
import com.smartcrm.repository.CustomerRepository;
import com.smartcrm.repository.DealRepository;
import com.smartcrm.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class SystemPerformanceBenchmarkTest {

    private static final Logger log = LoggerFactory.getLogger(SystemPerformanceBenchmarkTest.class);

    @Autowired
    private CustomerService customerService;

    @Autowired
    private DealService dealService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private DealRepository dealRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired(required = false)
    private org.springframework.cache.CacheManager cacheManager;

    private static boolean dataSeeded = false;
    private static final int SEED_SIZE = 500;
    private static final int BENCHMARK_ITERATIONS = 50;

    @BeforeEach
    void seedBenchmarkDataset() {
        if (cacheManager != null) {
            for (String name : cacheManager.getCacheNames()) {
                org.springframework.cache.Cache cache = cacheManager.getCache(name);
                if (cache != null) {
                    cache.clear();
                }
            }
        }
        if (customerRepository.count() >= SEED_SIZE) {
            return;
        }

        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.executeWithoutResult(status -> {
            User sales = userRepository.findByUsername("sales").orElseThrow();
            User admin = userRepository.findByUsername("admin").orElseThrow();
            List<User> assignees = List.of(sales, admin);

            List<Customer> customersToSave = new ArrayList<>(SEED_SIZE);
            List<CustomerStatus> statuses = List.of(CustomerStatus.LEAD, CustomerStatus.PROSPECT, CustomerStatus.ACTIVE_CLIENT, CustomerStatus.INACTIVE);

            for (int i = 1; i <= SEED_SIZE; i++) {
                Customer c = new Customer();
                c.setFullName("Benchmark Client " + i);
                c.setEmail("bench.client" + i + "@benchmark-corp.com");
                c.setPhoneNumber(String.format("098%07d", i));
                c.setCompanyName("Enterprise Corp #" + (i % 20));
                c.setStatus(statuses.get(i % statuses.size()));
                c.setAssignedTo(assignees.get(i % assignees.size()));
                c.setNotes("Synthetic test record for Phase 2 performance profiling");
                customersToSave.add(c);
            }
            List<Customer> savedCustomers = customerRepository.saveAll(customersToSave);

            List<Deal> dealsToSave = new ArrayList<>(SEED_SIZE);
            List<DealStage> stages = List.of(DealStage.NEW, DealStage.CONSULTING, DealStage.NEGOTIATION, DealStage.WON, DealStage.LOST);

            for (int i = 0; i < SEED_SIZE; i++) {
                Customer c = savedCustomers.get(i);
                Deal d = new Deal();
                d.setTitle("Enterprise Contract License #" + (i + 1));
                d.setDealValue(BigDecimal.valueOf(10_000_000L + (i * 250_000L)));
                d.setStage(stages.get(i % stages.size()));
                d.setProbability((i % 5 + 1) * 20);
                d.setCustomer(c);
                d.setAssignedTo(c.getAssignedTo());
                d.setExpectedCloseDate(LocalDate.now().plusDays((i % 60) + 1));
                if (d.getStage() == DealStage.WON) {
                    d.setActualCloseDate(LocalDate.now().minusDays(i % 30));
                }
                dealsToSave.add(d);
            }
            dealRepository.saveAll(dealsToSave);
        });

        dataSeeded = true;
        log.info("Successfully seeded {} benchmark customers and {} deals.", SEED_SIZE, SEED_SIZE);
    }

    public static class LatencyStats {
        public final String workloadName;
        public final int sampleCount;
        public final double minMs;
        public final double avgMs;
        public final double p50Ms;
        public final double p95Ms;
        public final double p99Ms;
        public final double throughputOpsPerSec;

        public LatencyStats(String workloadName, List<Long> durationsNanos) {
            this.workloadName = workloadName;
            this.sampleCount = durationsNanos.size();
            List<Double> msList = durationsNanos.stream().map(d -> d / 1_000_000.0).sorted().toList();
            this.minMs = msList.get(0);
            this.avgMs = msList.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            this.p50Ms = getPercentile(msList, 50);
            this.p95Ms = getPercentile(msList, 95);
            this.p99Ms = getPercentile(msList, 99);
            double totalSec = (durationsNanos.stream().mapToLong(Long::longValue).sum()) / 1_000_000_000.0;
            this.throughputOpsPerSec = totalSec > 0 ? sampleCount / totalSec : 0.0;
        }

        private static double getPercentile(List<Double> sorted, int percentile) {
            int index = (int) Math.ceil((percentile / 100.0) * sorted.size()) - 1;
            return sorted.get(Math.max(0, Math.min(index, sorted.size() - 1)));
        }

        @Override
        public String toString() {
            return String.format(
                    "BENCHMARK_RESULT | %-35s | N=%d | min=%.2fms | avg=%.2fms | p50=%.2fms | p95=%.2fms | p99=%.2fms | throughput=%.1f ops/s",
                    workloadName, sampleCount, minMs, avgMs, p50Ms, p95Ms, p99Ms, throughputOpsPerSec
            );
        }
    }

    @Test
    @DisplayName("Benchmark Workload 1: Dashboard Metrics Aggregation & Recent Deals Pushdown")
    void benchmarkDashboardMetrics() {
        // Cold start (miss)
        long startCold = System.nanoTime();
        DashboardMetricsDto coldMetrics = dashboardService.getDashboardMetrics();
        long coldDurationMs = (System.nanoTime() - startCold) / 1_000_000;
        assertNotNull(coldMetrics);
        assertTrue(coldMetrics.getTotalCustomers() >= SEED_SIZE);
        assertEquals(5, coldMetrics.getRecentDeals().size(), "Recent deals must strictly be 5 from SQL pushdown");

        // Warm benchmark iterations
        List<Long> latencies = new ArrayList<>(BENCHMARK_ITERATIONS);
        for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
            long t0 = System.nanoTime();
            DashboardMetricsDto m = dashboardService.getDashboardMetrics();
            long t1 = System.nanoTime();
            assertNotNull(m);
            latencies.add(t1 - t0);
        }

        LatencyStats stats = new LatencyStats("Dashboard Metrics (Optimized)", latencies);
        System.out.println("BENCHMARK_RESULT | Cold execution = " + coldDurationMs + " ms");
        System.out.println(stats.toString());
    }

    @Test
    @DisplayName("Benchmark Workload 2: Customer Search, Pagination and EntityGraph N+1 Avoidance")
    void benchmarkCustomerSearchAndPagination() {
        List<Long> latencies = new ArrayList<>(BENCHMARK_ITERATIONS);

        for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
            int pageIndex = i % 10;
            long t0 = System.nanoTime();
            var page = customerService.getCustomers("Benchmark", null, null, PageRequest.of(pageIndex, 15));
            long t1 = System.nanoTime();
            assertFalse(page.getContent().isEmpty());
            // Verify assignedTo is hydrated without causing exceptions or nulls
            assertNotNull(page.getContent().get(0).getAssignedToName());
            latencies.add(t1 - t0);
        }

        LatencyStats stats = new LatencyStats("Customer Search & Page (EntityGraph)", latencies);
        System.out.println(stats.toString());
    }

    @Test
    @DisplayName("Benchmark Workload 3: Customer DTO Summaries Projection")
    void benchmarkCustomerSummariesProjection() {
        List<Long> latencies = new ArrayList<>(BENCHMARK_ITERATIONS);

        for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
            long t0 = System.nanoTime();
            List<CustomerSummaryDto> summaries = customerService.getCustomerSummaries();
            long t1 = System.nanoTime();
            assertFalse(summaries.isEmpty());
            latencies.add(t1 - t0);
        }

        LatencyStats stats = new LatencyStats("Customer Summaries (DTO Projection)", latencies);
        System.out.println(stats.toString());
    }

    @Test
    @DisplayName("Benchmark Workload 4: Deal Kanban Board Multi-stage Aggregation")
    void benchmarkDealKanbanBoard() {
        List<Long> latencies = new ArrayList<>(BENCHMARK_ITERATIONS);

        for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
            long t0 = System.nanoTime();
            List<DealKanbanColumnDto> board = dealService.getKanbanBoard();
            long t1 = System.nanoTime();
            assertEquals(5, board.size());
            latencies.add(t1 - t0);
        }

        LatencyStats stats = new LatencyStats("Deal Kanban Board (DB Aggregated)", latencies);
        System.out.println(stats.toString());
    }
}
