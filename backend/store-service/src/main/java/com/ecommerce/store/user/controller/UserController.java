package com.ecommerce.store.user.controller;

import com.ecommerce.store.common.dto.ApiResponse;
import com.ecommerce.store.user.dto.CreateSubAdminRequest;
import com.ecommerce.store.user.dto.UpdateProfileRequest;
import com.ecommerce.store.user.dto.UserDto;
import com.ecommerce.store.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserDto>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(Long.parseLong(userDetails.getUsername()))));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Profile updated", userService.updateProfile(userId, request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Get user by ID (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Get all users (Admin only)")
    public ResponseEntity<ApiResponse<Page<UserDto>>> getAllUsers(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(pageable)));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Toggle user status (Admin only)")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(@PathVariable("id") Long id) {
        userService.toggleUserStatus(id);
        return ResponseEntity.ok(ApiResponse.success("User status toggled", null));
    }

    @PostMapping("/sub-admins")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a sub-admin (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> createSubAdmin(@Valid @RequestBody CreateSubAdminRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Sub-admin created", userService.createSubAdmin(request)));
    }

    @GetMapping("/sub-admins")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List sub-admins (Admin only)")
    public ResponseEntity<ApiResponse<Page<UserDto>>> getSubAdmins(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(userService.getSubAdmins(pageable)));
    }

    @DeleteMapping("/sub-admins/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove a sub-admin (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteSubAdmin(@PathVariable("id") Long id) {
        userService.deleteSubAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("Sub-admin removed", null));
    }
}
