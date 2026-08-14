package ru.obr_mosmit.site.news;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LegacyNewsImporter {
    private static final String BASE = "https://eorok.ru";
    private static final Pattern ARTICLE = Pattern.compile("^/novosti/\\d+-.+");
    private static final Pattern DATE = Pattern.compile("(\\d{2}\\.\\d{2}\\.\\d{4})");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private final NewsRepository repository;
    private final Path imageDirectory;

    public LegacyNewsImporter(NewsRepository repository, @Value("${app.uploads.directory}") String uploads) {
        this.repository = repository;
        this.imageDirectory = Path.of(uploads, "imported-news");
    }

    @Transactional
    public ImportResult importAll() throws IOException {
        Files.createDirectories(imageDirectory);
        Set<String> urls = new LinkedHashSet<>();
        for (int page = 0; page < 15; page++) {
            String archiveUrl = page == 0 ? BASE + "/novosti" : BASE + "/novosti?start=" + page * 10;
            Document archive = load(archiveUrl);
            archive.select("a[href]").stream()
                    .map(link -> link.attr("href").split("#")[0])
                    .filter(href -> ARTICLE.matcher(href).matches())
                    .map(href -> URI.create(BASE).resolve(href).toString())
                    .forEach(urls::add);
        }

        int imported = 0;
        int skipped = 0;
        for (String url : urls) {
            try {
                News parsed = parseArticle(url);
                var existing = repository.findBySourceUrl(url);
                if (existing.isPresent()) {
                    News item = existing.get();
                    item.setTitle(parsed.getTitle());
                    item.setSummary(parsed.getSummary());
                    item.setContent(parsed.getContent());
                    item.setCoverImageUrl(parsed.getCoverImageUrl());
                    item.setPublishedAt(parsed.getPublishedAt());
                    repository.save(item);
                    skipped++;
                } else {
                    repository.save(parsed);
                    imported++;
                }
            } catch (Exception exception) {
                skipped++;
            }
        }
        return new ImportResult(imported, skipped, urls.size());
    }

    private News parseArticle(String url) throws IOException {
        Document doc = load(url);
        Element body = first(doc, "[itemprop=articleBody]", ".item-page", "article", "main");
        Element titleNode = first(doc, "h1", ".page-header h2", "h2[itemprop=name]");
        if (body == null || titleNode == null) throw new IOException("Не удалось разобрать новость: " + url);

        body.select("script,style,nav,.pagination,.pager").remove();
        String title = titleNode.text().trim();
        String text = body.text().trim();
        var dateMatch = DATE.matcher(doc.text());
        Instant published = dateMatch.find()
                ? LocalDate.parse(dateMatch.group(1), DATE_FORMAT).atStartOfDay(ZoneId.of("Europe/Moscow")).toInstant()
                : Instant.now();
        String coverImage = null;
        for (Element image : body.select("img[src]")) {
            String source = image.absUrl("src");
            if (!isHttpUrl(source)) {
                image.remove();
                continue;
            }
            try {
                String local = downloadImage(source);
                image.attr("src", local);
                image.removeAttr("srcset");
                if (coverImage == null) coverImage = local;
            } catch (Exception ignored) {
                if (coverImage == null) coverImage = source;
            }
        }

        News news = new News();
        news.setTitle(title);
        news.setSlug(url.substring(url.lastIndexOf('/') + 1));
        news.setSummary(text.length() > 320 ? text.substring(0, 317).strip() + "…" : text);
        news.setContent(body.html());
        news.setCoverImageUrl(coverImage);
        news.setSourceUrl(url);
        news.setPublishedAt(published);
        news.setStatus(NewsStatus.PUBLISHED);
        return news;
    }

    private String downloadImage(String url) throws IOException {
        URI uri = URI.create(url);
        String path = uri.getPath();
        String original = path.substring(path.lastIndexOf('/') + 1);
        if (original.isBlank()) original = "image.jpg";
        String safe = Integer.toHexString(url.hashCode()) + "-" + original.replaceAll("[^A-Za-zА-Яа-я0-9._-]", "_");
        Path target = imageDirectory.resolve(safe);
        if (!Files.exists(target)) {
            try (var input = uri.toURL().openStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }
        }
        return "/uploads/imported-news/" + safe;
    }

    private boolean isHttpUrl(String value) {
        try {
            URI uri = URI.create(value);
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private Document load(String url) throws IOException {
        return Jsoup.connect(url).userAgent("obr-mosmit.ru migration/1.0").timeout(30_000).get();
    }

    private Element first(Document doc, String... selectors) {
        for (String selector : selectors) {
            Element found = doc.selectFirst(selector);
            if (found != null) return found;
        }
        return null;
    }

    public record ImportResult(int imported, int skipped, int found) {}
}
