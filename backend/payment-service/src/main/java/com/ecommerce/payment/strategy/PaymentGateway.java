package com.ecommerce.payment.strategy;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentGateway {
    PaymentOrder createOrder(String orderId, BigDecimal amount, String currency) throws Exception;
    PaymentVerification verifyPayment(Map<String, String> params) throws Exception;
    String getProviderName();

    record PaymentOrder(String providerOrderId, String clientKey, BigDecimal amount, String currency) {}
    record PaymentVerification(boolean success, String transactionId, String message) {}
}
