package com.anmol.bazaar.main.catalog.service;

import com.anmol.bazaar.main.catalog.model.Category;
import com.anmol.bazaar.main.catalog.model.Item;
import com.anmol.bazaar.main.catalog.model.SubCategory;
import com.anmol.bazaar.main.catalog.repository.CategoryRepository;
import com.anmol.bazaar.main.catalog.repository.ItemRepository;
import com.anmol.bazaar.main.catalog.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final ItemRepository itemRepository;
    private final CloudinaryStorageService imageStorageService;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(Category category) {
        if (categoryRepository.existsByNameIgnoreCase(category.getName().trim())) {
            throw new IllegalArgumentException("Category already exists.");
        }
        category.setName(category.getName().trim());
        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new IllegalArgumentException("Category not found.");
        }
        List<SubCategory> subs = subCategoryRepository.findByCategoryId(id);
        for (SubCategory sub : subs) {
            List<Item> items = itemRepository.findBySubCategoryId(sub.getId());
            items.forEach(item -> imageStorageService.deleteImageIfExists(item.getImageUrl()));
            itemRepository.deleteAll(items);
        }
        subCategoryRepository.deleteAll(subs);
        categoryRepository.deleteById(id);
    }

    public List<SubCategory> getSubCategories(Long categoryId) {
        if (categoryId != null) {
            return subCategoryRepository.findByCategoryId(categoryId);
        }
        return subCategoryRepository.findAll();
    }

    public SubCategory createSubCategory(String name, String description, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Parent category not found."));
        return subCategoryRepository.save(SubCategory.builder()
                .name(name.trim())
                .description(description)
                .category(category)
                .build());
    }

    @Transactional
    public void deleteSubCategory(Long id) {
        if (!subCategoryRepository.existsById(id)) {
            throw new IllegalArgumentException("Sub-category not found.");
        }
        List<Item> items = itemRepository.findBySubCategoryId(id);
        items.forEach(item -> imageStorageService.deleteImageIfExists(item.getImageUrl()));
        itemRepository.deleteAll(items);
        subCategoryRepository.deleteById(id);
    }

    public List<Item> searchItems(Long categoryId, Long subCategoryId, String search) {
        if (search != null && !search.isBlank()) {
            return itemRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search.trim(), search.trim());
        }
        if (subCategoryId != null) {
            return itemRepository.findBySubCategoryId(subCategoryId);
        }
        if (categoryId != null) {
            return itemRepository.findBySubCategoryCategoryId(categoryId);
        }
        return itemRepository.findAll();
    }

    public Page<Item> searchItemsPaged(Long categoryId, Long subCategoryId, String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return itemRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search.trim(), search.trim(), pageable);
        }
        if (subCategoryId != null) {
            return itemRepository.findBySubCategoryId(subCategoryId, pageable);
        }
        if (categoryId != null) {
            return itemRepository.findBySubCategoryCategoryId(categoryId, pageable);
        }
        return itemRepository.findAll(pageable);
    }

    public Item createItemWithLocalImage(
            String name,
            String description,
            BigDecimal price,
            BigDecimal originalPrice,
            Integer stockQuantity,
            String brand,
            String unitLabel,
            Long subCategoryId,
            boolean featured,
            MultipartFile imageFile) {

        SubCategory subCategory = subCategoryRepository.findById(subCategoryId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid sub-category selected."));

        String storedImageUrl = imageStorageService.storeImage(imageFile);

        Item item = Item.builder()
                .name(name.trim())
                .description(description)
                .price(price)
                .originalPrice(originalPrice != null ? originalPrice : price.multiply(BigDecimal.valueOf(1.15)))
                .stockQuantity(stockQuantity)
                .brand(brand != null && !brand.isBlank() ? brand : "BazaarOne Select")
                .unitLabel(unitLabel != null && !unitLabel.isBlank() ? unitLabel : "1 Unit")
                .imageUrl(storedImageUrl)
                .subCategory(subCategory)
                .featured(featured)
                .build();

        return itemRepository.save(item);
    }

    public void deleteItem(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found."));
        imageStorageService.deleteImageIfExists(item.getImageUrl());
        itemRepository.delete(item);
    }
}
