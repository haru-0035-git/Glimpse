import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post("/api/authenticate", {
        username,
        password,
      });

      const jwtToken = response.data.jwt;
      localStorage.setItem("jwtToken", jwtToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
      window.dispatchEvent(new Event("jwt-token-update"));

      navigate("/admin");
    } catch (err) {
      console.error("Login failed:", err);
      if (axios.isAxiosError(err) && err.response) {
        const message = (err.response.data as { message?: string })?.message;
        setError(message || "ログインに失敗しました。ユーザー名とパスワードを確認してください。");
      } else {
        setError("ログインに失敗しました。時間をおいて再度お試しください。");
      }
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>ログイン</h2>
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
        <button type="submit">ログイン</button>
      </form>
    </div>
  );
};

export default Login;
