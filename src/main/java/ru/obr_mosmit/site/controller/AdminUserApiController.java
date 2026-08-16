package ru.obr_mosmit.site.controller;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.obr_mosmit.site.entity.SiteUser;
import ru.obr_mosmit.site.repository.SiteUserRepository;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserApiController {

    private final SiteUserRepository users;

    public AdminUserApiController(SiteUserRepository users) {
        this.users = users;
    }

    @GetMapping
    List<UserDto> all() {
        return users.findAllByOrderByCreatedAtDesc().stream().map(this::dto).toList();
    }

    @PatchMapping("/{id}")
    UserDto update(@PathVariable Long id, @RequestBody UpdateUser request) {
        SiteUser user = users.findById(id).orElseThrow();
        if (request.role() != null && (request.role().equals("ADMIN") || request.role().equals("USER"))) {
            user.setRole(request.role());
        }
        user.setEnabled(request.enabled());
        return dto(users.save(user));
    }

    private UserDto dto(SiteUser user) {
        return new UserDto(
                user.getId(),
                user.getDisplayName(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt().toString());
    }

    record UpdateUser(String role, boolean enabled) {}
    public record UserDto(Long id, String displayName, String email, String role, boolean enabled, String createdAt) {}
}
