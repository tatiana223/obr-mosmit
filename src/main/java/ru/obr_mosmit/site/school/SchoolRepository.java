package ru.obr_mosmit.site.school;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolRepository extends JpaRepository<School, Long> {
    List<School> findAllByOrderByTitleAsc();
    Optional<School> findById(Long id);
    boolean existsBySourceUrl(String sourceUrl);
}
