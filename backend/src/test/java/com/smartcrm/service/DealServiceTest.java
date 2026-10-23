package com.smartcrm.service;

import com.smartcrm.dto.DealCreateRequest;
import com.smartcrm.dto.DealDto;
import com.smartcrm.dto.DealStageUpdateRequest;
import com.smartcrm.entity.Customer;
import com.smartcrm.entity.Deal;
import com.smartcrm.entity.DealStageHistory;
import com.smartcrm.enums.DealStage;
import com.smartcrm.repository.CustomerRepository;
import com.smartcrm.repository.DealRepository;
import com.smartcrm.repository.DealStageHistoryRepository;
import com.smartcrm.repository.UserRepository;
import com.smartcrm.service.impl.DealServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DealServiceTest {

    @Mock
    private DealRepository dealRepository;

    @Mock
    private DealStageHistoryRepository dealStageHistoryRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DealServiceImpl dealService;

    private Customer sampleCustomer;
    private Deal sampleDeal;

    @BeforeEach
    void setUp() {
        sampleCustomer = new Customer();
        sampleCustomer.setId(1L);
        sampleCustomer.setFullName("Alpha Customer");

        sampleDeal = new Deal();
        sampleDeal.setId(10L);
        sampleDeal.setTitle("Enterprise CRM Solution");
        sampleDeal.setDealValue(new BigDecimal("50000000.00"));
        sampleDeal.setStage(DealStage.CONSULTING);
        sampleDeal.setProbability(40);
        sampleDeal.setCustomer(sampleCustomer);
    }

    @Test
    @DisplayName("Should update deal stage to WON and set probability to 100 and actualCloseDate to today")
    void testUpdateDealStage_ToWon() {
        when(dealRepository.findById(10L)).thenReturn(Optional.of(sampleDeal));
        when(dealRepository.save(any(Deal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DealStageUpdateRequest stageRequest = new DealStageUpdateRequest(DealStage.WON, "Khách hàng đã ký hợp đồng");
        DealDto updated = dealService.updateDealStage(10L, stageRequest);

        assertNotNull(updated);
        assertEquals(DealStage.WON, updated.getStage());
        assertEquals(100, updated.getProbability());
        assertEquals(LocalDate.now(), updated.getActualCloseDate());

        verify(dealStageHistoryRepository, times(1)).save(any(DealStageHistory.class));
        verify(auditService, times(1)).record(eq("DEAL_STAGE_CHANGE"), eq("Deal"), eq(10L), anyString());
    }

    @Test
    @DisplayName("Should update deal stage to LOST and set probability to 0")
    void testUpdateDealStage_ToLost() {
        when(dealRepository.findById(10L)).thenReturn(Optional.of(sampleDeal));
        when(dealRepository.save(any(Deal.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DealStageUpdateRequest stageRequest = new DealStageUpdateRequest(DealStage.LOST, "Khách hàng không đủ ngân sách");
        DealDto updated = dealService.updateDealStage(10L, stageRequest);

        assertNotNull(updated);
        assertEquals(DealStage.LOST, updated.getStage());
        assertEquals(0, updated.getProbability());
        assertEquals(LocalDate.now(), updated.getActualCloseDate());

        verify(dealStageHistoryRepository, times(1)).save(any(DealStageHistory.class));
    }
}
