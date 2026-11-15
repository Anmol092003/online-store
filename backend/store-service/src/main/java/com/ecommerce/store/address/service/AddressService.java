package com.ecommerce.store.address.service;

import com.ecommerce.store.address.dto.AddressRequest;
import com.ecommerce.store.address.entity.Address;
import com.ecommerce.store.address.repository.AddressRepository;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;

    public List<Address> getUserAddresses(Long userId) {
        return addressRepository.findByUserId(userId);
    }

    @Transactional
    public Address addAddress(Long userId, AddressRequest request) {
        if (request.isDefaultAddress()) {
            addressRepository.clearDefaultAddresses(userId);
        }
        Address address = Address.builder()
            .userId(userId)
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .houseNumber(request.getHouseNumber())
            .street(request.getStreet())
            .city(request.getCity())
            .state(request.getState())
            .country(request.getCountry())
            .zipCode(request.getZipCode())
            .defaultAddress(request.isDefaultAddress())
            .build();
        return addressRepository.save(address);
    }

    @Transactional
    public Address updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = findByIdAndUser(addressId, userId);
        if (request.isDefaultAddress()) {
            addressRepository.clearDefaultAddresses(userId);
        }
        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setHouseNumber(request.getHouseNumber());
        address.setStreet(request.getStreet());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setCountry(request.getCountry());
        address.setZipCode(request.getZipCode());
        address.setDefaultAddress(request.isDefaultAddress());
        return addressRepository.save(address);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        addressRepository.delete(findByIdAndUser(addressId, userId));
    }

    private Address findByIdAndUser(Long addressId, Long userId) {
        return addressRepository.findById(addressId)
            .filter(a -> a.getUserId().equals(userId))
            .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
    }
}
