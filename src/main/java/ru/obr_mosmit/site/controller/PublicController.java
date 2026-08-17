package ru.obr_mosmit.site.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PublicController {

    @GetMapping({
            "/",
            "/login",
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
            "/control-center/documents",
            "/control-center/schools",
            "/control-center/competitions",
            "/control-center/competitions/krasota-bozhego-mira",
            "/control-center/courses",
            "/control-center/users",
            "/control-center/contacts"
    })
    String frontend() {
        return "forward:/index.html";
    }
}
