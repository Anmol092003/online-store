package com.anmol.bazaar.payment.service;

import com.anmol.bazaar.payment.dto.PaymentDtos.CreatePaymentOrderRequest;
import com.anmol.bazaar.payment.dto.PaymentDtos.VerifyPaymentRequest;
import com.anmol.bazaar.payment.model.PaymentTransaction;
import com.anmol.bazaar.payment.repository.PaymentTransactionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayPaymentService {

    private final PaymentTransactionRepository paymentRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.currency}")
    private String currency;

    @Value("${app.kafka.topics.payment-confirmed}")
    private String paymentConfirmedTopic;

    @Value("${main-service.fallback-callback-url}")
    private String fallbackCallbackUrl;

    private boolean isPlaceholderConfigured() {
        return razorpayKeyId == null || razorpayKeyId.contains("YOUR_KEY_ID_HERE")
                || razorpayKeySecret == null || razorpayKeySecret.contains("YOUR_RAZORPAY_KEY_SECRET_HERE");
    }

    @KafkaListener(
            topics = "${app.kafka.topics.order-created}",
            groupId = "payment-service-group",
            autoStartup = "${app.kafka.enabled:true}"
    )
    public void onOrderCreated(String message) {
        log.info("[KAFKA-CONSUMER] PaymentService received OrderCreated event: {}", message);
    }

    /**
     * Idempotent Razorpay order creation: if an order already exists for appOrderNumber, return it instead of creating duplicates.
     */
    @Transactional
    public Map<String, Object> createOrGetRazorpayOrder(CreatePaymentOrderRequest req) throws Exception {
        long amountInPaise = req.getAmount().multiply(BigDecimal.valueOf(100)).longValue();
        boolean sandboxSimulated = isPlaceholderConfigured();

        Optional<PaymentTransaction> existing = paymentRepository.findByAppOrderNumber(req.getAppOrderNumber());
        if (existing.isPresent()) {
            PaymentTransaction tx = existing.get();
            log.info("[IDEMPOTENT-PAYMENT] Returning existing Razorpay order {} for {}", tx.getRazorpayOrderId(), req.getAppOrderNumber());
            return Map.of(
                    "razorpayOrderId", tx.getRazorpayOrderId(),
                    "razorpayKeyId", razorpayKeyId,
                    "amountInPaise", amountInPaise,
                    "currency", currency,
                    "appOrderNumber", req.getAppOrderNumber(),
                    "sandboxSimulated", sandboxSimulated
            );
        }

        String rzpOrderId;
        if (sandboxSimulated) {
            rzpOrderId = "order_demo_" + UUID.randomUUID().toString().substring(0, 10);
        } else {
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", req.getAppOrderNumber());

            Order order = razorpay.orders.create(orderRequest);
            rzpOrderId = order.get("id");
        }

        PaymentTransaction tx = PaymentTransaction.builder()
                .appOrderNumber(req.getAppOrderNumber())
                .razorpayOrderId(rzpOrderId)
                .amount(req.getAmount())
                .currency(currency)
                .status("CREATED")
                .build();
        paymentRepository.save(tx);

        return Map.of(
                "razorpayOrderId", rzpOrderId,
                "razorpayKeyId", razorpayKeyId,
                "amountInPaise", amountInPaise,
                "currency", currency,
                "appOrderNumber", req.getAppOrderNumber(),
                "sandboxSimulated", sandboxSimulated
        );
    }

    /**
     * Verifies Razorpay signature and publishes `bazaar.payment.confirmed` to Kafka so Main Service
     * confirms the order, updates stock, and triggers email notification.
     */
    @Transactional
    public Map<String, Object> verifyAndPublishEvent(VerifyPaymentRequest req) throws Exception {
        PaymentTransaction tx = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Razorpay order not found."));

        // Idempotency guard: if already CAPTURED, return success without duplicate events
        if ("CAPTURED".equalsIgnoreCase(tx.getStatus())) {
            return Map.of(
                    "status", "CAPTURED",
                    "message", "Payment already verified!",
                    "paymentId", tx.getRazorpayPaymentId()
            );
        }

        boolean isValid;
        if (isPlaceholderConfigured() || req.getRazorpayOrderId().startsWith("order_demo_")) {
            isValid = true;
        } else {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", req.getRazorpayOrderId());
            options.put("razorpay_payment_id", req.getRazorpayPaymentId());
            options.put("razorpay_signature", req.getRazorpaySignature());
            isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);
        }

        if (!isValid) {
            tx.setStatus("FAILED");
            paymentRepository.save(tx);
            throw new IllegalArgumentException("Razorpay signature verification failed.");
        }

        tx.setRazorpayPaymentId(req.getRazorpayPaymentId());
        tx.setRazorpaySignature(req.getRazorpaySignature());
        tx.setStatus("CAPTURED");
        paymentRepository.save(tx);

        Map<String, String> eventPayload = Map.of(
                "eventId", UUID.randomUUID().toString(),
                "orderNumber", req.getAppOrderNumber(),
                "razorpayOrderId", req.getRazorpayOrderId(),
                "razorpayPaymentId", req.getRazorpayPaymentId()
        );

        try {
            String json = objectMapper.writeValueAsString(eventPayload);
            kafkaTemplate.send(paymentConfirmedTopic, req.getAppOrderNumber(), json).get();
            log.info("[KAFKA-PRODUCER] Published PaymentConfirmed event to {} for order {}",
                    paymentConfirmedTopic, req.getAppOrderNumber());
        } catch (Exception kafkaEx) {
            log.warn("[KAFKA-FALLBACK] Kafka broker unreachable ({}). Falling back to HTTP callback so order & email still complete.",
                    kafkaEx.getMessage());
            restTemplate.postForEntity(fallbackCallbackUrl, eventPayload, Map.class);
        }

        return Map.of(
                "status", "CAPTURED",
                "message", "Payment verified and order confirmed!",
                "paymentId", req.getRazorpayPaymentId()
        );
    }

    public List<PaymentTransaction> getAllTransactions() {
        return paymentRepository.findAll();
    }
}
