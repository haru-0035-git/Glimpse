package cc.haruverse.backend.repository;

import cc.haruverse.backend.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByAuthorId(UUID authorId);
}
