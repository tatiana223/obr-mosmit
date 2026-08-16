package ru.obr_mosmit.site.document;
import jakarta.persistence.*;
@Entity @Table(name="document_sections") public class DocumentSection{
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=300) private String title;@Column(nullable=false,unique=true,length=320) private String slug;
 @ManyToOne @JoinColumn(name="parent_id") private DocumentSection parent;@Column(name="sort_order",nullable=false) private int sortOrder;
 public Long getId(){return id;}public String getTitle(){return title;}public void setTitle(String v){title=v;}public String getSlug(){return slug;}public void setSlug(String v){slug=v;}public DocumentSection getParent(){return parent;}public void setParent(DocumentSection v){parent=v;}public int getSortOrder(){return sortOrder;}public void setSortOrder(int v){sortOrder=v;}
}
