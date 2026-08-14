package ru.obr_mosmit.site.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import ru.obr_mosmit.site.news.NewsRepository;
import ru.obr_mosmit.site.news.NewsStatus;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Controller
public class PublicController {
    private final NewsRepository newsRepository;

    public PublicController(NewsRepository newsRepository) {
        this.newsRepository = newsRepository;
    }

    @GetMapping("/")
    String home(Model model) {
        model.addAttribute("news", newsRepository.findTop9ByStatusOrderByPublishedAtDesc(NewsStatus.PUBLISHED));
        return "public/home";
    }

    @GetMapping("/novosti/{slug}")
    String news(@PathVariable String slug, Model model) {
        var item = newsRepository.findBySlugAndStatus(slug, NewsStatus.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        model.addAttribute("item", item);
        return "public/news-detail";
    }

    @GetMapping("/login")
    String login() { return "login"; }

    @GetMapping("/novosti")
    String allNews(@RequestParam(defaultValue = "") String q, Model model) {
        var items = q.isBlank() ? newsRepository.findAllByOrderByUpdatedAtDesc() : newsRepository.searchByTitle(q);
        model.addAttribute("news", items.stream().filter(n -> n.getStatus() == NewsStatus.PUBLISHED).toList());
        model.addAttribute("query", q);
        return "public/news-list";
    }
}
