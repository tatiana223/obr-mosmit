package ru.obr_mosmit.site.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.obr_mosmit.site.entity.SiteUser;

public interface SiteUserRepository extends JpaRepository<SiteUser, Long> {
    Optional<SiteUser> findByEmailIgnoreCase(String email);
    Optional<SiteUser> findByVerificationToken(String token);
    List<SiteUser> findAllByOrderByCreatedAtDesc();
}
