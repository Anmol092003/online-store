package com.anmol.bazaar.main.common.idempotency;

import com.anmol.bazaar.main.common.model.IdempotencyRecord;
import com.anmol.bazaar.main.common.repository.IdempotencyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Guarantees idempotent execution for mutating POST/PUT requests carrying `Idempotency-Key`.
 * Prevents duplicate orders or duplicate catalog creations on double-clicks or network retries.
 */
@Component
@RequiredArgsConstructor
public class IdempotencyFilter extends OncePerRequestFilter {

    private final IdempotencyRepository idempotencyRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String method = request.getMethod();
        String key = request.getHeader("Idempotency-Key");

        if ((!"POST".equalsIgnoreCase(method) && !"PUT".equalsIgnoreCase(method))
                || key == null || key.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        String scopedKey = request.getRequestURI() + "::" + key.trim();
        Optional<IdempotencyRecord> cached = idempotencyRepository.findById(scopedKey);
        if (cached.isPresent()) {
            IdempotencyRecord record = cached.get();
            response.setStatus(record.getHttpStatus());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("X-Idempotent-Replay", "true");
            response.getWriter().write(record.getResponseBody());
            return;
        }

        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
        filterChain.doFilter(request, responseWrapper);

        int status = responseWrapper.getStatus();
        if (status >= 200 && status < 300) {
            String body = new String(responseWrapper.getContentAsByteArray(), StandardCharsets.UTF_8);
            idempotencyRepository.save(IdempotencyRecord.builder()
                    .idempotencyKey(scopedKey)
                    .endpoint(request.getRequestURI())
                    .httpStatus(status)
                    .responseBody(body)
                    .build());
        }
        responseWrapper.copyBodyToResponse();
    }
}
