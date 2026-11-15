package com.ecommerce.payment.strategy;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PaymentGatewayFactory {

    @Value("${payment.provider}")
    private String activeProvider;

    private final List<PaymentGateway> gateways;

    public PaymentGateway getGateway() {
        return gateways.stream()
            .filter(g -> g.getProviderName().equalsIgnoreCase(activeProvider))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Unknown payment provider: " + activeProvider));
    }

    public PaymentGateway getGateway(String provider) {
        return gateways.stream()
            .filter(g -> g.getProviderName().equalsIgnoreCase(provider))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("Unknown payment provider: " + provider));
    }
}
