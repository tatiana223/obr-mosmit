package ru.obr_mosmit.site.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminNewsApiControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void createDraftWithoutImagePersists() throws Exception {
        mockMvc.perform(multipart("/api/admin/news")
                        .param("title", "Тестовая новость")
                        .param("summary", "Кратко")
                        .param("content", "<p>Текст</p>")
                        .param("slug", "")
                        .param("status", "DRAFT")
                        .with(user("admin@example.ru").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Тестовая новость"))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void createPublishedWithoutImageSetsStatus() throws Exception {
        mockMvc.perform(multipart("/api/admin/news")
                        .param("title", "Опубликованная новость")
                        .param("summary", "Кратко")
                        .param("content", "<p>Текст</p>")
                        .param("slug", "")
                        .param("status", "PUBLISHED")
                        .with(user("admin@example.ru").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.date").value(org.hamcrest.Matchers.not("—")));
    }

    @Test
    void publishExistingDraftViaPostUpdateAppearsPublic() throws Exception {
        String body = mockMvc.perform(multipart("/api/admin/news")
                        .param("title", "Черновик для публикации")
                        .param("summary", "Кратко")
                        .param("content", "<p>Текст</p>")
                        .param("slug", "")
                        .param("status", "DRAFT")
                        .with(user("admin@example.ru").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String id = body.replaceAll("(?s).*\"id\"\\s*:\\s*(\\d+).*", "$1");

        mockMvc.perform(multipart("/api/admin/news/" + id)
                        .param("title", "Черновик для публикации")
                        .param("summary", "Кратко")
                        .param("content", "<p>Текст</p>")
                        .param("slug", "")
                        .param("status", "PUBLISHED")
                        .with(user("admin@example.ru").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.date").value(org.hamcrest.Matchers.not("—")));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/news/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Черновик для публикации"));
    }

    @Test
    void createWithCoverImagePersists() throws Exception {
        var image = new MockMultipartFile(
                "image",
                "cover.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00});

        mockMvc.perform(multipart("/api/admin/news")
                        .file(image)
                        .param("title", "С обложкой")
                        .param("summary", "Кратко")
                        .param("content", "<p>Текст</p>")
                        .param("slug", "")
                        .param("status", "PUBLISHED")
                        .with(user("admin@example.ru").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.image").value(org.hamcrest.Matchers.startsWith("/uploads/")))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
    }

    @Test
    void createWithOversizedCoverReturnsReadableError() throws Exception {
        byte[] tooLarge = new byte[10 * 1024 * 1024 + 1];
        tooLarge[0] = (byte) 0xFF;
        tooLarge[1] = (byte) 0xD8;
        tooLarge[2] = (byte) 0xFF;
        var image = new MockMultipartFile(
                "image",
                "huge.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                tooLarge);

        mockMvc.perform(multipart("/api/admin/news")
                        .file(image)
                        .param("title", "Слишком большая обложка")
                        .param("summary", "Кратко")
                        .param("content", "<p>Текст</p>")
                        .param("slug", "")
                        .param("status", "DRAFT")
                        .with(user("admin@example.ru").roles("ADMIN")))
                .andExpect(status().isBadRequest())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                        .string(org.hamcrest.Matchers.containsString("10 МБ")));
    }

    @Test
    void createWithoutTitleReturnsReadableValidationError() throws Exception {
        mockMvc.perform(multipart("/api/admin/news")
                        .param("title", "")
                        .param("summary", "")
                        .param("content", "<p>Текст</p>")
                        .param("slug", "")
                        .param("status", "DRAFT")
                        .with(user("admin@example.ru").roles("ADMIN")))
                .andExpect(status().isBadRequest())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                        .string(org.hamcrest.Matchers.containsString("Введите заголовок")));
    }
}
