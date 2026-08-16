package ru.obr_mosmit.site.controller;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import ru.obr_mosmit.site.entity.Course;
import ru.obr_mosmit.site.repository.CourseRepository;

@RestController
public class CourseApiController {

    private final CourseRepository courses;

    public CourseApiController(CourseRepository courses) {
        this.courses = courses;
    }

    @GetMapping("/api/courses")
    List<CourseDto> published() {
        return courses.findAllByPublishedTrueOrderByCreatedAtDesc().stream().map(this::dto).toList();
    }

    @GetMapping("/api/admin/courses")
    List<CourseDto> all() {
        return courses.findAllByOrderByCreatedAtDesc().stream().map(this::dto).toList();
    }

    @PostMapping("/api/admin/courses")
    CourseDto save(@RequestBody CourseRequest request) {
        Course course = request.id() == null ? new Course() : courses.findById(request.id()).orElseThrow();
        course.setTitle(request.title());
        course.setDescription(request.description());
        course.setPublished(request.published());
        return dto(courses.save(course));
    }

    @DeleteMapping("/api/admin/courses/{id}")
    void delete(@PathVariable Long id) {
        courses.deleteById(id);
    }

    private CourseDto dto(Course course) {
        return new CourseDto(
                course.getId(),
                course.getTitle(),
                course.getDescription(),
                course.isPublished(),
                course.getCoverImageUrl(),
                split(course.getGalleryUrls()));
    }

    private List<String> split(String value) {
        return value == null || value.isBlank() ? List.of() : List.of(value.split("\\n"));
    }

    public record CourseDto(Long id, String title, String description, boolean published, String cover, List<String> gallery) {}
    record CourseRequest(Long id, String title, String description, boolean published) {}
}
