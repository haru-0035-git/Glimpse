import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Article, UserInfo } from "../types";
import "./Admin.css";
import { jwtDecode } from "jwt-decode";

type DecodedToken = { roles?: string; exp?: number };

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      navigate("/login");
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    const decoded = jwtDecode<DecodedToken>(token);
    const roles = decoded.roles || "";
    setIsAdmin(roles.split(",").includes("ROLE_ADMIN"));

    const load = async () => {
      try {
        // 自分の情報（isAdmin確認にも利用）
        await axios.get("/api/me");

        // 記事取得: 管理者は全件、一般は自分の分だけ
        const articleEndpoint = roles.includes("ROLE_ADMIN")
          ? "/api/articles"
          : "/api/articles/my";
        const articleRes = await axios.get<Article[]>(articleEndpoint);
        setArticles(articleRes.data);

        // 管理者の場合、ユーザー一覧も取得
        if (roles.includes("ROLE_ADMIN")) {
          const userRes = await axios.get<UserInfo[]>("/api/users");
          setUsers(userRes.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("ダッシュボードの読み込みに失敗しました。再度お試しください。");
      }
    };

    load();
  }, [navigate]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("この記事を削除しますか？")) return;
    try {
      await axios.delete(`/api/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(`Error deleting article ${id}:`, err);
      setError("記事の削除に失敗しました。");
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>{isAdmin ? "管理ダッシュボード" : "マイダッシュボード"}</h1>
        <Link to="/admin/new" className="btn btn-primary">
          新規記事
        </Link>
      </div>
      {error && <p className="error">{error}</p>}

      <h2 style={{ marginTop: "1rem" }}>
        {isAdmin ? "すべての記事" : "自分の記事"}
      </h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>作成日時</th>
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
                  <Link
                    to={`/admin/edit/${article.id}`}
                    className="btn btn-secondary"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="btn btn-danger"
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isAdmin && (
        <>
          <h2 style={{ marginTop: "2rem" }}>ユーザー一覧</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ユーザー名</th>
                <th>権限</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.admin ? "管理者" : "一般"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Admin;
