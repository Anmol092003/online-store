# BazaarOne — General Store Microservices Platform (v2)

## Architecture Highlights
1. **Modular Monolith + Strict MVC Package Layout (`backend/main-service`):**
   - `com.anmol.bazaar.main.auth` -> `controller/`, `service/`, `repository/`, `model/`, `dto/`
   - `com.anmol.bazaar.main.catalog` -> `controller/`, `service/`, `repository/`, `model/`
   - `com.anmol.bazaar.main.order` -> `controller/`, `service/`, `repository/`, `model/`, `dto/`
   - `com.anmol.bazaar.main.notification` -> `service/` (Async Email Notification on order confirmation)
   - `com.anmol.bazaar.main.common` -> `idempotency/`, `ratelimit/`, `security/`, `config/`, `exception/`
2. **Apache Kafka Event-Driven Integration (`docker-compose.yml`):**
   - `MAIN-SERVICE` publishes `bazaar.order.created` when an order is created.
   - `PAYMENT-SERVICE` verifies Razorpay signature and publishes `bazaar.payment.confirmed` to Kafka (with automatic HTTP fallback if Kafka isn't running).
   - `MAIN-SERVICE` consumes `bazaar.payment.confirmed`, marks the order `PAID` idempotently, deducts inventory, and sends an email receipt to the customer's registered email.
3. **Idempotency & Rate Limiting:**
   - HTTP `Idempotency-Key` filter in `MAIN-SERVICE` prevents duplicate POST/PUT mutations.
   - Order-level idempotency in `OrderService` & `RazorpayPaymentService` prevents double stock deductions or duplicate emails.
   - Sliding-window Rate Limiters at both `api-gateway` (90 req/min) and `main-service` (25 req/min on `/api/auth/**`).

## Quick Start
1. **Start Kafka (optional—HTTP fallback works automatically if skipped):**
   ```bash
   docker compose up -d
   ```
2. **Start Backend Services (in order):**
   - `cd backend/service-registry && mvn spring-boot:run` *(Port 8761)*
   - `cd backend/api-gateway && mvn spring-boot:run` *(Port 8080)*
   - `cd backend/main-service && mvn spring-boot:run` *(Port 8081)*
   - `cd backend/payment-service && mvn spring-boot:run` *(Port 8082)*
3. **Configure Razorpay & Email Credentials (Optional for Live Mode):**
   - Razorpay keys: `backend/payment-service/src/main/resources/application.yml` (`razorpay.key-id`, `razorpay.key-secret`)
   - Gmail SMTP: `backend/main-service/src/main/resources/application.yml` (`spring.mail.username`, `spring.mail.password`)
4. **Start React Frontend (Light Theme General Store):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
