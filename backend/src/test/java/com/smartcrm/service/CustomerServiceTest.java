package com.smartcrm.service;

import com.smartcrm.dto.CustomerCreateRequest;
import com.smartcrm.dto.CustomerDto;
import com.smartcrm.entity.Customer;
import com.smartcrm.enums.CustomerStatus;
import com.smartcrm.exception.DuplicateResourceException;
import com.smartcrm.exception.ResourceNotFoundException;
import com.smartcrm.repository.CustomerInteractionRepository;
import com.smartcrm.repository.CustomerRepository;
import com.smartcrm.repository.UserRepository;
import com.smartcrm.service.impl.CustomerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerInteractionRepository interactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private CustomerCreateRequest createRequest;

    @BeforeEach
    void setUp() {
        createRequest = new CustomerCreateRequest();
        createRequest.setFullName("Nguyen Van A");
        createRequest.setEmail("vana@example.com");
        createRequest.setPhoneNumber("0909998888");
        createRequest.setCompanyName("Tech Corp");
        createRequest.setStatus(CustomerStatus.LEAD);
    }

    @Test
    @DisplayName("Should create customer successfully when email and phone are unique")
    void testCreateCustomer_Success() {
        when(customerRepository.existsByEmail("vana@example.com")).thenReturn(false);
        when(customerRepository.existsByPhoneNumber("0909998888")).thenReturn(false);

        Customer savedCustomer = new Customer();
        savedCustomer.setId(100L);
        savedCustomer.setFullName(createRequest.getFullName());
        savedCustomer.setEmail(createRequest.getEmail());
        savedCustomer.setPhoneNumber(createRequest.getPhoneNumber());
        savedCustomer.setCompanyName(createRequest.getCompanyName());
        savedCustomer.setStatus(CustomerStatus.LEAD);
        savedCustomer.setCreatedAt(Instant.now());
        savedCustomer.setUpdatedAt(Instant.now());

        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);

        CustomerDto result = customerService.createCustomer(createRequest);

        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals("Nguyen Van A", result.getFullName());
        assertEquals("vana@example.com", result.getEmail());
        verify(customerRepository, times(1)).save(any(Customer.class));
        verify(auditService, times(1)).record(eq("CUSTOMER_CREATE"), eq("Customer"), eq(100L), anyString());
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when email already exists")
    void testCreateCustomer_DuplicateEmail() {
        when(customerRepository.existsByEmail("vana@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> customerService.createCustomer(createRequest));
        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when phone number already exists")
    void testCreateCustomer_DuplicatePhone() {
        when(customerRepository.existsByEmail("vana@example.com")).thenReturn(false);
        when(customerRepository.existsByPhoneNumber("0909998888")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> customerService.createCustomer(createRequest));
        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when customer ID not found")
    void testGetCustomerById_NotFound() {
        when(customerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> customerService.getCustomerById(999L));
    }
}
