package ru.obr_mosmit.site.school;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "schools")
public class School {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 500) private String title;
    @Column(nullable = false, unique = true, length = 550) private String slug;
    @Column(length = 1500) private String summary;
    @Column(nullable = false, columnDefinition = "text") private String content;
    @Column(name = "image_url", length = 1000) private String imageUrl;
    @Column(name = "source_url", nullable = false, unique = true, length = 1000) private String sourceUrl;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    @PrePersist void onCreate() { createdAt = Instant.now(); }
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }
}
