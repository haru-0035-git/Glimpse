import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Article } from '../types';
import ReactMarkdown from 'react-markdown';
import './ArticleDetail.css';

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:8080/api/articles/${id}`)
        .then(response => {
          setArticle(response.data);
        })
        .catch(err => {
          console.error(`Error fetching article ${id}:`, err);
          setError("記事の読み込みに失敗しました。");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!article) {
    return <div>記事が見つかりません。</div>;
  }

  return (
    <div className="article-detail-container">
      <div className="article-header">
        <h1>{article.title}</h1>
        <div className="article-meta">
          <span>投稿日: {new Date(article.createdAt).toLocaleDateString()}</span>
          <div className="tags-container">
            {article.tags && article.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="article-content">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ArticleDetail;
