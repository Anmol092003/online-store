package com.anmol.bazaar.main.order.controller;

import com.anmol.bazaar.main.auth.model.AppUser;
import com.anmol.bazaar.main.order.dto.OrderDtos.CreateOrderPayload;
import com.anmol.bazaar.main.order.model.CustomerOrder;
import com.anmol.bazaar.main.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<CustomerOrder> createOrder(
            @AuthenticationPrincipal AppUser user,
            @RequestBody CreateOrderPayload payload) {
        return ResponseEntity.ok(orderService.createOrder(user, payload));
    }

    @GetMapping("/my")
    public List<CustomerOrder> myOrders(@AuthenticationPrincipal AppUser user) {
        return orderService.getOrdersForUser(user.getId());
    }

    @GetMapping("/all")
    public List<CustomerOrder> allOrders() {
        return orderService.getAllOrders();
    }

    // Fallback HTTP endpoint if Kafka broker is offline during local dev
    @PostMapping("/confirm-payment")
    public ResponseEntity<CustomerOrder> confirmPayment(@RequestBody Map<String, String> payload) {
        CustomerOrder confirmed = orderService.confirmPaymentAndNotify(
                payload.get("orderNumber"),
                payload.get("razorpayOrderId"),
                payload.get("razorpayPaymentId")
        );
        return ResponseEntity.ok(confirmed);
    }
}
