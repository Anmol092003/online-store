package com.anmol.bazaar.main.catalog.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class CloudinaryStorageService {

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String folder;
    private final LocalFileStorageService localFileStorageService;
    private Cloudinary cloudinaryClient;

    public CloudinaryStorageService(
            @Value("${app.cloudinary.cloud-name:YOUR_CLOUDINARY_CLOUD_NAME}") String cloudName,
            @Value("${app.cloudinary.api-key:YOUR_CLOUDINARY_API_KEY}") String apiKey,
            @Value("${app.cloudinary.api-secret:YOUR_CLOUDINARY_API_SECRET}") String apiSecret,
            @Value("${app.cloudinary.folder:bazaarone/items}") String folder,
            LocalFileStorageService localFileStorageService) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.folder = folder;
        this.localFileStorageService = localFileStorageService;

        if (isCloudinaryConfigured()) {
            this.cloudinaryClient = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", this.cloudName.trim(),
                    "api_key", this.apiKey.trim(),
                    "api_secret", this.apiSecret.trim(),
                    "secure", true
            ));
            log.info("Cloudinary image storage configured successfully for cloud: {}", this.cloudName);
        } else {
            log.warn("Cloudinary credentials are not set (placeholder detected). Uploaded images will fall back to local disk storage in ./uploads/items");
        }
    }

    public boolean isCloudinaryConfigured() {
        return StringUtils.hasText(cloudName) && !cloudName.contains("YOUR_CLOUDINARY") &&
               StringUtils.hasText(apiKey) && !apiKey.contains("YOUR_CLOUDINARY") &&
               StringUtils.hasText(apiSecret) && !apiSecret.contains("YOUR_CLOUDINARY");
    }

    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Item image file is required.");
        }

        if (isCloudinaryConfigured() && this.cloudinaryClient != null) {
            try {
                log.info("Uploading image [{}] to Cloudinary in folder [{}]...", file.getOriginalFilename(), folder);
                Map<?, ?> uploadResult = this.cloudinaryClient.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", folder,
                                "resource_type", "image"
                        )
                );
                String secureUrl = (String) uploadResult.get("secure_url");
                log.info("Successfully uploaded image to Cloudinary: {}", secureUrl);
                return secureUrl;
            } catch (IOException ex) {
                log.error("Cloudinary upload failed, falling back to local file storage.", ex);
                return localFileStorageService.storeItemImage(file);
            }
        }

        return localFileStorageService.storeItemImage(file);
    }

    public void deleteImageIfExists(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }

        if (imageUrl.startsWith("/uploads/items/")) {
            localFileStorageService.deleteLocalImageIfExists(imageUrl);
        } else if (isCloudinaryConfigured() && imageUrl.contains("res.cloudinary.com") && this.cloudinaryClient != null) {
            try {
                String publicId = extractPublicId(imageUrl);
                if (publicId != null) {
                    this.cloudinaryClient.uploader().destroy(publicId, ObjectUtils.emptyMap());
                    log.info("Deleted image from Cloudinary: {}", publicId);
                }
            } catch (Exception ex) {
                log.warn("Failed to delete Cloudinary asset: {}", imageUrl, ex);
            }
        }
    }

    private String extractPublicId(String url) {
        try {
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) return null;
            String pathAfterUpload = url.substring(uploadIndex + 8);
            if (pathAfterUpload.startsWith("v") && pathAfterUpload.indexOf('/') != -1) {
                pathAfterUpload = pathAfterUpload.substring(pathAfterUpload.indexOf('/') + 1);
            }
            int dotIndex = pathAfterUpload.lastIndexOf('.');
            if (dotIndex != -1) {
                pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
            }
            return pathAfterUpload;
        } catch (Exception e) {
            return null;
        }
    }
}
