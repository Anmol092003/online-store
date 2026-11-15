package com.ecommerce.store.product.controller;

import com.ecommerce.store.common.dto.ApiResponse;
import com.ecommerce.store.product.dto.CreateProductRequest;
import com.ecommerce.store.product.dto.ProductDto;
import com.ecommerce.store.product.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product management APIs")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Get all active products (public)")
    public ResponseEntity<ApiResponse<Page<ProductDto>>> getProducts(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(productService.getAllActiveProducts(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID (public)")
    public ResponseEntity<ApiResponse<ProductDto>> getProduct(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(id)));
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get products by category (public)")
    public ResponseEntity<ApiResponse<Page<ProductDto>>> getByCategory(
            @PathVariable("categoryId") Long categoryId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductsByCategory(categoryId, pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products (public)")
    public ResponseEntity<ApiResponse<Page<ProductDto>>> searchProducts(
            @RequestParam("q") String q, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(productService.searchProducts(q, pageable)));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Create product with image upload (Admin)")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(
            @RequestPart("product") CreateProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Product created", productService.createProduct(request, image)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Update product (Admin)")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable("id") Long id,
            @RequestPart("product") CreateProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(ApiResponse.success("Product updated", productService.updateProduct(id, request, image)));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Adjust product stock by a delta (Admin)")
    public ResponseEntity<ApiResponse<ProductDto>> adjustStock(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Integer> body) {
        int delta = body.getOrDefault("delta", 0);
        return ResponseEntity.ok(ApiResponse.success("Stock updated", productService.adjustStock(id, delta)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SUB_ADMIN')")
    @Operation(summary = "Delete product (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable("id") Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted", null));
    }
}
