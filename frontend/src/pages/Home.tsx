import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Article } from "../types";
import "./Home.css";

const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/articles")
      .then((response) => {
        const data = response.data;

        if (!Array.isArray(data)) {
          console.error("Unexpected response for /api/articles:", data);
          setError("記事データの形式が正しくありません。");
          setArticles([]);
          return;
        }

        setArticles(data);
      })
      .catch((err) => {
        console.error("Error fetching articles:", err);
        setError("記事の読み込みに失敗しました。");
        setArticles([]);
      });
  }, []);

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">記事一覧</h1>
        {error && <p className="error">{error}</p>}
        <div className="articles-list">
          {articles.map((article) => {
            const tags = article.tags?.filter(Boolean) ?? [];

            return (
              <Link
                to={`/articles/${article.id}`}
                key={article.id}
                className="article-item-link"
              >
                <div className={article.thumbnailUrl ? "article-item has-thumbnail" : "article-item"}>
                  {article.thumbnailUrl && (
                    <img
                      className="article-thumbnail"
                      src={article.thumbnailUrl}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <div className="article-item-body">
                    <h2>{article.title}</h2>
                    <div className="article-card-footer">
                      <span className="article-date">
                        {new Date(article.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                      {tags.length > 0 && (
                        <div className="tags-container article-tags">
                          {tags.map((tag) => (
                            <span key={tag} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
