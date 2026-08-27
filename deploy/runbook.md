# Juna 再デプロイ・ランブック（正本）

_SupabaseバックエンドとNetlifyフロントの完全再構築経路。2026-08-23の全滅（無料枠pause→プロジェクト消滅）から
再建した時に使った手順を再利用可能にしたもの。次に死んでも（または新規立ち上げでも）ここから辿れる。_

## 前提となる理解

- **死因（2026-08-23確定）**: Supabase無料枠は7日間非アクティブで自動pause、長期放置でプロジェクト消滅。
  ダッシュボード復元は最長1年、その後はバックアップからの新規復元
- **再発防止**: `.github/workflows/keepalive.yml`（週次REST ping）がデッドマンスイッチ
- 復旧資産は**すべてgit内**: migrations（バケット・RLS・トリガー込み）/ Edge Functions 3本 / setupスクリプト
- git外で再設定が必要なもの: SMTP（Gmailアプリパスワード等）のみ。なしでもパスワードリセット以外は動く

## 認証の地図（最初にそろえる入力）

| 入力 | ファイル | 入手方法 |
|---|---|---|
| Supabaseメール+パスワード | `.zcode/tmp/sb_cred.txt`（1行目:email 2行目:password） | 本人から預かる |
| Supabaseアクセストークン | `.zcode/tmp/sb_token.txt` | ブラウザで `supabase.com/dashboard/account/tokens` → Generate new token → Copy。**AIエージェントならPlaywright（隔離ブラウザ）でメール+パスワードから自動取得可** |
| Netlifyトークン | `.zcode/tmp/netlify_token.txt` または環境変数 `NETLIFY_AUTH_TOKEN` | `app.netlify.com` ログイン → User Settings → Applications → New access token。Playwrightで同じ手順で取れる |

トークンは使い終わったら削除する。秘密は会話ログとvaultに置かない。.env（gitignore済み）にだけ残す。

## 実行（1コマンド）

```powershell
# 全自動: バックエンド再構築 → フロント再デプロイ → 検証
powershell -ExecutionPolicy Bypass -File deploy/juna-deploy.ps1 -Phase all `
  -AdminEmail "admin@example.com"

# 個別フェーズ
deploy/juna-deploy.ps1 -Phase backend    # プロジェクト作成→DB→Functions→管理者
deploy/juna-deploy.ps1 -Phase frontend   # Netlify環境変数→ビルド→デプロイ
deploy/juna-deploy.ps1 -Phase verify     # 生存チェック（証跡出力）
```

## フェーズ詳細と検証基準（証跡主義: AIの自己申告を信じない）

### Phase backend
1. CLIログイン（トークンファイルから）
2. 組織取得 → 同名プロジェクトの重複チェック（あったら停止）
3. **パスワード2種生成**（DB 32字・管理者 20字、英数字のみ）→ プロジェクト作成（無料枠 / ap-northeast-1）
4. ACTIVEまでポーリング（最大4分）
5. APIキー取得（anon / service_role）→ `.env` 書き出し
6. `package.json` の `supabase:link` を新refに差し替え → `supabase link`
7. `supabase db push --include-all`（migrations適用。**Windowsでは `db:reset` の `yes` が無いのでpush直叩き**）
8. `functions:env` → `functions:deploy`（3本）→ `admin:create`
9. **検証**: `GET /rest/v1/`（apikey付き）が200であること
10. keepalive.yml の `__SUPABASE_REF__` / `__ANON_KEY__` を実値に置換 → コミット対象

### Phase frontend
1. Netlify APIでサイト `juna-supabase` を特定
2. 環境変数 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を新値で更新
3. ビルド要求（git連携時は `POST /builds`。非連携時はrunbook末尾の手動UI手順）
4. **検証**: デプロイ後の `index-*.js` に新ref文字列が含まれること（古いバンドル掴みを検出）

### Phase verify（単体でも実行可・死活監視に使える）
- Supabase REST: 200 か
- Netlify: 200 か。JSバンドル内のrefと.envのref一致か
- 結果を `[OK]` / `[FAIL]` 付きで行出力（ログ=証跡）

## 既知の障害と対処

| 症状 | 原因 | 対処 |
|---|---|---|
| orgs list 401 | トークン失効/誤り | トークン再生成 |
| provisioning timeout | Supabase側混雑 | 数分待って `-Phase verify` で状態確認→backend再実行（重複チェックが効く） |
| Netlify API 401 | トークン違い/失効 | 再生成。NetlifyがOAuthのみアカウントの場合はUIから手動 |
| db push が既適用で失敗 | 状態不一致 | `supabase migration list --linked` で確認後、`--include-all` 再実行 |
| サイトは200だがログインできない | Edge Functions未デプロイ or ALLOWED_ORIGINS 不一致 | backendフェーズ8を再実行、`.env` の `ALLOWED_ORIGINS` 確認 |

## 支払い方針

**課金なし（無料枠のみ）で構成する**こと（本人指示 2026-08-23: 課金以外は基本何してよい）。
Supabase free / Netlify free / GitHub Actions free枠内で運用。

## 未実装・バックログ

- **メール: ビルトインメーラーで稼働確認済み（2026-08-23）**。パスワードリセットメールが
  noreply@mail.app.supabase.com から実際に届くことを検証済み（無料枠 約4通/時の制限あり）。
  **GmailカスタムSMTPは保留**: aiagents690@gmail.com のアプリパスワード取得には2SV有効化が必要だが、
  Googleは「同期されないパスキーしか無いアカウント」に対し電話番号等の追加要素を要求するため自動化不可。
  解錠手順: 同アカウントに電話番号を登録して2SVを有効化 → myaccount.google.com/apppasswords で
  16文字のアプリパスワード生成 → Supabase ダッシュボード Authentication → SMTP Settings に
  smtp.gmail.com / 587 / aiagents690@gmail.com / アプリパスワード を設定
- READMEのベクトル検索記載の削除（文書の真実化）
- `db:reset` のlocal/prod分離と確認ゲート（現状はrunbookの守則2で運用カバー）
- Playwrightによるトークン自動取得のスクリプト化（現状はエージェントが対話的に実行）
