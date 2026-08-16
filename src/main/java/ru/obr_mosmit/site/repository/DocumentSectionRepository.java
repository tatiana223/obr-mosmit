package ru.obr_mosmit.site.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.obr_mosmit.site.entity.DocumentSection;

public interface DocumentSectionRepository extends JpaRepository<DocumentSection, Long> {
    List<DocumentSection> findAllByOrderBySortOrderAscTitleAsc();
    Optional<DocumentSection> findBySlug(String slug);
}
