package com.anmol.bazaar.main.catalog.controller;

import com.anmol.bazaar.main.catalog.model.Category;
import com.anmol.bazaar.main.catalog.model.Item;
import com.anmol.bazaar.main.catalog.model.SubCategory;
import com.anmol.bazaar.main.catalog.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/categories")
    public List<Category> getCategories() {
        return catalogService.getAllCategories();
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(catalogService.createCategory(category));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long id) {
        catalogService.deleteCategory(id);
        return ResponseEntity.ok(Map.of("message", "Category and associated items deleted."));
    }

    @GetMapping("/sub-categories")
    public List<SubCategory> getSubCategories(@RequestParam(required = false) Long categoryId) {
        return catalogService.getSubCategories(categoryId);
    }

    @PostMapping("/sub-categories")
    public ResponseEntity<SubCategory> createSubCategory(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String description = (String) payload.getOrDefault("description", "");
        Long categoryId = Long.valueOf(payload.get("categoryId").toString());
        return ResponseEntity.ok(catalogService.createSubCategory(name, description, categoryId));
    }

    @DeleteMapping("/sub-categories/{id}")
    public ResponseEntity<?> deleteSubCategory(@PathVariable Long id) {
        catalogService.deleteSubCategory(id);
        return ResponseEntity.ok(Map.of("message", "Sub-category and items deleted."));
    }

    @GetMapping("/items")
    public ResponseEntity<?> getItems(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long subCategoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "8") int size) {
        if (page != null) {
            Page<Item> pageResult = catalogService.searchItemsPaged(
                    categoryId, subCategoryId, search, PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "id"))
            );
            return ResponseEntity.ok(Map.of(
                    "content", pageResult.getContent(),
                    "currentPage", pageResult.getNumber(),
                    "totalPages", pageResult.getTotalPages(),
                    "totalElements", pageResult.getTotalElements(),
                    "pageSize", pageResult.getSize()
            ));
        }
        return ResponseEntity.ok(catalogService.searchItems(categoryId, subCategoryId, search));
    }

    @PostMapping(value = "/items", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Item> createItem(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") BigDecimal price,
            @RequestParam(value = "originalPrice", required = false) BigDecimal originalPrice,
            @RequestParam("stockQuantity") Integer stockQuantity,
            @RequestParam(value = "brand", required = false) String brand,
            @RequestParam(value = "unitLabel", required = false) String unitLabel,
            @RequestParam("subCategoryId") Long subCategoryId,
            @RequestParam(value = "featured", defaultValue = "false") boolean featured,
            @RequestParam("image") MultipartFile imageFile) {

        Item saved = catalogService.createItemWithLocalImage(
                name, description, price, originalPrice, stockQuantity, brand, unitLabel, subCategoryId, featured, imageFile
        );
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable Long id) {
        catalogService.deleteItem(id);
        return ResponseEntity.ok(Map.of("message", "Item deleted successfully."));
    }
}
