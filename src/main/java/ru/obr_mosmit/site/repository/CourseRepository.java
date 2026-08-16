package ru.obr_mosmit.site.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.obr_mosmit.site.entity.Course;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findAllByOrderByCreatedAtDesc();
    List<Course> findAllByPublishedTrueOrderByCreatedAtDesc();
}
