package ru.obr_mosmit.site.course;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="courses")
public class Course {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=500) private String title;
 @Column(nullable=false,columnDefinition="text") private String description;
 @Column(name="cover_image_url",length=1000) private String coverImageUrl;
 @Column(name="gallery_urls",columnDefinition="text") private String galleryUrls;
 @Column(nullable=false) private boolean published;
 @Column(name="created_at",nullable=false) private Instant createdAt;
 @PrePersist void create(){if(createdAt==null)createdAt=Instant.now();}
 public Long getId(){return id;} public String getTitle(){return title;} public void setTitle(String v){title=v;}
 public String getDescription(){return description;} public void setDescription(String v){description=v;}
 public String getCoverImageUrl(){return coverImageUrl;} public void setCoverImageUrl(String v){coverImageUrl=v;}
 public String getGalleryUrls(){return galleryUrls;} public void setGalleryUrls(String v){galleryUrls=v;}
 public boolean isPublished(){return published;} public void setPublished(boolean v){published=v;}
}
