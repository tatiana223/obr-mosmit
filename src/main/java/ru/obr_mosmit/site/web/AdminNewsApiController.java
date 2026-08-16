package ru.obr_mosmit.site.web;

import jakarta.validation.Valid;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ru.obr_mosmit.site.news.*;

@RestController @RequestMapping("/api/admin/news")
public class AdminNewsApiController {
 private static final DateTimeFormatter DATE=DateTimeFormatter.ofPattern("dd.MM.yyyy");
 private final NewsRepository repository; private final NewsService service;
 public AdminNewsApiController(NewsRepository r,NewsService s){repository=r;service=s;}
 @GetMapping List<AdminNewsDto> all(@RequestParam(defaultValue="") String q){return (q.isBlank()?repository.findAllByOrderByUpdatedAtDesc():repository.searchByTitle(q)).stream().map(this::dto).toList();}
 @GetMapping("/{id}") AdminNewsDto one(@PathVariable Long id){return dto(service.get(id));}
 @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE) AdminNewsDto create(@Valid @ModelAttribute NewsForm form,@RequestPart(required=false) MultipartFile image){return dto(service.save(null,form,image));}
 @PutMapping(value="/{id}",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) AdminNewsDto update(@PathVariable Long id,@Valid @ModelAttribute NewsForm form,@RequestPart(required=false) MultipartFile image){return dto(service.save(id,form,image));}
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) void delete(@PathVariable Long id){service.delete(id);}
 private AdminNewsDto dto(News n){String date=n.getPublishedAt()==null?"—":DATE.format(n.getPublishedAt().atZone(ZoneId.of("Europe/Moscow")));return new AdminNewsDto(n.getId(),n.getTitle(),n.getSlug(),n.getSummary(),n.getContent(),n.getCoverImageUrl(),n.getGalleryUrls()==null||n.getGalleryUrls().isBlank()?List.of():List.of(n.getGalleryUrls().split("\n")),n.getStatus().name(),date,n.getUpdatedAt().toString());}
 public record AdminNewsDto(Long id,String title,String slug,String summary,String content,String image,List<String> gallery,String status,String date,String updatedAt){}
}
