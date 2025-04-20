/**
 * アプリケーション全体で共有される型定義。
 * UI コンポーネント、Composable 関数、API レスポンスなどで利用される。
 */

/**
 * 関数の成功・失敗を表す共通の結果型。
 * 非同期処理やエラーハンドリングで使用。
 * @template T 成功時のデータの型。
 * @template E 失敗時のエラーの型 (デフォルトは Error)。
 */
export type Result<T, E = Error> =
  | { success: true; data: T } // 成功した場合の型
  | { success: false; error: E }; // 失敗した場合の型

/**
 * Supabase Edge Function からのエラーレスポンスの共通インターフェース。
 * API呼び出し時のエラーハンドリングで使用。
 */
export interface EdgeFunctionErrorResponse {
  success: false; // 常に false
  error: string; // エラーメッセージ
  errorCode?: string; // オプションのエラーコード (例: 'email_exists')
}

/**
 * ユーザー登録API (register-user function) の成功時のレスポンス形式。
 */
export interface RegisterUserSuccessResponse {
  success: true; // 常に true
  userId: string; // 登録されたユーザーのID (UUID)
}

/**
 * ユーザー登録API (register-user function) のリクエストボディの型。
 */
export interface RegisterUserPayload {
  email: string; // ユーザーのメールアドレス
  password: string; // ユーザーのパスワード
  nickname: string; // ユーザーのニックネーム
  accountId?: string; // ユーザーのアカウントID (@...) (任意)
}

/**
 * ログイン識別子 (メールアドレスまたはアカウントID) 取得API (login-with-account function)
 * の成功時のレスポンス形式。
 */
export interface LoginIdentifierSuccessResponse {
  success: true; // 常に true
  email: string; // 識別子に対応するメールアドレス
}

/**
 * ログイン識別子取得API (login-with-account function) のリクエストボディの型。
 */
export interface LoginIdentifierPayload {
  identifier: string; // メールアドレスまたはアカウントID ('@'の有無は問わない)
}

/**
 * public.profiles テーブルの行データに対応するインターフェース。
 * `database.ts` の `Tables<"profiles">` の Row 型を基にするが、
 * アプリケーション内で扱いやすいように再定義することも可能。
 */
export interface ProfileData {
  id: string; // ユーザーID (主キー、auth.users.id と同じ)
  account_id: string; // アカウントID (ユニーク、@...)
  nickname: string | null; // ニックネーム (null許容)
  avatar_data: string | null; // アバター画像のパス (Storage) またはデータ (null許容)
  bio: string | null; // 自己紹介文 (null許容)
}

/**
 * プロフィール更新API (/api/profile/update) のリクエストボディの型。
 * 更新可能なフィールドのみをオプショナルで定義。
 */
export interface ProfileUpdatePayload {
  nickname?: string; // ニックネーム (更新する場合のみ指定)
  account_id?: string; // アカウントID (更新する場合のみ指定)
  avatar_data?: string | null; // アバターデータ (更新する場合のみ指定、nullで削除)
  bio?: string | null; // 自己紹介文 (更新する場合のみ指定、nullで削除)
}

/**
 * テストデータなどで使用するユーザー認証情報のインターフェース。
 */
export interface UserCredentials {
  email: string;
  password: string;
  nickname: string;
  accountId: string;
}

/**
 * アプリケーション固有のカスタムエラーインターフェース。
 * 標準の Error を拡張し、エラーコードや原因となったエラーを保持可能にする。
 */
export interface CustomError extends Error {
  message: string; // エラーメッセージ (Errorから継承)
  errorCode?: string; // アプリケーション固有のエラーコード (例: 'network_error')
  cause?: any; // エラーの根本原因 (別のエラーオブジェクトなど)
}

/**
 * 引数が CustomError 型かどうかを判定するタイプガード関数。
 * catch ブロックなどでエラーの種類を特定するために使用。
 * @param error 判定対象の不明な値。
 * @returns error が CustomError であれば true、そうでなければ false。
 */
export function isCustomError(error: unknown): error is CustomError {
  // typeof null === 'object' なので null 除外は必須
  return typeof error === 'object' && error !== null && 'message' in error;
}

/**
 * アカウント削除処理におけるエラー情報のインターフェース。
 * `composables/account/useAccount.ts` で使用される想定。
 */
export interface DeletionError {
  message: string; // ユーザーに表示するエラーメッセージ
  // code: APIレスポンスのエラーコードや、クライアント側で定義したエラー種別を格納
  code?: 'unauthorized' | 'supabase_client_not_initialized' | 'fetch_error_or_unexpected' | 'api_returned_failure' | string;
}

/**
 * シリアライズ可能な Supabase ユーザー情報のインターフェース。
 * User オブジェクトはそのままシリアライズできないため、必要な情報のみ抽出。
 * plugins/supabase.ts と composables/useSupabaseUser.ts で使用される。
 */
export interface SafeSupabaseUser {
  id: string; // ユーザーID
  email?: string; // メールアドレス (存在する場合)
  // Record<string, any> は型安全性が低いため、可能であればより具体的な型を指定する
  user_metadata: Record<string, unknown>; // ユーザー定義メタデータ
  app_metadata: Record<string, unknown>; // アプリケーション定義メタデータ
} 