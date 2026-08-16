package ru.obr_mosmit.site.bootstrap;
import ru.obr_mosmit.site.service.importer.LegacyNewsImporter;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.news-import.enabled", havingValue = "true")
public class LegacyNewsImportRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(LegacyNewsImportRunner.class);
    private final LegacyNewsImporter importer;

    public LegacyNewsImportRunner(LegacyNewsImporter importer) { this.importer = importer; }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        var result = importer.importAll();
        log.info("Legacy news import completed: imported={}, skipped={}, found={}",
                result.imported(), result.skipped(), result.found());
    }
}
