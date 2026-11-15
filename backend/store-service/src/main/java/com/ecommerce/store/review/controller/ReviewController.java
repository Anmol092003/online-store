package com.ecommerce.store.review.controller;

import com.ecommerce.store.common.dto.ApiResponse;
import com.ecommerce.store.review.entity.Review;
import com.ecommerce.store.review.service.ReviewService;
import com.ecommerce.store.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<Review>>> getProductReviews(
            @PathVariable("productId") Long productId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getProductReviews(productId, pageable)));
    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Review>> addReview(
            @PathVariable("productId") Long productId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        var user = userRepository.findById(Long.parseLong(userDetails.getUsername())).orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Review added", reviewService.addReview(
                user.getId(), productId,
                Integer.parseInt(body.get("rating").toString()),
                body.get("comment").toString(),
                user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "")
            )));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Review>> updateReview(
            @PathVariable("reviewId") Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Review updated", reviewService.updateReview(
            userId, reviewId,
            Integer.parseInt(body.get("rating").toString()),
            body.get("comment").toString()
        )));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable("reviewId") Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        reviewService.deleteReview(userId, reviewId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted", null));
    }
}
