package ru.obr_mosmit.site.document;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "documents")
public class SiteDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=600) private String title;
    @Column(nullable=false,unique=true,length=650) private String slug;
    @Column(length=300) private String category;
    @Column(length=1500) private String summary;
    @Column(nullable=false,columnDefinition="text") private String content;
    @Column(columnDefinition="text") private String attachments;
    @Column(name="source_url",nullable=false,unique=true,length=1000) private String sourceUrl;
    @Column(name="sort_order",nullable=false) private int sortOrder;
    @ManyToOne @JoinColumn(name="section_id") private DocumentSection section;
    @Column(nullable=false) private boolean published=true;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    @Column(name="created_at",nullable=false) private Instant createdAt;
    @PrePersist void onCreate(){createdAt=Instant.now();updatedAt=Instant.now();}@PreUpdate void onUpdate(){updatedAt=Instant.now();}
    public Long getId(){return id;} public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getSlug(){return slug;} public void setSlug(String v){slug=v;} public String getCategory(){return category;} public void setCategory(String v){category=v;}
    public String getSummary(){return summary;} public void setSummary(String v){summary=v;} public String getContent(){return content;} public void setContent(String v){content=v;}
    public String getAttachments(){return attachments;} public void setAttachments(String v){attachments=v;} public String getSourceUrl(){return sourceUrl;} public void setSourceUrl(String v){sourceUrl=v;}
    public int getSortOrder(){return sortOrder;} public void setSortOrder(int v){sortOrder=v;}
    public DocumentSection getSection(){return section;}public void setSection(DocumentSection v){section=v;}public boolean isPublished(){return published;}public void setPublished(boolean v){published=v;}
}
