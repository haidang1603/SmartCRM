package com.smartcrm.service.impl;

import com.smartcrm.config.CacheConfig;
import com.smartcrm.dto.*;
import com.smartcrm.entity.Customer;
import com.smartcrm.entity.CustomerInteraction;
import com.smartcrm.entity.User;
import com.smartcrm.enums.CustomerStatus;
import com.smartcrm.exception.DuplicateResourceException;
import com.smartcrm.exception.ResourceNotFoundException;
import com.smartcrm.repository.CustomerInteractionRepository;
import com.smartcrm.repository.CustomerRepository;
import com.smartcrm.repository.UserRepository;
import com.smartcrm.service.AuditService;
import com.smartcrm.service.CustomerService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerInteractionRepository interactionRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public CustomerServiceImpl(CustomerRepository customerRepository,
                               CustomerInteractionRepository interactionRepository,
                               UserRepository userRepository,
                               AuditService auditService) {
        this.customerRepository = customerRepository;
        this.interactionRepository = interactionRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerDto> getCustomers(String search, CustomerStatus status, Long assignedToId, Pageable pageable) {
        Specification<Customer> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), pattern);
                Predicate phoneMatch = cb.like(cb.lower(root.get("phoneNumber")), pattern);
                Predicate companyMatch = cb.like(cb.lower(root.get("companyName")), pattern);
                predicates.add(cb.or(nameMatch, emailMatch, phoneMatch, companyMatch));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (assignedToId != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), assignedToId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Uses EntityGraph defined in CustomerRepository to eliminate N+1 queries on assignedTo relation!
        Page<Customer> customerPage = customerRepository.findAll(spec, pageable);
        List<CustomerDto> dtoList = customerPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PageResponse.of(customerPage, dtoList);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));
        return mapToDto(customer);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.CACHE_DASHBOARD_METRICS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_CUSTOMER_SUMMARIES, allEntries = true)
    })
    public CustomerDto createCustomer(CustomerCreateRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (customerRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Customer with email '" + email + "' already exists");
        }

        if (StringUtils.hasText(request.getPhoneNumber())) {
            String phone = request.getPhoneNumber().trim();
            if (customerRepository.existsByPhoneNumber(phone)) {
                throw new DuplicateResourceException("Customer with phone number '" + phone + "' already exists");
            }
        }

        Customer customer = new Customer();
        customer.setFullName(request.getFullName().trim());
        customer.setEmail(email);
        customer.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null);
        customer.setCompanyName(request.getCompanyName() != null ? request.getCompanyName().trim() : null);
        customer.setStatus(request.getStatus() != null ? request.getStatus() : CustomerStatus.LEAD);
        customer.setNotes(request.getNotes());
        customer.setDemo(false);

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            customer.setAssignedTo(assignedTo);
        }

        Customer savedCustomer = customerRepository.save(customer);

        auditService.record("CUSTOMER_CREATE", "Customer", savedCustomer.getId(),
                "Created customer: " + savedCustomer.getFullName() + " (" + savedCustomer.getEmail() + ")");

        return mapToDto(savedCustomer);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.CACHE_DASHBOARD_METRICS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_CUSTOMER_SUMMARIES, allEntries = true)
    })
    public CustomerDto updateCustomer(Long id, CustomerUpdateRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        String email = request.getEmail().trim().toLowerCase();
        if (customerRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateResourceException("Customer with email '" + email + "' already exists");
        }

        if (StringUtils.hasText(request.getPhoneNumber())) {
            String phone = request.getPhoneNumber().trim();
            if (customerRepository.existsByPhoneNumberAndIdNot(phone, id)) {
                throw new DuplicateResourceException("Customer with phone number '" + phone + "' already exists");
            }
        }

        customer.setFullName(request.getFullName().trim());
        customer.setEmail(email);
        customer.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null);
        customer.setCompanyName(request.getCompanyName() != null ? request.getCompanyName().trim() : null);
        if (request.getStatus() != null) {
            customer.setStatus(request.getStatus());
        }
        customer.setNotes(request.getNotes());

        if (request.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            customer.setAssignedTo(assignedTo);
        } else {
            customer.setAssignedTo(null);
        }

        Customer updatedCustomer = customerRepository.save(customer);

        auditService.record("CUSTOMER_UPDATE", "Customer", updatedCustomer.getId(),
                "Updated customer details for: " + updatedCustomer.getFullName());

        return mapToDto(updatedCustomer);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.CACHE_DASHBOARD_METRICS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_CUSTOMER_SUMMARIES, allEntries = true)
    })
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", id));

        auditService.record("CUSTOMER_DELETE", "Customer", customer.getId(),
                "Deleted customer: " + customer.getFullName());

        customerRepository.delete(customer);
    }

    @Override
    @Transactional
    public CustomerInteractionDto addInteraction(Long customerId, CustomerInteractionRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        CustomerInteraction interaction = new CustomerInteraction();
        interaction.setCustomer(customer);
        interaction.setInteractionType(request.getInteractionType());
        interaction.setSummary(request.getSummary().trim());
        interaction.setDetails(request.getDetails());
        interaction.setInteractionDate(request.getInteractionDate() != null ? request.getInteractionDate() : Instant.now());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            userRepository.findByUsernameOrEmail(auth.getName(), auth.getName())
                    .ifPresent(interaction::setPerformedBy);
        }

        CustomerInteraction saved = interactionRepository.save(interaction);

        auditService.record("CUSTOMER_INTERACTION_ADD", "CustomerInteraction", saved.getId(),
                "Added interaction [" + saved.getInteractionType() + "] for customer ID " + customerId);

        return mapInteractionToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerInteractionDto> getCustomerInteractions(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer", "id", customerId);
        }
        return interactionRepository.findByCustomerIdOrderByInteractionDateDesc(customerId).stream()
                .map(this::mapInteractionToDto)
                .collect(Collectors.toList());
    }

    /**
     * Optimized Projection with Redis Caching:
     * Executes single lightweight query and caches results for fast dropdown selection.
     */
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CACHE_CUSTOMER_SUMMARIES, key = "'all'")
    public List<CustomerSummaryDto> getCustomerSummaries() {
        return customerRepository.findCustomerSummariesProjected();
    }

    private CustomerDto mapToDto(Customer customer) {
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setFullName(customer.getFullName());
        dto.setEmail(customer.getEmail());
        dto.setPhoneNumber(customer.getPhoneNumber());
        dto.setCompanyName(customer.getCompanyName());
        dto.setStatus(customer.getStatus());
        dto.setNotes(customer.getNotes());
        dto.setDemo(customer.isDemo());
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setUpdatedAt(customer.getUpdatedAt());

        if (customer.getAssignedTo() != null) {
            dto.setAssignedToId(customer.getAssignedTo().getId());
            dto.setAssignedToName(customer.getAssignedTo().getFullName());
        }

        return dto;
    }

    private CustomerInteractionDto mapInteractionToDto(CustomerInteraction interaction) {
        CustomerInteractionDto dto = new CustomerInteractionDto();
        dto.setId(interaction.getId());
        dto.setCustomerId(interaction.getCustomer().getId());
        dto.setInteractionType(interaction.getInteractionType());
        dto.setSummary(interaction.getSummary());
        dto.setDetails(interaction.getDetails());
        dto.setInteractionDate(interaction.getInteractionDate());
        dto.setCreatedAt(interaction.getCreatedAt());

        if (interaction.getPerformedBy() != null) {
            dto.setPerformedById(interaction.getPerformedBy().getId());
            dto.setPerformedByName(interaction.getPerformedBy().getFullName());
        }

        return dto;
    }
}
