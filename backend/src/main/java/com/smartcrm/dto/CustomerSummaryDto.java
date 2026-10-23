package com.smartcrm.dto;

public class CustomerSummaryDto {
    private Long id;
    private String fullName;
    private String email;
    private String companyName;

    public CustomerSummaryDto() {}

    public CustomerSummaryDto(Long id, String fullName, String email, String companyName) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.companyName = companyName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
}
