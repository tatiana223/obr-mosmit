package ru.obr_mosmit.site.competition;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface CompetitionApplicationRepository extends JpaRepository<CompetitionApplication,Long>{ List<CompetitionApplication> findAllByOrderByCreatedAtDesc(); List<CompetitionApplication> findAllByUserIdOrderByCreatedAtDesc(Long userId); boolean existsByCompetitionIdAndUserId(Long competitionId,Long userId); }
