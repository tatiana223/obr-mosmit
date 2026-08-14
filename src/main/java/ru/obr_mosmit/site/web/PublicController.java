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
            "/kursy",
            "/dokumenty",
            "/dokumenty/razdel/{category}",
            "/dokumenty/{id}",
            "/kontakty",
            "/control-center",
            "/control-center/news",
            "/control-center/news/new",
            "/control-center/news/{id}"
    })
    String frontend() {
        return "forward:/index.html";
    }

    @GetMapping("/login")
    String login() { return "login"; }
}
