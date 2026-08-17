package ru.obr_mosmit.site.controller;

import java.security.Principal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;
import ru.obr_mosmit.site.entity.Competition;
import ru.obr_mosmit.site.entity.CompetitionApplication;
import ru.obr_mosmit.site.entity.SiteUser;
import ru.obr_mosmit.site.repository.CompetitionApplicationRepository;
import ru.obr_mosmit.site.repository.CompetitionRepository;
import ru.obr_mosmit.site.repository.SiteUserRepository;

@RestController
public class CompetitionApiController {

    private final CompetitionRepository competitions;
    private final CompetitionApplicationRepository applications;
    private final SiteUserRepository users;

    public CompetitionApiController(
            CompetitionRepository competitions,
            CompetitionApplicationRepository applications,
            SiteUserRepository users) {
        this.competitions = competitions;
        this.applications = applications;
        this.users = users;
    }

    @GetMapping("/api/competitions")
    List<CompetitionDto> publicList() {
        return competitions.findAllByPublishedTrueOrderByDeadlineAsc()
                .stream()
                .map(this::competitionDto)
                .toList();
    }

    @GetMapping("/api/cabinet/applications")
    List<ApplicationDto> mine(Principal principal) {
        SiteUser user = user(principal);
        return applications.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::applicationDto)
                .toList();
    }

    @PostMapping("/api/cabinet/applications")
    ResponseEntity<?> apply(Principal principal, @RequestBody ApplicationRequest request) {
        SiteUser user = user(principal);
        Competition competition = competitions.findById(request.competitionId())
                .filter(Competition::isPublished)
                .orElseThrow();

        if (applications.existsByCompetitionIdAndUserId(competition.getId(), user.getId())) {
            return ResponseEntity.status(409).body("Заявка уже отправлена");
        }

        CompetitionApplication application = new CompetitionApplication();
        application.setCompetition(competition);
        application.setUser(user);
        application.setParticipantName(request.participantName());
        application.setSchoolName(request.schoolName());
        application.setAgeGroup(request.ageGroup());
        application.setComment(request.comment());

        return ResponseEntity.ok(applicationDto(applications.save(application)));
    }

    @GetMapping("/api/admin/competitions")
    List<CompetitionDto> all() {
        return competitions.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::competitionDto)
                .toList();
    }

    @PostMapping("/api/admin/competitions")
    CompetitionDto saveCompetition(@RequestBody CompetitionRequest request) {
        Competition competition = request.id() == null
                ? new Competition()
                : competitions.findById(request.id()).orElseThrow();

        competition.setTitle(request.title());
        competition.setDeadline(request.deadline());
        competition.setPublished(request.published());
        if (competition.getDescription() == null) {
            competition.setDescription("");
        }

        return competitionDto(competitions.save(competition));
    }

    @DeleteMapping("/api/admin/competitions/{id}")
    void deleteCompetition(@PathVariable Long id) {
        competitions.deleteById(id);
    }

    @GetMapping("/api/admin/applications")
    List<ApplicationDto> allApplications() {
        return applications.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::applicationDto)
                .toList();
    }

    @PatchMapping("/api/admin/applications/{id}")
    ApplicationDto review(@PathVariable Long id, @RequestBody ReviewRequest request) {
        CompetitionApplication application = applications.findById(id).orElseThrow();
        application.setStatus(request.status());
        application.setAdminComment(request.adminComment());
        return applicationDto(applications.save(application));
    }

    @DeleteMapping("/api/admin/applications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteApplication(@PathVariable Long id) {
        applications.deleteById(id);
    }

    private SiteUser user(Principal principal) {
        return users.findByEmailIgnoreCase(principal.getName()).orElseThrow();
    }

    private CompetitionDto competitionDto(Competition competition) {
        return new CompetitionDto(
                competition.getId(),
                competition.getTitle(),
                competition.getDeadline(),
                competition.isPublished(),
                competition.getCoverImageUrl(),
                splitLines(competition.getGalleryUrls()));
    }

    private ApplicationDto applicationDto(CompetitionApplication application) {
        return new ApplicationDto(
                application.getId(),
                application.getCompetition().getId(),
                application.getCompetition().getTitle(),
                application.getUser().getDisplayName(),
                application.getUser().getEmail(),
                application.getParticipantName(),
                application.getSchoolName(),
                application.getAgeGroup(),
                application.getComment(),
                application.getStatus(),
                application.getAdminComment(),
                application.getCreatedAt().toString());
    }

    private List<String> splitLines(String value) {
        return value == null || value.isBlank() ? List.of() : Arrays.asList(value.split("\\n"));
    }

    public record CompetitionDto(
            Long id,
            String title,
            LocalDate deadline,
            boolean published,
            String cover,
            List<String> gallery) {}

    record CompetitionRequest(Long id, String title, LocalDate deadline, boolean published) {}
    record ApplicationRequest(Long competitionId, String participantName, String schoolName, String ageGroup, String comment) {}

    public record ApplicationDto(
            Long id,
            Long competitionId,
            String competitionTitle,
            String userName,
            String userEmail,
            String participantName,
            String schoolName,
            String ageGroup,
            String comment,
            String status,
            String adminComment,
            String createdAt) {}

    record ReviewRequest(String status, String adminComment) {}
}
