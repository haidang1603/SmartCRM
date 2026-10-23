package com.smartcrm.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class PasswordHashTest {

    @Test
    void generateAndVerifyPasswords() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String adminHash = encoder.encode("Admin@123");
        String managerHash = encoder.encode("Manager@123");
        String salesHash = encoder.encode("Sales@123");

        System.out.println("ADMIN_HASH=" + adminHash);
        System.out.println("MANAGER_HASH=" + managerHash);
        System.out.println("SALES_HASH=" + salesHash);

        assertTrue(encoder.matches("Admin@123", adminHash));
        assertTrue(encoder.matches("Manager@123", managerHash));
        assertTrue(encoder.matches("Sales@123", salesHash));
    }
}
