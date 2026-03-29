# セキュリティテストチェックリスト

## 自動テスト
- [x] 2026-03-29 に `./mvnw.cmd test` を実行し、バックエンドの自動テストがすべて成功した
- [x] ログイン成功時に `HttpOnly` な認証 Cookie が発行される (`AuthControllerTest.authenticateSetsHttpOnlyCookieOnSuccess`)
- [x] ログイン失敗回数制限に達すると `429 Too Many Requests` を返す (`AuthControllerTest.authenticateReturnsTooManyRequestsWhenBlocked`)
- [x] 認証失敗時に `401 Unauthorized` を返し、失敗回数を記録する (`AuthControllerTest.authenticateReturnsUnauthorizedAndRecordsFailure`)
- [x] ログアウト時に認証 Cookie を削除する (`AuthControllerTest.logoutClearsCookie`)
- [x] `/api/me` が現在のユーザー情報を返す (`AuthControllerTest.meReturnsCurrentUser`)
- [x] 自分自身のユーザー削除を拒否する (`AuthControllerTest.deleteUserRejectsSelfDeletion`)
- [x] 不正な JWT を受け取っても認証せず、安全に処理を継続する (`JwtRequestFilterTest.invalidTokenDoesNotAuthenticateAndContinues`)
- [x] Cookie 内の JWT で認証できる (`JwtRequestFilterTest.cookieTokenAuthenticatesUser`)
- [x] ログイン失敗がしきい値に達するとブロックする (`LoginAttemptServiceTest.blocksAfterConfiguredNumberOfFailures`)
- [x] ログイン成功時に記録済みの失敗回数をクリアする (`LoginAttemptServiceTest.successClearsRecordedFailures`)
- [x] 弱い初期管理者パスワードを拒否する (`AdminInitializerTest.weakDefaultCredentialsAreRejected`)
- [x] 十分に強い初期管理者パスワードなら管理者を作成できる (`AdminInitializerTest.strongCredentialsCreateAdminIfMissing`)
- [x] `JWT_SECRET` 未設定を拒否する (`SecurityConfigValidatorTest.missingSecretIsRejected`)
- [x] 短すぎる `JWT_SECRET` を拒否する (`SecurityConfigValidatorTest.weakSecretIsRejected`)
- [x] 十分に強い `JWT_SECRET` は受け入れられる (`SecurityConfigValidatorTest.strongSecretPasses`)
- [x] `GET /api/csrf` で `XSRF-TOKEN` Cookie を発行する (`SecurityCsrfIntegrationTest.csrfEndpointIssuesTokenCookie`)
- [x] CSRF トークンなしの `/api/authenticate` は `403 Forbidden` になる (`SecurityCsrfIntegrationTest.authenticateWithoutCsrfTokenIsForbidden`)
- [x] `XSRF-TOKEN` Cookie と `X-XSRF-TOKEN` ヘッダを付けた `/api/authenticate` は成功する (`SecurityCsrfIntegrationTest.authenticateWithCsrfCookieAndHeaderIsAllowed`)
- [x] `XSRF-TOKEN` Cookie と `X-XSRF-TOKEN` ヘッダを付けた `/api/logout` は成功する (`SecurityCsrfIntegrationTest.logoutWithCsrfTokenIsAllowed`)

## 手動確認
- [x] ログイン成功時に `GLIMPSE_AUTH` Cookie が `HttpOnly` 付きで発行される
- [x] ブラウザの `localStorage` に `jwtToken` が保存されていない
- [x] ログアウト後に認証 Cookie が消え、`/admin` にアクセスできなくなる
- [ ] `XSRF-TOKEN` Cookie が発行され、`POST` / `PUT` / `DELETE` 時に `X-XSRF-TOKEN` ヘッダが送信される
- [ ] `Authorization` ヘッダに不正な JWT を入れても `500` にならない
- [ ] ログイン失敗を繰り返すと、設定した回数超過後に `HTTP 429` が返る
- [x] 記事本文に `<script>` や `onerror=` を含めてもブラウザで実行されない
- [ ] `X-XSRF-TOKEN` ヘッダなしの `POST` / `PUT` / `DELETE` は `403 Forbidden` になる
- [x] `APP_ADMIN_PASSWORD=change_me` で起動するとアプリが起動失敗する
- [x] `JWT_SECRET` が未設定、または短すぎる場合に起動失敗する
