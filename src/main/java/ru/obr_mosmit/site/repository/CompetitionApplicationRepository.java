package ru.obr_mosmit.site.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.obr_mosmit.site.entity.CompetitionApplication;

public interface CompetitionApplicationRepository extends JpaRepository<CompetitionApplication, Long> {
    List<CompetitionApplication> findAllByOrderByCreatedAtDesc();
    List<CompetitionApplication> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByCompetitionIdAndUserId(Long competitionId, Long userId);
}
