package ru.obr_mosmit.site.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaStorageService {

    private static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024;
    private static final long MAX_DOCUMENT_SIZE = 25L * 1024 * 1024;

    private final Path directory;

    public MediaStorageService(@Value("${app.uploads.directory}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getContentType() == null
                || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Можно загружать только изображения");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Изображение больше 10 МБ");
        }
        return save(file, "image.jpg");
    }

    public String storeDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Файл пуст");
        }
        if (file.getSize() > MAX_DOCUMENT_SIZE) {
            throw new IllegalArgumentException("Файл больше 25 МБ");
        }
        return save(file, "document.pdf");
    }

    private String save(MultipartFile file, String fallbackName) {
        String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), fallbackName);
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.')).toLowerCase()
                : "";

        try {
            Files.createDirectories(directory);
            String fileName = UUID.randomUUID() + extension;
            file.transferTo(directory.resolve(fileName));
            return "/uploads/" + fileName;
        } catch (IOException exception) {
            throw new IllegalStateException("Не удалось сохранить файл", exception);
        }
    }
}
