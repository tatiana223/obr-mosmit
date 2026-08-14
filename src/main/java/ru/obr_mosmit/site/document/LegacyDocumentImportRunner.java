package ru.obr_mosmit.site.document;
import org.slf4j.*;import org.springframework.boot.*;import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;import org.springframework.stereotype.Component;
@Component @ConditionalOnProperty(name="app.document-import.enabled",havingValue="true")
public class LegacyDocumentImportRunner implements ApplicationRunner{
 private static final Logger log=LoggerFactory.getLogger(LegacyDocumentImportRunner.class);private final LegacyDocumentImporter importer;
 public LegacyDocumentImportRunner(LegacyDocumentImporter importer){this.importer=importer;}
 public void run(ApplicationArguments args)throws Exception{var r=importer.importAll();log.info("Legacy document import completed: imported={}, skipped={}, found={}, files={}, failed={}",r.imported(),r.skipped(),r.found(),r.downloaded(),r.failed());}
}
