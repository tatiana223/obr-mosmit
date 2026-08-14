package ru.obr_mosmit.site.web;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.obr_mosmit.site.news.News;
import ru.obr_mosmit.site.news.NewsRepository;
import ru.obr_mosmit.site.news.NewsStatus;

@RestController
@RequestMapping("/api/news")
public class NewsApiController {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.forLanguageTag("ru"));
    private final NewsRepository repository;

    public NewsApiController(NewsRepository repository) { this.repository = repository; }

    @GetMapping
    List<NewsDto> all() {
        return repository.findByStatusOrderByPublishedAtDesc(NewsStatus.PUBLISHED).stream().map(this::dto).toList();
    }

    @GetMapping("/{id}")
    ResponseEntity<NewsDto> one(@PathVariable Long id) {
        return repository.findByIdAndStatus(id, NewsStatus.PUBLISHED)
                .map(item -> ResponseEntity.ok(dto(item)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private NewsDto dto(News item) {
        String date = item.getPublishedAt() == null ? "" : DATE.format(item.getPublishedAt().atZone(ZoneId.of("Europe/Moscow")));
        String publishedAt = item.getPublishedAt() == null ? "" : item.getPublishedAt().toString();
        return new NewsDto(String.valueOf(item.getId()), date, item.getTitle(), item.getSummary(), item.getContent(), item.getCoverImageUrl(), publishedAt);
    }

    public record NewsDto(String id, String date, String title, String summary, String content, String image, String publishedAt) {}
}
