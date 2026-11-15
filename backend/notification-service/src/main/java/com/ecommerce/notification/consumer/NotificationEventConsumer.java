package com.ecommerce.notification.consumer;

import com.ecommerce.notification.service.EmailService;
import com.ecommerce.notification.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final EmailService emailService;
    private final SmsService smsService;

    @KafkaListener(topics = "${kafka.topics.order-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOrderCreated(Map<String, Object> event) {
        log.info("Received ORDER_CREATED event: {}", event);
        try {
            String userEmail = (String) event.get("userEmail");
            String orderNumber = (String) event.get("orderNumber");
            Object totalAmountObj = event.get("totalAmount");
            String totalAmount = totalAmountObj != null ? totalAmountObj.toString() : "0";

            if (userEmail != null) {
                emailService.sendOrderConfirmation(userEmail, orderNumber, "Customer", totalAmount);
            }
        } catch (Exception e) {
            log.error("Error processing ORDER_CREATED event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "${kafka.topics.payment-success}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentSuccess(Map<String, Object> event) {
        log.info("Received PAYMENT_SUCCESS event: {}", event);
        try {
            String orderNumber = (String) event.get("orderNumber");
            Object amountObj = event.get("amount");
            // In real app, fetch user email from store service via Feign
            log.info("Payment success for order: {}, amount: {}", orderNumber, amountObj);
        } catch (Exception e) {
            log.error("Error processing PAYMENT_SUCCESS event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "${kafka.topics.payment-failed}", groupId = "${spring.kafka.consumer.group-id}")
    public void onPaymentFailed(Map<String, Object> event) {
        log.info("Received PAYMENT_FAILED event: {}", event);
        try {
            String orderNumber = (String) event.get("orderNumber");
            String reason = (String) event.get("reason");
            log.info("Payment failed for order: {}, reason: {}", orderNumber, reason);
        } catch (Exception e) {
            log.error("Error processing PAYMENT_FAILED event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "${kafka.topics.user-registered}", groupId = "${spring.kafka.consumer.group-id}")
    public void onUserRegistered(Map<String, Object> event) {
        log.info("Received USER_REGISTERED event: {}", event);
        try {
            String email = (String) event.get("email");
            String firstName = (String) event.get("firstName");
            if (email != null) {
                emailService.sendWelcomeEmail(email, firstName);
            }
        } catch (Exception e) {
            log.error("Error processing USER_REGISTERED event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "${kafka.topics.otp-generated}", groupId = "${spring.kafka.consumer.group-id}")
    public void onOtpGenerated(Map<String, Object> event) {
        String email = (String) event.get("email");
        String phone = (String) event.get("phone");
        log.info("Received OTP_GENERATED event for email={}, phone={}", email, phone);
        try {
            String firstName = (String) event.get("firstName");
            String otp = (String) event.get("otp");
            if (email != null && !email.isBlank()) {
                emailService.sendOtpEmail(email, firstName, otp);
            }
            if (phone != null && !phone.isBlank()) {
                smsService.sendOtpSms(phone, otp);
            }
        } catch (Exception e) {
            log.error("Error processing OTP_GENERATED event", e);
        }
    }
}
