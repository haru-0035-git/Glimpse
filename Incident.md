# インシデント報告書 - Glimpse セキュリティレビュー
日付: 2026-01-30
対象: C:\Users\haru186\programming\Glimpse 配下の backend/ と frontend/ のソースレビュー

## 概要
- 記事本文を生HTMLとして描画しているため、保存型XSSの高リスク。
- 管理者初期化のデフォルト値とコミット済みシークレットにより、不正アクセスの恐れ。
- 追加の弱点として、ログインのレート制限不足とJWT処理の脆弱な例外対応。

## 調査結果
### 1) Markdownの生HTML描画による保存型XSS (高)
根拠:
- frontend/src/pages/ArticleDetail.tsx で ReactMarkdown + rehypeRaw により article.content を描画。
- backend/src/main/java/cc/haruverse/backend/ArticleController.java で本文を無サニタイズで保存。

影響:
- 記事本文にHTML/JSを埋め込めると閲覧者のブラウザでスクリプト実行→トークン窃取/アカウント乗っ取り/情報流出。

推奨対応:
- rehypeRaw を削除、または厳格な許可リストでサニタイズ (rehype-sanitize / DOMPurify 等)。
- サーバー側サニタイズやサニタイズ済みHTMLの保存も検討。

### 2) JWT を localStorage に保存 (高)
根拠:
- frontend/src/pages/Login.tsx で localStorage に JWT 保存。
- frontend/src/components/ProtectedRoute.tsx と frontend/src/pages/Admin.tsx で localStorage から読込。

影響:
- XSS が発生した場合、トークンを容易に窃取され完全なアカウント乗っ取り。

推奨対応:
- HttpOnly / Secure / SameSite 付き Cookie を推奨。必要ならCSRF対策も実施。
- Cookie不可ならメモリ保持 + 短命アクセストークン + リフレッシュトークン。

### 3) デフォルト管理者資格情報と自動作成 (高)
根拠:
- .env に APP_ADMIN_USERNAME=admin, APP_ADMIN_PASSWORD=change_me。
- backend/src/main/java/cc/haruverse/backend/config/AdminInitializer.java が env から管理者を自動作成。

影響:
- デフォルトのままデプロイすると既知の認証情報で管理者ログイン可能。

推奨対応:
- 追跡対象設定からデフォルト資格情報を削除。
- 既定/弱い資格情報を検出したら起動失敗、または一度限りの手動ブートストラップを要求。

### 4) シークレットがリポジトリにコミット済み (高)
根拠:
- .env に DB パスワードと JWT_SECRET。

影響:
- リポジトリが共有/漏洩した場合、DB 侵害や JWT 偽造の恐れ。

推奨対応:
- すべてのシークレットをVCSから削除し、.env.example へ置換。全資格情報とJWT秘密鍵をローテーション。
- 本番は Secret Manager / CI/CD から注入。

### 5) ログインのレート制限/ロックアウトなし (中)
根拠:
- backend/src/main/java/cc/haruverse/backend/AuthController.java の /authenticate にレート制限・ロックアウトなし。

影響:
- 総当たり/クレデンシャルスタッフィングが容易。

推奨対応:
- IP/ユーザー単位のレート制限 (bucket4j / Spring filter 等) と連続失敗時の一時ロックアウト。

### 6) 不正JWTの扱いで500エラーになる可能性 (低〜中)
根拠:
- backend/src/main/java/cc/haruverse/backend/filter/JwtRequestFilter.java で jwtUtil.extractUsername(jwt) の例外未処理。

影響:
- 不正トークンで500やログスパム、簡易DoSの恐れ。

推奨対応:
- 例外を捕捉し未認証として処理 (または401返却)。

## 補足
- 登録は無効化されており、管理者専用のエンドポイントは SecurityConfig と追加の管理者チェックで保護されている。
