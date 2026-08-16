package ru.obr_mosmit.site.account;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "site_users")
public class SiteUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 320) private String email;
    @Column(name = "display_name", nullable = false, length = 200) private String displayName;
    @Column(name = "password_hash", nullable = false, length = 255) private String passwordHash;
    @Column(nullable = false, length = 20) private String role = "USER";
    @Column(nullable = false) private boolean enabled = true;
    @Column(name = "email_verified", nullable = false) private boolean emailVerified;
    @Column(name = "verification_token", unique = true, length = 100) private String verificationToken;
    @Column(name = "verification_expires_at") private Instant verificationExpiresAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
    @PrePersist void create() { if (createdAt == null) createdAt = Instant.now(); }
    public Long getId(){return id;} public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getDisplayName(){return displayName;} public void setDisplayName(String v){displayName=v;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){passwordHash=v;}
    public String getRole(){return role;} public void setRole(String v){role=v;} public boolean isEnabled(){return enabled;}
    public void setEnabled(boolean v){enabled=v;} public Instant getCreatedAt(){return createdAt;}
    public boolean isEmailVerified(){return emailVerified;} public void setEmailVerified(boolean v){emailVerified=v;}
    public String getVerificationToken(){return verificationToken;} public void setVerificationToken(String v){verificationToken=v;}
    public Instant getVerificationExpiresAt(){return verificationExpiresAt;} public void setVerificationExpiresAt(Instant v){verificationExpiresAt=v;}
}
