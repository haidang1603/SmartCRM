package com.smartcrm.controller;

import com.smartcrm.dto.*;
import com.smartcrm.service.AuditService;
import com.smartcrm.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Endpoints for user login, logout, profile and password management")
public class AuthController {

    private final AuthService authService;
    private final AuditService auditService;

    public AuthController(AuthService authService, AuditService auditService) {
        this.authService = authService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and issue JWT token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        UserDto userDto = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công", userDto));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user and record audit log")
    public ResponseEntity<ApiResponse<String>> logout(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            auditService.record("AUTH_LOGOUT", "User", null, "User logged out");
        }
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change current user's password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }
}
