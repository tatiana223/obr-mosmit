package ru.obr_mosmit.site.school;

import java.io.IOException;
import java.net.URI;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LegacySchoolImporter {
    private static final String BASE = "https://eorok.ru";
    private static final Pattern ARTICLE = Pattern.compile("^/pravoslavnye-shkoly/\\d+-.+");
    private final SchoolRepository repository;

    public LegacySchoolImporter(SchoolRepository repository) { this.repository = repository; }

    @Transactional
    public ImportResult importAll() throws IOException {
        Set<String> urls = new LinkedHashSet<>();
        for (int page = 0; page < 10; page++) {
            String indexUrl = page == 0 ? BASE + "/pravoslavnye-shkoly" : BASE + "/pravoslavnye-shkoly?start=" + page * 10;
            Document index = load(indexUrl);
            int before = urls.size();
            index.select("a[href]").stream().map(a -> a.attr("href").split("#")[0])
                    .filter(href -> ARTICLE.matcher(href).matches())
                    .map(href -> URI.create(BASE).resolve(href).toString()).forEach(urls::add);
            if (page > 0 && urls.size() == before) break;
        }
        int imported = 0, skipped = 0;
        for (String url : urls) {
            if (repository.existsBySourceUrl(url)) { skipped++; continue; }
            repository.save(parse(url)); imported++;
        }
        return new ImportResult(imported, skipped, urls.size());
    }

    private School parse(String url) throws IOException {
        Document doc = load(url);
        Element body = first(doc, "[itemprop=articleBody]", ".item-page", "article", "main");
        Element heading = first(doc, "h1", ".page-header h2", "h2[itemprop=name]");
        if (body == null || heading == null) throw new IOException("Не удалось разобрать школу: " + url);
        body.select("script,style,nav,.pagination,.pager").remove();
        String text = body.text().trim();
        Element image = body.selectFirst("img[src]");
        School school = new School();
        school.setTitle(heading.text().trim());
        school.setSlug(url.substring(url.lastIndexOf('/') + 1));
        school.setSummary(text.length() > 500 ? text.substring(0, 497).strip() + "…" : text);
        school.setContent(body.html());
        school.setImageUrl(image == null ? null : image.absUrl("src"));
        school.setSourceUrl(url);
        return school;
    }

    private Document load(String url) throws IOException {
        return Jsoup.connect(url).userAgent("obr-mosmit.ru migration/1.0").timeout(30_000).get();
    }
    private Element first(Document doc, String... selectors) {
        for (String selector : selectors) { Element item = doc.selectFirst(selector); if (item != null) return item; }
        return null;
    }
    public record ImportResult(int imported, int skipped, int found) {}
}
