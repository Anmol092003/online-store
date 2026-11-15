package com.ecommerce.store.category.service;

import com.ecommerce.store.category.dto.*;
import com.ecommerce.store.category.entity.Category;
import com.ecommerce.store.category.entity.Subcategory;
import com.ecommerce.store.category.repository.CategoryRepository;
import com.ecommerce.store.category.repository.SubcategoryRepository;
import com.ecommerce.store.common.exception.ConflictException;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;

    public List<CategoryDto> getAllActiveCategories() {
        return categoryRepository.findByActiveTrue().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        return toDto(findById(id));
    }

    @Transactional
    public CategoryDto createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new ConflictException("Category already exists: " + request.getName());
        }
        Category category = Category.builder()
            .name(request.getName())
            .description(request.getDescription())
            .imageUrl(request.getImageUrl())
            .active(true)
            .build();
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CreateCategoryRequest request) {
        Category category = findById(id);
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        if (request.getImageUrl() != null) category.setImageUrl(request.getImageUrl());
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        categoryRepository.delete(findById(id));
    }

    @Transactional
    public SubcategoryDto createSubcategory(Long categoryId, SubcategoryDto dto) {
        Category category = findById(categoryId);
        Subcategory sub = Subcategory.builder()
            .category(category)
            .name(dto.getName())
            .description(dto.getDescription())
            .active(true)
            .build();
        return toSubDto(subcategoryRepository.save(sub));
    }

    @Transactional
    public void deleteSubcategory(Long subcategoryId) {
        subcategoryRepository.deleteById(subcategoryId);
    }

    private Category findById(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    private CategoryDto toDto(Category c) {
        return CategoryDto.builder()
            .id(c.getId())
            .name(c.getName())
            .description(c.getDescription())
            .imageUrl(c.getImageUrl())
            .active(c.isActive())
            .subcategories(c.getSubcategories().stream().map(this::toSubDto).collect(Collectors.toList()))
            .build();
    }

    private SubcategoryDto toSubDto(Subcategory s) {
        return SubcategoryDto.builder()
            .id(s.getId())
            .categoryId(s.getCategory().getId())
            .name(s.getName())
            .description(s.getDescription())
            .active(s.isActive())
            .build();
    }
}
