package ru.obr_mosmit.site.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import ru.obr_mosmit.site.entity.SiteContact;
import ru.obr_mosmit.site.repository.SiteContactRepository;

@RestController
public class ContactApiController {

    private final SiteContactRepository contacts;

    public ContactApiController(SiteContactRepository contacts) {
        this.contacts = contacts;
    }

    @GetMapping("/api/contacts")
    SiteContact get() {
        return contacts.findById(1L).orElseThrow();
    }

    @PutMapping("/api/admin/contacts")
    SiteContact save(@RequestBody SiteContact value) {
        return contacts.save(value);
    }
}
