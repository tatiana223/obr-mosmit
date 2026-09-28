package ru.obr_mosmit.site.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SchoolCoverApiControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void uploadedCoverSurvivesSaveWithStaleImportedUrl() throws Exception {
        String created = mockMvc.perform(post("/api/schools")
                        .with(user("admin@example.ru").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Гимназия тестовая","summary":"Кратко","image":"https://example.test/old.jpg","sections":[]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = created.replaceAll("(?s).*\"id\"\\s*:\\s*\"(\\d+)\".*", "$1");

        mockMvc.perform(multipart("/api/admin/media/schools/" + id + "/cover")
                        .file(tinyJpeg())
                        .with(user("admin@example.ru").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.startsWith("/uploads/")));

        mockMvc.perform(put("/api/schools/" + id)
                        .with(user("admin@example.ru").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Гимназия тестовая","summary":"Кратко","image":"https://example.test/old.jpg","sections":[]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.image").value(org.hamcrest.Matchers.startsWith("/uploads/")));
    }

    private static MockMultipartFile tinyJpeg() {
        byte[] jpeg = new byte[] {
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xDB, 0x00, 0x43, 0x00, 0x08,
                0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08,
                0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F,
                0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E,
                0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30,
                0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E,
                0x33, 0x34, 0x32, (byte) 0xFF, (byte) 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
                0x00, 0x01, 0x01, 0x01, 0x11, 0x00, (byte) 0xFF, (byte) 0xC4, 0x00, 0x14,
                0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x03, (byte) 0xFF, (byte) 0xC4, 0x00, 0x14,
                0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, (byte) 0xFF, (byte) 0xDA, 0x00, 0x08,
                0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, (byte) 0xFF, (byte) 0xD9
        };
        return new MockMultipartFile("file", "cover.jpg", "image/jpeg", jpeg);
    }
}
