package com.ecommerce.notification.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

@Service
@Slf4j
public class SmsService {

    @Value("${sms.gateway.url:}")
    private String gatewayUrl;

    @Value("${sms.default-country-code:}")
    private String defaultCountryCode;

    private RestClient restClient;

    @PostConstruct
    void init() {
        if (!StringUtils.hasText(gatewayUrl)) {
            log.warn("sms.gateway.url is not set - SMS messages will only be logged, not delivered");
            return;
        }
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));
        restClient = RestClient.builder().requestFactory(factory).build();
    }

    @Async
    public void sendOtpSms(String phone, String otp) {
        sendSms(phone, "Your E-Commerce Store verification code is " + otp + ". It expires in 10 minutes.");
    }

    public void sendSms(String phone, String body) {
        String to = normalize(phone);
        if (restClient == null) {
            log.info("[SMS DISABLED] Would send to {}: {}", to, body);
            return;
        }
        try {
            restClient.post()
                .uri(gatewayUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("phone", to, "message", body))
                .retrieve()
                .toBodilessEntity();
            log.info("SMS sent to {} via gateway", to);
        } catch (Exception e) {
            log.error("Failed to send SMS to {} via {}", to, gatewayUrl, e);
        }
    }

    private String normalize(String phone) {
        String digits = phone.replaceAll("[^\\d+]", "");
        if (digits.startsWith("+") || !StringUtils.hasText(defaultCountryCode)) {
            return digits;
        }
        return defaultCountryCode + digits;
    }
}
