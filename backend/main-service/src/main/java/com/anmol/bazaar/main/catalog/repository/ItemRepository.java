package com.anmol.bazaar.main.catalog.repository;

import com.anmol.bazaar.main.catalog.model.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findBySubCategoryId(Long subCategoryId);
    List<Item> findBySubCategoryCategoryId(Long categoryId);
    List<Item> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String desc);

    Page<Item> findBySubCategoryId(Long subCategoryId, Pageable pageable);
    Page<Item> findBySubCategoryCategoryId(Long categoryId, Pageable pageable);
    Page<Item> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String desc, Pageable pageable);

    boolean existsByNameIgnoreCase(String name);
}
