package com.smartcrm.service.impl;

import com.smartcrm.dto.CreateUserRequest;
import com.smartcrm.dto.UpdateUserRequest;
import com.smartcrm.dto.UserDto;
import com.smartcrm.entity.Role;
import com.smartcrm.entity.User;
import com.smartcrm.enums.RoleName;
import com.smartcrm.exception.BadRequestException;
import com.smartcrm.exception.DuplicateResourceException;
import com.smartcrm.exception.ResourceNotFoundException;
import com.smartcrm.repository.RoleRepository;
import com.smartcrm.repository.UserRepository;
import com.smartcrm.service.AuditService;
import com.smartcrm.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAllByOrderByIdAsc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getActiveUsers() {
        return userRepository.findByActiveTrue().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null);
        user.setActive(true);
        user.setDemo(false);

        Set<Role> roles = resolveRoles(request.getRoles());
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        auditService.record("USER_CREATE", "User", savedUser.getId(),
                "Created user " + savedUser.getUsername() + " with roles: " + formatRoles(roles));

        return mapToDto(savedUser);
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        String currentUsername = getCurrentUsername();
        boolean isSelf = user.getUsername().equalsIgnoreCase(currentUsername);

        // Prevent self-deactivation
        if (isSelf && request.getActive() != null && !request.getActive()) {
            throw new BadRequestException("You cannot deactivate your own account");
        }

        user.setFullName(request.getFullName().trim());
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        // Roles update
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            // If editing own account, prevent self-removal of ROLE_ADMIN
            if (isSelf && !request.getRoles().contains("ROLE_ADMIN") && hasAdminRole(user)) {
                throw new BadRequestException("You cannot remove your own ADMIN role");
            }
            Set<Role> roles = resolveRoles(request.getRoles());
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);

        auditService.record("USER_UPDATE", "User", updatedUser.getId(),
                "Updated user profile for " + updatedUser.getUsername());

        return mapToDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        String currentUsername = getCurrentUsername();
        if (user.getUsername().equalsIgnoreCase(currentUsername)) {
            throw new BadRequestException("You cannot delete your own account");
        }

        auditService.record("USER_DELETE", "User", user.getId(), "Deleted user " + user.getUsername());
        userRepository.delete(user);
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "";
    }

    private boolean hasAdminRole(User user) {
        return user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_ADMIN);
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        for (String roleNameStr : roleNames) {
            String normalized = roleNameStr.startsWith("ROLE_") ? roleNameStr : "ROLE_" + roleNameStr;
            RoleName roleNameEnum;
            try {
                roleNameEnum = RoleName.valueOf(normalized);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role specified: " + roleNameStr);
            }
            Role role = roleRepository.findByName(roleNameEnum)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + normalized));
            roles.add(role);
        }
        return roles;
    }

    private String formatRoles(Set<Role> roles) {
        return roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", "));
    }

    private UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()),
                user.isActive(),
                user.isDemo(),
                user.getCreatedAt()
        );
    }
}
