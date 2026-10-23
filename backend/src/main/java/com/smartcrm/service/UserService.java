package com.smartcrm.service;

import com.smartcrm.dto.CreateUserRequest;
import com.smartcrm.dto.UpdateUserRequest;
import com.smartcrm.dto.UserDto;

import java.util.List;

public interface UserService {
    List<UserDto> getAllUsers();
    List<UserDto> getActiveUsers();
    UserDto getUserById(Long id);
    UserDto createUser(CreateUserRequest request);
    UserDto updateUser(Long id, UpdateUserRequest request);
    void deleteUser(Long id);
}
