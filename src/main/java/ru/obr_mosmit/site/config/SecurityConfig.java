package ru.obr_mosmit.site.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import ru.obr_mosmit.site.entity.SiteUser;
import ru.obr_mosmit.site.repository.SiteUserRepository;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/cabinet/**").authenticated()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        .anyRequest().permitAll())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .build();
    }

    @Bean
    UserDetailsService userDetailsService(SiteUserRepository repository) {
        return email -> repository.findByEmailIgnoreCase(email)
                .map(item -> User.withUsername(item.getEmail())
                        .password(item.getPasswordHash())
                        .roles(item.getRole())
                        .disabled(!item.isEnabled())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException(email));
    }

    @Bean
    CommandLineRunner seedAdmin(
            SiteUserRepository repository,
            PasswordEncoder encoder,
            @Value("${app.admin.username}") String username,
            @Value("${app.admin.password}") String password) {
        return args -> {
            if (repository.findByEmailIgnoreCase(username).isPresent()) {
                return;
            }

            SiteUser admin = new SiteUser();
            admin.setEmail(username);
            admin.setDisplayName("Администратор");
            admin.setPasswordHash(encoder.encode(password));
            admin.setRole("ADMIN");
            admin.setEmailVerified(true);
            repository.save(admin);
        };
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
