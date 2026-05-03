import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserInfo } from "../types";
import "./ArticleForm.css";

const DEFAULT_IMAGE_WIDTH = 560;
const MIN_IMAGE_WIDTH = 160;
const MAX_IMAGE_WIDTH = 960;
const DEFAULT_IMAGE_ALIGN = "center";

type ImageAlign = "left" | "center" | "right";
type ImageMeta = {
  alt: string;
  src: string;
  width: number;
  align: ImageAlign;
  layout?: "row";
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isImageAlign = (value: string): value is ImageAlign =>
  value === "left" || value === "center" || value === "right";

const markdownImage = (meta: ImageMeta) => {
  const parts = [meta.alt || "image", `width=${meta.width}`, `align=${meta.align}`];
  if (meta.layout === "row") {
    parts.push("layout=row");
  }
  return `![${parts.join("|")}](${meta.src})`;
};

const parseImageLine = (line: string): ImageMeta | null => {
  const match = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) {
    return null;
  }

  const [alt = "image", ...options] = match[1].split("|");
  const meta: ImageMeta = {
    alt: alt || "image",
    src: match[2],
    width: DEFAULT_IMAGE_WIDTH,
    align: DEFAULT_IMAGE_ALIGN as ImageAlign,
  };

  options.forEach((option) => {
    const [key, value] = option.split("=");
    if (key === "width" && value) {
      const width = Number(value);
      if (Number.isFinite(width)) {
        meta.width = Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, width));
      }
    }
    if (key === "align" && value && isImageAlign(value)) {
      meta.align = value;
    }
    if (key === "layout" && value === "row") {
      meta.layout = "row";
    }
  });

  return meta;
};

const imageHtml = (meta: ImageMeta) =>
  `<img src="${escapeHtml(meta.src)}" alt="${escapeHtml(meta.alt)}" data-markdown-image="true" data-width="${meta.width}" data-align="${meta.align}" data-layout="${meta.layout ?? ""}" style="width:${meta.width}px;max-width:100%;">`;

const imageParagraphHtml = (images: ImageMeta[]) => {
  const layout = images.length > 1 || images[0]?.layout === "row" ? "row" : "";
  const align = images[0]?.align ?? DEFAULT_IMAGE_ALIGN;
  const className = layout === "row" ? "editor-image-row" : `editor-image-align-${align}`;
  const attrs = [
    `data-image-align="${align}"`,
    layout ? `data-image-layout="${layout}"` : "",
    `class="${className}"`,
  ]
    .filter(Boolean)
    .join(" ");

  return `<p ${attrs}>${images.map(imageHtml).join("")}</p>`;
};

