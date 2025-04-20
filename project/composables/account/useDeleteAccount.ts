import { ref } from 'vue';
import { useSupabaseAuth } from '../useSupabaseAuth';
import type { Result } from '~/types';
import { useRouter } from 'vue-router';

// ★ エラーオブジェクトの型を定義
interface DeletionError extends Error {
  code?: string;
}

/**
 * アカウント削除処理を提供する Composable。
 */
export const useDeleteAccount = () => {
  const { getClient, getUser } = useSupabaseAuth();
  const client = getClient();
  const user = getUser();
  const router = useRouter();
  const isLoading = ref(false);
  const error = ref<DeletionError | null>(null);

  /**
   * アカウント削除を実行します。
   * @returns {Promise<Result<true, DeletionError>>}
   */
  const deleteAccount = async (): Promise<Result<true, DeletionError>> => {
    isLoading.value = true;
    error.value = null;

    if (!user.value) {
      const err = new Error('ユーザーがログインしていません。') as DeletionError;
      err.code = 'not_logged_in';
      error.value = err;
      isLoading.value = false;
      console.error('[useDeleteAccount] Error: User not found before deleting account.')
      return { success: false, error: err };
    }

    const currentUserId = user.value.id;

    try {
      console.log(`[useDeleteAccount] Invoking delete-user function for user ID: ${currentUserId}`)

      const { data, error: functionError } = await client.functions.invoke<void>('delete-user', {
        body: { userId: user.value.id },
      })

      console.log('[useDeleteAccount] delete-user function response data:', data)
      console.log('[useDeleteAccount] delete-user function response error:', functionError)

      if (functionError) {
        console.error('アカウント削除 Function 呼び出しエラー詳細:', JSON.stringify(functionError, null, 2));

        let errorMessage = 'アカウントの削除に失敗しました。';
        let errorCode = 'function_invoke_failed';

        if (typeof functionError === 'object' && functionError !== null) {
          if ('name' in functionError && functionError.name === 'FunctionsHttpError' && 'message' in functionError) {
            errorMessage = `Edge Function エラー: ${functionError.message}`;
            if ('context' in functionError && typeof functionError.context === 'object' && functionError.context !== null) {
              const context = functionError.context as any;
              if ('code' in context && typeof context.code === 'string') {
                errorCode = context.code;
              } else if ('status' in context && typeof context.status === 'number'){
                errorCode = `http_${context.status}`;
              }
            }
          } else if ('message' in functionError && typeof functionError.message === 'string') {
            errorMessage = functionError.message;
          }
        }

        const err = new Error(errorMessage) as DeletionError;
        err.code = errorCode;
        error.value = err;
        isLoading.value = false;
        return { success: false, error: err };
      }

      console.log('[useDeleteAccount] Invocation successful. Signing out...')

      const { error: signOutError } = await client.auth.signOut()
      if (signOutError) {
        console.warn('アカウント削除後のログアウト失敗:', signOutError.stack || signOutError);
      }

      console.log('[useDeleteAccount] Sign out successful. Redirecting to homepage...')

      await router.push('/')

      console.log('[useDeleteAccount] Account deletion process completed successfully.')
      return { success: true, data: true };

    } catch (e) {
      const caughtError = e instanceof Error ? e : new Error(String(e));
      console.error('アカウント削除処理中に予期せぬエラー:', caughtError.stack || caughtError);
      const err = caughtError as DeletionError;
      err.code = 'unexpected_error';
      error.value = err;
      return { success: false, error: err };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    deleteAccount,
  };
}; 