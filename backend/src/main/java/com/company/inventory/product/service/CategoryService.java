package com.company.inventory.product.service;

import com.company.inventory.product.dto.CategoryResponse;
import com.company.inventory.product.entity.Category;
import com.company.inventory.product.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getStatus()))
                .toList();
    }

    @Transactional
    public Category getByIdOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> com.company.inventory.common.exception.ApiException
                        .notFound("Category not found: " + id));
    }
}
