package ru.obr_mosmit.site.bootstrap;
import ru.obr_mosmit.site.entity.School;
import ru.obr_mosmit.site.entity.SchoolDetail;
import ru.obr_mosmit.site.repository.SchoolDetailRepository;
import ru.obr_mosmit.site.repository.SchoolRepository;


import java.util.*;
import java.util.regex.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SchoolDetailInitializer implements ApplicationRunner {
    private static final Pattern MARKER = Pattern.compile("<(strong|b)\\b[^>]*>([\\s\\S]*?)</\\1>", Pattern.CASE_INSENSITIVE);
    private static final Pattern KNOWN = Pattern.compile("адрес|телефон|электронн|почт|сайт|руковод|директор|духовник|лиценз|аккредит|конфессион|дата учрежден|дата регистрац|истори|мисси|учащ|класс|педагог|программ|образовательн|предмет|направлен", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private final SchoolRepository schools;
    private final SchoolDetailRepository details;

    public SchoolDetailInitializer(SchoolRepository schools, SchoolDetailRepository details) {
        this.schools = schools;
        this.details = details;
    }

    @Override @Transactional
    public void run(ApplicationArguments args) {
        for (School school : schools.findAll()) {
            if (details.existsBySchoolId(school.getId())) continue;
            List<Item> items = parse(school.getContent());
            for (int index = 0; index < items.size(); index++) {
                Item item = items.get(index);
                SchoolDetail detail = new SchoolDetail();
                detail.setSchool(school);
                detail.setSectionKey(category(item.label()));
                detail.setLabel(cleanTitle(item.label()));
                detail.setContent(cleanHtml(item.content()));
                detail.setSortOrder(index);
                details.save(detail);
            }
        }
    }

    private List<Item> parse(String html) {
        List<Match> matches = new ArrayList<>();
        Matcher matcher = MARKER.matcher(html);
        while (matcher.find()) {
            String rawLabel = Jsoup.parse(matcher.group(2)).text().trim();
            String label = cleanTitle(rawLabel);
            boolean numberedHeading = rawLabel.matches("^\\s*\\d+\\s*[.)-].*");
            if (label.length() > 1 && label.length() < 150 && (numberedHeading || KNOWN.matcher(label).find())) {
                matches.add(new Match(matcher.start(), matcher.end(), label));
            }
        }
        if (!matches.isEmpty()) {
            List<Item> result = new ArrayList<>();
            for (int i = 0; i < matches.size(); i++) {
                Match current = matches.get(i);
                int end = i + 1 < matches.size() ? matches.get(i + 1).start() : html.length();
                String content = html.substring(current.end(), end);
                if (hasContent(content)) result.add(new Item(current.label(), content));
            }
            if (!result.isEmpty()) return result;
        }
        return parseRows(html);
    }

    private List<Item> parseRows(String html) {
        Document document = Jsoup.parseBodyFragment(html);
        List<Item> result = new ArrayList<>();
        String currentTitle = "Общие сведения";
        StringBuilder currentBody = new StringBuilder();
        for (Element row : document.select("table tr")) {
            Element cell = row.selectFirst("td,th");
            if (cell == null || (!hasContent(cell.html()) && cell.selectFirst("img") == null)) continue;
            String text = cell.text().replaceAll("\\s+", " ").trim();
            boolean heading = cell.selectFirst("strong,b") != null && text.length() < 190;
            if (heading) {
                if (hasContent(currentBody.toString())) result.add(new Item(currentTitle, currentBody.toString()));
                currentTitle = cleanTitle(text);
                currentBody = new StringBuilder();
            } else currentBody.append(cell.html());
        }
        if (hasContent(currentBody.toString())) result.add(new Item(currentTitle, currentBody.toString()));
        if (result.isEmpty() && hasContent(html)) result.add(new Item("Общие сведения", html));
        return result;
    }

    private String category(String label) {
        String value = label.toLowerCase(Locale.ROOT);
        if (value.matches(".*(адрес|сайт|электрон|почт|телефон|тел\\.|факс|проезд|схема).*")) return "contacts";
        if (value.matches(".*(руковод|директор|духовник).*")) return "management";
        if (value.matches(".*(лиценз|аккредит|свидетельств|конфессион|регистрац).*")) return "documents";
        if (value.matches(".*(учащ|класс|педагог|администрац|предмет|программ|направлен|образовательн|отделени).*")) return "education";
        if (value.matches(".*(наименован|дата учрежден|истори|мисси|общие сведения|учредител|источник финанс).*")) return "about";
        return "additional";
    }

    private String cleanTitle(String title) {
        return title.replaceFirst("^\\s*\\d+\\s*[.)-]?\\s*", "").replaceFirst("[:：]\\s*$", "").trim();
    }

    private boolean hasContent(String html) {
        Document document = Jsoup.parseBodyFragment(html);
        String text = document.text().replaceAll("[\\s\\u00a0–—:;,.!?]+", "");
        return !text.isBlank() || document.selectFirst("img,a[href]") != null;
    }

    private String cleanHtml(String html) {
        Document document = Jsoup.parseBodyFragment(html);
        document.select("script,style,.pagination,.pager").remove();
        for (Element element : document.getAllElements()) {
            for (String attribute : List.of("style", "width", "height", "align", "cellpadding", "cellspacing", "face", "size", "color")) element.removeAttr(attribute);
        }
        return document.body().html();
    }

    private record Match(int start, int end, String label) {}
    private record Item(String label, String content) {}
}