const markdownToEditorHtml = (markdown: string) => {
  if (!markdown) {
    return "";
  }

  const lines = markdown.split("\n");
  const html: string[] = [];
  let rowImages: ImageMeta[] = [];

  const flushRowImages = () => {
    if (rowImages.length > 0) {
      html.push(imageParagraphHtml(rowImages.map((image) => ({ ...image, layout: "row" }))));
      rowImages = [];
    }
  };

  lines.forEach((line) => {
    const image = parseImageLine(line);
    if (image?.layout === "row") {
      rowImages.push(image);
      return;
    }

    flushRowImages();

    if (image) {
      html.push(imageParagraphHtml([image]));
      return;
    }

    html.push(line ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>");
  });

  flushRowImages();
  return html.join("");
};

const ArticleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [lastUploadedUrl, setLastUploadedUrl] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [selectedImageWidth, setSelectedImageWidth] = useState(DEFAULT_IMAGE_WIDTH);
  const [selectedImageAlign, setSelectedImageAlign] = useState<ImageAlign>(DEFAULT_IMAGE_ALIGN as ImageAlign);
  const [selectedImageLayout, setSelectedImageLayout] = useState<"" | "row">("");
  const isEditing = Boolean(id);

  const updateImageParent = (image: HTMLImageElement) => {
    const parent = image.closest("p");
    if (!(parent instanceof HTMLParagraphElement)) {
      return;
    }

    const images = Array.from(parent.querySelectorAll<HTMLImageElement>("img[data-markdown-image='true']"));
    const align = image.dataset.align && isImageAlign(image.dataset.align) ? image.dataset.align : DEFAULT_IMAGE_ALIGN;
    const layout = image.dataset.layout === "row" || images.length > 1 ? "row" : "";

    parent.dataset.imageAlign = align;
    parent.classList.remove("editor-image-align-left", "editor-image-align-center", "editor-image-align-right", "editor-image-row");

    if (layout === "row") {
      parent.dataset.imageLayout = "row";
      parent.classList.add("editor-image-row");
      images.forEach((item) => {
        item.dataset.layout = "row";
        item.dataset.align = align;
      });
      return;
    }

    delete parent.dataset.imageLayout;
    parent.classList.add(`editor-image-align-${align}`);
  };

  const isImageOnlyParagraph = (element: Element | null): element is HTMLParagraphElement => {
    if (!(element instanceof HTMLParagraphElement)) {
      return false;
    }

    const images = element.querySelectorAll("img[data-markdown-image='true']");
    return images.length > 0 && element.textContent?.trim() === "";
  };

  const mergeAdjacentImageParagraphs = (image: HTMLImageElement) => {
    const parent = image.closest("p");
    if (!(parent instanceof HTMLParagraphElement)) {
      return;
    }

    while (isImageOnlyParagraph(parent.previousElementSibling)) {
      const previous = parent.previousElementSibling;
      const images = Array.from(previous.querySelectorAll<HTMLImageElement>("img[data-markdown-image='true']"));
      images.reverse().forEach((item) => parent.prepend(item));
      previous.remove();
    }

    while (isImageOnlyParagraph(parent.nextElementSibling)) {
      const next = parent.nextElementSibling;
      const images = Array.from(next.querySelectorAll<HTMLImageElement>("img[data-markdown-image='true']"));
      images.forEach((item) => parent.append(item));
      next.remove();
    }
  };

  const splitImageFromRow = (image: HTMLImageElement) => {
    const parent = image.closest("p");
    if (!(parent instanceof HTMLParagraphElement)) {
      return;
    }

    const images = Array.from(parent.querySelectorAll<HTMLImageElement>("img[data-markdown-image='true']"));
    image.dataset.layout = "";

    if (images.length <= 1) {
      updateImageParent(image);
      return;
    }

    const align = image.dataset.align && isImageAlign(image.dataset.align) ? image.dataset.align : DEFAULT_IMAGE_ALIGN;
    const singleParagraph = document.createElement("p");
    singleParagraph.dataset.imageAlign = align;
    singleParagraph.classList.add(`editor-image-align-${align}`);
    singleParagraph.append(image);
    parent.after(singleParagraph);

    const remainingImages = Array.from(parent.querySelectorAll<HTMLImageElement>("img[data-markdown-image='true']"));
    if (remainingImages.length > 0) {
      updateImageParent(remainingImages[0]);
    } else {
      parent.remove();
    }

    updateImageParent(image);
  };

  const editorToMarkdown = () => {
    const editor = editorRef.current;
    if (!editor) {
      return content;
    }

    const lines = Array.from(editor.childNodes).map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? "";
      }

      const element = node as HTMLElement;
      const images = Array.from(element.querySelectorAll<HTMLImageElement>("img[data-markdown-image='true']"));
      if (element.matches?.("img[data-markdown-image='true']") && element instanceof HTMLImageElement) {
        images.push(element);
      }

      if (images.length > 0) {
        const layout = element.dataset.imageLayout === "row" || images.length > 1 ? "row" : undefined;
        const align = element.dataset.imageAlign && isImageAlign(element.dataset.imageAlign)
          ? element.dataset.imageAlign
          : DEFAULT_IMAGE_ALIGN;

        return images
          .map((image) =>
            markdownImage({
              alt: image.getAttribute("alt") ?? "image",
              src: image.getAttribute("src") ?? "",
              width: Number(image.dataset.width || DEFAULT_IMAGE_WIDTH),
              align,
              layout,
            })
          )
          .join("\n");
      }

      return element.innerText.replace(/\n+$/g, "");
    });

    return lines.join("\n").replace(/\n+$/g, "");
  };

  const resetImageParagraphStyle = (paragraph: HTMLParagraphElement) => {
    delete paragraph.dataset.imageAlign;
    delete paragraph.dataset.imageLayout;
    paragraph.classList.remove("editor-image-align-left", "editor-image-align-center", "editor-image-align-right", "editor-image-row");
  };

  const normalizeEditorParagraphs = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    Array.from(editor.querySelectorAll<HTMLParagraphElement>("p")).forEach((paragraph) => {
      const images = Array.from(paragraph.querySelectorAll<HTMLImageElement>("img[data-markdown-image='true']"));

      if (images.length === 0) {
        resetImageParagraphStyle(paragraph);
        return;
      }

      const extraNodes = Array.from(paragraph.childNodes).filter((node) => {
        if (node instanceof HTMLImageElement && node.dataset.markdownImage === "true") {
          return false;
        }
        if (node instanceof HTMLBRElement) {
          return false;
        }
        return (node.textContent ?? "").trim().length > 0;
      });

      if (extraNodes.length === 0) {
        return;
      }

      const textParagraph = document.createElement("p");
      extraNodes.forEach((node) => textParagraph.append(node));
      paragraph.after(textParagraph);
      updateImageParent(images[0]);
    });
  };

  const syncContentFromEditor = () => {
    normalizeEditorParagraphs();
    setContent(editorToMarkdown());
  };

  const getSelectionImageParagraph = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const selectedParagraph = selectedImage?.closest("p") ?? null;
      return isImageOnlyParagraph(selectedParagraph) ? selectedParagraph : null;
    }

    const node = selection.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;
    const paragraph = element?.closest("p") ?? null;
    if (isImageOnlyParagraph(paragraph)) {
      return paragraph;
    }

    const selectedParagraph = selectedImage?.closest("p") ?? null;
    return isImageOnlyParagraph(selectedParagraph) ? selectedParagraph : null;
  };

  const insertTextParagraphAfter = (paragraph: HTMLParagraphElement, text: string) => {
    const nextParagraph = document.createElement("p");
    editorRef.current?.focus();

    if (text) {
      const textNode = document.createTextNode(text);
      nextParagraph.append(textNode);
      paragraph.after(nextParagraph);

      const range = document.createRange();
      range.setStart(textNode, text.length);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }

    nextParagraph.append(document.createElement("br"));
    paragraph.after(nextParagraph);

    const range = document.createRange();
    range.setStart(nextParagraph, 0);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    setSelectedImage(null);
  };

  const handleEditorBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const paragraph = getSelectionImageParagraph();
    if (!paragraph) {
      return;
    }

    const inputEvent = e.nativeEvent as InputEvent;
    if (inputEvent.inputType === "insertParagraph") {
      e.preventDefault();
      insertTextParagraphAfter(paragraph, "");
      syncContentFromEditor();
      return;
    }

    if ((inputEvent.inputType === "insertText" || inputEvent.inputType === "insertCompositionText") && inputEvent.data) {
      e.preventDefault();
      insertTextParagraphAfter(paragraph, inputEvent.data);
      syncContentFromEditor();
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") {
      return;
    }

    const paragraph = getSelectionImageParagraph();
    if (!paragraph) {
      return;
    }

    e.preventDefault();
    insertTextParagraphAfter(paragraph, "");
    syncContentFromEditor();
  };

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
          if (editorRef.current) {
            editorRef.current.innerHTML = markdownToEditorHtml(response.data.content);
          }
          setThumbnailUrl(response.data.thumbnailUrl ?? "");
          setLastUploadedUrl(response.data.thumbnailUrl ?? "");
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

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post<{ url: string }>("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.url;
  };

  const insertImagesAtCursor = (urls: string[]) => {
    const images = urls.map((url) => ({
      alt: "image",
      src: url,
      width: DEFAULT_IMAGE_WIDTH,
      align: DEFAULT_IMAGE_ALIGN as ImageAlign,
      layout: urls.length > 1 ? "row" as const : undefined,
    }));

    editorRef.current?.focus();
    document.execCommand("insertHTML", false, imageParagraphHtml(images));
    syncContentFromEditor();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const url = await uploadImage(file);
      setThumbnailUrl(url);
      setLastUploadedUrl(url);
    } catch (err) {
      console.error("Failed to upload article image:", err);
      setError("画像アップロードに失敗しました。5MB以下の jpg、jpeg、png、webp 画像を選択してください。");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const copyLastUploadedUrl = async () => {
    if (!lastUploadedUrl) {
      return;
    }

    await navigator.clipboard.writeText(lastUploadedUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const insertLastUploadedImage = () => {
    if (lastUploadedUrl) {
      insertImagesAtCursor([lastUploadedUrl]);
    }
  };

  const handleEditorPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));

    if (files.length > 0) {
      e.preventDefault();
      setError(null);
      setUploading(true);

      try {
        const urls = [];
        for (const file of files) {
          urls.push(await uploadImage(file));
        }
        setLastUploadedUrl(urls[urls.length - 1]);
        insertImagesAtCursor(urls);
      } catch (err) {
        console.error("Failed to paste-upload images:", err);
        setError("貼り付けた画像のアップロードに失敗しました。本文には挿入していません。");
      } finally {
        setUploading(false);
      }
      return;
    }

    const text = e.clipboardData.getData("text/plain");
    if (text) {
      e.preventDefault();
      const paragraph = getSelectionImageParagraph();
      if (paragraph) {
        insertTextParagraphAfter(paragraph, text);
      } else {
        document.execCommand("insertText", false, text);
      }
      syncContentFromEditor();
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target;
    if (target instanceof HTMLImageElement && target.dataset.markdownImage === "true") {
      const width = Number(target.dataset.width || DEFAULT_IMAGE_WIDTH);
      const align = target.dataset.align && isImageAlign(target.dataset.align) ? target.dataset.align : DEFAULT_IMAGE_ALIGN;
      const layout = target.dataset.layout === "row" ? "row" : "";
      setSelectedImage(target);
      setSelectedImageWidth(width);
      setSelectedImageAlign(align);
      setSelectedImageLayout(layout);
      return;
    }
    setSelectedImage(null);
  };

  const handleSelectedImageWidthChange = (width: number) => {
    if (!selectedImage) {
      return;
    }

    const clampedWidth = Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, width));
    selectedImage.dataset.width = String(clampedWidth);
    selectedImage.style.width = `${clampedWidth}px`;
    selectedImage.style.maxWidth = "100%";
    setSelectedImageWidth(clampedWidth);
    syncContentFromEditor();
  };

  const handleSelectedImageAlignChange = (align: ImageAlign) => {
    if (!selectedImage) {
      return;
    }

    selectedImage.dataset.align = align;
    setSelectedImageAlign(align);
    updateImageParent(selectedImage);
    syncContentFromEditor();
  };

  const handleSelectedImageLayoutChange = (layout: "" | "row") => {
    if (!selectedImage) {
      return;
    }

    selectedImage.dataset.layout = layout;
    if (layout === "row") {
      mergeAdjacentImageParagraphs(selectedImage);
      updateImageParent(selectedImage);
    } else {
      splitImageFromRow(selectedImage);
    }
    setSelectedImageLayout(layout);
    syncContentFromEditor();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const currentContent = editorToMarkdown();
    setContent(currentContent);

    if (!currentContent.trim()) {
      setError("本文を入力してください。");
      return;
    }

    const articleData = {
      title,
      content: currentContent,
      thumbnailUrl: thumbnailUrl.trim() || null,
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
      <h1>{isEditing ? "記事編集" : "新規記事作成"}</h1>
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
          <label htmlFor="tags">タグ（カンマ区切り）</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="imageUpload">画像アップロード</label>
          <input
            type="file"
            id="imageUpload"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={uploading}
          />
          <input
            type="text"
            aria-label="サムネイルURL"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="/uploads/articles/example.webp"
            className="image-url-input"
          />
          {uploading && <p className="form-hint">アップロード中...</p>}
          {lastUploadedUrl && (
            <div className="upload-actions">
              <code>{lastUploadedUrl}</code>
              <button type="button" className="btn btn-secondary" onClick={copyLastUploadedUrl}>
                {copied ? "コピーしました" : "URLをコピー"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={insertLastUploadedImage}>
                本文に挿入
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setThumbnailUrl(lastUploadedUrl)}>
                サムネイルに設定
              </button>
            </div>
          )}
          {thumbnailUrl && (
            <div className="image-preview">
              <img src={thumbnailUrl} alt="記事サムネイルのプレビュー" />
              <button type="button" className="btn btn-secondary" onClick={() => setThumbnailUrl("")}>
                サムネイルを外す
              </button>
            </div>
          )}
        </div>
        <div className="form-group editor-panel">
          <label htmlFor="content">本文</label>
          {selectedImage && (
            <div className="image-size-control">
              <label htmlFor="imageWidth">画像サイズ</label>
              <input
                id="imageWidth"
                type="range"
                min={MIN_IMAGE_WIDTH}
                max={MAX_IMAGE_WIDTH}
                step={20}
                value={selectedImageWidth}
                onChange={(e) => handleSelectedImageWidthChange(Number(e.target.value))}
              />
              <input
                type="number"
                min={MIN_IMAGE_WIDTH}
                max={MAX_IMAGE_WIDTH}
                value={selectedImageWidth}
                onChange={(e) => handleSelectedImageWidthChange(Number(e.target.value))}
                aria-label="画像サイズ"
              />
              <span>px</span>
              <label htmlFor="imageAlign">画像位置</label>
              <select
                id="imageAlign"
                value={selectedImageAlign}
                onChange={(e) => handleSelectedImageAlignChange(e.target.value as ImageAlign)}
              >
                <option value="left">左寄せ</option>
                <option value="center">中央</option>
                <option value="right">右寄せ</option>
              </select>
              <label htmlFor="imageLayout">画像の並び</label>
              <select
                id="imageLayout"
                value={selectedImageLayout}
                onChange={(e) => handleSelectedImageLayoutChange(e.target.value as "" | "row")}
              >
                <option value="">単独表示</option>
                <option value="row">横並び</option>
              </select>
            </div>
          )}
          <div
            ref={editorRef}
            id="content"
            className="visual-editor"
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label="本文"
            data-placeholder="本文を入力、または画像を貼り付け"
            onKeyDown={handleEditorKeyDown}
            onBeforeInput={handleEditorBeforeInput}
            onInput={syncContentFromEditor}
            onPaste={handleEditorPaste}
            onClick={handleEditorClick}
            suppressContentEditableWarning
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={uploading}>
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
