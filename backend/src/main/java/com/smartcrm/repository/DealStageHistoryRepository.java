package com.smartcrm.repository;

import com.smartcrm.entity.DealStageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealStageHistoryRepository extends JpaRepository<DealStageHistory, Long> {
    @Query("SELECT h FROM DealStageHistory h LEFT JOIN FETCH h.changedBy WHERE h.deal.id = :dealId ORDER BY h.changeDate DESC")
    List<DealStageHistory> findByDealIdWithUser(@Param("dealId") Long dealId);
}
