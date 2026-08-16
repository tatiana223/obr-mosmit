package ru.obr_mosmit.site.bootstrap;
import ru.obr_mosmit.site.service.importer.LegacySchoolImporter;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.school-import.enabled", havingValue = "true")
public class LegacySchoolImportRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(LegacySchoolImportRunner.class);
    private final LegacySchoolImporter importer;
    public LegacySchoolImportRunner(LegacySchoolImporter importer) { this.importer = importer; }
    @Override public void run(ApplicationArguments args) throws Exception {
        var result = importer.importAll();
        log.info("Legacy school import completed: imported={}, skipped={}, found={}", result.imported(), result.skipped(), result.found());
    }
}
