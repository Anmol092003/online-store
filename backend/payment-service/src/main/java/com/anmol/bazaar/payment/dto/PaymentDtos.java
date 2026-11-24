package com.anmol.bazaar.payment.dto;

import lombok.Data;
import java.math.BigDecimal;

public class PaymentDtos {

    @Data
    public static class CreatePaymentOrderRequest {
        private String appOrderNumber;
        private BigDecimal amount;
    }

    @Data
    public static class VerifyPaymentRequest {
        private String appOrderNumber;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }
}
