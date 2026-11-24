package com.anmol.bazaar.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory Sliding-Window Rate Limiter at the API Gateway (60 requests/min per client IP).
 * Works standalone without external Redis dependencies.
 */
@Component
public class GatewayRateLimitFilter implements GlobalFilter, Ordered {

    private static final int MAX_REQUESTS_PER_MINUTE = 90;
    private static final long WINDOW_MS = 60_000L;

    private static class WindowCounter {
        long windowStart;
        AtomicInteger count;

        WindowCounter(long windowStart) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(0);
        }
    }

    private final Map<String, WindowCounter> clientBuckets = new ConcurrentHashMap<>();

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        // Do not rate-limit static product images
        if (path.startsWith("/uploads/")) {
            return chain.filter(exchange);
        }

        String clientIp = exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown-client";

        long now = Instant.now().toEpochMilli();
        WindowCounter counter = clientBuckets.compute(clientIp, (ip, existing) -> {
            if (existing == null || now - existing.windowStart >= WINDOW_MS) {
                return new WindowCounter(now);
            }
            return existing;
        });

        int current = counter.count.incrementAndGet();
        int remaining = Math.max(0, MAX_REQUESTS_PER_MINUTE - current);
        exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf(remaining));

        if (current > MAX_REQUESTS_PER_MINUTE) {
            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            byte[] bytes = "{\"message\":\"Rate limit exceeded (90 req/min). Please try again shortly.\"}"
                    .getBytes(StandardCharsets.UTF_8);
            return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
        }

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
