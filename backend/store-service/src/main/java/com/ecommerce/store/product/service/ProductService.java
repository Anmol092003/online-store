package com.ecommerce.store.product.service;

import com.ecommerce.store.category.repository.CategoryRepository;
import com.ecommerce.store.category.repository.SubcategoryRepository;
import com.ecommerce.store.common.exception.BadRequestException;
import com.ecommerce.store.common.exception.ConflictException;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import com.ecommerce.store.product.dto.CreateProductRequest;
import com.ecommerce.store.product.dto.ProductDto;
import com.ecommerce.store.product.entity.Product;
import com.ecommerce.store.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;
    private final GoogleDriveService googleDriveService;

    public Page<ProductDto> getAllActiveProducts(Pageable pageable) {
        return productRepository.findByStatus(Product.ProductStatus.ACTIVE, pageable)
            .map(this::toDto);
    }

    public Page<ProductDto> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toDto);
    }

    public ProductDto getProductById(Long id) {
        return toDto(findById(id));
    }

    public Page<ProductDto> getProductsByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdAndStatus(categoryId, Product.ProductStatus.ACTIVE, pageable)
            .map(this::toDto);
    }

    public Page<ProductDto> searchProducts(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable).map(this::toDto);
    }

    @Transactional
    public ProductDto createProduct(CreateProductRequest request, MultipartFile image) {
        if (request.getSku() != null && request.getSku().isBlank()) {
            request.setSku(null);
        }
        if (request.getSku() != null && productRepository.existsBySku(request.getSku())) {
            throw new ConflictException("SKU already exists: " + request.getSku());
        }
        if (!categoryRepository.existsById(request.getCategoryId())) {
            throw new BadRequestException("Category not found: " + request.getCategoryId());
        }

        Product product = Product.builder()
            .name(request.getName())
            .description(request.getDescription())
            .price(request.getPrice())
            .discountPrice(request.getDiscountPrice())
            .stockQuantity(request.getStockQuantity())
            .sku(request.getSku() != null ? request.getSku() : "SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
            .categoryId(request.getCategoryId())
            .subcategoryId(request.getSubcategoryId())
            .status(Product.ProductStatus.ACTIVE)
            .build();

        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = googleDriveService.uploadFile(image);
                product.setImageUrl(imageUrl);
            } catch (Exception e) {
                log.error("Failed to upload image to Google Drive: {}", e.getMessage());
            }
        }

        return toDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto updateProduct(Long id, CreateProductRequest request, MultipartFile image) {
        Product product = findById(id);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setCategoryId(request.getCategoryId());
        product.setSubcategoryId(request.getSubcategoryId());

        if (image != null && !image.isEmpty()) {
            try {
                String imageUrl = googleDriveService.uploadFile(image);
                product.setImageUrl(imageUrl);
            } catch (Exception e) {
                log.error("Failed to upload image: {}", e.getMessage());
            }
        }
        return toDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto adjustStock(Long id, int delta) {
        Product product = findById(id);
        int updated = product.getStockQuantity() + delta;
        if (updated < 0) {
            throw new BadRequestException("Stock cannot go below zero");
        }
        product.setStockQuantity(updated);
        return toDto(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = findById(id);
        product.setStatus(Product.ProductStatus.INACTIVE);
        productRepository.save(product);
    }

    private Product findById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    private ProductDto toDto(Product p) {
        return ProductDto.builder()
            .id(p.getId())
            .name(p.getName())
            .description(p.getDescription())
            .price(p.getPrice())
            .discountPrice(p.getDiscountPrice())
            .stockQuantity(p.getStockQuantity())
            .sku(p.getSku())
            .categoryId(p.getCategoryId())
            .subcategoryId(p.getSubcategoryId())
            .imageUrl(p.getImageUrl())
            .status(p.getStatus())
            .createdAt(p.getCreatedAt())
            .build();
    }
}
