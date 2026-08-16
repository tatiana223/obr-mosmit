package ru.obr_mosmit.site.controller;

import jakarta.validation.Valid;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ru.obr_mosmit.site.dto.NewsForm;
import ru.obr_mosmit.site.entity.News;
import ru.obr_mosmit.site.repository.NewsRepository;
import ru.obr_mosmit.site.service.NewsService;

@RestController
@RequestMapping("/api/admin/news")
public class AdminNewsApiController {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final NewsRepository repository;
    private final NewsService service;

    public AdminNewsApiController(NewsRepository repository, NewsService service) {
        this.repository = repository;
        this.service = service;
    }

    @GetMapping
    List<AdminNewsDto> all(@RequestParam(defaultValue = "") String q) {
        var items = q.isBlank()
                ? repository.findAllByOrderByUpdatedAtDesc()
                : repository.searchByTitle(q);
        return items.stream().map(this::dto).toList();
    }

    @GetMapping("/{id}")
    AdminNewsDto one(@PathVariable Long id) {
        return dto(service.get(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    AdminNewsDto create(
            @Valid @ModelAttribute NewsForm form,
            @RequestPart(required = false) MultipartFile image) {
        return dto(service.save(null, form, image));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    AdminNewsDto update(
            @PathVariable Long id,
            @Valid @ModelAttribute NewsForm form,
            @RequestPart(required = false) MultipartFile image) {
        return dto(service.save(id, form, image));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private AdminNewsDto dto(News news) {
        String date = news.getPublishedAt() == null
                ? "—"
                : DATE.format(news.getPublishedAt().atZone(ZoneId.of("Europe/Moscow")));
        List<String> gallery = news.getGalleryUrls() == null || news.getGalleryUrls().isBlank()
                ? List.of()
                : List.of(news.getGalleryUrls().split("\\n"));

        return new AdminNewsDto(
                news.getId(),
                news.getTitle(),
                news.getSlug(),
                news.getSummary(),
                news.getContent(),
                news.getCoverImageUrl(),
                gallery,
                news.getStatus().name(),
                date,
                news.getUpdatedAt().toString());
    }

    public record AdminNewsDto(
            Long id,
            String title,
            String slug,
            String summary,
            String content,
            String image,
            List<String> gallery,
            String status,
            String date,
            String updatedAt) {}
}
