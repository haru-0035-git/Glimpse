import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Article, UserInfo } from "../types";
import "./Admin.css";

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const meRes = await axios.get<UserInfo>("/api/me");
        if (!meRes.data.admin) {
          navigate("/login");
          return;
        }

        if (!active) {
          return;
        }
        setCurrentUserId(meRes.data.id);

        const [articleRes, userRes] = await Promise.all([
          axios.get<Article[]>("/api/articles"),
          axios.get<UserInfo[]>("/api/users"),
        ]);

        if (!active) {
          return;
        }
        setArticles(articleRes.data);
        setUsers(userRes.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          navigate("/login");
          return;
        }
        setError("ダッシュボードの読み込みに失敗しました。時間をおいて再試行してください。");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm("この記事を削除しますか？")) return;
    try {
      await axios.delete(`/api/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(`Error deleting article ${id}:`, err);
      setError("記事の削除に失敗しました。");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("このユーザーを削除しますか？")) return;
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(`Error deleting user ${id}:`, err);
      setError("ユーザーの削除に失敗しました。");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>管理者ダッシュボード</h1>
        <Link to="/admin/new" className="btn btn-primary">
          新規記事作成
        </Link>
      </div>
      {error && <p className="error">{error}</p>}

      <h2 style={{ marginTop: "1rem" }}>すべての記事</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>投稿日</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td>
                <Link to={`/admin/articles/${article.id}`}>{article.title}</Link>
              </td>
              <td>{new Date(article.createdAt).toLocaleString()}</td>
              <td>
                <div className="actions">
                  <Link to={`/admin/edit/${article.id}`} className="btn btn-secondary">
                    編集
                  </Link>
                  <button onClick={() => handleDeleteArticle(article.id)} className="btn btn-danger">
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "2rem" }}>ユーザー一覧</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ユーザー名</th>
            <th>権限</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.admin ? "管理者" : "一般"}</td>
              <td>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteUser(user.id)}
                  disabled={user.id === currentUserId}
                  title={user.id === currentUserId ? "自分自身は削除できません" : ""}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;
