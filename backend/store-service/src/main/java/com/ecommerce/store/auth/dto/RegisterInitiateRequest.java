package com.ecommerce.store.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterInitiateRequest {
    @Size(max = 50)
    private String firstName;

    @Size(max = 50)
    private String lastName;

    private String email;

    private String phone;

    @Size(min = 8, max = 100)
    private String password;
}
