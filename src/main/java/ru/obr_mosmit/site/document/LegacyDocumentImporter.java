package ru.obr_mosmit.site.document;

import java.io.IOException;
import java.net.URI;
import java.nio.file.*;
import java.util.*;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LegacyDocumentImporter {
    private static final String BASE = "https://eorok.ru";
    private static final Pattern DOCUMENT_PAGE = Pattern.compile("^/dokumenty/[^/]+/\\d+-.+");
    private static final Pattern FILE = Pattern.compile("(?i).+\\.(pdf|docx?|xlsx?|zip|rar)(?:\\?.*)?$");
    private final SiteDocumentRepository repository;
    private final Path files;

    public LegacyDocumentImporter(SiteDocumentRepository repository, @Value("${app.uploads.directory}") String uploads) {
        this.repository = repository;
        this.files = Path.of(uploads, "imported-documents");
    }

    @Transactional
    public ImportResult importAll() throws IOException {
        Files.createDirectories(files);
        Collection<Candidate> candidates = discoverPages().values();
        int imported = 0, skipped = 0, downloaded = 0, failed = 0;
        for (Candidate candidate : candidates) {
            String url = candidate.url();
            var existing = repository.findBySourceUrl(url);
            if (existing.isPresent()) {
                SiteDocument item = existing.get();
                item.setSortOrder(candidate.order());
                if (!candidate.category().isBlank()) item.setCategory(candidate.category());
                repository.save(item);
                skipped++;
                continue;
            }
            try {
                Parsed parsed = candidate.file() ? parseFile(candidate) : parse(candidate);
                if (parsed == null) continue; // category or navigation page
                repository.save(parsed.item());
                imported++;
                downloaded += parsed.downloaded();
            } catch (Exception exception) {
                failed++;
            }
        }
        return new ImportResult(imported, skipped, candidates.size(), downloaded, failed);
    }

    private Map<String, Candidate> discoverPages() throws IOException {
        Set<String> visited = new LinkedHashSet<>();
        Map<String, Candidate> candidates = new LinkedHashMap<>();
        Deque<String> pending = new ArrayDeque<>();
        pending.add(BASE + "/dokumenty");
        while (!pending.isEmpty() && visited.size() < 400) {
            String current = pending.removeFirst();
            if (!visited.add(current)) continue;
            Document page;
            try { page = load(current); } catch (IOException exception) { continue; }
            String category = categoryFromUrl(current);
            for (Element link : page.select("a[href]")) {
                URI absolute;
                try { absolute = URI.create(current).resolve(link.attr("href").split("#")[0]); }
                catch (IllegalArgumentException exception) { continue; }
                String path = absolute.getPath();
                if (!"eorok.ru".equalsIgnoreCase(absolute.getHost()) && !"www.eorok.ru".equalsIgnoreCase(absolute.getHost())) continue;
                if (path == null) continue;
                String absoluteUrl = absolute.toString();
                if (FILE.matcher(absoluteUrl).matches()) {
                    String title = link.text().trim();
                    if (title.isBlank()) title = fileName(absoluteUrl);
                    candidates.putIfAbsent(absoluteUrl, new Candidate(absoluteUrl, title, category, true, candidates.size() + 1));
                    continue;
                }
                if (!path.startsWith("/dokumenty")) continue;
                String normalized = BASE + path + (absolute.getQuery() == null ? "" : "?" + absolute.getQuery());
                if (!visited.contains(normalized)) pending.addLast(normalized);
                if (DOCUMENT_PAGE.matcher(path).matches()) candidates.putIfAbsent(BASE + path, new Candidate(BASE + path, link.text().trim(), categoryFromUrl(BASE + path), false, candidates.size() + 1));
            }
        }
        return candidates;
    }

    private Parsed parseFile(Candidate candidate) throws IOException {
        String local = download(candidate.url());
        SiteDocument item = new SiteDocument();
        item.setTitle(candidate.title());
        item.setSlug("file-" + Integer.toUnsignedString(candidate.url().hashCode(), 36));
        item.setCategory(candidate.category());
        item.setSummary("Документ доступен для просмотра и скачивания.");
        item.setContent("<p>Документ можно просмотреть на этой странице или скачать на устройство.</p>");
        item.setAttachments(candidate.title().replace('|', ' ') + "|" + local);
        item.setSourceUrl(candidate.url());
        item.setSortOrder(candidate.order());
        return new Parsed(item, 1);
    }

    private Parsed parse(Candidate candidate) throws IOException {
        String url = candidate.url();
        Document doc = load(url);
        Element body = first(doc, "[itemprop=articleBody]", ".item-page", "article");
        if (body == null) return null;
        Element breadcrumbTitle = doc.selectFirst(".breadcrumb li.active span");
        String title = breadcrumbTitle == null ? doc.title().trim() : breadcrumbTitle.text().trim();
        if (title.isBlank()) return null;
        body.select("script,style,nav,.pagination,.pager").remove();
        List<String> attachments = new ArrayList<>();
        int downloaded = 0;
        for (Element link : body.select("a[href]")) {
            String href = link.absUrl("href");
            if (!FILE.matcher(href).matches()) continue;
            try {
                String label = link.text().isBlank() ? fileName(href) : link.text().replace('|', ' ');
                attachments.add(label + "|" + download(href));
                downloaded++;
            } catch (Exception ignored) {
                // One unavailable attachment must not cancel the whole archive.
            }
        }
        String text = body.text().trim();
        String category = candidate.category();
        SiteDocument item = new SiteDocument();
        item.setTitle(title);
        item.setSlug(url.substring(url.lastIndexOf('/') + 1));
        item.setCategory(category);
        item.setSummary(text.length() > 500 ? text.substring(0, 497).strip() + "…" : text);
        item.setContent(body.html());
        item.setAttachments(String.join("\n", attachments));
        item.setSourceUrl(url);
        item.setSortOrder(candidate.order());
        return new Parsed(item, downloaded);
    }

    private String download(String url) throws IOException {
        String original = fileName(url);
        String safe = Integer.toHexString(url.hashCode()) + "-" + original.replaceAll("[^A-Za-zА-Яа-я0-9._-]", "_");
        Path target = files.resolve(safe);
        if (!Files.exists(target)) try (var input = URI.create(url).toURL().openStream()) { Files.copy(input, target); }
        return "/uploads/imported-documents/" + safe;
    }
    private String fileName(String url) { String path = URI.create(url).getPath(); return path.substring(path.lastIndexOf('/') + 1); }
    private String categoryFromUrl(String url) {
        String[] parts = URI.create(url).getPath().split("/");
        if (parts.length < 3) return "Документы";
        return switch (parts[2]) {
            case "17-glavnoe" -> "Главное";
            case "20-osnovy-pravoslavnoj-kultury" -> "I. Основы Православной культуры";
            case "18-voskresnye-shkoly" -> "II. Воскресные школы";
            case "19-katekhizatsiya-i-oglashenie" -> "III. Катехизация и оглашение";
            case "21-pravoslavnyj-komponent-osnovnogo-dopolnitelnogo-obrazovaniya" -> "IV. Православный компонент";
            case "27-konfessionalnaya-attestatsiya" -> "V. Конфессиональная аттестация";
            case "26-rasporyazheniya" -> "VI. Распоряжения";
            case "22-tsentry-podgotovki-prikhodskikh-spetsialistov" -> "VII. Центры подготовки приходских специалистов";
            case "23-monitoring" -> "Мониторинг";
            default -> "Документы";
        };
    }
    private Document load(String url) throws IOException { return Jsoup.connect(url).userAgent("obr-mosmit.ru migration/1.0").timeout(30_000).get(); }
    private Element first(Document doc, String... selectors) { for (String selector : selectors) { Element item = doc.selectFirst(selector); if (item != null) return item; } return null; }
    private record Parsed(SiteDocument item, int downloaded) {}
    private record Candidate(String url, String title, String category, boolean file, int order) {}
    public record ImportResult(int imported, int skipped, int found, int downloaded, int failed) {}
}
