package com.ecommerce.store.order.service;

import com.ecommerce.store.cart.service.CartService;
import com.ecommerce.store.common.exception.BadRequestException;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import com.ecommerce.store.order.dto.OrderDto;
import com.ecommerce.store.order.entity.Order;
import com.ecommerce.store.order.entity.OrderItem;
import com.ecommerce.store.order.event.OrderCreatedEvent;
import com.ecommerce.store.order.repository.OrderRepository;
import com.ecommerce.store.product.entity.Product;
import com.ecommerce.store.product.repository.ProductRepository;
import com.ecommerce.store.user.entity.User;
import com.ecommerce.store.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.order-created}")
    private String orderCreatedTopic;

    @Transactional
    public OrderDto placeOrder(Long userId, Long addressId, String paymentMethod) {
        var cart = cartService.getCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        List<OrderItem> orderItems = cart.getItems().stream().map(cartItem -> {
            Product product = productRepository.findById(cartItem.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for: " + product.getName());
            }
            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);

            return OrderItem.builder()
                .productId(cartItem.getProductId())
                .productName(cartItem.getProductName())
                .quantity(cartItem.getQuantity())
                .unitPrice(cartItem.getUnitPrice())
                .totalPrice(cartItem.getTotalPrice())
                .build();
        }).collect(Collectors.toList());

        BigDecimal total = orderItems.stream()
            .map(OrderItem::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean cashOnDelivery = "COD".equalsIgnoreCase(paymentMethod);
        if (!cashOnDelivery && !"ONLINE".equalsIgnoreCase(paymentMethod)) {
            throw new BadRequestException("Unsupported payment method");
        }

        Order order = Order.builder()
            .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
            .userId(userId)
            .addressId(addressId)
            .totalAmount(total)
            .paymentStatus(Order.PaymentStatus.PENDING)
            .orderStatus(cashOnDelivery ? Order.OrderStatus.CONFIRMED : Order.OrderStatus.PENDING)
            .build();

        orderItems.forEach(item -> item.setOrder(order));
        order.setItems(orderItems);

        Order saved = orderRepository.save(order);
        cartService.clearCart(userId);

        // Publish ORDER_CREATED event
        User user = userRepository.findById(userId).orElseThrow();
        publishOrderCreatedEvent(saved, user);

        return toDto(saved);
    }

    public Page<OrderDto> getUserOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable).map(this::toDto);
    }

    public OrderDto getOrderById(Long orderId) {
        return toDto(orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId)));
    }

    public Page<OrderDto> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        order.setOrderStatus(status);
        return toDto(orderRepository.save(order));
    }

    @Transactional
    public OrderDto cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (!order.getUserId().equals(userId)) {
            throw new BadRequestException("You cannot cancel this order");
        }
        if (order.getOrderStatus() != Order.OrderStatus.PENDING) {
            throw new BadRequestException("Only pending orders can be cancelled");
        }
        order.setPaymentStatus(Order.PaymentStatus.FAILED);
        order.setOrderStatus(Order.OrderStatus.CANCELLED);
        return toDto(orderRepository.save(order));
    }

    @Transactional
    public void markPaymentSuccessful(Long orderId, String paymentId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if (order.getOrderStatus() == Order.OrderStatus.PENDING) {
                order.setPaymentStatus(Order.PaymentStatus.PAID);
                order.setPaymentId(paymentId);
                order.setOrderStatus(Order.OrderStatus.CONFIRMED);
                orderRepository.save(order);
            }
        });
    }

    @Transactional
    public void markPaymentFailed(Long orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if (order.getOrderStatus() == Order.OrderStatus.PENDING) {
                order.setPaymentStatus(Order.PaymentStatus.FAILED);
                order.setOrderStatus(Order.OrderStatus.CANCELLED);
                orderRepository.save(order);
            }
        });
    }

    private void publishOrderCreatedEvent(Order order, User user) {
        try {
            var event = OrderCreatedEvent.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(user.getId())
                .userEmail(user.getEmail())
                .totalAmount(order.getTotalAmount())
                .createdAt(LocalDateTime.now())
                .items(order.getItems().stream().map(i ->
                    OrderCreatedEvent.OrderItemEvent.builder()
                        .productId(i.getProductId())
                        .productName(i.getProductName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .build()
                ).collect(Collectors.toList()))
                .build();
            kafkaTemplate.send(orderCreatedTopic, order.getOrderNumber(), event);
        } catch (Exception e) {
            log.error("Failed to publish order created event: {}", e.getMessage());
        }
    }

    private OrderDto toDto(Order o) {
        return OrderDto.builder()
            .id(o.getId())
            .orderNumber(o.getOrderNumber())
            .userId(o.getUserId())
            .addressId(o.getAddressId())
            .totalAmount(o.getTotalAmount())
            .paymentStatus(o.getPaymentStatus())
            .orderStatus(o.getOrderStatus())
            .createdAt(o.getCreatedAt())
            .items(o.getItems().stream().map(i -> OrderDto.OrderItemDto.builder()
                .productId(i.getProductId())
                .productName(i.getProductName())
                .quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice())
                .totalPrice(i.getTotalPrice())
                .build()).collect(Collectors.toList()))
            .build();
    }
}
