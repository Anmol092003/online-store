package com.ecommerce.store.review.service;

import com.ecommerce.store.common.exception.BadRequestException;
import com.ecommerce.store.common.exception.ConflictException;
import com.ecommerce.store.common.exception.ResourceNotFoundException;
import com.ecommerce.store.order.repository.OrderRepository;
import com.ecommerce.store.review.entity.Review;
import com.ecommerce.store.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    public Page<Review> getProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable);
    }

    @Transactional
    public Review addReview(Long userId, Long productId, Integer rating, String comment, String userName) {
        // Only verified buyers can review
        boolean hasPurchased = orderRepository.findByUserId(userId, Pageable.unpaged())
            .stream()
            .anyMatch(order -> order.getItems().stream()
                .anyMatch(item -> item.getProductId().equals(productId)));

        if (!hasPurchased) {
            throw new BadRequestException("You can only review products you have purchased");
        }

        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new ConflictException("You have already reviewed this product");
        }

        if (rating < 1 || rating > 5) {
            throw new BadRequestException("Rating must be between 1 and 5");
        }

        return reviewRepository.save(Review.builder()
            .userId(userId)
            .productId(productId)
            .rating(rating)
            .comment(comment)
            .userName(userName)
            .build());
    }

    @Transactional
    public Review updateReview(Long userId, Long reviewId, Integer rating, String comment) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));
        if (!review.getUserId().equals(userId)) {
            throw new BadRequestException("You can only edit your own reviews");
        }
        review.setRating(rating);
        review.setComment(comment);
        return reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));
        if (!review.getUserId().equals(userId)) {
            throw new BadRequestException("You can only delete your own reviews");
        }
        reviewRepository.delete(review);
    }
}
