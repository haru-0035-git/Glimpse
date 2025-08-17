import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Basic認証のためにユーザー名とパスワードをエンコード
      const token = btoa(`${username}:${password}`);
      
      // このリクエストは認証を確認するためだけのもの
      // SecurityConfigで /api/test-auth のようなエンドポイントをADMINロールで保護し、
      // 200 OKが返るかで認証成功を判断するのがより堅牢
      // ここでは簡略化のため、/api/articles にGETリクエストを送って試す
      await axios.get('http://localhost:8080/api/articles', {
        headers: {
          'Authorization': `Basic ${token}`
        }
      });

      // 認証情報をlocalStorageに保存（推奨されないが、MVPのため簡略化）
      localStorage.setItem('authToken', token);

      // axiosのデフォルトヘッダーに設定
      axios.defaults.headers.common['Authorization'] = `Basic ${token}`;

      navigate('/admin');
    } catch (err) {
      console.error("Login failed:", err);
      setError('ログインに失敗しました。ユーザー名またはパスワードを確認してください。');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>管理者ログイン</h2>
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
