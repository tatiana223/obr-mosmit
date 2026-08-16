package ru.obr_mosmit.site.account;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface SiteUserRepository extends JpaRepository<SiteUser,Long> {
    Optional<SiteUser> findByEmailIgnoreCase(String email);
    Optional<SiteUser> findByVerificationToken(String token);
    List<SiteUser> findAllByOrderByCreatedAtDesc();
}
