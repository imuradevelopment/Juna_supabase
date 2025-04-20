import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '~/types/database';
import type { ProfileData, ProfileUpdatePayload, CustomError } from '~/types';

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
  const errorGlobal = useState<CustomError | null>('profile-error', () => null);

  // Supabase クライアントの型定義を修正し、null を許容
  // useSupabaseClient からジェネリック型引数を削除
  const supabase: SupabaseClient<Database> | null = useSupabaseClient();
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
    if (!userId.value) {
      errorGlobal.value = { name: 'AuthError', message: 'ログインしていません。', errorCode: 'user_not_logged_in' };
      profileGlobal.value = null;
      return;
    }

    loadingGlobal.value = true;
    errorGlobal.value = null;
    profileGlobal.value = null;

    try {
      // Supabase クライアントのチェック (型ガードとして機能)
      if (!supabase) {
        throw { name: 'InitializationError', message: 'Supabase client is not available.', errorCode: 'supabase_client_unavailable' };
      }
      // `as any` を削除し、型付きクライアントを使用
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, nickname, account_id, bio, avatar_data')
        .eq('id', userId.value)
        .single();

      if (error && status !== 406) {
        // Supabaseのエラー型を考慮
        throw { name: error.code || 'SupabaseFetchError', message: error.message, details: error.details, hint: error.hint, errorCode: 'profile_fetch_db_error', cause: error };
      }

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
    // unknown を使用し、型ガードを行う
    } catch (err: unknown) {
      let customError: CustomError;
      if (err && typeof err === 'object') {
        const name = 'name' in err && typeof err.name === 'string' ? err.name : 'FetchError';
        const message = 'message' in err && typeof err.message === 'string' ? err.message : 'プロフィールの取得中に不明なエラーが発生しました。';
        const errorCode = 'errorCode' in err && typeof err.errorCode === 'string' ? err.errorCode : 'profile_fetch_failed';
        customError = { name, message, errorCode, cause: err };
      } else {
        customError = { name: 'UnknownError', message: 'プロフィールの取得中に予期せぬエラーが発生しました。', errorCode: 'profile_fetch_unknown', cause: err };
      }

      console.error('[useProfile][fetchProfile] プロフィール取得エラー:', customError.cause || err, customError.message);
      errorGlobal.value = customError;
      profileGlobal.value = null; // エラー時はプロファイルもnullに
    } finally {
      loadingGlobal.value = false;
    }
  };

  // ユーザープロフィール情報を更新する。
  // サーバーサイドAPIを使用してプロフィールを更新し、RLSポリシーの問題を回避する。
  // @param updates 更新するデータ (ニックネーム、自己紹介)
  // @returns 更新処理が成功した場合は true、失敗した場合は false
  const updateProfile = async (updates: ProfileUpdatePayload): Promise<boolean> => {
    const currentUser = useSupabaseUser();
    const currentAuthUserId = currentUser.value?.id;

    if (!currentAuthUserId) {
      const errorMessage = '更新実行前に認証が確認できませんでした。';
      console.error('[useProfile][updateProfile] エラー:', errorMessage);
      errorGlobal.value = { name: 'AuthError', message: errorMessage, errorCode: 'update_auth_failed' };
      return false;
    }

    loadingGlobal.value = true;
    errorGlobal.value = null;

    try {
      // $fetch の期待されるレスポンス型を定義
      type UpdateApiResponse = {
        success: boolean;
        data?: Tables<'profiles'>;
        error?: string;
        errorCode?: string;
      };

      // サーバーサイドAPI (/api/profile/update) を呼び出し
      const response = await $fetch<UpdateApiResponse>('/api/profile/update', {
        method: 'POST',
        body: {
          userId: currentAuthUserId,
          updates: {
            nickname: updates.nickname,
            bio: updates.bio
          }
        },
      });

      if (response && response.success && response.data) {
        const updatedProfileData = response.data;

        if (profileGlobal.value) {
          profileGlobal.value.nickname = updatedProfileData.nickname;
          profileGlobal.value.bio = updatedProfileData.bio;
          // updated_at も更新したい場合は追加
        } else {
          profileGlobal.value = {
            id: updatedProfileData.id,
            nickname: updatedProfileData.nickname,
            account_id: updatedProfileData.account_id, // account_id も response.data から取得
            bio: updatedProfileData.bio,
            avatar_data: updatedProfileData.avatar_data, // avatar_data も response.data から取得
          };
        }
        loadingGlobal.value = false;
        return true;
      } else {
        const apiErrorMessage = response?.error || '不明なAPIエラー';
        const errorCode = response?.errorCode || 'update_api_error';
        const errorMessage = `プロフィール更新に失敗しました: ${apiErrorMessage}`;
        console.error('[useProfile][updateProfile] API応答エラー:', errorMessage, response);
        errorGlobal.value = { name: 'ApiError', message: errorMessage, errorCode: errorCode };
        loadingGlobal.value = false;
        return false;
      }

    // unknown を使用し、型ガードを行う
    } catch (err: unknown) {
      let detailedError = 'プロフィール更新中にエラーが発生しました。'
      let serverDetails: Record<string, unknown> | null = null; // serverDetails の型を Record<string, unknown> に
      let errorCode: string = 'update_fetch_exception'; // デフォルトエラーコードを let に変更

      // FetchError かどうかを判定 (Nuxt/Nitro の $fetch が返すエラー)
      if (err && typeof err === 'object' && 'name' in err && err.name === 'FetchError' && 'data' in err && err.data && typeof err.data === 'object') {
          serverDetails = err.data as Record<string, unknown>; // 型アサーション
          console.error('[useProfile][updateProfile] $fetch caught error data:', JSON.stringify(serverDetails));
          if ('error' in serverDetails && typeof serverDetails.error === 'string') {
            detailedError += `: ${serverDetails.error}`;
            if ('errorCode' in serverDetails && typeof serverDetails.errorCode === 'string') {
              detailedError += ` [Code: ${serverDetails.errorCode}]`;
              errorCode = serverDetails.errorCode;
            }
          } else if ('message' in serverDetails && typeof serverDetails.message === 'string') {
             // data に message が含まれる場合 (FetchError のデフォルトなど)
            detailedError += `: ${serverDetails.message}`;
          }
      } else if (err instanceof Error) {
          detailedError += `: ${err.message}`;
      }

      const errorName = err instanceof Error ? err.name : 'FetchException';

      console.error('[useProfile][updateProfile] エラー: 更新処理中に $fetch 例外が発生しました:', err instanceof Error ? err.stack || err : err, detailedError, serverDetails ? 'ServerDetails:' : '', serverDetails || '');
      errorGlobal.value = {
        name: errorName,
        message: detailedError,
        errorCode: errorCode,
        cause: err
      };
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