package ru.obr_mosmit.site.admin;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.validation.BindingResult;
import jakarta.validation.Valid;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import ru.obr_mosmit.site.dto.NewsForm;
import ru.obr_mosmit.site.service.importer.LegacyNewsImporter;
import ru.obr_mosmit.site.repository.NewsRepository;
import ru.obr_mosmit.site.service.NewsService;
import ru.obr_mosmit.site.entity.NewsStatus;

@Controller
public class AdminController {
    private final NewsRepository newsRepository;
    private final NewsService newsService;
    private final LegacyNewsImporter legacyNewsImporter;

    public AdminController(NewsRepository newsRepository, NewsService newsService, LegacyNewsImporter legacyNewsImporter) {
        this.newsRepository = newsRepository;
        this.newsService = newsService;
        this.legacyNewsImporter = legacyNewsImporter;
    }

    @GetMapping("/admin")
    String dashboard(Model model) {
        model.addAttribute("totalNews", newsRepository.count());
        model.addAttribute("publishedNews", newsRepository.countByStatus(NewsStatus.PUBLISHED));
        model.addAttribute("draftNews", newsRepository.countByStatus(NewsStatus.DRAFT));
        model.addAttribute("recentNews", newsRepository.findAllByOrderByUpdatedAtDesc().stream().limit(6).toList());
        return "admin/dashboard";
    }

    @GetMapping("/admin/news")
    String newsList(@RequestParam(defaultValue = "") String q, Model model) {
        model.addAttribute("news", q.isBlank() ? newsRepository.findAllByOrderByUpdatedAtDesc() : newsRepository.searchByTitle(q));
        model.addAttribute("query", q);
        return "admin/news-list";
    }

    @GetMapping("/admin/news/new")
    String newNews(Model model) {
        model.addAttribute("newsForm", new NewsForm());
        model.addAttribute("pageTitle", "Новая новость");
        return "admin/news-form";
    }

    @GetMapping("/admin/news/{id}/edit")
    String editNews(@PathVariable Long id, Model model) {
        var item = newsService.get(id);
        model.addAttribute("newsForm", NewsForm.from(item));
        model.addAttribute("item", item);
        model.addAttribute("pageTitle", "Редактирование новости");
        return "admin/news-form";
    }

    @PostMapping({"/admin/news", "/admin/news/{id}"})
    String saveNews(@PathVariable(required = false) Long id,
                    @Valid @ModelAttribute NewsForm newsForm, BindingResult errors,
                    @RequestParam(required = false) MultipartFile image, Model model,
                    RedirectAttributes redirectAttributes) {
        if (errors.hasErrors()) {
            model.addAttribute("pageTitle", id == null ? "Новая новость" : "Редактирование новости");
            if (id != null) model.addAttribute("item", newsService.get(id));
            return "admin/news-form";
        }
        var saved = newsService.save(id, newsForm, image);
        redirectAttributes.addFlashAttribute("message", "Новость сохранена");
        return "redirect:/admin/news/" + saved.getId() + "/edit";
    }

    @PostMapping("/admin/news/{id}/delete")
    String deleteNews(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        newsService.delete(id);
        redirectAttributes.addFlashAttribute("message", "Новость удалена");
        return "redirect:/admin/news";
    }

    @PostMapping("/admin/news/import")
    String importLegacyNews(RedirectAttributes redirectAttributes) {
        try {
            var result = legacyNewsImporter.importAll();
            redirectAttributes.addFlashAttribute("message", "Импортировано: " + result.imported()
                    + ", уже было: " + result.skipped() + ", найдено: " + result.found());
        } catch (Exception exception) {
            redirectAttributes.addFlashAttribute("message", "Импорт не завершён: " + exception.getMessage());
        }
        return "redirect:/admin/news";
    }
}
