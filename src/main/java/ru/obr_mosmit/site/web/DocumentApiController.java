package ru.obr_mosmit.site.web;
import java.util.*;import org.springframework.http.ResponseEntity;import org.springframework.web.bind.annotation.*;import ru.obr_mosmit.site.document.*;
@RestController @RequestMapping("/api/documents")
public class DocumentApiController{
 private final SiteDocumentRepository repository;public DocumentApiController(SiteDocumentRepository repository){this.repository=repository;}
 @GetMapping List<DocumentDto> all(){return repository.findAllByOrderBySortOrderAscTitleAsc().stream().map(this::dto).toList();}
 @GetMapping("/{id}") ResponseEntity<DocumentDetailsDto> one(@PathVariable Long id){return repository.findById(id).map(d->ResponseEntity.ok(new DocumentDetailsDto(String.valueOf(d.getId()),d.getTitle(),d.getCategory(),d.getContent(),attachments(d)))).orElseGet(()->ResponseEntity.notFound().build());}
 private DocumentDto dto(SiteDocument d){return new DocumentDto(String.valueOf(d.getId()),d.getTitle(),d.getCategory(),d.getSummary(),attachments(d),d.getSourceUrl());}
 private List<AttachmentDto> attachments(SiteDocument d){List<AttachmentDto> files=new ArrayList<>();if(d.getAttachments()!=null&&!d.getAttachments().isBlank())for(String row:d.getAttachments().split("\\n")){String[] p=row.split("\\|",2);if(p.length==2)files.add(new AttachmentDto(p[0],p[1]));}return files;}
 public record DocumentDto(String id,String title,String category,String summary,List<AttachmentDto> attachments,String sourceUrl){} public record AttachmentDto(String title,String url){}
 public record DocumentDetailsDto(String id,String title,String category,String content,List<AttachmentDto> attachments){}
}
