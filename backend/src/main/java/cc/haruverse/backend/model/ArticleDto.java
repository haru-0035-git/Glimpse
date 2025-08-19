package cc.haruverse.backend.model;

import cc.haruverse.backend.entity.Article;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ArticleDto {
    private Long id;
    private String title;
    private String content;
    private List<String> tags;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long authorId;

    // Constructor to convert Article entity to ArticleDto
    public ArticleDto(Article article) {
        this.id = article.getId();
        this.title = article.getTitle();
        this.content = article.getContent();
        this.tags = article.getTags().stream()
                             .map(tag -> tag.getName())
                             .collect(Collectors.toList());
        this.createdAt = article.getCreatedAt();
        this.updatedAt = article.getUpdatedAt();
        this.authorId = article.getAuthorId();
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public List<String> getTags() {
        return tags;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public Long getAuthorId() {
        return authorId;
    }
}
