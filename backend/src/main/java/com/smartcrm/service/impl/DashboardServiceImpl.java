package com.smartcrm.service.impl;

import com.smartcrm.config.CacheConfig;
import com.smartcrm.dto.DashboardMetricsDto;
import com.smartcrm.dto.DealDto;
import com.smartcrm.dto.StageStatDto;
import com.smartcrm.entity.Deal;
import com.smartcrm.enums.DealStage;
import com.smartcrm.repository.CustomerRepository;
import com.smartcrm.repository.DealRepository;
import com.smartcrm.service.DashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class DashboardServiceImpl implements DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardServiceImpl.class);

    private final CustomerRepository customerRepository;
    private final DealRepository dealRepository;

    public DashboardServiceImpl(CustomerRepository customerRepository, DealRepository dealRepository) {
        this.customerRepository = customerRepository;
        this.dealRepository = dealRepository;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CACHE_DASHBOARD_METRICS, key = "'overview'")
    public DashboardMetricsDto getDashboardMetrics() {
        log.debug("Cache miss on dashboard metrics. Calculating aggregations from database...");
        DashboardMetricsDto dto = new DashboardMetricsDto();

        // Customer metrics (Count queries using indexes)
        long totalCustomers = customerRepository.count();
        long realCustomers = customerRepository.countRealCustomers();
        long demoCustomers = customerRepository.countDemoCustomers();
        dto.setTotalCustomers(totalCustomers);
        dto.setRealCustomersCount(realCustomers);
        dto.setDemoCustomersCount(demoCustomers);

        // Deal metrics (Database-level sums avoiding loading rows into memory)
        List<DealStage> openStages = List.of(DealStage.NEW, DealStage.CONSULTING, DealStage.NEGOTIATION);
        long openDeals = dealRepository.countByStageIn(openStages);
        BigDecimal pipelineValue = dealRepository.sumDealValueByStageIn(openStages);
        BigDecimal wonRevenue = dealRepository.sumDealValueByStage(DealStage.WON);

        dto.setOpenDealsCount(openDeals);
        dto.setTotalPipelineValue(pipelineValue != null ? pipelineValue : BigDecimal.ZERO);
        dto.setWonRevenue(wonRevenue != null ? wonRevenue : BigDecimal.ZERO);

        // Stage aggregations (GROUP BY at database layer)
        List<Object[]> aggResults = dealRepository.getStageAggregations();
        Map<DealStage, StageStatDto> statMap = new EnumMap<>(DealStage.class);
        for (DealStage stage : DealStage.values()) {
            statMap.put(stage, new StageStatDto(stage, getStageLabel(stage), 0L, BigDecimal.ZERO));
        }

        for (Object[] row : aggResults) {
            DealStage stage = (DealStage) row[0];
            long count = ((Number) row[1]).longValue();
            BigDecimal totalVal = (BigDecimal) row[2];
            statMap.put(stage, new StageStatDto(stage, getStageLabel(stage), count, totalVal));
        }

        dto.setStageBreakdown(new ArrayList<>(statMap.values()));

        // OPTIMIZATION: Pushed LIMIT 5 directly down to MySQL instead of loading entire table to RAM!
        List<Deal> recentDeals = dealRepository.findRecentDeals(PageRequest.of(0, 5));
        List<DealDto> recent = recentDeals.stream()
                .map(this::mapDealToDto)
                .toList();
        dto.setRecentDeals(recent);

        // Demo data indicator
        long demoDeals = dealRepository.countByIsDemo(true);
        boolean hasDemo = demoCustomers > 0 || demoDeals > 0;
        dto.setContainsDemoData(hasDemo);
        if (hasDemo) {
            dto.setDataModeNotice(String.format(
                    "Hệ thống đang hiển thị %d khách hàng demo & %d khách hàng thực tế được lưu trữ an toàn trong MySQL.",
                    demoCustomers, realCustomers
            ));
        } else {
            dto.setDataModeNotice("100% dữ liệu thực tế trong hệ sinh thái sản phẩm.");
        }

        return dto;
    }

    private String getStageLabel(DealStage stage) {
        return switch (stage) {
            case NEW -> "Mới tạo";
            case CONSULTING -> "Tư vấn";
            case NEGOTIATION -> "Đàm phán";
            case WON -> "Thành công";
            case LOST -> "Thất bại";
        };
    }

    private DealDto mapDealToDto(Deal deal) {
        DealDto d = new DealDto();
        d.setId(deal.getId());
        d.setTitle(deal.getTitle());
        d.setDealValue(deal.getDealValue());
        d.setStage(deal.getStage());
        d.setProbability(deal.getProbability());
        d.setExpectedCloseDate(deal.getExpectedCloseDate());
        d.setActualCloseDate(deal.getActualCloseDate());
        d.setDemo(deal.isDemo());
        d.setCreatedAt(deal.getCreatedAt());

        if (deal.getCustomer() != null) {
            d.setCustomerId(deal.getCustomer().getId());
            d.setCustomerName(deal.getCustomer().getFullName());
            d.setCustomerCompany(deal.getCustomer().getCompanyName());
        }

        if (deal.getAssignedTo() != null) {
            d.setAssignedToId(deal.getAssignedTo().getId());
            d.setAssignedToName(deal.getAssignedTo().getFullName());
        }

        return d;
    }
}
