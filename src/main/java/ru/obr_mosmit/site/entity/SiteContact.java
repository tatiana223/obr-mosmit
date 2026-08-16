package ru.obr_mosmit.site.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "site_contacts")
public class SiteContact {

    @Id
    private Long id = 1L;

    private String city;
    private String address;

    @Column(name = "public_email")
    private String publicEmail;

    @Column(name = "public_email_note")
    private String publicEmailNote;

    @Column(name = "chairman_role")
    private String chairmanRole;

    @Column(name = "chairman_name")
    private String chairmanName;

    @Column(name = "chairman_email")
    private String chairmanEmail;

    @Column(name = "assistant_role")
    private String assistantRole;

    @Column(name = "assistant_name")
    private String assistantName;

    @Column(name = "assistant_email")
    private String assistantEmail;

    public Long getId() { return id; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPublicEmail() { return publicEmail; }
    public void setPublicEmail(String publicEmail) { this.publicEmail = publicEmail; }
    public String getPublicEmailNote() { return publicEmailNote; }
    public void setPublicEmailNote(String publicEmailNote) { this.publicEmailNote = publicEmailNote; }
    public String getChairmanRole() { return chairmanRole; }
    public void setChairmanRole(String chairmanRole) { this.chairmanRole = chairmanRole; }
    public String getChairmanName() { return chairmanName; }
    public void setChairmanName(String chairmanName) { this.chairmanName = chairmanName; }
    public String getChairmanEmail() { return chairmanEmail; }
    public void setChairmanEmail(String chairmanEmail) { this.chairmanEmail = chairmanEmail; }
    public String getAssistantRole() { return assistantRole; }
    public void setAssistantRole(String assistantRole) { this.assistantRole = assistantRole; }
    public String getAssistantName() { return assistantName; }
    public void setAssistantName(String assistantName) { this.assistantName = assistantName; }
    public String getAssistantEmail() { return assistantEmail; }
    public void setAssistantEmail(String assistantEmail) { this.assistantEmail = assistantEmail; }
}
