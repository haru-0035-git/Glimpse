package cc.haruverse.backend.repository;

import cc.haruverse.backend.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;

// JpaRepositoryを継承することで、基本的なCRUD操作（保存、検索、削除など）が自動で使えるようになる
public interface ArticleRepository extends JpaRepository<Article, Long> {
    // <Article, Long> は、Articleエンティティを、Long型のIDで管理するという意味
}