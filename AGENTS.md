# AGENTS.md — Juna_supabase リポジトリ地図（エージェント前提）

_このリポジトリで作業するAIエージェント（ZCode/Cursor/Codex/Claude Code等）が最初に読むファイル。
デプロイ・運用の正本は [deploy/runbook.md](deploy/runbook.md)。_

## 構成

- `project/` — Vue3 + Vite + TypeScript + Tailwind のSPA（Netlifyでホスト）
- `project/supabase/` — migrations（スキーマ正本）・Edge Functions 3本（register-user / login-with-account / delete-user）・config.toml
- `project/scripts/` — create-admin / set-edge-functions-env / setup-smtp
- `deploy/` — 再利用可能な再構築・再デプロイツールチェーン（下記）

## コマンド（project/ で）

- `npm run dev` / `npm run build`（vue-tsc + vite build）/ `npm test`（vitest run）
- `npm run setup:all` — DB初期化→管理者→Functions一式（**Windowsでは `db:reset` 内の `yes` コマンドが無く失敗する**。Windowsは deploy/juna-deploy.ps1 を使うこと）

## 絶対守則

1. **`.env` はコミット禁止**（gitignore済み。キー・パスワードはここにのみ置く）
2. **`db:reset` は `supabase db reset --linked`（本番直結）** を含む — データがある状態で実行する前に必ず確認
3. ベクトル検索は**存在しない**: 2025-09-07にRevert済み（gte-smallが日本語非対応のため本人判断）。キーワード検索は PostsPage 内に現役（search_posts RPC）
4. READMEの「ベクトル/ハイブリッド検索」記載は実態と不一致（既知。修正はrunbookのIssue参照）

## デプロイ・運用

- **正本**: `deploy/runbook.md`（全手順・入力・検証・障害時）
- **ツール**: `deploy/juna-deploy.ps1 -Phase backend|frontend|verify|all`
- **CI**: `.github/workflows/ci.yml`（build + vitest）
- **keepalive**: `.github/workflows/keepalive.yml`（週次REST ping — 無料枠の7日非アクティブpause防止。**今回の死亡原因の再発防止**）
- Netlify: `juna-supabase.netlify.app`（環境変数 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` が接続先）
