package ru.obr_mosmit.site.controller;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.obr_mosmit.site.entity.Competition;
import ru.obr_mosmit.site.entity.CompetitionApplication;
import ru.obr_mosmit.site.repository.CompetitionApplicationRepository;
import ru.obr_mosmit.site.repository.CompetitionRepository;

@RestController
public class CompetitionApiController {
 private final CompetitionRepository competitions; private final CompetitionApplicationRepository applications;
 public CompetitionApiController(CompetitionRepository competitions,CompetitionApplicationRepository applications){this.competitions=competitions;this.applications=applications;}
 @GetMapping("/api/competitions") List<CompetitionDto> publicList(){return competitions.findAllByPublishedTrueOrderByDeadlineAsc().stream().map(this::competitionDto).toList();}
 @PostMapping("/api/competition-applications") ResponseEntity<?> apply(@RequestBody PublicApplicationRequest r){
  if(r.competitionId()==null||blank(r.participantName())||blank(r.email())||blank(r.schoolName())||!r.consent())return ResponseEntity.badRequest().body("Заполните обязательные поля и подтвердите согласие на обработку данных");
  Competition c=competitions.findById(r.competitionId()).filter(Competition::isPublished).orElse(null);if(c==null)return ResponseEntity.badRequest().body("Конкурс недоступен");
  String email=normalizeEmail(r.email());if(applications.existsByCompetitionIdAndParticipantEmailIgnoreCase(c.getId(),email))return ResponseEntity.status(409).body("Заявка с этой почтой на конкурс уже отправлена");
  CompetitionApplication a=new CompetitionApplication();a.setCompetition(c);a.setTrackingCode(newCode());a.setParticipantEmail(email);a.setParticipantPhone(clean(r.phone()));a.setParticipantName(r.participantName().trim());a.setSchoolName(r.schoolName().trim());a.setAgeGroup(clean(r.ageGroup()));a.setComment(clean(r.comment()));return ResponseEntity.ok(applicationDto(applications.save(a)));
 }
 @GetMapping(value={"/api/competition-applications","/api/competition-applications/status"}) ResponseEntity<List<ApplicationDto>> status(@RequestParam String email){
  if(blank(email))return ResponseEntity.ok(List.of());
  String normalized=normalizeEmail(email);
  List<ApplicationDto> result=applications.findAllByParticipantEmailIgnoreCaseOrderByCreatedAtDesc(normalized).stream().map(this::applicationDto).toList();
  return ResponseEntity.ok(result);
 }
 @GetMapping("/api/admin/competitions") List<CompetitionDto> all(){return competitions.findAllByOrderByCreatedAtDesc().stream().map(this::competitionDto).toList();}
 @PostMapping("/api/admin/competitions") CompetitionDto saveCompetition(@RequestBody CompetitionRequest r){Competition c=r.id()==null?new Competition():competitions.findById(r.id()).orElseThrow();c.setTitle(r.title());c.setDeadline(r.deadline());c.setPublished(r.published());if(c.getDescription()==null)c.setDescription("");return competitionDto(competitions.save(c));}
 @DeleteMapping("/api/admin/competitions/{id}") void deleteCompetition(@PathVariable Long id){competitions.deleteById(id);}
 @GetMapping("/api/admin/applications") List<ApplicationDto> allApplications(){return applications.findAllByOrderByCreatedAtDesc().stream().map(this::applicationDto).toList();}
 @PatchMapping("/api/admin/applications/{id}") ApplicationDto review(@PathVariable Long id,@RequestBody ReviewRequest r){CompetitionApplication a=applications.findById(id).orElseThrow();a.setStatus(r.status());a.setAdminComment(clean(r.adminComment()));return applicationDto(applications.save(a));}
 private String newCode(){String code;do{code="MOS-"+LocalDate.now().getYear()+"-"+UUID.randomUUID().toString().substring(0,6).toUpperCase(Locale.ROOT);}while(applications.existsByTrackingCode(code));return code;}
 private String normalizeEmail(String value){return value.trim().toLowerCase(Locale.ROOT);}
 private boolean blank(String s){return s==null||s.isBlank();}private String clean(String s){return blank(s)?null:s.trim();}
 private CompetitionDto competitionDto(Competition c){return new CompetitionDto(c.getId(),c.getTitle(),c.getDescription(),c.getDeadline(),c.isPublished(),c.getCoverImageUrl(),splitLines(c.getGalleryUrls()));}
 private ApplicationDto applicationDto(CompetitionApplication a){return new ApplicationDto(a.getId(),a.getCompetition().getId(),a.getCompetition().getTitle(),a.getTrackingCode(),a.getParticipantEmail(),a.getParticipantPhone(),a.getParticipantName(),a.getSchoolName(),a.getAgeGroup(),a.getComment(),a.getStatus(),a.getAdminComment(),a.getCreatedAt().toString());}
 private List<String> splitLines(String v){return v==null||v.isBlank()?List.of():Arrays.asList(v.split("\\n"));}
 public record CompetitionDto(Long id,String title,String description,LocalDate deadline,boolean published,String cover,List<String> gallery){}
 record CompetitionRequest(Long id,String title,LocalDate deadline,boolean published){}
 record PublicApplicationRequest(Long competitionId,String participantName,String email,String phone,String schoolName,String ageGroup,String comment,boolean consent){}
 public record ApplicationDto(Long id,Long competitionId,String competitionTitle,String trackingCode,String userEmail,String phone,String participantName,String schoolName,String ageGroup,String comment,String status,String adminComment,String createdAt){}
 record ReviewRequest(String status,String adminComment){}
}
