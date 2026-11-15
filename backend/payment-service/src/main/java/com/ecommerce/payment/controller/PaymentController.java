package com.ecommerce.payment.controller;

import com.ecommerce.payment.entity.Payment;
import com.ecommerce.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<Map<String, Object>> initiate(@RequestBody Map<String, Object> body) throws Exception {
        return ResponseEntity.ok(paymentService.initiatePayment(
            Long.valueOf(body.get("orderId").toString()),
            body.get("orderNumber").toString(),
            Long.valueOf(body.get("userId").toString()),
            new BigDecimal(body.get("amount").toString()),
            body.getOrDefault("currency", "INR").toString()
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<Payment> verify(@RequestBody Map<String, String> params) throws Exception {
        return ResponseEntity.ok(paymentService.verifyAndCapturePayment(params));
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<Page<Payment>> getHistory(@PathVariable("userId") Long userId, Pageable pageable) {
        return ResponseEntity.ok(paymentService.getTransactionHistory(userId, pageable));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<Payment> getByOrder(@PathVariable("orderId") Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentByOrder(orderId));
    }
}
