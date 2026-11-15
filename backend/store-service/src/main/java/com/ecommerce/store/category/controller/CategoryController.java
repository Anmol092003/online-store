package com.ecommerce.store.category.controller;

import com.ecommerce.store.category.dto.*;
import com.ecommerce.store.category.service.CategoryService;
import com.ecommerce.store.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Category and Subcategory management")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Get all active categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllActiveCategories()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID")
    public ResponseEntity<ApiResponse<CategoryDto>> getCategoryById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getCategoryById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Create category (Admin)")
    public ResponseEntity<ApiResponse<CategoryDto>> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Category created", categoryService.createCategory(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Update category (Admin)")
    public ResponseEntity<ApiResponse<CategoryDto>> updateCategory(
            @PathVariable("id") Long id, @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Category updated", categoryService.updateCategory(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Delete category (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable("id") Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Category deleted", null));
    }

    @PostMapping("/{categoryId}/subcategories")
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Create subcategory (Admin)")
    public ResponseEntity<ApiResponse<SubcategoryDto>> createSubcategory(
            @PathVariable("categoryId") Long categoryId, @RequestBody SubcategoryDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Subcategory created", categoryService.createSubcategory(categoryId, dto)));
    }

    @DeleteMapping("/subcategories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Delete subcategory (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteSubcategory(@PathVariable("id") Long id) {
        categoryService.deleteSubcategory(id);
        return ResponseEntity.ok(ApiResponse.success("Subcategory deleted", null));
    }
}
