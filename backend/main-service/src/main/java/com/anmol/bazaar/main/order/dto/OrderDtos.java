package com.anmol.bazaar.main.order.dto;

import lombok.Data;
import java.util.List;

public class OrderDtos {

    @Data
    public static class CartItemPayload {
        private Long itemId;
        private Integer quantity;
    }

    @Data
    public static class CreateOrderPayload {
        private String shippingAddress;
        private List<CartItemPayload> items;
    }

    @Data
    public static class PaymentConfirmedEvent {
        private String eventId;
        private String orderNumber;
        private String razorpayOrderId;
        private String razorpayPaymentId;
    }
}
