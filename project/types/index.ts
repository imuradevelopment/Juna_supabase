/**
 * 関数の成功・失敗を表す共通の結果型
 * @template T 成功時のデータの型
 * @template E 失敗時のエラーの型 (デフォルトは Error)
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Edge Functionからのエラーレスポンスの共通型
 */
export interface EdgeFunctionErrorResponse {
  success: false;
  error: string;
  errorCode?: string; // オプションのエラーコード
}

/**
 * ユーザー登録APIの成功時のレスポンス形式。
 */
export interface RegisterUserSuccessResponse {
  success: true;
  userId: string; // 登録されたユーザーのID
}

/**
 * ユーザー登録APIのリクエストボディの型。
 */
export interface RegisterUserPayload {
  email: string;
  password: string;
  nickname: string;
  accountId?: string; // アカウントIDは任意
}

/**
 * ログイン識別子 (メールアドレスまたはアカウントID) 取得APIの成功時のレスポンス形式。
 */
export interface LoginIdentifierSuccessResponse {
  success: true;
  email: string; // 識別子に対応するメールアドレス
}

/**
 * ログイン識別子取得APIのリクエストボディの型。
 */
export interface LoginIdentifierPayload {
  identifier: string; // メールアドレスまたはアカウントID (@あり/なし)
}

/**
 * プロフィールテーブルの行データに対応する型。
 * `database.ts` の `Tables<"profiles">` を参照。
 */
export interface ProfileData {
  id: string; // ユーザーID (主キー)
  account_id: string; // アカウントID (ユニーク)
  nickname: string | null; // ニックネーム
  avatar_data: string | null; // アバター画像のパスまたはデータ (実装による)
  bio: string | null; // 自己紹介文
}

/**
 * プロフィール更新APIのリクエストボディの型。
 * 更新可能なフィールドのみ定義します。
 */
export interface ProfileUpdatePayload {
  nickname?: string; // ニックネームは更新可能
  bio?: string; // 自己紹介文は更新可能
  // account_id は更新不可
  // avatar_data は別途アップロード処理などを想定
} 