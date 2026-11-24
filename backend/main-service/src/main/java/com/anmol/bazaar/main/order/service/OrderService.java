package com.anmol.bazaar.main.order.service;

import com.anmol.bazaar.main.auth.model.AppUser;
import com.anmol.bazaar.main.catalog.model.Item;
import com.anmol.bazaar.main.catalog.repository.ItemRepository;
import com.anmol.bazaar.main.notification.service.EmailNotificationService;
import com.anmol.bazaar.main.order.dto.OrderDtos.CartItemPayload;
import com.anmol.bazaar.main.order.dto.OrderDtos.CreateOrderPayload;
import com.anmol.bazaar.main.order.model.CustomerOrder;
import com.anmol.bazaar.main.order.model.OrderLineItem;
import com.anmol.bazaar.main.order.repository.CustomerOrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final CustomerOrderRepository orderRepository;
    private final ItemRepository itemRepository;
    private final EmailNotificationService emailNotificationService;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.order-created}")
    private String orderCreatedTopic;

    @Transactional
    public CustomerOrder createOrder(AppUser user, CreateOrderPayload payload) {
        if (payload.getItems() == null || payload.getItems().isEmpty()) {
            throw new IllegalArgumentException("Shopping bag is empty.");
        }

        CustomerOrder order = CustomerOrder.builder()
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .user(user)
                .shippingAddress(payload.getShippingAddress())
                .status("PENDING_PAYMENT")
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (CartItemPayload cartLine : payload.getItems()) {
            Item dbItem = itemRepository.findById(cartLine.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Item not found: " + cartLine.getItemId()));

            if (dbItem.getStockQuantity() < cartLine.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + dbItem.getName());
            }

            BigDecimal lineTotal = dbItem.getPrice().multiply(BigDecimal.valueOf(cartLine.getQuantity()));
            total = total.add(lineTotal);

            order.getItems().add(OrderLineItem.builder()
                    .order(order)
                    .itemId(dbItem.getId())
                    .itemName(dbItem.getName())
                    .imageUrl(dbItem.getImageUrl())
                    .quantity(cartLine.getQuantity())
                    .unitPrice(dbItem.getPrice())
                    .build());
        }

        order.setTotalAmount(total);
        CustomerOrder saved = orderRepository.save(order);

        // Publish OrderCreated event to Kafka asynchronously for Payment Service audit/tracking
        try {
            String eventJson = objectMapper.writeValueAsString(Map.of(
                    "orderNumber", saved.getOrderNumber(),
                    "userEmail", user.getEmail() != null ? user.getEmail() : "",
                    "totalAmount", saved.getTotalAmount()
            ));
            kafkaTemplate.send(orderCreatedTopic, saved.getOrderNumber(), eventJson);
            log.info("[KAFKA-PRODUCER] Published OrderCreated event for {}", saved.getOrderNumber());
        } catch (Exception ex) {
            log.warn("[KAFKA-PRODUCER] Kafka broker unavailable (non-blocking): {}", ex.getMessage());
        }

        return saved;
    }

    /**
     * Idempotent order confirmation handler called by Kafka Consumer (or HTTP fallback).
     * Guarantees stock is deducted and email notification is sent exactly once.
     */
    @Transactional
    public CustomerOrder confirmPaymentAndNotify(String orderNumber, String razorpayOrderId, String razorpayPaymentId) {
        CustomerOrder order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderNumber));

        // Idempotency guard: if already PAID, do not deduct stock or send duplicate emails
        if ("PAID".equalsIgnoreCase(order.getStatus())) {
            log.info("[IDEMPOTENT-ORDER] Order {} is already confirmed as PAID. Skipping duplicate processing.", orderNumber);
            return order;
        }

        order.setStatus("PAID");
        order.setRazorpayOrderId(razorpayOrderId);
        order.setRazorpayPaymentId(razorpayPaymentId);

        for (OrderLineItem line : order.getItems()) {
            itemRepository.findById(line.getItemId()).ifPresent(item -> {
                item.setStockQuantity(Math.max(0, item.getStockQuantity() - line.getQuantity()));
                itemRepository.save(item);
            });
        }

        order.setEmailNotificationSent(true);
        CustomerOrder confirmedOrder = orderRepository.save(order);

        // Dispatch confirmation email to the user's registered Gmail/Email address
        emailNotificationService.sendOrderConfirmationEmail(confirmedOrder);
        return confirmedOrder;
    }

    public List<CustomerOrder> getOrdersForUser(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<CustomerOrder> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }
}
