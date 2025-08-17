import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Article } from '../types';
import './Admin.css';

const Admin: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    // Set auth token for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Basic ${token}`;

    axios.get('http://localhost:8080/api/articles')
      .then(response => {
        setArticles(response.data);
      })
      .catch(err => {
        console.error("Error fetching articles:", err);
        setError("記事の読み込みに失敗しました。");
      });
  }, [navigate]);

  const handleDelete = async (id: number) => {
    if (window.confirm('本当にこの記事を削除しますか？')) {
      try {
        await axios.delete(`http://localhost:8080/api/articles/${id}`);
        setArticles(articles.filter(article => article.id !== id));
      } catch (err) {
        console.error(`Error deleting article ${id}:`, err);
        setError("記事の削除に失敗しました。");
      }
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>管理者ダッシュボード</h1>
        <Link to="/admin/new" className="btn btn-primary">新規記事作成</Link>
      </div>
      {error && <p className="error">{error}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>作成日時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(article => (
            <tr key={article.id}>
              <td>{article.title}</td>
              <td>{new Date(article.createdAt).toLocaleString()}</td>
              <td>
                <div className="actions">
                  <Link to={`/admin/edit/${article.id}`} className="btn btn-secondary">編集</Link>
                  <button onClick={() => handleDelete(article.id)} className="btn btn-danger">削除</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;
