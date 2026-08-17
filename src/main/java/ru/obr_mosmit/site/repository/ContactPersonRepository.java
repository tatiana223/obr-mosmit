package ru.obr_mosmit.site.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.obr_mosmit.site.entity.ContactPerson;

public interface ContactPersonRepository extends JpaRepository<ContactPerson, Long> {
    List<ContactPerson> findAllByOrderBySortOrderAscIdAsc();
}
