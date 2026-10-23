package com.smartcrm.controller;

import com.smartcrm.dto.*;
import com.smartcrm.enums.CustomerStatus;
import com.smartcrm.service.CustomerService;
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
@RequestMapping("/api/v1/customers")
@Tag(name = "Customer Management", description = "Endpoints for customer CRUD, search, filtering, and interaction timeline")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    @Operation(summary = "Get paginated list of customers with search and filters")
    public ResponseEntity<ApiResponse<PageResponse<CustomerDto>>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerStatus status,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<CustomerDto> response = customerService.getCustomers(search, status, assignedToId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khách hàng thành công", response));
    }

    @GetMapping("/summaries")
    @Operation(summary = "Get list of customer summaries for lookup selectors")
    public ResponseEntity<ApiResponse<List<CustomerSummaryDto>>> getCustomerSummaries() {
        List<CustomerSummaryDto> summaries = customerService.getCustomerSummaries();
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer details by ID")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable Long id) {
        CustomerDto customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @PostMapping
    @Operation(summary = "Create a new customer")
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        CustomerDto created = customerService.createCustomer(request);
        return new ResponseEntity<>(ApiResponse.success("Tạo khách hàng mới thành công", created), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing customer")
    public ResponseEntity<ApiResponse<CustomerDto>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerUpdateRequest request
    ) {
        CustomerDto updated = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin khách hàng thành công", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Delete customer by ID (Admin or Manager only)")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa khách hàng thành công", null));
    }

    @PostMapping("/{id}/interactions")
    @Operation(summary = "Add an interaction log or note for a customer")
    public ResponseEntity<ApiResponse<CustomerInteractionDto>> addInteraction(
            @PathVariable Long id,
            @Valid @RequestBody CustomerInteractionRequest request
    ) {
        CustomerInteractionDto dto = customerService.addInteraction(id, request);
        return new ResponseEntity<>(ApiResponse.success("Thêm tương tác khách hàng thành công", dto), HttpStatus.CREATED);
    }

    @GetMapping("/{id}/interactions")
    @Operation(summary = "Get all interactions and notes for a customer")
    public ResponseEntity<ApiResponse<List<CustomerInteractionDto>>> getCustomerInteractions(@PathVariable Long id) {
        List<CustomerInteractionDto> list = customerService.getCustomerInteractions(id);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}
