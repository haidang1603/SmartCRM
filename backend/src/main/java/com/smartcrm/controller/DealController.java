package com.smartcrm.controller;

import com.smartcrm.dto.*;
import com.smartcrm.service.DealService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/deals")
@Tag(name = "Deal Pipeline", description = "Endpoints for deal management, Kanban board, and stage transitions")
public class DealController {

    private final DealService dealService;

    public DealController(DealService dealService) {
        this.dealService = dealService;
    }

    @GetMapping
    @Operation(summary = "Get paginated deals list")
    public ResponseEntity<ApiResponse<PageResponse<DealDto>>> getDeals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<DealDto> response = dealService.getDeals(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all deals without pagination")
    public ResponseEntity<ApiResponse<List<DealDto>>> getAllDeals() {
        List<DealDto> deals = dealService.getAllDeals();
        return ResponseEntity.ok(ApiResponse.success(deals));
    }

    @GetMapping("/kanban")
    @Operation(summary = "Get Kanban board columns with grouped deals and stage sums")
    public ResponseEntity<ApiResponse<List<DealKanbanColumnDto>>> getKanbanBoard() {
        List<DealKanbanColumnDto> board = dealService.getKanbanBoard();
        return ResponseEntity.ok(ApiResponse.success("Lấy dữ liệu Kanban thành công", board));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get deal by ID")
    public ResponseEntity<ApiResponse<DealDto>> getDealById(@PathVariable Long id) {
        DealDto deal = dealService.getDealById(id);
        return ResponseEntity.ok(ApiResponse.success(deal));
    }

    @PostMapping
    @Operation(summary = "Create a new deal")
    public ResponseEntity<ApiResponse<DealDto>> createDeal(@Valid @RequestBody DealCreateRequest request) {
        DealDto created = dealService.createDeal(request);
        return new ResponseEntity<>(ApiResponse.success("Tạo cơ hội bán hàng thành công", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update deal details")
    public ResponseEntity<ApiResponse<DealDto>> updateDeal(
            @PathVariable Long id,
            @Valid @RequestBody DealUpdateRequest request
    ) {
        DealDto updated = dealService.updateDeal(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cơ hội bán hàng thành công", updated));
    }

    @PatchMapping("/{id}/stage")
    @Operation(summary = "Quickly transition deal to a new stage")
    public ResponseEntity<ApiResponse<DealDto>> updateDealStage(
            @PathVariable Long id,
            @Valid @RequestBody DealStageUpdateRequest request
    ) {
        DealDto updated = dealService.updateDealStage(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái cơ hội thành công", updated));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get stage transition history for a deal")
    public ResponseEntity<ApiResponse<List<DealStageHistoryDto>>> getDealStageHistory(@PathVariable Long id) {
        List<DealStageHistoryDto> history = dealService.getDealStageHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Delete deal by ID (Admin or Manager only)")
    public ResponseEntity<ApiResponse<Void>> deleteDeal(@PathVariable Long id) {
        dealService.deleteDeal(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cơ hội bán hàng thành công", null));
    }
}
