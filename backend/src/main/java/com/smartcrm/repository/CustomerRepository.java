package com.smartcrm.repository;

import com.smartcrm.dto.CustomerSummaryDto;
import com.smartcrm.entity.Customer;
import com.smartcrm.enums.CustomerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    long countByStatus(CustomerStatus status);
    long countByIsDemo(boolean isDemo);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.isDemo = false")
    long countRealCustomers();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.isDemo = true")
    long countDemoCustomers();

    /**
     * DTO Projection: Fetch only lightweight columns required for dropdown selectors,
     * avoiding full entity hydration and large notes column loads.
     */
    @Query("SELECT new com.smartcrm.dto.CustomerSummaryDto(c.id, c.fullName, c.email, c.companyName) FROM Customer c ORDER BY c.fullName ASC")
    List<CustomerSummaryDto> findCustomerSummariesProjected();

    /**
     * EntityGraph: Eagerly fetch assignedTo user with a single LEFT JOIN,
     * completely eliminating N+1 queries when mapping to DTOs.
     */
    @Override
    @EntityGraph(attributePaths = {"assignedTo"})
    Page<Customer> findAll(Specification<Customer> spec, Pageable pageable);
}
