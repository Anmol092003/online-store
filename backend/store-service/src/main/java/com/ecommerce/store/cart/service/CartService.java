package com.ecommerce.store.cart.service;

import com.ecommerce.store.cart.dto.CartDto;
import com.ecommerce.store.cart.dto.CartItemDto;
import com.ecommerce.store.cart.entity.Cart;
import com.ecommerce.store.cart.entity.CartItem;
import com.ecommerce.store.cart.repository.CartRepository;
import com.ecommerce.store.common.exception.BadRequestException;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import com.ecommerce.store.product.entity.Product;
import com.ecommerce.store.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    public CartDto getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> createCart(userId));
        return toDto(cart);
    }

    @Transactional
    public CartDto addItem(Long userId, Long productId, int quantity) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        if (product.getStatus() != Product.ProductStatus.ACTIVE) {
            throw new BadRequestException("Product is not available");
        }
        if (product.getStockQuantity() < quantity) {
            throw new BadRequestException("Insufficient stock. Available: " + product.getStockQuantity());
        }

        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> createCart(userId));

        BigDecimal price = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();

        cart.getItems().stream()
            .filter(item -> item.getProductId().equals(productId))
            .findFirst()
            .ifPresentOrElse(
                item -> item.setQuantity(item.getQuantity() + quantity),
                () -> cart.getItems().add(CartItem.builder()
                    .cart(cart)
                    .productId(productId)
                    .quantity(quantity)
                    .unitPrice(price)
                    .build())
            );

        return toDto(cartRepository.save(cart));
    }

    @Transactional
    public CartDto updateItemQuantity(Long userId, Long itemId, int quantity) {
        Cart cart = findCartByUser(userId);
        CartItem item = cart.getItems().stream()
            .filter(i -> i.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (quantity <= 0) {
            cart.getItems().remove(item);
        } else {
            item.setQuantity(quantity);
        }
        return toDto(cartRepository.save(cart));
    }

    @Transactional
    public CartDto removeItem(Long userId, Long itemId) {
        Cart cart = findCartByUser(userId);
        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        return toDto(cartRepository.save(cart));
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = findCartByUser(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private Cart createCart(Long userId) {
        return cartRepository.save(Cart.builder().userId(userId).build());
    }

    private Cart findCartByUser(Long userId) {
        return cartRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));
    }

    private CartDto toDto(Cart cart) {
        var items = cart.getItems().stream().map(item -> {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            return CartItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(product != null ? product.getName() : "Unknown")
                .productImageUrl(product != null ? product.getImageUrl() : null)
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .build();
        }).collect(Collectors.toList());

        BigDecimal total = items.stream()
            .map(CartItemDto::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartDto.builder()
            .id(cart.getId())
            .userId(cart.getUserId())
            .items(items)
            .totalAmount(total)
            .totalItems(items.stream().mapToInt(CartItemDto::getQuantity).sum())
            .build();
    }
}
