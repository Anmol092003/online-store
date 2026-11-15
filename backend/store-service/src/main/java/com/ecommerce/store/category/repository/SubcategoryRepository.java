package com.ecommerce.store.category.repository;

import com.ecommerce.store.category.entity.Subcategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubcategoryRepository extends JpaRepository<Subcategory, Long> {
    List<Subcategory> findByCategoryId(Long categoryId);
    List<Subcategory> findByCategoryIdAndActiveTrue(Long categoryId);
}
