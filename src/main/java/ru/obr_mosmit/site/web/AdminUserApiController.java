package ru.obr_mosmit.site.web;
import java.util.*; import org.springframework.web.bind.annotation.*; import ru.obr_mosmit.site.account.*;
@RestController @RequestMapping("/api/admin/users")
public class AdminUserApiController { private final SiteUserRepository users; public AdminUserApiController(SiteUserRepository u){users=u;}
 @GetMapping List<UserDto> all(){return users.findAllByOrderByCreatedAtDesc().stream().map(this::dto).toList();}
 @PatchMapping("/{id}") UserDto update(@PathVariable Long id,@RequestBody UpdateUser r){var u=users.findById(id).orElseThrow();if(r.role()!=null&&(r.role().equals("ADMIN")||r.role().equals("USER")))u.setRole(r.role());u.setEnabled(r.enabled());return dto(users.save(u));}
 private UserDto dto(SiteUser u){return new UserDto(u.getId(),u.getDisplayName(),u.getEmail(),u.getRole(),u.isEnabled(),u.getCreatedAt().toString());}
 record UpdateUser(String role,boolean enabled){} public record UserDto(Long id,String displayName,String email,String role,boolean enabled,String createdAt){}
}
