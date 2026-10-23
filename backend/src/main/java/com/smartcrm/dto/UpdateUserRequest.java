package com.smartcrm.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Set;

public class UpdateUserRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phoneNumber;

    private Set<String> roles;

    private Boolean active;

    public UpdateUserRequest() {}

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
