import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Article } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import './ArticleDetail.css';

interface ArticleDetailProps {
  showAdminButtons?: boolean;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ showAdminButtons = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]} rehypePlugins={[rehypeRaw]}>{article.content}</ReactMarkdown>
      </div>
      {showAdminButtons && article && (
        <div className="article-actions">
          <Link to={`/admin/edit/${article.id}`} className="btn btn-primary">編集</Link>
          <button onClick={() => navigate('/admin')} className="btn btn-secondary">管理者ページに戻る</button>
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;