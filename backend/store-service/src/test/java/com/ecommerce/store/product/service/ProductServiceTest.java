package com.ecommerce.store.product.service;

import com.ecommerce.store.category.repository.CategoryRepository;
import com.ecommerce.store.category.repository.SubcategoryRepository;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import com.ecommerce.store.product.dto.ProductDto;
import com.ecommerce.store.product.entity.Product;
import com.ecommerce.store.product.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository productRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock SubcategoryRepository subcategoryRepository;
    @Mock GoogleDriveService googleDriveService;

    @InjectMocks
    ProductService productService;

    @Test
    void getProductById_shouldReturnProduct_whenExists() {
        Product product = Product.builder()
            .id(1L).name("Test Phone").price(BigDecimal.valueOf(999.99))
            .stockQuantity(10).status(Product.ProductStatus.ACTIVE)
            .categoryId(1L).sku("SKU-001").build();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ProductDto result = productService.getProductById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Test Phone");
    }

    @Test
    void getProductById_shouldThrow_whenNotFound() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(99L));
    }

    @Test
    void getAllActiveProducts_shouldReturnPagedResults() {
        Product product = Product.builder().id(1L).name("Laptop")
            .price(BigDecimal.valueOf(50000)).stockQuantity(5)
            .status(Product.ProductStatus.ACTIVE).categoryId(1L).build();

        Page<Product> page = new PageImpl<>(List.of(product));
        when(productRepository.findByStatus(Product.ProductStatus.ACTIVE, PageRequest.of(0, 10))).thenReturn(page);

        Page<ProductDto> result = productService.getAllActiveProducts(PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Laptop");
    }
}
