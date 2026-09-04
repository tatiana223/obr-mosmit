package ru.obr_mosmit.site.service;
import ru.obr_mosmit.site.dto.NewsForm;
import ru.obr_mosmit.site.entity.News;
import ru.obr_mosmit.site.entity.NewsStatus;
import ru.obr_mosmit.site.repository.NewsRepository;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class NewsService {
    private static final ZoneId MOSCOW = ZoneId.of("Europe/Moscow");

    private final NewsRepository repository;
    private final Path uploadDirectory;

    public NewsService(NewsRepository repository, @Value("${app.uploads.directory}") String uploadDirectory) {
        this.repository = repository;
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }
    public News get(Long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(NOT_FOUND)); }

    public News save(Long id, NewsForm form, MultipartFile image) {
        var news = id == null ? new News() : get(id);
        var requestedSlug = form.getSlug() == null || form.getSlug().isBlank() ? form.getTitle() : form.getSlug();
        var slug = slugify(requestedSlug);
        if ((id == null && repository.existsBySlug(slug)) || (id != null && repository.existsBySlugAndIdNot(slug, id))) slug += "-" + System.currentTimeMillis();
        news.setTitle(form.getTitle().trim()); news.setSlug(slug);
        news.setSummary(form.getSummary() == null ? "" : form.getSummary().trim());
        news.setContent(form.getContent().trim()); news.setStatus(form.getStatus());
        applyPublishedAt(news, form);
        if (image != null && !image.isEmpty()) news.setCoverImageUrl(storeImage(image));
        return repository.save(news);
    }

    /**
     * Custom publishedAt from the admin form wins when non-blank.
     * Drafts may leave it empty (stays null until publish).
     * Publishing with an empty date defaults to Instant.now().
     */
    private void applyPublishedAt(News news, NewsForm form) {
        var raw = form.getPublishedAt();
        if (raw != null && !raw.isBlank()) {
            news.setPublishedAt(parsePublishedAt(raw.trim()));
            return;
        }
        if (form.getStatus() == NewsStatus.PUBLISHED && news.getPublishedAt() == null) {
            news.setPublishedAt(Instant.now());
        }
    }

    private Instant parsePublishedAt(String value) {
        try {
            if (value.length() == 10) {
                return LocalDate.parse(value).atStartOfDay(MOSCOW).toInstant();
            }
            if (value.length() == 16 && value.charAt(10) == 'T') {
                return LocalDateTime.parse(value).atZone(MOSCOW).toInstant();
            }
            return Instant.parse(value);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(BAD_REQUEST, "Некорректная дата публикации");
        }
    }

    public void delete(Long id) { repository.delete(get(id)); }

    private String storeImage(MultipartFile image) {
        var type = image.getContentType();
        if (type == null || !type.startsWith("image/")) throw new ResponseStatusException(BAD_REQUEST, "Можно загружать только изображения");
        if (image.getSize() > 10 * 1024 * 1024) throw new ResponseStatusException(BAD_REQUEST, "Изображение больше 10 МБ");
        var original = image.getOriginalFilename() == null ? "image.jpg" : image.getOriginalFilename();
        var extension = original.contains(".") ? original.substring(original.lastIndexOf('.')).toLowerCase(Locale.ROOT) : ".jpg";
        var filename = UUID.randomUUID() + extension;
        try {
            Files.createDirectories(uploadDirectory); image.transferTo(uploadDirectory.resolve(filename));
            return "/uploads/" + filename;
        } catch (IOException e) { throw new IllegalStateException("Не удалось сохранить изображение", e); }
    }

    private String slugify(String value) {
        String ru = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
        String[] en = {"a","b","v","g","d","e","e","zh","z","i","y","k","l","m","n","o","p","r","s","t","u","f","h","c","ch","sh","sch","","y","","e","yu","ya"};
        var result = value.toLowerCase(Locale.ROOT);
        for (int i = 0; i < ru.length(); i++) result = result.replace(String.valueOf(ru.charAt(i)), en[i]);
        result = result.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return result.isBlank() ? "news-" + System.currentTimeMillis() : result;
    }
}
