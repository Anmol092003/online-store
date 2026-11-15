package com.ecommerce.store.address.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank private String fullName;
    @NotBlank private String phone;
    private String houseNumber;
    private String street;
    @NotBlank private String city;
    @NotBlank private String state;
    @NotBlank private String country;
    @NotBlank private String zipCode;
    private boolean defaultAddress;
}
