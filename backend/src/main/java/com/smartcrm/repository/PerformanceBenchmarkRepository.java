package com.smartcrm.repository;

import com.smartcrm.entity.PerformanceBenchmark;
import com.smartcrm.enums.BenchmarkRunType;
import com.smartcrm.enums.BenchmarkScenario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceBenchmarkRepository extends JpaRepository<PerformanceBenchmark, Long> {

    Optional<PerformanceBenchmark> findByRunUuid(String runUuid);

    Page<PerformanceBenchmark> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<PerformanceBenchmark> findByScenarioNameOrderByCreatedAtDesc(BenchmarkScenario scenario);

    @Query("SELECT b FROM PerformanceBenchmark b WHERE b.scenarioName = :scenario AND b.runType = :runType ORDER BY b.createdAt DESC LIMIT 1")
    Optional<PerformanceBenchmark> findLatestByScenarioAndType(
            @Param("scenario") BenchmarkScenario scenario,
            @Param("runType") BenchmarkRunType runType
    );

    @Query("SELECT DISTINCT b.scenarioName FROM PerformanceBenchmark b")
    List<BenchmarkScenario> findDistinctScenarios();
}
