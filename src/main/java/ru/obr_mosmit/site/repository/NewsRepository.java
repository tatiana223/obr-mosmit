package ru.obr_mosmit.site.repository;
import ru.obr_mosmit.site.entity.News;
import ru.obr_mosmit.site.entity.NewsStatus;


import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findTop9ByStatusOrderByPublishedAtDesc(NewsStatus status);
    List<News> findByStatusOrderByPublishedAtDesc(NewsStatus status);
    Optional<News> findByIdAndStatus(Long id, NewsStatus status);
    List<News> findAllByOrderByUpdatedAtDesc();
    Optional<News> findBySlugAndStatus(String slug, NewsStatus status);
    long countByStatus(NewsStatus status);
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsBySourceUrl(String sourceUrl);
    Optional<News> findBySourceUrl(String sourceUrl);

    @Query("select n from News n where lower(n.title) like lower(concat('%', :query, '%')) order by n.updatedAt desc")
    List<News> searchByTitle(@Param("query") String query);
}
