package ru.obr_mosmit.site.school;

import jakarta.persistence.*;

@Entity
@Table(name = "school_details")
public class SchoolDetail {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;
    @Column(name = "section_key", nullable = false, length = 50)
    private String sectionKey;
    @Column(nullable = false, length = 300)
    private String label;
    @Column(nullable = false, columnDefinition = "text")
    private String content;
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public Long getId() { return id; }
    public School getSchool() { return school; }
    public void setSchool(School school) { this.school = school; }
    public String getSectionKey() { return sectionKey; }
    public void setSectionKey(String sectionKey) { this.sectionKey = sectionKey; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
