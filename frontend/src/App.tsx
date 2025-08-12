/// <reference types="react" />
// src/App.tsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

// APIから返ってくるデータの型を定義する
interface ApiResponse {
  message: string;
}

const App: React.FC = () => {
  // useStateに型を指定することで、messageはstring型であることが保証される
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // axiosのgetメソッドにも型を指定でき、レスポンスのdataがApiResponse型であることを明示できる
    axios
      .get<ApiResponse>("http://localhost:8080/api/hello")
      .then((response) => {
        // response.dataはApiResponse型なので、.messageプロパティを持つことが保証される
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error("APIの呼び出し中にエラーが発生しました！", error);
        setError("APIサーバーに接続できませんでした。");
      });
  }, []); // 空の配列を渡すことで、コンポーネントのマウント時に一度だけ実行される

  return (
    <div className="App">
      <header className="App-header">
        <h1>社内Wiki (TypeScript版)</h1>
        <p>バックエンドからのメッセージ:</p>
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <p style={{ color: "#61dafb" }}>{message || "読み込み中..."}</p>
        )}
      </header>
    </div>
  );
};

export default App;
