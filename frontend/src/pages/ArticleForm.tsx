import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ArticleForm.css';

const ArticleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(id);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.defaults.headers.common['Authorization'] = `Basic ${token}`;

    if (isEditing) {
      axios.get(`http://localhost:8080/api/articles/${id}`)
        .then(response => {
          setTitle(response.data.title);
          setContent(response.data.content);
          setTags(response.data.tags ? response.data.tags.join(', ') : '');
        })
        .catch(err => {
          console.error(`Error fetching article ${id}:`, err);
          setError("記事の読み込みに失敗しました。");
        });
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const articleData = {
      title,
      content,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    try {
      if (isEditing) {
        await axios.put(`http://localhost:8080/api/articles/${id}`, articleData);
      } else {
        await axios.post('http://localhost:8080/api/articles', articleData);
      }
      navigate('/admin');
    } catch (err) {
      console.error("Failed to save article:", err);
      setError("記事の保存に失敗しました。");
    }
  };

  return (
    <div className="article-form-container">
      <h1>{isEditing ? '記事の編集' : '新規記事の作成'}</h1>
      <form onSubmit={handleSubmit} className="article-form">
        {error && <p className="error">{error}</p>}
        <div className="form-group">
          <label htmlFor="title">タイトル</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="tags">タグ (カンマ区切り)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">本文</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={15}
          />
        </div>
        <button type="submit" className="btn btn-primary">{isEditing ? '更新' : '作成'}</button>
      </form>
    </div>
  );
};

export default ArticleForm;
