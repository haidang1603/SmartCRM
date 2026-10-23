package com.smartcrm.service;

import com.smartcrm.dto.ChangePasswordRequest;
import com.smartcrm.dto.LoginRequest;
import com.smartcrm.dto.LoginResponse;
import com.smartcrm.dto.UserDto;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    UserDto getCurrentUser();
    void changePassword(ChangePasswordRequest request);
}
