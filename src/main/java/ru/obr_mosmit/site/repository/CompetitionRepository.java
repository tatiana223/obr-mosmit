package ru.obr_mosmit.site.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.obr_mosmit.site.entity.Competition;

public interface CompetitionRepository extends JpaRepository<Competition, Long> {
    List<Competition> findAllByOrderByCreatedAtDesc();
    List<Competition> findAllByPublishedTrueOrderByDeadlineAsc();
}
