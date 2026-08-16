package ru.obr_mosmit.site.document;
import java.util.List;import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SiteDocumentRepository extends JpaRepository<SiteDocument,Long>{
    List<SiteDocument> findAllByOrderBySortOrderAscTitleAsc();
    List<SiteDocument> findAllByPublishedTrueOrderBySortOrderAscTitleAsc();
    boolean existsBySourceUrl(String sourceUrl);
    Optional<SiteDocument> findBySourceUrl(String sourceUrl);
}
