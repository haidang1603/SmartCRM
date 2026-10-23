package com.smartcrm.service;

import com.smartcrm.dto.*;
import com.smartcrm.enums.CustomerStatus;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CustomerService {
    PageResponse<CustomerDto> getCustomers(String search, CustomerStatus status, Long assignedToId, Pageable pageable);
    CustomerDto getCustomerById(Long id);
    CustomerDto createCustomer(CustomerCreateRequest request);
    CustomerDto updateCustomer(Long id, CustomerUpdateRequest request);
    void deleteCustomer(Long id);

    CustomerInteractionDto addInteraction(Long customerId, CustomerInteractionRequest request);
    List<CustomerInteractionDto> getCustomerInteractions(Long customerId);
    List<CustomerSummaryDto> getCustomerSummaries();
}
