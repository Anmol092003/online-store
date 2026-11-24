package com.anmol.bazaar.payment.controller;

import com.anmol.bazaar.payment.dto.PaymentDtos.CreatePaymentOrderRequest;
import com.anmol.bazaar.payment.dto.PaymentDtos.VerifyPaymentRequest;
import com.anmol.bazaar.payment.model.PaymentTransaction;
import com.anmol.bazaar.payment.service.RazorpayPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class RazorpayPaymentController {

    private final RazorpayPaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody CreatePaymentOrderRequest req) {
        try {
            return ResponseEntity.ok(paymentService.createOrGetRazorpayOrder(req));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody VerifyPaymentRequest req) {
        try {
            return ResponseEntity.ok(paymentService.verifyAndPublishEvent(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/transactions")
    public List<PaymentTransaction> allTransactions() {
        return paymentService.getAllTransactions();
    }
}
