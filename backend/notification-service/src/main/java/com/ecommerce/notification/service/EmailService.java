package com.ecommerce.notification.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${notification.from-email}")
    private String fromEmail;

    @Value("${notification.from-name}")
    private String fromName;

    @Async
    public void sendOrderConfirmation(String toEmail, String orderNumber, String customerName, String totalAmount) {
        Context ctx = new Context();
        ctx.setVariable("orderNumber", orderNumber);
        ctx.setVariable("customerName", customerName);
        ctx.setVariable("totalAmount", totalAmount);

        String html = templateEngine.process("order-confirmation", ctx);
        sendHtmlEmail(toEmail, "Order Confirmed - " + orderNumber, html);
    }

    @Async
    public void sendPaymentSuccess(String toEmail, String orderNumber, String amount) {
        Context ctx = new Context();
        ctx.setVariable("orderNumber", orderNumber);
        ctx.setVariable("amount", amount);
        String html = templateEngine.process("payment-success", ctx);
        sendHtmlEmail(toEmail, "Payment Successful - " + orderNumber, html);
    }

    @Async
    public void sendPaymentFailed(String toEmail, String orderNumber, String reason) {
        Context ctx = new Context();
        ctx.setVariable("orderNumber", orderNumber);
        ctx.setVariable("reason", reason);
        String html = templateEngine.process("payment-failed", ctx);
        sendHtmlEmail(toEmail, "Payment Failed - " + orderNumber, html);
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        Context ctx = new Context();
        ctx.setVariable("firstName", firstName);
        String html = templateEngine.process("welcome", ctx);
        sendHtmlEmail(toEmail, "Welcome to E-Commerce Store!", html);
    }

    @Async
    public void sendOtpEmail(String toEmail, String firstName, String otp) {
        Context ctx = new Context();
        ctx.setVariable("firstName", firstName);
        ctx.setVariable("otp", otp);
        String html = templateEngine.process("otp", ctx);
        sendHtmlEmail(toEmail, "Your verification code: " + otp, html);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} with subject: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}", to, e);
        }
    }
}
