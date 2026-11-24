package com.anmol.bazaar.main.common.ratelimit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service-level rate limiter protecting Auth and Order APIs even if called directly bypassing the Gateway.
 */
@Component
public class ServiceRateLimitFilter extends OncePerRequestFilter {

    private static final int AUTH_LIMIT_PER_MIN = 25;
    private static final int GENERAL_LIMIT_PER_MIN = 120;
    private static final long WINDOW_MS = 60_000L;

    private static class Bucket {
        long start;
        AtomicInteger count = new AtomicInteger(0);
        Bucket(long start) { this.start = start; }
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path.startsWith("/uploads/")) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean isAuthRoute = path.startsWith("/api/auth/");
        int limit = isAuthRoute ? AUTH_LIMIT_PER_MIN : GENERAL_LIMIT_PER_MIN;
        String ip = request.getRemoteAddr();
        String bucketKey = ip + ":" + (isAuthRoute ? "AUTH" : "API");

        long now = Instant.now().toEpochMilli();
        Bucket bucket = buckets.compute(bucketKey, (k, existing) -> {
            if (existing == null || now - existing.start >= WINDOW_MS) {
                return new Bucket(now);
            }
            return existing;
        });

        if (bucket.count.incrementAndGet() > limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Too many requests. Please slow down and try again in a minute.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
