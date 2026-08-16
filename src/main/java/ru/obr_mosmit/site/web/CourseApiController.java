package ru.obr_mosmit.site.web;
import java.util.*; import org.springframework.web.bind.annotation.*; import ru.obr_mosmit.site.course.*;
@RestController public class CourseApiController{
 private final CourseRepository courses; public CourseApiController(CourseRepository c){courses=c;}
 @GetMapping("/api/courses") List<CourseDto> published(){return courses.findAllByPublishedTrueOrderByCreatedAtDesc().stream().map(this::dto).toList();}
 @GetMapping("/api/admin/courses") List<CourseDto> all(){return courses.findAllByOrderByCreatedAtDesc().stream().map(this::dto).toList();}
 @PostMapping("/api/admin/courses") CourseDto save(@RequestBody CourseRequest r){var c=r.id()==null?new Course():courses.findById(r.id()).orElseThrow();c.setTitle(r.title());c.setDescription(r.description());c.setPublished(r.published());return dto(courses.save(c));}
 @DeleteMapping("/api/admin/courses/{id}") void delete(@PathVariable Long id){courses.deleteById(id);}
 private CourseDto dto(Course c){return new CourseDto(c.getId(),c.getTitle(),c.getDescription(),c.isPublished(),c.getCoverImageUrl(),parse(c.getGalleryUrls()));}
 private List<String> parse(String v){return v==null||v.isBlank()?List.of():List.of(v.split("\n"));}
 public record CourseDto(Long id,String title,String description,boolean published,String cover,List<String> gallery){} record CourseRequest(Long id,String title,String description,boolean published){}
}
