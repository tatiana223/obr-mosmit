package ru.obr_mosmit.site.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.security.Principal;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import ru.obr_mosmit.site.account.*;

@RestController @RequestMapping("/api/auth")
public class AccountApiController {
 private final SiteUserRepository users; private final PasswordEncoder encoder; private final AuthenticationManager authenticationManager;
 public AccountApiController(SiteUserRepository u,PasswordEncoder e,AuthenticationManager a){users=u;encoder=e;authenticationManager=a;}
 @PostMapping("/register") ResponseEntity<?> register(@RequestBody RegisterRequest r,HttpServletRequest request){
  String email=r.email()==null?"":r.email().trim().toLowerCase();
  if(email.isBlank()||r.displayName()==null||r.displayName().isBlank()||r.password()==null||r.password().length()<8) return ResponseEntity.badRequest().body("Заполните имя, почту и пароль от 8 символов");
  if(users.findByEmailIgnoreCase(email).isPresent()) return ResponseEntity.status(409).body("Пользователь с такой почтой уже существует");
  var user=new SiteUser(); user.setEmail(email); user.setDisplayName(r.displayName().trim()); user.setPasswordHash(encoder.encode(r.password()));users.save(user);
  authenticate(email,r.password(),request);return ResponseEntity.ok(me(email));
 }
 @PostMapping("/login") ResponseEntity<?> login(@RequestBody LoginRequest r,HttpServletRequest request){ try{authenticate(r.email(),r.password(),request);return ResponseEntity.ok(me(r.email()));}catch(AuthenticationException e){return ResponseEntity.status(401).body("Неверная почта или пароль");} }
 @PostMapping("/logout") void logout(HttpSession session){session.invalidate(); SecurityContextHolder.clearContext();}
 @GetMapping("/me") ResponseEntity<?> current(Principal principal){return principal==null?ResponseEntity.status(401).build():ResponseEntity.ok(me(principal.getName()));}
 private void authenticate(String email,String password,HttpServletRequest request){var auth=authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email,password));var context=SecurityContextHolder.createEmptyContext();context.setAuthentication(auth);SecurityContextHolder.setContext(context);request.getSession(true).setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,context);}
 private UserDto me(String email){var u=users.findByEmailIgnoreCase(email).orElseThrow();return new UserDto(u.getId(),u.getEmail(),u.getDisplayName(),u.getRole());}
 record RegisterRequest(String displayName,String email,String password){} record LoginRequest(String email,String password){} public record UserDto(Long id,String email,String displayName,String role){}
}
