package com.anmol.bazaar.main.common.repository;

import com.anmol.bazaar.main.common.model.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IdempotencyRepository extends JpaRepository<IdempotencyRecord, String> {
}
