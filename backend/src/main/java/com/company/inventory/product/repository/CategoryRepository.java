package com.company.inventory.product.repository;

import com.company.inventory.product.entity.Category;
import com.company.inventory.product.entity.CategoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    List<Category> findAllByStatusOrderByNameAsc(CategoryStatus status);
}
