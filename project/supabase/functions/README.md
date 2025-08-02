# Supabase Edge Functions 環境変数設定ガイド

## ローカル開発環境

ローカルでエッジ関数を開発・テストする場合は、`/supabase/.env.local`ファイルを使用します。

### 設定方法

1. `/supabase/.env.local`ファイルに環境変数を定義
2. `supabase functions serve`コマンドを実行する際、自動的に読み込まれます

```bash
# ローカルでエッジ関数を起動
supabase functions serve --env-file ./supabase/.env.local
```

## 本番環境（Supabaseダッシュボード）

本番環境では、Supabaseダッシュボードから環境変数を設定します。

### 設定手順

1. [Supabaseダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. 左側メニューから「Edge Functions」を選択
4. 「Settings」タブをクリック
5. 「Environment Variables」セクションで環境変数を追加

### 必要な環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `ALLOWED_ORIGINS` | 許可されたオリジン（カンマ区切り） | `https://example.com,https://app.example.com` |

### 注意事項

- `SUPABASE_URL`と`SUPABASE_SERVICE_ROLE_KEY`は自動的に設定されるため、手動で設定する必要はありません
- 環境変数を変更した後は、エッジ関数を再デプロイする必要があります

## デプロイコマンド

```bash
# 単一の関数をデプロイ
supabase functions deploy register-user

# すべての関数をデプロイ
supabase functions deploy
```

## CORS設定について

現在のエッジ関数は、リクエストのオリジンに基づいて動的にCORSヘッダーを設定します。
`ALLOWED_ORIGINS`環境変数にカンマ区切りで複数のオリジンを指定できます。