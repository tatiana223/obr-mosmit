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
            .map(key -> new SchoolSectionDto(key, titles.get(key), grouped.getOrDefault(key, List.of())))
            .toList();
        return new SchoolDto(String.valueOf(item.getId()), item.getTitle(), item.getSummary(), item.getImageUrl(), split(item.getGalleryUrls()), sections);
    }
    public record SchoolFieldDto(String label, String content) {}
    public record SchoolSectionDto(String key, String title, List<SchoolFieldDto> fields) {}
    private List<String> split(String value){return value==null||value.isBlank()?List.of():Arrays.asList(value.split("\n"));}
    public record SchoolDto(String id, String title, String summary, String image, List<String> gallery, List<SchoolSectionDto> sections) {}

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @org.springframework.transaction.annotation.Transactional
    ResponseEntity<SchoolDto> update(@PathVariable Long id, @RequestBody SchoolUpdate request) {
        return repository.findById(id).map(school -> {
            school.setTitle(request.title()); school.setSummary(request.summary()); school.setImageUrl(request.image()); repository.save(school);
            detailRepository.deleteAllBySchoolId(id); int sort = 0;
            for (SchoolSectionDto section : request.sections()) for (SchoolFieldDto field : section.fields()) {
                if (field.content() == null || field.content().isBlank()) continue;
                var detail = new ru.obr_mosmit.site.school.SchoolDetail(); detail.setSchool(school); detail.setSectionKey(section.key()); detail.setLabel(field.label()); detail.setContent(field.content()); detail.setSortOrder(sort++); detailRepository.save(detail);
            }
            return ResponseEntity.ok(dto(school));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
    public record SchoolUpdate(String title,String summary,String image,List<SchoolSectionDto> sections){}
}
