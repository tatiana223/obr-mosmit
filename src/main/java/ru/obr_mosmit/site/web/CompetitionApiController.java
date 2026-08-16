package ru.obr_mosmit.site.web;
import java.security.Principal; import java.time.LocalDate; import java.util.*;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*;
import ru.obr_mosmit.site.account.*; import ru.obr_mosmit.site.competition.*;

@RestController
public class CompetitionApiController {
 private final CompetitionRepository competitions; private final CompetitionApplicationRepository applications; private final SiteUserRepository users;
 public CompetitionApiController(CompetitionRepository c,CompetitionApplicationRepository a,SiteUserRepository u){competitions=c;applications=a;users=u;}
 @GetMapping("/api/competitions") List<CompetitionDto> publicList(){return competitions.findAllByPublishedTrueOrderByDeadlineAsc().stream().map(this::competitionDto).toList();}
 @GetMapping("/api/cabinet/applications") List<ApplicationDto> mine(Principal p){var u=user(p);return applications.findAllByUserIdOrderByCreatedAtDesc(u.getId()).stream().map(this::applicationDto).toList();}
 @PostMapping("/api/cabinet/applications") ResponseEntity<?> apply(Principal p,@RequestBody ApplicationRequest r){var u=user(p);var c=competitions.findById(r.competitionId()).filter(Competition::isPublished).orElseThrow();if(applications.existsByCompetitionIdAndUserId(c.getId(),u.getId()))return ResponseEntity.status(409).body("Заявка уже отправлена");var a=new CompetitionApplication();a.setCompetition(c);a.setUser(u);a.setParticipantName(r.participantName());a.setSchoolName(r.schoolName());a.setAgeGroup(r.ageGroup());a.setComment(r.comment());return ResponseEntity.ok(applicationDto(applications.save(a)));}
 @GetMapping("/api/admin/competitions") List<CompetitionDto> all(){return competitions.findAllByOrderByCreatedAtDesc().stream().map(this::competitionDto).toList();}
 @PostMapping("/api/admin/competitions") CompetitionDto saveCompetition(@RequestBody CompetitionRequest r){var c=r.id()==null?new Competition():competitions.findById(r.id()).orElseThrow();c.setTitle(r.title());c.setDescription(r.description());c.setDeadline(r.deadline());c.setPublished(r.published());c.setFormUrl(r.formUrl());c.setFormDescription(r.formDescription());return competitionDto(competitions.save(c));}
 @DeleteMapping("/api/admin/competitions/{id}") void deleteCompetition(@PathVariable Long id){competitions.deleteById(id);}
 @GetMapping("/api/admin/applications") List<ApplicationDto> allApplications(){return applications.findAllByOrderByCreatedAtDesc().stream().map(this::applicationDto).toList();}
 @PatchMapping("/api/admin/applications/{id}") ApplicationDto review(@PathVariable Long id,@RequestBody ReviewRequest r){var a=applications.findById(id).orElseThrow();a.setStatus(r.status());a.setAdminComment(r.adminComment());return applicationDto(applications.save(a));}
 private SiteUser user(Principal p){return users.findByEmailIgnoreCase(p.getName()).orElseThrow();}
 private CompetitionDto competitionDto(Competition c){return new CompetitionDto(c.getId(),c.getTitle(),c.getDescription(),c.getDeadline(),c.isPublished(),c.getCoverImageUrl(),c.getGalleryUrls()==null||c.getGalleryUrls().isBlank()?List.of():List.of(c.getGalleryUrls().split("\n")),c.getFormUrl(),c.getFormDescription());}
 private ApplicationDto applicationDto(CompetitionApplication a){return new ApplicationDto(a.getId(),a.getCompetition().getId(),a.getCompetition().getTitle(),a.getUser().getDisplayName(),a.getUser().getEmail(),a.getParticipantName(),a.getSchoolName(),a.getAgeGroup(),a.getComment(),a.getStatus(),a.getAdminComment(),a.getCreatedAt().toString());}
 public record CompetitionDto(Long id,String title,String description,LocalDate deadline,boolean published,String cover,List<String> gallery,String formUrl,String formDescription){} record CompetitionRequest(Long id,String title,String description,LocalDate deadline,boolean published,String formUrl,String formDescription){} record ApplicationRequest(Long competitionId,String participantName,String schoolName,String ageGroup,String comment){} public record ApplicationDto(Long id,Long competitionId,String competitionTitle,String userName,String userEmail,String participantName,String schoolName,String ageGroup,String comment,String status,String adminComment,String createdAt){} record ReviewRequest(String status,String adminComment){}
}
