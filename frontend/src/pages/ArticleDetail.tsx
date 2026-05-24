import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Article } from "../types";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import "./ArticleDetail.css";

interface ArticleDetailProps {
  showAdminButtons?: boolean;
}

type ImageAlign = "left" | "center" | "right";

const isImageAlign = (value: string): value is ImageAlign =>
  value === "left" || value === "center" || value === "right";

const parseImageAlt = (alt?: string) => {
  const [label = "", ...options] = (alt ?? "").split("|");
  const parsed: {
    alt: string;
    width?: number;
    align?: ImageAlign;
    layout?: "row";
  } = {
    alt: label,
  };

  options.forEach((option) => {
    const [key, value] = option.split("=");
    if (key === "width" && value) {
      const width = Number(value);
      if (Number.isFinite(width)) {
        parsed.width = width;
      }
    }
    if (key === "align" && value && isImageAlign(value)) {
      parsed.align = value;
    }
    if (key === "layout" && value === "row") {
      parsed.layout = "row";
    }
  });

  return parsed;
};

const imageTokenPattern = /!\[[^\]]*]\([^)]+\)/g;

const isRowImageToken = (token: string) => {
  const alt = token.match(/^!\[([^\]]*)]/)?.[1] ?? "";
  return alt.split("|").some((option) => option === "layout=row");
};

const normalizeArticleMarkdown = (markdown: string) => {
  const tokenized = markdown.replace(imageTokenPattern, (match) => `\n${match}\n`);
  const normalizedLines: string[] = [];
  let rowImages: string[] = [];

  const flushRowImages = () => {
    if (rowImages.length === 0) {
      return;
    }

    normalizedLines.push("");
    normalizedLines.push(rowImages.join(" "));
    normalizedLines.push("");
    rowImages = [];
  };

  tokenized.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushRowImages();
      normalizedLines.push("");
      return;
    }

    if (line.match(/^!\[[^\]]*]\([^)]+\)$/)) {
      if (isRowImageToken(line)) {
        rowImages.push(line);
        return;
      }

      flushRowImages();
      normalizedLines.push("");
      normalizedLines.push(line);
      normalizedLines.push("");
      return;
    }

    flushRowImages();
    normalizedLines.push(rawLine);
  });

  flushRowImages();
  return normalizedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const ArticleDetail: React.FC<ArticleDetailProps> = ({
  showAdminButtons = false,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios
        .get(`/api/articles/${id}`)
        .then((response) => {
          setArticle(response.data);
        })
        .catch((err) => {
          console.error(`Error fetching article ${id}:`, err);
          setError("記事の読み込みに失敗しました。");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!article) {
    return <div>記事が見つかりません。</div>;
  }

  return (
    <div className="article-detail-container">
      <div className="article-header">
        <h1>{article.title}</h1>
        {article.thumbnailUrl && (
          <img className="article-hero-image" src={article.thumbnailUrl} alt="" />
        )}
        <div className="article-meta">
          <span>
            投稿日: {new Date(article.createdAt).toLocaleDateString("ja-JP")}
          </span>
          {article.tags && article.tags.length > 0 && (
            <div className="tags-container">
              {article.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="article-content">
        <ReactMarkdown
          remarkPlugins={[remarkBreaks, remarkGfm]}
          components={{
            img: ({ alt, src }) => {
              const parsed = parseImageAlt(alt);
              return (
                <img
                  src={src}
                  alt={parsed.alt}
                  data-align={parsed.align}
                  data-layout={parsed.layout}
                  style={parsed.width ? { width: parsed.width, maxWidth: "100%" } : undefined}
                />
              );
            },
          }}
        >
          {normalizeArticleMarkdown(article.content)}
        </ReactMarkdown>
      </div>
      {showAdminButtons && article && (
        <div className="article-actions">
          <Link to={`/admin/edit/${article.id}`} className="btn btn-primary">
            編集
          </Link>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="btn btn-secondary"
          >
            管理画面に戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleDetail;
