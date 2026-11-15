package com.ecommerce.store.user.service;

import com.ecommerce.store.common.exception.BadRequestException;
import com.ecommerce.store.common.exception.ConflictException;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import com.ecommerce.store.user.dto.CreateSubAdminRequest;
import com.ecommerce.store.user.dto.UpdateProfileRequest;
import com.ecommerce.store.user.dto.UserDto;
import com.ecommerce.store.user.entity.User;
import com.ecommerce.store.user.mapper.UserMapper;
import com.ecommerce.store.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserDto getUserById(Long id) {
        return userMapper.toDto(findById(id));
    }

    public UserDto getUserByEmail(String email) {
        return userMapper.toDto(userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email)));
    }

    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findById(userId);

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null && !request.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(request.getPhone())) {
                throw new ConflictException("Phone number already in use");
            }
            user.setPhone(request.getPhone());
        }
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());

        return userMapper.toDto(userRepository.save(user));
    }

    public Page<UserDto> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toDto);
    }

    @Transactional
    public void toggleUserStatus(Long userId) {
        User user = findById(userId);
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
    }

    @Transactional
    public UserDto createSubAdmin(CreateSubAdminRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ConflictException("Phone number already in use");
        }
        User subAdmin = User.builder()
            .firstName("Sub Admin")
            .phone(request.getPhone())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(User.Role.ROLE_SUB_ADMIN)
            .enabled(true)
            .build();
        return userMapper.toDto(userRepository.save(subAdmin));
    }

    public Page<UserDto> getSubAdmins(Pageable pageable) {
        return userRepository.findByRole(User.Role.ROLE_SUB_ADMIN, pageable).map(userMapper::toDto);
    }

    @Transactional
    public void deleteSubAdmin(Long userId) {
        User user = findById(userId);
        if (user.getRole() != User.Role.ROLE_SUB_ADMIN) {
            throw new BadRequestException("User is not a sub-admin");
        }
        userRepository.delete(user);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }
}
