package com.smartcrm.service;

import com.smartcrm.dto.*;
import com.smartcrm.enums.DealStage;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DealService {
    PageResponse<DealDto> getDeals(Pageable pageable);
    List<DealDto> getAllDeals();
    List<DealKanbanColumnDto> getKanbanBoard();
    DealDto getDealById(Long id);
    DealDto createDeal(DealCreateRequest request);
    DealDto updateDeal(Long id, DealUpdateRequest request);
    DealDto updateDealStage(Long id, DealStageUpdateRequest request);
    List<DealStageHistoryDto> getDealStageHistory(Long dealId);
    void deleteDeal(Long id);
}
