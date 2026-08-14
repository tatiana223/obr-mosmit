package ru.obr_mosmit.site.news;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class NewsForm {
    @NotBlank(message = "Введите заголовок") @Size(max = 300, message = "Не более 300 символов")
    private String title;
    @Size(max = 350, message = "Не более 350 символов")
    private String slug = "";
    @Size(max = 1000, message = "Не более 1000 символов")
    private String summary = "";
    @NotBlank(message = "Введите текст новости")
    private String content;
    private NewsStatus status = NewsStatus.DRAFT;

    public static NewsForm from(News news) {
        var form = new NewsForm();
        form.title = news.getTitle(); form.slug = news.getSlug(); form.summary = news.getSummary();
        form.content = news.getContent(); form.status = news.getStatus();
        return form;
    }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public NewsStatus getStatus() { return status; }
    public void setStatus(NewsStatus status) { this.status = status; }
}
