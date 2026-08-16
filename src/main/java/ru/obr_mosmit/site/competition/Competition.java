package ru.obr_mosmit.site.competition;
import jakarta.persistence.*; import java.time.*;
@Entity @Table(name="competitions")
public class Competition {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=500) private String title; @Column(nullable=false,columnDefinition="text") private String description;
 private LocalDate deadline; @Column(nullable=false) private boolean published; @Column(name="created_at",nullable=false) private Instant createdAt;
 @Column(name="cover_image_url",length=1000) private String coverImageUrl;
 @Column(name="gallery_urls",columnDefinition="text") private String galleryUrls;
 @Column(name="form_url",length=1000) private String formUrl;
 @Column(name="form_description",columnDefinition="text") private String formDescription;
 @PrePersist void create(){if(createdAt==null)createdAt=Instant.now();}
 public Long getId(){return id;} public String getTitle(){return title;} public void setTitle(String v){title=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public LocalDate getDeadline(){return deadline;} public void setDeadline(LocalDate v){deadline=v;}
 public boolean isPublished(){return published;} public void setPublished(boolean v){published=v;}
 public String getCoverImageUrl(){return coverImageUrl;} public void setCoverImageUrl(String v){coverImageUrl=v;}
 public String getGalleryUrls(){return galleryUrls;} public void setGalleryUrls(String v){galleryUrls=v;}
 public String getFormUrl(){return formUrl;} public void setFormUrl(String v){formUrl=v;}
 public String getFormDescription(){return formDescription;} public void setFormDescription(String v){formDescription=v;}
}
