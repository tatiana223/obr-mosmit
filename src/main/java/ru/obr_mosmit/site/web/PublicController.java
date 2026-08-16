package ru.obr_mosmit.site.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PublicController {
    @GetMapping({
            "/",
            "/novosti",
            "/novosti/{id}",
            "/pravoslavnye-shkoly",
            "/pravoslavnye-shkoly/{id}",
            "/konkursy",
            "/kursy",
            "/dokumenty",
            "/dokumenty/razdel/{category}",
            "/dokumenty/{id}",
            "/kontakty",
            "/cabinet",
            "/control-center",
            "/control-center/news",
            "/control-center/news/new",
            "/control-center/news/{id}",
            "/control-center/schools",
            "/control-center/competitions",
            "/control-center/users"
    })
    String frontend() {
        return "forward:/index.html";
    }

    @GetMapping("/login")
    String login() { return "login"; }
}
