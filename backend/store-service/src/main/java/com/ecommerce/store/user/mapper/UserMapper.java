package com.ecommerce.store.user.mapper;

import com.ecommerce.store.user.dto.UserDto;
import com.ecommerce.store.user.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);
    User toEntity(UserDto dto);
}
