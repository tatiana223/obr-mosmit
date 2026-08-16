package ru.obr_mosmit.site.competition;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface CompetitionRepository extends JpaRepository<Competition,Long>{ List<Competition> findAllByOrderByCreatedAtDesc(); List<Competition> findAllByPublishedTrueOrderByDeadlineAsc(); }
