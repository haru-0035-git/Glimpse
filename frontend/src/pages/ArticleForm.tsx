import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserInfo } from "../types";
import "./ArticleForm.css";

const ArticleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(id);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const meRes = await axios.get<UserInfo>("/api/me");
        if (!meRes.data.admin) {
          navigate("/login");
          return;
        }

        if (isEditing) {
          const response = await axios.get(`/api/articles/${id}`);
          if (!active) {
            return;
          }
          setTitle(response.data.title);
          setContent(response.data.content);
          setTags(response.data.tags ? response.data.tags.join(", ") : "");
        }
      } catch (err) {
        console.error(`Error preparing article form ${id ?? "new"}:`, err);
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          navigate("/login");
          return;
        }
        setError("記事フォームの読み込みに失敗しました。");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const articleData = {
      title,
      content,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
    };

    try {
      if (isEditing) {
        await axios.put(`/api/articles/${id}`, articleData);
      } else {
        await axios.post("/api/articles", articleData);
      }
      navigate("/admin");
    } catch (err) {
      console.error("Failed to save article:", err);
      setError("記事の保存に失敗しました。");
    }
  };

  return (
    <div className="article-form-container">
      <h1>{isEditing ? "記事の編集" : "新規記事の作成"}</h1>
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
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEditing ? "更新" : "作成"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            戻る
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;
