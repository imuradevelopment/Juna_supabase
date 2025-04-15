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