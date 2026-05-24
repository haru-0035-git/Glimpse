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
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<UserInfo | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const isAdmin = Boolean(currentUser?.admin);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const meRes = await axios.get<UserInfo>("/api/me");
        if (!active) {
          return;
        }
        setCurrentUser(meRes.data);

        const articleRes = await axios.get<Article[]>("/api/articles");
        if (!active) {
          return;
        }
        setArticles(articleRes.data);

        if (meRes.data.admin) {
          const userRes = await axios.get<UserInfo[]>("/api/users");
          if (!active) {
            return;
          }
          setUsers(userRes.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError("管理ダッシュボードの読み込みに失敗しました。");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleDeleteArticle = async (id: number) => {
    if (!isAdmin) {
      return;
    }
    if (!window.confirm("この記事を削除しますか？")) return;
    try {
      await axios.delete(`/api/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(`Error deleting article ${id}:`, err);
      setError("記事の削除に失敗しました。");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      return;
    }

    setError(null);
    setNotice(null);

    const username = createUsername.trim();
    if (username.length < 3 || username.length > 50) {
      setError("ユーザー名は3文字以上50文字以下で入力してください。");
      return;
    }

    if (createPassword.length < 12 || createPassword.length > 100) {
      setError("パスワードは12文字以上100文字以下で入力してください。");
      return;
    }

    if (createPassword !== createPasswordConfirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setCreatingUser(true);
    try {
      const response = await axios.post<UserInfo>("/api/users", {
        username,
        password: createPassword,
      });
      setUsers((prev) => [...prev, response.data]);
      setCreateUsername("");
      setCreatePassword("");
      setCreatePasswordConfirm("");
      setNotice(`${response.data.username} を追加しました。`);
    } catch (err) {
      console.error("Error creating user:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("ユーザーの追加に失敗しました。");
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!isAdmin) {
      return;
    }
    if (!window.confirm("このユーザーを削除しますか？")) return;
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(`Error deleting user ${id}:`, err);
      setError("ユーザーの削除に失敗しました。");
    }
  };

  const openPasswordForm = (user: UserInfo) => {
    if (!isAdmin) {
      return;
    }
    setError(null);
    setNotice(null);
    setPasswordTarget(user);
    setNewPassword("");
    setConfirmPassword("");
  };

  const closePasswordForm = () => {
    setPasswordTarget(null);
    setNewPassword("");
    setConfirmPassword("");
    setSavingPassword(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget || !isAdmin) {
      return;
    }

    setError(null);
    setNotice(null);

    if (newPassword.length < 12 || newPassword.length > 100) {
      setError("パスワードは12文字以上100文字以下で入力してください。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    setSavingPassword(true);
    try {
      await axios.put(`/api/users/${passwordTarget.id}/password`, {
        password: newPassword,
      });
      setNotice(`${passwordTarget.username} のパスワードを変更しました。`);
      closePasswordForm();
    } catch (err) {
      console.error(`Error changing password for ${passwordTarget.id}:`, err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("パスワードの変更に失敗しました。");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>管理ダッシュボード</h1>
          {currentUser && (
            <p className="admin-subtitle">
              ログイン中: {currentUser.username}（{currentUser.admin ? "管理者" : "閲覧ユーザー"}）
            </p>
          )}
        </div>
        {isAdmin && (
          <Link to="/admin/new" className="btn btn-primary">
            新規記事作成
          </Link>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <h2 style={{ marginTop: "1rem" }}>記事一覧</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>作成日時</th>
            {isAdmin && <th>操作</th>}
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id}>
              <td>
                <Link to={isAdmin ? `/admin/articles/${article.id}` : `/articles/${article.id}`}>
                  {article.title}
                </Link>
              </td>
              <td>{new Date(article.createdAt).toLocaleString("ja-JP")}</td>
              {isAdmin && (
                <td>
                  <div className="actions">
                    <Link to={`/admin/edit/${article.id}`} className="btn btn-secondary">
                      編集
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteArticle(article.id)}
                      className="btn btn-danger"
                    >
                      削除
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isAdmin && (
        <>
          <section className="user-create-panel">
            <h2>ユーザー追加</h2>
            <form className="user-create-form" onSubmit={handleCreateUser}>
              <div className="user-create-field">
                <label htmlFor="createUsername">ユーザー名</label>
                <input
                  id="createUsername"
                  type="text"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  minLength={3}
                  maxLength={50}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="user-create-field">
                <label htmlFor="createPassword">パスワード</label>
                <input
                  id="createPassword"
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  minLength={12}
                  maxLength={100}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="user-create-field">
                <label htmlFor="createPasswordConfirm">パスワード（確認）</label>
                <input
                  id="createPasswordConfirm"
                  type="password"
                  value={createPasswordConfirm}
                  onChange={(e) => setCreatePasswordConfirm(e.target.value)}
                  minLength={12}
                  maxLength={100}
                  required
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={creatingUser}>
                {creatingUser ? "追加中..." : "ユーザーを追加"}
              </button>
            </form>
          </section>

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
                  <td>{user.admin ? "管理者" : "閲覧ユーザー"}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-secondary" type="button" onClick={() => openPasswordForm(user)}>
                        パスワード変更
                      </button>
                      <button
                        className="btn btn-danger"
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                        title={user.id === currentUser?.id ? "自分自身のアカウントは削除できません。" : ""}
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {passwordTarget && (
        <div className="modal-backdrop" role="presentation">
          <form className="password-dialog" onSubmit={handleChangePassword}>
            <h2>パスワード変更</h2>
            <p className="dialog-subtitle">{passwordTarget.username}</p>
            <label htmlFor="newPassword">新しいパスワード</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={12}
              maxLength={100}
              required
              autoComplete="new-password"
            />
            <label htmlFor="confirmPassword">新しいパスワード（確認）</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={12}
              maxLength={100}
              required
              autoComplete="new-password"
            />
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={closePasswordForm}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? "保存中..." : "パスワードを変更"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;
