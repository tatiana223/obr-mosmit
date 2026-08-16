package ru.obr_mosmit.site.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ru.obr_mosmit.site.repository.CompetitionRepository;
import ru.obr_mosmit.site.repository.CourseRepository;
import ru.obr_mosmit.site.repository.NewsRepository;
import ru.obr_mosmit.site.repository.SchoolRepository;
import ru.obr_mosmit.site.service.MediaStorageService;

@RestController
@RequestMapping("/api/admin/media")
public class MediaApiController {

    private final MediaStorageService storage;
    private final NewsRepository news;
    private final SchoolRepository schools;
    private final CompetitionRepository competitions;
    private final CourseRepository courses;

    public MediaApiController(
            MediaStorageService storage,
            NewsRepository news,
            SchoolRepository schools,
            CompetitionRepository competitions,
            CourseRepository courses) {
        this.storage = storage;
        this.news = news;
        this.schools = schools;
        this.competitions = competitions;
        this.courses = courses;
    }

    @PostMapping("/news/{id}")
    List<String> newsGallery(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        var item = news.findById(id).orElseThrow();
        var urls = appendImages(item.getGalleryUrls(), files);
        item.setGalleryUrls(String.join("\n", urls));
        news.save(item);
        return urls;
    }

    @PostMapping("/schools/{id}")
    List<String> schoolGallery(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        var item = schools.findById(id).orElseThrow();
        var urls = appendImages(item.getGalleryUrls(), files);
        item.setGalleryUrls(String.join("\n", urls));
        schools.save(item);
        return urls;
    }

    @PostMapping("/schools/{id}/cover")
    String schoolCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        var item = schools.findById(id).orElseThrow();
        item.setImageUrl(storage.store(file));
        schools.save(item);
        return item.getImageUrl();
    }

    @PostMapping("/competitions/{id}")
    String competitionCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        var item = competitions.findById(id).orElseThrow();
        item.setCoverImageUrl(storage.store(file));
        competitions.save(item);
        return item.getCoverImageUrl();
    }

    @PostMapping("/competitions/{id}/gallery")
    List<String> competitionGallery(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        var item = competitions.findById(id).orElseThrow();
        var urls = appendImages(item.getGalleryUrls(), files);
        item.setGalleryUrls(String.join("\n", urls));
        competitions.save(item);
        return urls;
    }

    @PostMapping("/courses/{id}")
    String courseCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        var item = courses.findById(id).orElseThrow();
        item.setCoverImageUrl(storage.store(file));
        courses.save(item);
        return item.getCoverImageUrl();
    }

    @PostMapping("/courses/{id}/gallery")
    List<String> courseGallery(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        var item = courses.findById(id).orElseThrow();
        var urls = appendImages(item.getGalleryUrls(), files);
        item.setGalleryUrls(String.join("\n", urls));
        courses.save(item);
        return urls;
    }

    private ArrayList<String> appendImages(String existing, MultipartFile[] files) {
        ArrayList<String> urls = parse(existing);
        for (MultipartFile file : files) {
            urls.add(storage.store(file));
        }
        return urls;
    }

    private ArrayList<String> parse(String value) {
        return new ArrayList<>(
                value == null || value.isBlank()
                        ? List.of()
                        : Arrays.asList(value.split("\\n")));
    }
}
