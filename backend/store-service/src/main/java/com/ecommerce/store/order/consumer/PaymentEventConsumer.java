package com.ecommerce.store.order.consumer;

import com.ecommerce.store.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    private final OrderService orderService;

    @KafkaListener(topics = "${kafka.topics.payment-success}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentSuccess(Map<String, Object> event) {
        Long orderId = toLong(event.get("orderId"));
        String paymentId = event.get("paymentId") == null ? null : event.get("paymentId").toString();
        if (orderId != null) {
            orderService.markPaymentSuccessful(orderId, paymentId);
        }
    }

    @KafkaListener(topics = "${kafka.topics.payment-failed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentFailed(Map<String, Object> event) {
        Long orderId = toLong(event.get("orderId"));
        if (orderId != null) {
            orderService.markPaymentFailed(orderId);
        }
    }

    private Long toLong(Object value) {
        try {
            return value == null ? null : Long.valueOf(value.toString());
        } catch (NumberFormatException exception) {
            log.warn("Ignoring payment event with invalid orderId: {}", value);
            return null;
        }
    }
}