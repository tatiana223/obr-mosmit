package ru.obr_mosmit.site.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.obr_mosmit.site.entity.ContactPerson;
import ru.obr_mosmit.site.entity.SiteContact;
import ru.obr_mosmit.site.repository.ContactPersonRepository;
import ru.obr_mosmit.site.repository.SiteContactRepository;

@RestController
public class ContactApiController {

    private final SiteContactRepository contacts;
    private final ContactPersonRepository people;

    public ContactApiController(SiteContactRepository contacts, ContactPersonRepository people) {
        this.contacts = contacts;
        this.people = people;
    }

    @GetMapping("/api/contacts")
    ContactDto get() {
        return dto(contacts.findById(1L).orElseThrow());
    }

    @PutMapping("/api/admin/contacts")
    ContactDto save(@RequestBody ContactRequest request) {
        SiteContact value = contacts.findById(1L).orElseThrow();
        value.setCity(request.city());
        value.setAddress(request.address());
        value.setPublicEmail(request.publicEmail());
        value.setPublicEmailNote(request.publicEmailNote());
        return dto(contacts.save(value));
    }

    @PostMapping("/api/admin/contact-people")
    ContactPersonDto savePerson(@RequestBody ContactPersonRequest request) {
        ContactPerson person = request.id() == null
                ? new ContactPerson()
                : people.findById(request.id()).orElseThrow();
        person.setRole(request.role());
        person.setTitle(request.title());
        person.setName(request.name());
        person.setEmail(request.email());
        person.setSortOrder(request.sortOrder());
        return personDto(people.save(person));
    }

    @DeleteMapping("/api/admin/contact-people/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deletePerson(@PathVariable Long id) {
        people.deleteById(id);
    }

    private ContactDto dto(SiteContact contact) {
        return new ContactDto(
                contact.getId(),
                contact.getCity(),
                contact.getAddress(),
                contact.getPublicEmail(),
                contact.getPublicEmailNote(),
                people.findAllByOrderBySortOrderAscIdAsc().stream().map(this::personDto).toList());
    }

    private ContactPersonDto personDto(ContactPerson person) {
        return new ContactPersonDto(
                person.getId(),
                person.getRole(),
                person.getTitle(),
                person.getName(),
                person.getEmail(),
                person.getSortOrder());
    }

    public record ContactDto(
            Long id,
            String city,
            String address,
            String publicEmail,
            String publicEmailNote,
            List<ContactPersonDto> people) {}

    public record ContactPersonDto(
            Long id,
            String role,
            String title,
            String name,
            String email,
            int sortOrder) {}

    record ContactRequest(String city, String address, String publicEmail, String publicEmailNote) {}
    record ContactPersonRequest(Long id, String role, String title, String name, String email, int sortOrder) {}
}
