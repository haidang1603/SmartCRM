package com.smartcrm.repository;

import com.smartcrm.entity.ReportJob;
import com.smartcrm.enums.ReportJobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportJobRepository extends JpaRepository<ReportJob, Long> {

    Optional<ReportJob> findByJobUuid(String jobUuid);

    @Query("SELECT r FROM ReportJob r JOIN FETCH r.requestedBy WHERE r.jobUuid = :jobUuid")
    Optional<ReportJob> findByJobUuidWithUser(@Param("jobUuid") String jobUuid);

    Page<ReportJob> findByRequestedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<ReportJob> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByRequestedByIdAndStatusIn(Long userId, Collection<ReportJobStatus> statuses);

    List<ReportJob> findByStatusAndExpiresAtBefore(ReportJobStatus status, Instant now);

    List<ReportJob> findByStatusAndStartedAtBefore(ReportJobStatus status, Instant threshold);
}
