package ru.obr_mosmit.site.school;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolDetailRepository extends JpaRepository<SchoolDetail, Long> {
    List<SchoolDetail> findAllBySchoolIdOrderBySortOrderAscIdAsc(Long schoolId);
    boolean existsBySchoolId(Long schoolId);
    void deleteAllBySchoolId(Long schoolId);
}
