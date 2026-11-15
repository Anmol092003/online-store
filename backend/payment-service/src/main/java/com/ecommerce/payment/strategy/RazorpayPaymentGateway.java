package com.ecommerce.payment.strategy;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.util.Map;

@Component
@Slf4j
public class RazorpayPaymentGateway implements PaymentGateway {

    @Value("${payment.razorpay.key-id}")
    private String keyId;

    @Value("${payment.razorpay.key-secret}")
    private String keySecret;

    @Override
    public PaymentOrder createOrder(String orderId, BigDecimal amount, String currency) throws Exception {
        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        JSONObject options = new JSONObject();
        options.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue()); // paise
        options.put("currency", currency);
        options.put("receipt", orderId);

        Order order = client.orders.create(options);
        return new PaymentOrder(order.get("id"), keyId, amount, currency);
    }

    @Override
    public PaymentVerification verifyPayment(Map<String, String> params) throws Exception {
        String razorpayOrderId = params.get("razorpay_order_id");
        String razorpayPaymentId = params.get("razorpay_payment_id");
        String razorpaySignature = params.get("razorpay_signature");

        String payload = razorpayOrderId + "|" + razorpayPaymentId;
        String expectedSignature = computeHmacSha256(payload, keySecret);

        boolean valid = expectedSignature.equals(razorpaySignature);
        return new PaymentVerification(valid, razorpayPaymentId,
            valid ? "Payment verified" : "Invalid payment signature");
    }

    @Override
    public String getProviderName() {
        return "RAZORPAY";
    }

    private String computeHmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes());
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            hexString.append(String.format("%02x", b));
        }
        return hexString.toString();
    }
}
