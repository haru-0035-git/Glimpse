package cc.haruverse.backend;

import cc.haruverse.backend.entity.Article;
import cc.haruverse.backend.repository.ArticleRepository;
import cc.haruverse.backend.repository.TagRepository;
import cc.haruverse.backend.repository.UserRepository;
import cc.haruverse.backend.entity.Tag;
import cc.haruverse.backend.entity.User;
import cc.haruverse.backend.model.ArticleDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<ArticleDto> getAllArticles() {
        return articleRepository.findAll().stream()
                .map(ArticleDto::new)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArticleDto> getArticleById(@PathVariable Long id) {
        Optional<Article> article = articleRepository.findById(id);
        return article.map(ArticleDto::new).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ArticleDto> createArticle(@RequestBody Article article) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                                        .orElseThrow(() -> new RuntimeException("User not found"));
        article.setAuthorId(currentUser.getId());

        Set<Tag> managedTags = new HashSet<>();
        if (article.getTags() != null) {
            for (Tag incomingTag : article.getTags()) {
                // Find existing tag by name, or create a new one if it doesn't exist
                Tag tag = tagRepository.findByName(incomingTag.getName())
                                       .orElseGet(() -> {
                                           // If not found, create a new Tag entity
                                           Tag newTag = new Tag();
                                           newTag.setName(incomingTag.getName());
                                           return tagRepository.save(newTag);
                                       });
                managedTags.add(tag);
            }
        }
        article.setTags(managedTags);
        Article savedArticle = articleRepository.save(article);
        return ResponseEntity.ok(new ArticleDto(savedArticle));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArticleDto> updateArticle(@PathVariable Long id, @RequestBody Article articleDetails) {
        Optional<Article> optionalArticle = articleRepository.findById(id);
        if (optionalArticle.isPresent()) {
            Article article = optionalArticle.get();
            // Preserve original authorId, do not update from articleDetails
            // article.setAuthorId(articleDetails.getAuthorId()); // Do NOT do this

            article.setTitle(articleDetails.getTitle());
            article.setContent(articleDetails.getContent());

            Set<Tag> managedTags = new HashSet<>();
            if (articleDetails.getTags() != null) {
                for (Tag incomingTag : articleDetails.getTags()) {
                    Tag tag = tagRepository.findByName(incomingTag.getName())
                                           .orElseGet(() -> {
                                               Tag newTag = new Tag();
                                               newTag.setName(incomingTag.getName());
                                               return tagRepository.save(newTag);
                                           });
                    managedTags.add(tag);
                }
            }
            article.setTags(managedTags);

            Article updatedArticle = articleRepository.save(article);
            return ResponseEntity.ok(new ArticleDto(updatedArticle));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        if (articleRepository.existsById(id)) {
            articleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}