package ru.obr_mosmit.site.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.obr_mosmit.site.entity.SiteUser;
import ru.obr_mosmit.site.repository.SiteUserRepository;

@RestController
@RequestMapping("/api/auth")
public class AccountApiController {

    private final SiteUserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;

    public AccountApiController(
            SiteUserRepository users,
            PasswordEncoder encoder,
            AuthenticationManager authenticationManager) {
        this.users = users;
        this.encoder = encoder;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/register")
    ResponseEntity<?> register(@RequestBody RegisterRequest request, HttpServletRequest servletRequest) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase();
        if (email.isBlank()
                || request.displayName() == null
                || request.displayName().isBlank()
                || request.password() == null
                || request.password().length() < 8) {
            return ResponseEntity.badRequest().body("Заполните имя, почту и пароль от 8 символов");
        }

        if (users.findByEmailIgnoreCase(email).isPresent()) {
            return ResponseEntity.status(409).body("Пользователь с такой почтой уже существует");
        }

        SiteUser user = new SiteUser();
        user.setEmail(email);
        user.setDisplayName(request.displayName().trim());
        user.setPasswordHash(encoder.encode(request.password()));
        users.save(user);

        authenticate(email, request.password(), servletRequest);
        return ResponseEntity.ok(me(email));
    }

    @PostMapping("/login")
    ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        try {
            authenticate(request.email(), request.password(), servletRequest);
            return ResponseEntity.ok(me(request.email()));
        } catch (AuthenticationException exception) {
            return ResponseEntity.status(401).body("Неверная почта или пароль");
        }
    }

    @PostMapping("/logout")
    void logout(HttpSession session) {
        session.invalidate();
        SecurityContextHolder.clearContext();
    }

    @GetMapping("/me")
    ResponseEntity<?> current(Principal principal) {
        return principal == null
                ? ResponseEntity.status(401).build()
                : ResponseEntity.ok(me(principal.getName()));
    }

    private void authenticate(String email, String password, HttpServletRequest request) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context);
    }

    private UserDto me(String email) {
        SiteUser user = users.findByEmailIgnoreCase(email).orElseThrow();
        return new UserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole());
    }

    record RegisterRequest(String displayName, String email, String password) {}
    record LoginRequest(String email, String password) {}
    public record UserDto(Long id, String email, String displayName, String role) {}
}
