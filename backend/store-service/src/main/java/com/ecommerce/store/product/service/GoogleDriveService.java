package com.ecommerce.store.product.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.Permission;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class GoogleDriveService {

    @Value("${google.drive.service-account-key}")
    private String serviceAccountKeyPath;

    @Value("${google.drive.folder-id}")
    private String folderId;

    private Drive getDriveService() throws Exception {
        GoogleCredentials credentials = GoogleCredentials
            .fromStream(new FileInputStream(serviceAccountKeyPath))
            .createScoped(Collections.singletonList(DriveScopes.DRIVE));

        return new Drive.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            GsonFactory.getDefaultInstance(),
            new HttpCredentialsAdapter(credentials)
        ).setApplicationName("E-Commerce Store").build();
    }

    public String uploadFile(MultipartFile multipartFile) throws Exception {
        Drive drive = getDriveService();

        File fileMetadata = new File();
        fileMetadata.setName(multipartFile.getOriginalFilename());
        fileMetadata.setParents(List.of(folderId));

        com.google.api.client.http.InputStreamContent mediaContent =
            new com.google.api.client.http.InputStreamContent(
                multipartFile.getContentType(),
                multipartFile.getInputStream()
            );

        File uploadedFile = drive.files().create(fileMetadata, mediaContent)
            .setFields("id, webViewLink, webContentLink")
            .execute();

        // Make the file publicly readable
        Permission permission = new Permission()
            .setType("anyone")
            .setRole("reader");
        drive.permissions().create(uploadedFile.getId(), permission).execute();

        String publicUrl = "https://drive.google.com/uc?export=view&id=" + uploadedFile.getId();
        log.info("File uploaded to Google Drive: {}", publicUrl);
        return publicUrl;
    }

    public void deleteFile(String fileId) throws Exception {
        Drive drive = getDriveService();
        drive.files().delete(fileId).execute();
        log.info("File deleted from Google Drive: {}", fileId);
    }
}
