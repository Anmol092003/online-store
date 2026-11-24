package com.anmol.bazaar.main.common.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "idempotency_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdempotencyRecord {
    @Id
    @Column(name = "idempotency_key", length = 128)
    private String idempotencyKey;

    private String endpoint;

    private int httpStatus;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String responseBody;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
