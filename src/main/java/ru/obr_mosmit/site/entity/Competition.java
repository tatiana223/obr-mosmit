package ru.obr_mosmit.site.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "competitions")
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    /**
     * Legacy column kept for database compatibility. The current UI no longer edits or displays it.
     */
    @Column(nullable = false, columnDefinition = "text")
    private String description = "";

    private LocalDate deadline;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "cover_image_url", length = 1000)
    private String coverImageUrl;

    @Column(name = "gallery_urls", columnDefinition = "text")
    private String galleryUrls;

    /** Legacy fields retained until a dedicated Flyway cleanup migration is introduced. */
    @Column(name = "form_url", length = 1000)
    private String formUrl;

    @Column(name = "form_description", columnDefinition = "text")
    private String formDescription;

    @PrePersist
    void create() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (description == null) {
            description = "";
        }
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public void setCoverImageUrl(String coverImageUrl) { this.coverImageUrl = coverImageUrl; }
    public String getGalleryUrls() { return galleryUrls; }
    public void setGalleryUrls(String galleryUrls) { this.galleryUrls = galleryUrls; }
    public String getFormUrl() { return formUrl; }
    public void setFormUrl(String formUrl) { this.formUrl = formUrl; }
    public String getFormDescription() { return formDescription; }
    public void setFormDescription(String formDescription) { this.formDescription = formDescription; }
}
