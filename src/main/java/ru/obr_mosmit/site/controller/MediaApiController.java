package ru.obr_mosmit.site.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
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

    @DeleteMapping("/news/{id}")
    List<String> removeNewsGallery(@PathVariable Long id, @RequestParam String url) {
        var item = news.findById(id).orElseThrow();
        var urls = removeImage(item.getGalleryUrls(), url);
        item.setGalleryUrls(join(urls));
        news.save(item);
        return urls;
    }

    @DeleteMapping("/news/{id}/cover")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void removeNewsCover(@PathVariable Long id) {
        var item = news.findById(id).orElseThrow();
        storage.deleteStored(item.getCoverImageUrl());
        item.setCoverImageUrl(null);
        news.save(item);
    }

    @PostMapping("/schools/{id}")
    List<String> schoolGallery(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        var item = schools.findById(id).orElseThrow();
        var urls = appendImages(item.getGalleryUrls(), files);
        item.setGalleryUrls(String.join("\n", urls));
        schools.save(item);
        return urls;
    }

    @DeleteMapping("/schools/{id}")
    List<String> removeSchoolGallery(@PathVariable Long id, @RequestParam String url) {
        var item = schools.findById(id).orElseThrow();
        var urls = removeImage(item.getGalleryUrls(), url);
        item.setGalleryUrls(join(urls));
        schools.save(item);
        return urls;
    }

    @PostMapping(value = "/schools/{id}/cover", produces = MediaType.APPLICATION_JSON_VALUE)
    MediaUrlDto schoolCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        var item = schools.findById(id).orElseThrow();
        item.setImageUrl(storage.store(file));
        schools.save(item);
        return new MediaUrlDto(item.getImageUrl());
    }

    @PostMapping(value = "/competitions/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    MediaUrlDto competitionCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        var item = competitions.findById(id).orElseThrow();
        item.setCoverImageUrl(storage.store(file));
        competitions.save(item);
        return new MediaUrlDto(item.getCoverImageUrl());
    }

    @PostMapping("/competitions/{id}/gallery")
    List<String> competitionGallery(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        var item = competitions.findById(id).orElseThrow();
        var urls = appendImages(item.getGalleryUrls(), files);
        item.setGalleryUrls(String.join("\n", urls));
        competitions.save(item);
        return urls;
    }

    @DeleteMapping("/competitions/{id}/gallery")
    List<String> removeCompetitionGallery(@PathVariable Long id, @RequestParam String url) {
        var item = competitions.findById(id).orElseThrow();
        var urls = removeImage(item.getGalleryUrls(), url);
        item.setGalleryUrls(join(urls));
        competitions.save(item);
        return urls;
    }

    @PostMapping(value = "/courses/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    MediaUrlDto courseCover(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        var item = courses.findById(id).orElseThrow();
        item.setCoverImageUrl(storage.store(file));
        courses.save(item);
        return new MediaUrlDto(item.getCoverImageUrl());
    }

    @PostMapping("/courses/{id}/gallery")
    List<String> courseGallery(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        var item = courses.findById(id).orElseThrow();
        var urls = appendImages(item.getGalleryUrls(), files);
        item.setGalleryUrls(String.join("\n", urls));
        courses.save(item);
        return urls;
    }

    @DeleteMapping("/courses/{id}/gallery")
    List<String> removeCourseGallery(@PathVariable Long id, @RequestParam String url) {
        var item = courses.findById(id).orElseThrow();
        var urls = removeImage(item.getGalleryUrls(), url);
        item.setGalleryUrls(join(urls));
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

    private ArrayList<String> removeImage(String existing, String url) {
        ArrayList<String> urls = parse(existing);
        boolean removed = urls.remove(url);
        if (!removed) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Фотография не найдена");
        }
        storage.deleteStored(url);
        return urls;
    }

    private String join(List<String> urls) {
        return urls.isEmpty() ? "" : String.join("\n", urls);
    }

    public record MediaUrlDto(String url) {}
}
