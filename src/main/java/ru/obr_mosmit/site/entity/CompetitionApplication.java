package ru.obr_mosmit.site.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "competition_applications")
public class CompetitionApplication {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "competition_id") private Competition competition;
    @ManyToOne @JoinColumn(name = "user_id") private SiteUser user;
    @Column(name="tracking_code", nullable=false, unique=true, length=40) private String trackingCode;
    @Column(name="participant_email", nullable=false, length=320) private String participantEmail;
    @Column(name="participant_phone", length=50) private String participantPhone;
    @Column(name = "participant_name", nullable = false, length = 250) private String participantName;
    @Column(name = "school_name", nullable = false, length = 500) private String schoolName;
    @Column(name = "age_group", length = 100) private String ageGroup;
    @Column(columnDefinition = "text") private String comment;
    @Column(nullable = false, length = 30) private String status = "NEW";
    @Column(name = "admin_comment", columnDefinition = "text") private String adminComment;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @PrePersist void create(){if(createdAt==null)createdAt=Instant.now();}
    public Long getId(){return id;} public Competition getCompetition(){return competition;} public void setCompetition(Competition v){competition=v;}
    public SiteUser getUser(){return user;} public void setUser(SiteUser v){user=v;} public String getTrackingCode(){return trackingCode;} public void setTrackingCode(String v){trackingCode=v;}
    public String getParticipantEmail(){return participantEmail;} public void setParticipantEmail(String v){participantEmail=v;} public String getParticipantPhone(){return participantPhone;} public void setParticipantPhone(String v){participantPhone=v;}
    public String getParticipantName(){return participantName;} public void setParticipantName(String v){participantName=v;} public String getSchoolName(){return schoolName;} public void setSchoolName(String v){schoolName=v;}
    public String getAgeGroup(){return ageGroup;} public void setAgeGroup(String v){ageGroup=v;} public String getComment(){return comment;} public void setComment(String v){comment=v;}
    public String getStatus(){return status;} public void setStatus(String v){status=v;} public String getAdminComment(){return adminComment;} public void setAdminComment(String v){adminComment=v;} public Instant getCreatedAt(){return createdAt;}
}
