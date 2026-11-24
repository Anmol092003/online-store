package com.anmol.bazaar.main.auth.controller;

import com.anmol.bazaar.main.auth.dto.AuthDtos.CreateSubAdminRequest;
import com.anmol.bazaar.main.auth.model.AppUser;
import com.anmol.bazaar.main.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final AuthService authService;

    @GetMapping
    public List<AppUser> getAllUsers() {
        return authService.getAllUsers();
    }

    @PostMapping("/sub-admins")
    public ResponseEntity<AppUser> createSubAdmin(@RequestBody CreateSubAdminRequest req) {
        return ResponseEntity.ok(authService.createSubAdmin(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        authService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully."));
    }
}
