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
        setArticles(response.data);
      })
      .catch((err) => {
        console.error("Error fetching articles:", err);
        setError("記事の読み込みに失敗しました。");
      });
  }, []);

  const getFirstLine = (content: string) => {
    if (!content) return "";
    return content.split("\n")[0];
  };

  return (
    <div className="home-container">
      <h1>記事一覧</h1>
      {error && <p className="error">{error}</p>}
      <div className="articles-list">
        {articles.map((article) => (
          <Link
            to={`/articles/${article.id}`}
            key={article.id}
            className="article-item-link"
          >
            <div className="article-item">
              <h2>{article.title}</h2>
              <p className="article-content-preview">
                {getFirstLine(article.content)}
              </p>
              <div className="article-meta">
                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                <div className="tags-container">
                  {article.tags &&
                    article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
