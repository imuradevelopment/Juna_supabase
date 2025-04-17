import { ref, watch } from 'vue';
import type { Database, Tables, TablesInsert, TablesUpdate } from '~/types/database';
import type { ProfileData, ProfileUpdatePayload } from '~/types';

// グローバルなプロフィール状態 (useState を使ってコンポーザブル間で共有)
// Nuxt 3 の useState はサーバーサイドとクライアントサイドで状態を共有するのに役立つ
// const profileGlobal = useState<ProfileData | null>('profile', () => null);
// const loadingGlobal = useState<boolean>('profile-loading', () => false);
// const errorGlobal = useState<Error | null>('profile-error', () => null);

// プロフィールデータの取得・更新・状態管理を行う Composable。
// グローバルな状態 (useState) を利用して、異なるコンポーネント間でプロフィール情報、
// ローディング状態、エラー状態を共有・同期する。
export function useProfile() {
  // Nuxt 3 の useState を使用して、コンポーザブル間で共有される状態を定義
  const profileGlobal = useState<ProfileData | null>('profile', () => null);
  const loadingGlobal = useState<boolean>('profile-loading', () => false);
  const errorGlobal = useState<Error | null>('profile-error', () => null);

  // Supabase クライアントとユーザー情報を取得
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  // ログインユーザーのIDをリアクティブな参照として保持
  const userId = ref<string | null>(user.value?.id ?? null);

  // ログイン状態 (Supabaseユーザー) の変化を監視
  watch(user, (newUser) => {
    const newId = newUser?.id ?? null;
    // ユーザーIDが実際に変更された場合のみ状態を更新
    if (userId.value !== newId) {
      userId.value = newId;
      // ユーザーが切り替わったため、関連するグローバル状態をリセット
      profileGlobal.value = null;
      errorGlobal.value = null;
      loadingGlobal.value = false;
      // 必要に応じて、新しいユーザーIDで自動的にプロフィールを取得する処理をここに追加可能
      // 例: if (newId) { fetchProfile(); }
    }
  }, { immediate: true }); // コンポーザブル初期化時にもユーザーIDを設定

  // Supabase から現在のユーザーのプロフィール情報を非同期に取得する。
  // 取得処理中は loadingGlobal を true に設定し、結果またはエラーに応じて
  // profileGlobal または errorGlobal を更新する。
  const fetchProfile = async (): Promise<void> => {
    // ユーザーIDがなければ処理中断
    if (!userId.value) {
      errorGlobal.value = new Error('ログインしていません。');
      profileGlobal.value = null;
      return;
    }

    // 状態の初期化
    loadingGlobal.value = true;
    errorGlobal.value = null;
    profileGlobal.value = null;

    try {
      // Supabase profiles テーブルからユーザーIDに一致するレコードを取得
      const { data, error, status } = await supabase
        .from('profiles')
        .select('*') // 全カラムを取得
        .eq('id', userId.value) // 主キーで検索
        .single(); // 結果は単一レコードのはず

      // 406エラー (Not Acceptable) は .single() でデータが見つからなかった場合なので除外
      if (error && status !== 406) {
        throw error; // その他のDBエラーはスロー
      }

      // データが存在すれば、グローバル状態に整形して格納
      if (data) {
        profileGlobal.value = {
          id: data.id,
          nickname: data.nickname,
          account_id: data.account_id,
          bio: data.bio,
          avatar_data: data.avatar_data,
        };
      } else {
        // データが存在しない場合はnull (プロフィール未作成など)
        profileGlobal.value = null;
      }
    } catch (err: any) {
      // エラーハンドリング：エラーメッセージをグローバル状態に格納
      console.error('[useProfile][fetchProfile] プロフィール取得エラー:', err.stack || err);
      errorGlobal.value = new Error(`プロフィールの取得に失敗しました。詳細はコンソールを確認してください。`);
      profileGlobal.value = null; // エラー時はプロファイルもnullに
    } finally {
      // 処理完了後、ローディング状態を解除
      loadingGlobal.value = false;
    }
  };

  // ユーザープロフィール情報を更新する。
  // サーバーサイドAPIを使用してプロフィールを更新し、RLSポリシーの問題を回避する。
  // @param updates 更新するデータ (ニックネーム、自己紹介)
  // @returns 更新処理が成功した場合は true、失敗した場合は false
  const updateProfile = async (updates: ProfileUpdatePayload): Promise<boolean> => {
    // 1. 事前チェック
    const currentUser = useSupabaseUser();
    const currentAuthUserId = currentUser.value?.id;

    // 認証されていない場合はエラーを記録して中断
    if (!currentAuthUserId) {
      console.error('[useProfile][updateProfile] エラー: 更新実行前にユーザーが未認証状態です。');
      errorGlobal.value = new Error('更新実行前に認証が確認できませんでした。');
      return false;
    }

    // 2. 状態初期化
    loadingGlobal.value = true;
    errorGlobal.value = null;

    try {
      // 3. サーバーサイドAPI (/api/profile/update) を呼び出し
      const response = await $fetch('/api/profile/update', {
        method: 'POST',
        body: {
          userId: currentAuthUserId,
          updates: {
            nickname: updates.nickname,
            bio: updates.bio
          }
        }
      });

      // 4. レスポンス処理
      // 型の安全性のため、応答がエラーかどうかを適切に判定
      if (!response.success) {
        // エラーレスポンスの場合、エラーを記録して中断
        console.error('[useProfile][updateProfile] API応答エラー:', 'error' in response ? response.error : '不明なエラー');
        errorGlobal.value = new Error(`プロフィール更新に失敗しました: ${'error' in response ? response.error : '不明なエラー'}`);
        loadingGlobal.value = false;
        return false;
      }

      // 5. 成功時の処理 - ローカル状態を更新
      // データプロパティの型を安全に確認
      if ('data' in response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const updatedProfile = response.data[0];

        // 既存のローカル状態が存在すれば、新しいデータで更新
        if (profileGlobal.value) {
          profileGlobal.value.nickname = updatedProfile.nickname;
          profileGlobal.value.bio = updatedProfile.bio;
        } else {
          // ローカル状態が存在しない場合は、取得したデータで新規作成
          profileGlobal.value = {
            id: updatedProfile.id,
            nickname: updatedProfile.nickname,
            account_id: updatedProfile.account_id,
            bio: updatedProfile.bio,
            avatar_data: updatedProfile.avatar_data,
          };
        }
      } else {
        // APIは成功したがデータが返ってこなかった場合は、最新情報を再取得
        await fetchProfile();
      }

      // 6. 成功状態を返し、ローディングを解除
      loadingGlobal.value = false;
      return true;

    } catch (err) {
      // 予期せぬ例外が発生した場合のエラーハンドリング
      console.error('[useProfile][updateProfile] エラー: 更新処理中に例外が発生しました:', err instanceof Error ? err.stack || err : err);
      errorGlobal.value = new Error(`プロフィール更新中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
      loadingGlobal.value = false;
      return false;
    }
  };

  // Composable が提供する関数と状態を返す
  return {
    profile: profileGlobal, // 共有プロフィールデータ
    loading: loadingGlobal, // 共有ローディング状態
    error: errorGlobal,     // 共有エラー状態
    userId,                 // 現在のユーザーID
    fetchProfile,           // プロフィール取得関数
    updateProfile,          // プロフィール更新関数
  };
}

// グローバルなプロフィール状態の型定義 (必要に応じて)
// declare module '#app' {
//   interface NuxtApp {
//     $profile: Ref<ProfileData | null>;
//     $profileLoading: Ref<boolean>;
//     $profileError: Ref<Error | null>;
//   }
// } 