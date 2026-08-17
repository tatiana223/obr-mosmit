package ru.obr_mosmit.site.repository;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.obr_mosmit.site.entity.CompetitionApplication;
public interface CompetitionApplicationRepository extends JpaRepository<CompetitionApplication,Long>{
 List<CompetitionApplication> findAllByOrderByCreatedAtDesc();
 List<CompetitionApplication> findAllByParticipantEmailIgnoreCaseOrderByCreatedAtDesc(String participantEmail);
 boolean existsByCompetitionIdAndParticipantEmailIgnoreCase(Long competitionId,String participantEmail);
 boolean existsByTrackingCode(String trackingCode);
}
