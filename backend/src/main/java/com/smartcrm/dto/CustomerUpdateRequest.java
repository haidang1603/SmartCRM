package com.smartcrm.dto;

import com.smartcrm.enums.CustomerStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CustomerUpdateRequest {
    @NotBlank(message = "Customer full name is required")
    @Size(max = 120, message = "Name cannot exceed 120 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 120, message = "Email cannot exceed 120 characters")
    private String email;

    @Pattern(regexp = "^$|[0-9+()\\-\\s]{7,25}", message = "Phone number contains invalid format")
    private String phoneNumber;

    @Size(max = 150, message = "Company name cannot exceed 150 characters")
    private String companyName;

    private CustomerStatus status;

    private Long assignedToId;

    @Size(max = 2000, message = "Notes cannot exceed 2000 characters")
    private String notes;

    public CustomerUpdateRequest() {}

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public CustomerStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerStatus status) {
        this.status = status;
    }

    public Long getAssignedToId() {
        return assignedToId;
    }

    public void setAssignedToId(Long assignedToId) {
        this.assignedToId = assignedToId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
