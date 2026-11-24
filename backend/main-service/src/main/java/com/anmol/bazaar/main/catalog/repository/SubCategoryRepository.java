package com.anmol.bazaar.main.catalog.repository;

import com.anmol.bazaar.main.catalog.model.SubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {
    List<SubCategory> findByCategoryId(Long categoryId);
    Optional<SubCategory> findByNameIgnoreCaseAndCategoryId(String name, Long categoryId);
}
