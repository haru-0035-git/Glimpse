import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const Signup: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("パスワードが一致しません。");
      return;
    }

    try {
      const response = await axios.post("/api/register", {
        username,
        password,
      });

      const jwtToken = response.data.jwt;

      localStorage.setItem("jwtToken", jwtToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

      navigate("/admin");
    } catch (err) {
      console.error("Signup failed:", err);
      if (axios.isAxiosError(err) && err.response) {
        const message = (err.response.data as { message?: string })?.message;
        setError(message || "新規登録に失敗しました。入力内容をご確認ください。");
      } else {
        setError("新規登録に失敗しました。時間をおいて再度お試しください。");
      }
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSignup} className="login-form">
        <h2>アカウントを作成</h2>
        {error && <p className="error">{error}</p>}
        <div className="form-group">
          <label htmlFor="username">ユーザー名</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">パスワード</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">パスワード（確認）</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">登録する</button>
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          すでにアカウントをお持ちの方は <Link to="/login">ログイン</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
