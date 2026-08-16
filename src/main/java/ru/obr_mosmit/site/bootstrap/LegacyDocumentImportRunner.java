package ru.obr_mosmit.site.bootstrap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import ru.obr_mosmit.site.service.importer.LegacyDocumentImporter;

@Component
@ConditionalOnProperty(name = "app.document-import.enabled", havingValue = "true")
public class LegacyDocumentImportRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyDocumentImportRunner.class);

    private final LegacyDocumentImporter importer;

    public LegacyDocumentImportRunner(LegacyDocumentImporter importer) {
        this.importer = importer;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        var result = importer.importAll();
        log.info(
                "Legacy document import completed: imported={}, skipped={}, found={}, files={}, failed={}",
                result.imported(),
                result.skipped(),
                result.found(),
                result.downloaded(),
                result.failed());
    }
}
