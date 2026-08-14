package ru.obr_mosmit.site.web;

import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.obr_mosmit.site.school.School;
import ru.obr_mosmit.site.school.SchoolDetailRepository;
import ru.obr_mosmit.site.school.SchoolRepository;

@RestController
@RequestMapping("/api/schools")
public class SchoolApiController {
    private final SchoolRepository repository;
    private final SchoolDetailRepository detailRepository;
    public SchoolApiController(SchoolRepository repository, SchoolDetailRepository detailRepository) {
        this.repository = repository;
        this.detailRepository = detailRepository;
    }
    @GetMapping List<SchoolDto> all() { return repository.findAllByOrderByTitleAsc().stream().map(this::dto).toList(); }
    @GetMapping("/{id}") ResponseEntity<SchoolDto> one(@PathVariable Long id) {
        return repository.findById(id).map(item -> ResponseEntity.ok(dto(item))).orElseGet(() -> ResponseEntity.notFound().build());
    }
    private SchoolDto dto(School item) {
        Map<String, String> titles = Map.of(
            "about", "О школе",
            "contacts", "Контакты",
            "management", "Руководство",
            "documents", "Документы",
            "education", "Образовательная деятельность",
            "additional", "Дополнительная информация"
        );
        List<String> order = List.of("about", "contacts", "management", "documents", "education", "additional");
        Map<String, List<SchoolFieldDto>> grouped = new LinkedHashMap<>();
        detailRepository.findAllBySchoolIdOrderBySortOrderAscIdAsc(item.getId()).forEach(detail ->
            grouped.computeIfAbsent(detail.getSectionKey(), ignored -> new ArrayList<>())
                .add(new SchoolFieldDto(detail.getLabel(), detail.getContent()))
        );
        List<SchoolSectionDto> sections = order.stream()
            .filter(grouped::containsKey)
            .map(key -> new SchoolSectionDto(key, titles.get(key), grouped.get(key)))
            .toList();
        return new SchoolDto(String.valueOf(item.getId()), item.getTitle(), item.getSummary(), item.getImageUrl(), sections);
    }
    public record SchoolFieldDto(String label, String content) {}
    public record SchoolSectionDto(String key, String title, List<SchoolFieldDto> fields) {}
    public record SchoolDto(String id, String title, String summary, String image, List<SchoolSectionDto> sections) {}
}
