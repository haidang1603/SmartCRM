package com.smartcrm.service.impl;

import com.smartcrm.config.CacheConfig;
import com.smartcrm.dto.*;
import com.smartcrm.entity.Customer;
import com.smartcrm.entity.Deal;
import com.smartcrm.entity.DealStageHistory;
import com.smartcrm.entity.User;
import com.smartcrm.enums.DealStage;
import com.smartcrm.exception.ResourceNotFoundException;
import com.smartcrm.repository.CustomerRepository;
import com.smartcrm.repository.DealRepository;
import com.smartcrm.repository.DealStageHistoryRepository;
import com.smartcrm.repository.UserRepository;
import com.smartcrm.service.AuditService;
import com.smartcrm.service.DealService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DealServiceImpl implements DealService {

    private final DealRepository dealRepository;
    private final DealStageHistoryRepository dealStageHistoryRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public DealServiceImpl(DealRepository dealRepository,
                           DealStageHistoryRepository dealStageHistoryRepository,
                           CustomerRepository customerRepository,
                           UserRepository userRepository,
                           AuditService auditService) {
        this.dealRepository = dealRepository;
        this.dealStageHistoryRepository = dealStageHistoryRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DealDto> getDeals(Pageable pageable) {
        Page<Deal> page = dealRepository.findAll(pageable);
        List<DealDto> dtoList = page.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return PageResponse.of(page, dtoList);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DealDto> getAllDeals() {
        return dealRepository.findAllWithDetails().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DealKanbanColumnDto> getKanbanBoard() {
        // Fetch stage aggregations at database level (count + total value)
        List<Object[]> aggResults = dealRepository.getStageAggregations();
        Map<DealStage, Long> countMap = new EnumMap<>(DealStage.class);
        Map<DealStage, BigDecimal> valueMap = new EnumMap<>(DealStage.class);

        for (DealStage stage : DealStage.values()) {
            countMap.put(stage, 0L);
            valueMap.put(stage, BigDecimal.ZERO);
        }

        for (Object[] row : aggResults) {
            DealStage stage = (DealStage) row[0];
            countMap.put(stage, ((Number) row[1]).longValue());
            valueMap.put(stage, (BigDecimal) row[2]);
        }

        List<DealKanbanColumnDto> columns = new ArrayList<>();
        for (DealStage stage : DealStage.values()) {
            DealKanbanColumnDto col = new DealKanbanColumnDto(stage, getStageDisplayName(stage));
            col.setCount(countMap.get(stage));
            col.setTotalValue(valueMap.get(stage));

            // Load top 100 active deals per stage with JOIN FETCH to prevent memory overload
            List<Deal> stageDeals = dealRepository.findByStageWithDetailsPaged(stage, PageRequest.of(0, 100));
            col.setDeals(stageDeals.stream().map(this::mapToDto).collect(Collectors.toList()));

            columns.add(col);
        }

        return columns;
    }

    @Override
    @Transactional(readOnly = true)
    public DealDto getDealById(Long id) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", id));
        return mapToDto(deal);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_DASHBOARD_METRICS, allEntries = true)
    public DealDto createDeal(DealCreateRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        Deal deal = new Deal();
        deal.setTitle(request.getTitle().trim());
        deal.setDealValue(request.getDealValue());
        deal.setStage(request.getStage() != null ? request.getStage() : DealStage.NEW);

        if (request.getProbability() != null) {
            deal.setProbability(request.getProbability());
        } else {
            deal.updateDefaultProbability();
        }

        deal.setCustomer(customer);
        deal.setExpectedCloseDate(request.getExpectedCloseDate());
        deal.setNotes(request.getNotes());
        deal.setDemo(false);

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            deal.setAssignedTo(assignedTo);
        }

        if (deal.getStage() == DealStage.WON) {
            deal.setActualCloseDate(LocalDate.now());
            deal.setProbability(100);
        } else if (deal.getStage() == DealStage.LOST) {
            deal.setActualCloseDate(LocalDate.now());
            deal.setProbability(0);
        }

        Deal savedDeal = dealRepository.save(deal);

        // Record initial history
        User currentUser = getCurrentUserEntity();
        DealStageHistory history = new DealStageHistory(savedDeal, null, savedDeal.getStage(), currentUser, "Deal created");
        dealStageHistoryRepository.save(history);

        auditService.record("DEAL_CREATE", "Deal", savedDeal.getId(),
                "Created deal: " + savedDeal.getTitle() + " with value " + savedDeal.getDealValue());

        return mapToDto(savedDeal);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_DASHBOARD_METRICS, allEntries = true)
    public DealDto updateDeal(Long id, DealUpdateRequest request) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", id));

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        DealStage oldStage = deal.getStage();
        DealStage newStage = request.getStage() != null ? request.getStage() : oldStage;

        deal.setTitle(request.getTitle().trim());
        deal.setDealValue(request.getDealValue());
        deal.setCustomer(customer);
        deal.setExpectedCloseDate(request.getExpectedCloseDate());
        deal.setActualCloseDate(request.getActualCloseDate());
        deal.setNotes(request.getNotes());

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            deal.setAssignedTo(assignedTo);
        } else {
            deal.setAssignedTo(null);
        }

        if (oldStage != newStage) {
            applyStageRules(deal, newStage);
            User currentUser = getCurrentUserEntity();
            DealStageHistory history = new DealStageHistory(deal, oldStage, newStage, currentUser, "Stage updated via deal update");
            dealStageHistoryRepository.save(history);
        } else if (request.getProbability() != null) {
            deal.setProbability(request.getProbability());
        }

        Deal updatedDeal = dealRepository.save(deal);

        auditService.record("DEAL_UPDATE", "Deal", updatedDeal.getId(),
                "Updated deal details for: " + updatedDeal.getTitle());

        return mapToDto(updatedDeal);
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_DASHBOARD_METRICS, allEntries = true)
    public DealDto updateDealStage(Long id, DealStageUpdateRequest request) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", id));

        DealStage oldStage = deal.getStage();
        DealStage newStage = request.getNewStage();

        if (oldStage == newStage) {
            return mapToDto(deal);
        }

        applyStageRules(deal, newStage);

        Deal updatedDeal = dealRepository.save(deal);

        User currentUser = getCurrentUserEntity();
        DealStageHistory history = new DealStageHistory(updatedDeal, oldStage, newStage, currentUser, request.getComment());
        dealStageHistoryRepository.save(history);

        auditService.record("DEAL_STAGE_CHANGE", "Deal", updatedDeal.getId(),
                "Stage moved from " + oldStage + " to " + newStage + " (" + request.getComment() + ")");

        return mapToDto(updatedDeal);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DealStageHistoryDto> getDealStageHistory(Long dealId) {
        if (!dealRepository.existsById(dealId)) {
            throw new ResourceNotFoundException("Deal", "id", dealId);
        }
        return dealStageHistoryRepository.findByDealIdWithUser(dealId).stream()
                .map(this::mapHistoryToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_DASHBOARD_METRICS, allEntries = true)
    public void deleteDeal(Long id) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal", "id", id));

        auditService.record("DEAL_DELETE", "Deal", deal.getId(), "Deleted deal: " + deal.getTitle());
        dealRepository.delete(deal);
    }

    private void applyStageRules(Deal deal, DealStage newStage) {
        deal.setStage(newStage);
        if (newStage == DealStage.WON) {
            deal.setActualCloseDate(LocalDate.now());
            deal.setProbability(100);
        } else if (newStage == DealStage.LOST) {
            deal.setActualCloseDate(LocalDate.now());
            deal.setProbability(0);
        } else {
            deal.setActualCloseDate(null);
            deal.updateDefaultProbability();
        }
    }

    private User getCurrentUserEntity() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return userRepository.findByUsernameOrEmail(auth.getName(), auth.getName()).orElse(null);
        }
        return null;
    }

    private String getStageDisplayName(DealStage stage) {
        return switch (stage) {
            case NEW -> "Mới tạo (New)";
            case CONSULTING -> "Tư vấn (Consulting)";
            case NEGOTIATION -> "Đàm phán (Negotiation)";
            case WON -> "Thành công (Won)";
            case LOST -> "Thất bại (Lost)";
        };
    }

    private DealDto mapToDto(Deal deal) {
        DealDto dto = new DealDto();
        dto.setId(deal.getId());
        dto.setTitle(deal.getTitle());
        dto.setDealValue(deal.getDealValue());
        dto.setStage(deal.getStage());
        dto.setProbability(deal.getProbability());
        dto.setExpectedCloseDate(deal.getExpectedCloseDate());
        dto.setActualCloseDate(deal.getActualCloseDate());
        dto.setNotes(deal.getNotes());
        dto.setDemo(deal.isDemo());
        dto.setCreatedAt(deal.getCreatedAt());
        dto.setUpdatedAt(deal.getUpdatedAt());

        if (deal.getCustomer() != null) {
            dto.setCustomerId(deal.getCustomer().getId());
            dto.setCustomerName(deal.getCustomer().getFullName());
            dto.setCustomerCompany(deal.getCustomer().getCompanyName());
        }

        if (deal.getAssignedTo() != null) {
            dto.setAssignedToId(deal.getAssignedTo().getId());
            dto.setAssignedToName(deal.getAssignedTo().getFullName());
        }

        return dto;
    }

    private DealStageHistoryDto mapHistoryToDto(DealStageHistory history) {
        DealStageHistoryDto dto = new DealStageHistoryDto();
        dto.setId(history.getId());
        dto.setDealId(history.getDeal().getId());
        dto.setPreviousStage(history.getPreviousStage());
        dto.setNewStage(history.getNewStage());
        dto.setChangeDate(history.getChangeDate());
        dto.setComment(history.getComment());

        if (history.getChangedBy() != null) {
            dto.setChangedById(history.getChangedBy().getId());
            dto.setChangedByName(history.getChangedBy().getFullName());
        }

        return dto;
    }
}
