import { useState } from '#imports'
import type { Ref } from 'vue'
// types/index.ts から SafeSupabaseUser をインポート
import type { SafeSupabaseUser } from '~/types'

// ローカルの SafeSupabaseUser 定義を削除
// interface SafeSupabaseUser {
//   id: string;
//   email?: string;
//   user_metadata: Record<string, any>;
//   app_metadata: Record<string, any>;
// }

/**
 * プラグインによって管理されるリアクティブな Supabase ユーザー情報 (SafeSupabaseUser 形式) を取得します。
 * この Composable は useState フックをラップするだけになります。
 * 実際のユーザー情報の取得と更新はプラグイン側で行われます。
 * 
 * @returns {Ref<SafeSupabaseUser | null>} リアクティブなユーザー情報、または null。
 */
export const useSupabaseUser = (): Ref<SafeSupabaseUser | null> => {
  // プラグインが設定する useState('supabase_user') を取得して返す
  const user = useState<SafeSupabaseUser | null>('supabase_user', () => null) // 初期値 null を設定
  return user
} 