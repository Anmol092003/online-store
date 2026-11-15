package com.ecommerce.payment.service;

import com.ecommerce.payment.entity.Payment;
import com.ecommerce.payment.repository.PaymentRepository;
import com.ecommerce.payment.strategy.PaymentGateway;
import com.ecommerce.payment.strategy.PaymentGatewayFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayFactory gatewayFactory;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.payment-success}")
    private String paymentSuccessTopic;

    @Value("${kafka.topics.payment-failed}")
    private String paymentFailedTopic;

    @Transactional
    public Map<String, Object> initiatePayment(Long orderId, String orderNumber, Long userId,
                                                BigDecimal amount, String currency) throws Exception {
        PaymentGateway gateway = gatewayFactory.getGateway();
        PaymentGateway.PaymentOrder order = gateway.createOrder(orderNumber, amount, currency);

        Payment payment = Payment.builder()
            .orderId(orderId)
            .orderNumber(orderNumber)
            .userId(userId)
            .amount(amount)
            .currency(currency)
            .status(Payment.PaymentStatus.INITIATED)
            .provider(Payment.PaymentProvider.valueOf(gateway.getProviderName()))
            .providerOrderId(order.providerOrderId())
            .build();

        paymentRepository.save(payment);

        return Map.of(
            "paymentId", payment.getId(),
            "providerOrderId", order.providerOrderId(),
            "clientKey", order.clientKey(),
            "amount", amount,
            "currency", currency,
            "provider", gateway.getProviderName()
        );
    }

    @Transactional
    public Payment verifyAndCapturePayment(Map<String, String> params) throws Exception {
        PaymentGateway gateway = gatewayFactory.getGateway();
        PaymentGateway.PaymentVerification result = gateway.verifyPayment(params);

        String providerOrderId = params.get("razorpay_order_id");

        Payment payment = paymentRepository.findAll().stream()
            .filter(p -> providerOrderId.equals(p.getProviderOrderId()) || providerOrderId.equals(p.getProviderPaymentId()))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Payment record not found"));

        if (result.success()) {
            payment.setStatus(Payment.PaymentStatus.CAPTURED);
            payment.setProviderPaymentId(result.transactionId());
            paymentRepository.save(payment);

            kafkaTemplate.send(paymentSuccessTopic, payment.getOrderNumber(),
                Map.of("orderId", payment.getOrderId(), "orderNumber", payment.getOrderNumber(),
                    "amount", payment.getAmount(), "paymentId", payment.getId()));
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setFailureReason(result.message());
            paymentRepository.save(payment);

            kafkaTemplate.send(paymentFailedTopic, payment.getOrderNumber(),
                Map.of("orderId", payment.getOrderId(), "orderNumber", payment.getOrderNumber(),
                    "reason", result.message()));
        }
        return payment;
    }

    public Page<Payment> getTransactionHistory(Long userId, Pageable pageable) {
        return paymentRepository.findByUserId(userId, pageable);
    }

    public Payment getPaymentByOrder(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
            .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));
    }
}
