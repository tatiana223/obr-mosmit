package ru.obr_mosmit.site.web;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.obr_mosmit.site.school.School;
import ru.obr_mosmit.site.school.SchoolRepository;

@RestController
@RequestMapping("/api/schools")
public class SchoolApiController {
    private final SchoolRepository repository;
    public SchoolApiController(SchoolRepository repository) { this.repository = repository; }
    @GetMapping List<SchoolDto> all() { return repository.findAllByOrderByTitleAsc().stream().map(this::dto).toList(); }
    @GetMapping("/{id}") ResponseEntity<SchoolDto> one(@PathVariable Long id) {
        return repository.findById(id).map(item -> ResponseEntity.ok(dto(item))).orElseGet(() -> ResponseEntity.notFound().build());
    }
    private SchoolDto dto(School item) { return new SchoolDto(String.valueOf(item.getId()), item.getTitle(), item.getSummary(), item.getContent(), item.getImageUrl()); }
    public record SchoolDto(String id, String title, String summary, String content, String image) {}
}
