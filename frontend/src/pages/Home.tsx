import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Article } from '../types';
import './Home.css';

const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('http://localhost:8080/api/articles')
      .then(response => {
        setArticles(response.data);
      })
      .catch(err => {
        console.error("Error fetching articles:", err);
        setError("記事の読み込みに失敗しました。");
      });
  }, []);

  return (
    <div className="home-container">
      <h1>記事一覧</h1>
      {error && <p className="error">{error}</p>}
      <div className="articles-list">
        {articles.map(article => (
          <div key={article.id} className="article-item">
            <h2><Link to={`/articles/${article.id}`}>{article.title}</Link></h2>
            <p>{new Date(article.createdAt).toLocaleDateString()}</p>
            <p>{article.content.substring(0, 100)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
