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
        if (file == null || file.isEmpty() || !isImage(file)) {
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

    public void deleteStored(String url) {
        String relative = uploadsRelativePath(url);
        if (relative == null) {
            return;
        }
        Path target = directory.resolve(relative).normalize();
        if (!target.startsWith(directory)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // Gallery/cover rows still drop even if the file is already gone.
        }
    }

    static String uploadsRelativePath(String url) {
        String path = normalizePhotoUrl(url);
        if (!path.startsWith("/uploads/")) {
            return null;
        }
        String relative = path.substring("/uploads/".length());
        if (relative.isBlank() || relative.contains("\\") || relative.contains("..")) {
            return null;
        }
        return relative;
    }

    static String normalizePhotoUrl(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        String value = url.trim();
        int query = value.indexOf('?');
        if (query >= 0) {
            value = value.substring(0, query);
        }
        try {
            value = java.net.URLDecoder.decode(value, java.nio.charset.StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ignored) {
            // keep the raw path if it was not encoded
        }
        if (value.startsWith("http://") || value.startsWith("https://")) {
            int pathStart = value.indexOf('/', value.indexOf("//") + 2);
            if (pathStart >= 0) {
                value = value.substring(pathStart);
            }
        }
        return value;
    }

    private boolean isImage(MultipartFile file) {
        String type = file.getContentType();
        if (type != null && type.startsWith("image/")) {
            return true;
        }
        String name = Objects.requireNonNullElse(file.getOriginalFilename(), "").toLowerCase();
        return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")
                || name.endsWith(".webp") || name.endsWith(".gif");
    }
}
