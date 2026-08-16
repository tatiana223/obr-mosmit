package ru.obr_mosmit.site.controller;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ru.obr_mosmit.site.entity.DocumentSection;
import ru.obr_mosmit.site.entity.SiteDocument;
import ru.obr_mosmit.site.repository.DocumentSectionRepository;
import ru.obr_mosmit.site.repository.SiteDocumentRepository;
import ru.obr_mosmit.site.service.MediaStorageService;

@RestController
public class DocumentApiController {

    private final SiteDocumentRepository documents;
    private final DocumentSectionRepository sections;
    private final MediaStorageService storage;

    public DocumentApiController(
            SiteDocumentRepository documents,
            DocumentSectionRepository sections,
            MediaStorageService storage) {
        this.documents = documents;
        this.sections = sections;
        this.storage = storage;
    }

    @GetMapping("/api/documents")
    List<DocumentDto> all() {
        return documents.findAllByPublishedTrueOrderBySortOrderAscTitleAsc()
                .stream()
                .map(this::dto)
                .toList();
    }

    @GetMapping("/api/documents/{id}")
    ResponseEntity<DocumentDetailsDto> one(@PathVariable Long id) {
        return documents.findById(id)
                .filter(SiteDocument::isPublished)
                .map(document -> ResponseEntity.ok(details(document)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/api/document-sections")
    List<SectionDto> publicSections() {
        return sections.findAllByOrderBySortOrderAscTitleAsc().stream().map(this::sectionDto).toList();
    }

    @GetMapping("/api/admin/documents")
    List<AdminDocumentDto> adminDocuments() {
        return documents.findAllByOrderBySortOrderAscTitleAsc().stream().map(this::adminDto).toList();
    }

    @PostMapping("/api/admin/documents")
    AdminDocumentDto save(@RequestBody DocumentRequest request) {
        SiteDocument document = request.id() == null
                ? new SiteDocument()
                : documents.findById(request.id()).orElseThrow();

        document.setTitle(request.title());
        document.setSummary(value(request.summary()));
        document.setContent(value(request.content()));
        document.setSortOrder(request.sortOrder());
        document.setPublished(request.published());
        document.setSection(request.sectionId() == null ? null : sections.findById(request.sectionId()).orElseThrow());
        document.setCategory(document.getSection() == null ? "Документы" : document.getSection().getTitle());
        document.setAttachments(value(request.attachments()));

        if (request.id() == null) {
            String token = UUID.randomUUID().toString();
            document.setSlug("document-" + token);
            document.setSourceUrl("/admin/documents/" + token);
        }

        return adminDto(documents.save(document));
    }

    @PostMapping("/api/admin/documents/{id}/files")
    AdminDocumentDto upload(@PathVariable Long id, @RequestParam("files") MultipartFile[] files) {
        SiteDocument document = documents.findById(id).orElseThrow();
        List<String> rows = new ArrayList<>();

        if (document.getAttachments() != null && !document.getAttachments().isBlank()) {
            rows.addAll(Arrays.asList(document.getAttachments().split("\\n")));
        }

        for (MultipartFile file : files) {
            String title = Objects.requireNonNullElse(file.getOriginalFilename(), "Файл");
            rows.add(title + "|" + storage.storeDocument(file));
        }

        document.setAttachments(String.join("\n", rows));
        return adminDto(documents.save(document));
    }

    @DeleteMapping("/api/admin/documents/{id}")
    void delete(@PathVariable Long id) {
        documents.deleteById(id);
    }

    @GetMapping("/api/admin/document-sections")
    List<SectionDto> adminSections() {
        return publicSections();
    }

    @PostMapping("/api/admin/document-sections")
    SectionDto saveSection(@RequestBody SectionRequest request) {
        DocumentSection section = request.id() == null
                ? new DocumentSection()
                : sections.findById(request.id()).orElseThrow();

        section.setTitle(request.title());
        section.setSortOrder(request.sortOrder());
        section.setParent(request.parentId() == null ? null : sections.findById(request.parentId()).orElseThrow());
        if (request.id() == null) {
            section.setSlug("section-" + UUID.randomUUID());
        }
        return sectionDto(sections.save(section));
    }

    @DeleteMapping("/api/admin/document-sections/{id}")
    void deleteSection(@PathVariable Long id) {
        sections.deleteById(id);
    }

    private String value(String value) {
        return value == null ? "" : value.trim();
    }

    private String sectionTitle(SiteDocument document) {
        return document.getSection() == null
                ? Objects.requireNonNullElse(document.getCategory(), "Документы")
                : document.getSection().getTitle();
    }

    private DocumentDto dto(SiteDocument document) {
        return new DocumentDto(
                String.valueOf(document.getId()),
                document.getTitle(),
                sectionTitle(document),
                document.getSummary(),
                attachments(document),
                document.getSourceUrl(),
                document.getSection() == null ? null : document.getSection().getId());
    }

    private DocumentDetailsDto details(SiteDocument document) {
        return new DocumentDetailsDto(
                String.valueOf(document.getId()),
                document.getTitle(),
                sectionTitle(document),
                document.getContent(),
                attachments(document));
    }

    private AdminDocumentDto adminDto(SiteDocument document) {
        return new AdminDocumentDto(
                document.getId(),
                document.getTitle(),
                document.getSummary(),
                document.getContent(),
                document.getSection() == null ? null : document.getSection().getId(),
                document.getSortOrder(),
                document.isPublished(),
                document.getAttachments());
    }

    private List<AttachmentDto> attachments(SiteDocument document) {
        List<AttachmentDto> files = new ArrayList<>();
        if (document.getAttachments() == null || document.getAttachments().isBlank()) {
            return files;
        }

        for (String row : document.getAttachments().split("\\n")) {
            String[] parts = row.split("\\|", 2);
            if (parts.length == 2) {
                files.add(new AttachmentDto(parts[0], parts[1]));
            }
        }
        return files;
    }

    private SectionDto sectionDto(DocumentSection section) {
        return new SectionDto(
                section.getId(),
                section.getTitle(),
                section.getSlug(),
                section.getParent() == null ? null : section.getParent().getId(),
                section.getSortOrder());
    }

    public record DocumentDto(String id, String title, String category, String summary,
                              List<AttachmentDto> attachments, String sourceUrl, Long sectionId) {}
    public record AttachmentDto(String title, String url) {}
    public record DocumentDetailsDto(String id, String title, String category, String content,
                                     List<AttachmentDto> attachments) {}
    public record AdminDocumentDto(Long id, String title, String summary, String content,
                                   Long sectionId, int sortOrder, boolean published, String attachments) {}
    record DocumentRequest(Long id, String title, String summary, String content,
                           Long sectionId, int sortOrder, boolean published, String attachments) {}
    public record SectionDto(Long id, String title, String slug, Long parentId, int sortOrder) {}
    record SectionRequest(Long id, String title, Long parentId, int sortOrder) {}
}
