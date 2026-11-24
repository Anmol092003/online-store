package com.anmol.bazaar.main.notification.service;

import com.anmol.bazaar.main.order.model.CustomerOrder;
import com.anmol.bazaar.main.order.model.OrderLineItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendOrderConfirmationEmail(CustomerOrder order) {
        String recipientEmail = order.getUser().getEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.info("[EMAIL-NOTIFY] Order {} confirmed for user {} (no registered email on file; skipping email).",
                    order.getOrderNumber(), order.getUser().getFullName());
            return;
        }

        StringBuilder body = new StringBuilder();
        body.append("Hi ").append(order.getUser().getFullName()).append(",\n\n");
        body.append("Thank you for shopping at BazaarOne General Store! Your payment has been confirmed.\n\n");
        body.append("Order Number: ").append(order.getOrderNumber()).append("\n");
        body.append("Razorpay Payment ID: ").append(order.getRazorpayPaymentId()).append("\n");
        body.append("Delivery Address: ").append(order.getShippingAddress()).append("\n\n");
        body.append("Items Purchased:\n");

        for (OrderLineItem line : order.getItems()) {
            body.append(" - ")
                .append(line.getItemName())
                .append(" (Qty: ").append(line.getQuantity()).append(")")
                .append(" — ₹").append(line.getUnitPrice())
                .append("\n");
        }

        body.append("\nTotal Paid: ₹").append(order.getTotalAmount()).append("\n\n");
        body.append("We are packing your order now and will notify you once dispatched.\n");
        body.append("— Team BazaarOne General Store");

        if (fromEmail == null || fromEmail.contains("your_store_email@gmail.com")) {
            log.info("================ [SIMULATED ORDER CONFIRMATION EMAIL] ================");
            log.info("To: {}", recipientEmail);
            log.info("Subject: Order Confirmed! #{} — BazaarOne General Store", order.getOrderNumber());
            log.info("Body:\n{}", body);
            log.info("======================================================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(recipientEmail);
            message.setSubject("Order Confirmed! #" + order.getOrderNumber() + " — BazaarOne General Store");
            message.setText(body.toString());
            mailSender.send(message);
            log.info("[EMAIL-NOTIFY] Order confirmation email sent to {}", recipientEmail);
        } catch (Exception ex) {
            log.error("[EMAIL-NOTIFY] Failed to send email to {}: {}", recipientEmail, ex.getMessage());
        }
    }
}
