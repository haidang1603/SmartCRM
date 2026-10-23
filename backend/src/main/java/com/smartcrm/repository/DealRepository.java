package com.smartcrm.repository;

import com.smartcrm.entity.Deal;
import com.smartcrm.enums.DealStage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long>, JpaSpecificationExecutor<Deal> {

    @Override
    @EntityGraph(attributePaths = {"customer", "assignedTo"})
    org.springframework.data.domain.Page<Deal> findAll(org.springframework.data.jpa.domain.Specification<Deal> spec, Pageable pageable);

    List<Deal> findByStage(DealStage stage);

    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.customer LEFT JOIN FETCH d.assignedTo ORDER BY d.createdAt DESC")
    List<Deal> findAllWithDetails();

    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.customer LEFT JOIN FETCH d.assignedTo ORDER BY d.createdAt DESC")
    List<Deal> findRecentDeals(Pageable pageable);

    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.customer LEFT JOIN FETCH d.assignedTo WHERE d.stage = :stage ORDER BY d.createdAt DESC")
    List<Deal> findByStageWithDetails(@Param("stage") DealStage stage);

    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.customer LEFT JOIN FETCH d.assignedTo WHERE d.stage = :stage ORDER BY d.createdAt DESC")
    List<Deal> findByStageWithDetailsPaged(@Param("stage") DealStage stage, Pageable pageable);

    @Query("SELECT COUNT(d) FROM Deal d WHERE d.stage IN :stages")
    long countByStageIn(@Param("stages") Collection<DealStage> stages);

    @Query("SELECT COALESCE(SUM(d.dealValue), 0) FROM Deal d WHERE d.stage = :stage")
    BigDecimal sumDealValueByStage(@Param("stage") DealStage stage);

    @Query("SELECT COALESCE(SUM(d.dealValue), 0) FROM Deal d WHERE d.stage IN :stages")
    BigDecimal sumDealValueByStageIn(@Param("stages") Collection<DealStage> stages);

    @Query("SELECT d.stage, COUNT(d), COALESCE(SUM(d.dealValue), 0) FROM Deal d GROUP BY d.stage")
    List<Object[]> getStageAggregations();

    long countByIsDemo(boolean isDemo);
}
