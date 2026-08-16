package ru.obr_mosmit.site.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.obr_mosmit.site.entity.School;
import ru.obr_mosmit.site.entity.SchoolDetail;
import ru.obr_mosmit.site.repository.SchoolDetailRepository;
import ru.obr_mosmit.site.repository.SchoolRepository;

@RestController
@RequestMapping("/api/schools")
public class SchoolApiController {

    private static final Map<String, String> SECTION_TITLES = Map.of(
            "about", "О школе",
            "contacts", "Контакты",
            "management", "Руководство",
            "documents", "Документы",
            "education", "Образовательная деятельность",
            "additional", "Дополнительная информация");

    private static final List<String> SECTION_ORDER =
            List.of("about", "contacts", "management", "documents", "education", "additional");

    private final SchoolRepository repository;
    private final SchoolDetailRepository detailRepository;

    public SchoolApiController(SchoolRepository repository, SchoolDetailRepository detailRepository) {
        this.repository = repository;
        this.detailRepository = detailRepository;
    }

    @GetMapping
    List<SchoolDto> all() {
        return repository.findAllByOrderByTitleAsc().stream().map(this::dto).toList();
    }

    @GetMapping("/{id}")
    ResponseEntity<SchoolDto> one(@PathVariable Long id) {
        return repository.findById(id)
                .map(item -> ResponseEntity.ok(dto(item)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    ResponseEntity<SchoolDto> update(@PathVariable Long id, @RequestBody SchoolUpdate request) {
        return repository.findById(id).map(school -> {
            school.setTitle(request.title());
            school.setSummary(request.summary());
            school.setImageUrl(request.image());
            repository.save(school);

            detailRepository.deleteAllBySchoolId(id);
            int sortOrder = 0;
            for (SchoolSectionDto section : request.sections()) {
                for (SchoolFieldDto field : section.fields()) {
                    if (field.content() == null || field.content().isBlank()) {
                        continue;
                    }
                    SchoolDetail detail = new SchoolDetail();
                    detail.setSchool(school);
                    detail.setSectionKey(section.key());
                    detail.setLabel(field.label());
                    detail.setContent(field.content());
                    detail.setSortOrder(sortOrder++);
                    detailRepository.save(detail);
                }
            }

            return ResponseEntity.ok(dto(school));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    private SchoolDto dto(School item) {
        Map<String, List<SchoolFieldDto>> grouped = new LinkedHashMap<>();
        detailRepository.findAllBySchoolIdOrderBySortOrderAscIdAsc(item.getId()).forEach(detail ->
                grouped.computeIfAbsent(detail.getSectionKey(), ignored -> new ArrayList<>())
                        .add(new SchoolFieldDto(detail.getLabel(), detail.getContent())));

        List<SchoolSectionDto> sections = SECTION_ORDER.stream()
                .map(key -> new SchoolSectionDto(
                        key,
                        SECTION_TITLES.get(key),
                        grouped.getOrDefault(key, List.of())))
                .toList();

        return new SchoolDto(
                String.valueOf(item.getId()),
                item.getTitle(),
                item.getSummary(),
                item.getImageUrl(),
                split(item.getGalleryUrls()),
                sections);
    }

    private List<String> split(String value) {
        return value == null || value.isBlank() ? List.of() : Arrays.asList(value.split("\\n"));
    }

    public record SchoolFieldDto(String label, String content) {}
    public record SchoolSectionDto(String key, String title, List<SchoolFieldDto> fields) {}
    public record SchoolDto(String id, String title, String summary, String image,
                            List<String> gallery, List<SchoolSectionDto> sections) {}
    public record SchoolUpdate(String title, String summary, String image, List<SchoolSectionDto> sections) {}
}
