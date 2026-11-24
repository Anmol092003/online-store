package com.anmol.bazaar.main.order.service;

import com.anmol.bazaar.main.order.dto.OrderDtos.PaymentConfirmedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventKafkaListener {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "${app.kafka.topics.payment-confirmed}",
            groupId = "main-service-group",
            autoStartup = "${app.kafka.enabled:true}"
    )
    public void onPaymentConfirmed(String payload) {
        try {
            PaymentConfirmedEvent event = objectMapper.readValue(payload, PaymentConfirmedEvent.class);
            log.info("[KAFKA-CONSUMER] Received PaymentConfirmed event for order {} (paymentId={})",
                    event.getOrderNumber(), event.getRazorpayPaymentId());

            orderService.confirmPaymentAndNotify(
                    event.getOrderNumber(),
                    event.getRazorpayOrderId(),
                    event.getRazorpayPaymentId()
            );
        } catch (Exception ex) {
            log.error("[KAFKA-CONSUMER] Failed processing payment event: {}", ex.getMessage(), ex);
        }
    }
}
