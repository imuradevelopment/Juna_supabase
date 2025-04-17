import { ref } from 'vue';
import type { Database } from '~/types/database';
import { AuthError } from '@supabase/supabase-js';
// FunctionsHttpError は useAccountUtils に移動
// import { FunctionsHttpError } from '@supabase/functions-js';
// Result 型と EdgeFunctionErrorResponse を index.ts からインポート
import type { Result, EdgeFunctionErrorResponse } from '~/types/index';
// 新しいコンポーザブルをインポート
import { useAccountUtils } from './useAccountUtils';

// ログインに必要なデータ型
interface LoginCredentials {
  identifier: string; // Email or Account ID
  password: string;
}

// 成功時のデータ型
interface LoginSuccessData {
  userId: string;
  email?: string; // メールアドレスは取得できない場合もあるため optional
}

// ログイン関数のエラー型
type LoginError = { 
  type: 'validation'; 
  errors: { [key: string]: string }; 
} | { 
  type: 'authentication'; 
  error: Error; 
} | { 
  type: 'network'; 
  error: Error; 
} | { 
  type: 'unknown'; 
  error: Error; 
};

// 識別子のタイプ
type IdentifierType = 'email' | 'accountId' | 'invalid';

/**
 * ユーザーログイン機能を提供する Composable
 * メールアドレスまたはアカウントIDとパスワードを受け取り、Supabase Auth を利用してログイン処理を行います。
 * アカウントIDが入力された場合は、`useAccountUtils` を使用してメールアドレスを取得します。
 */
export const useLogin = () => {
  const { $supabaseClient } = useNuxtApp();
  const loading = ref(false);
  // useAccountUtils を呼び出す
  const { getEmailFromAccountId } = useAccountUtils(); 

  /**
   * 識別子が Email か Account ID か、あるいは無効な形式かを判定する
   */
  const getIdentifierType = (identifier: string): IdentifierType => {
    if (!identifier) return 'invalid';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      return 'email';
    }
    // 簡単なアカウントID形式チェック (ここでは例として英数字とアンダースコアのみ許可)
    if (/^[a-zA-Z0-9_]+$/.test(identifier)) {
        return 'accountId';
    }
    return 'invalid';
  };

  /**
   * ユーザーログイン処理本体
   */
  const loginUser = async (credentials: LoginCredentials): Promise<Result<LoginSuccessData, LoginError>> => {
    loading.value = true;
    const validationErrors: { [key: string]: string } = {};

    if (!$supabaseClient) {
      const error = new Error('Supabase client is not available');
      // console.error(error); // ユーザーには表示しないが、内部エラーとしてログは残す
      console.error('Supabase クライアントが利用できません:', error.stack || error);
      loading.value = false;
      // ユーザー向けのエラーメッセージに変更
      return { success: false, error: { type: 'network', error: new Error('現在サーバーに接続できません。後ほど再試行してください。') } };
    }

    // --- クライアントサイドバリデーション --- 
    const identifierType = getIdentifierType(credentials.identifier);
    if (identifierType === 'invalid' && credentials.identifier) { // 空でなく、かつ無効な形式の場合
      validationErrors.identifier = 'メールアドレスまたは有効なアカウントIDを入力してください。';
    } else if (!credentials.identifier) {
        validationErrors.identifier = 'メールアドレスまたはアカウントIDは必須です。';
    }
    if (!credentials.password) {
      validationErrors.password = 'パスワードは必須です。';
    }
    if (Object.keys(validationErrors).length > 0) {
      loading.value = false;
      return { success: false, error: { type: 'validation', errors: validationErrors } };
    }

    // --- ログイン処理 --- 
    try {
      let emailToLogin: string | null = null;

      // 識別子がアカウントIDの場合、メールアドレスを取得 (useAccountUtils を使用)
      if (identifierType === 'accountId') {
        const emailResult = await getEmailFromAccountId(credentials.identifier);
        if (!emailResult.success) {
            // getEmailFromAccountId 内でエラーメッセージは適切に設定されているはず
            validationErrors.identifier = emailResult.error.message; 
            loading.value = false;
            return { success: false, error: { type: 'validation', errors: validationErrors } };
        }
        emailToLogin = emailResult.data;
      } else {
        emailToLogin = credentials.identifier; // Email 形式の場合
      }

      // メールアドレスとパスワードで Supabase Auth にサインイン
      if (!emailToLogin) {
        throw new Error('ログインに使用するメールアドレスを取得できませんでした。');
      }
      console.log(`[useLogin] Attempting signInWithPassword for email: ${emailToLogin.substring(0, 3)}...`); // ログ追加
      const { data: signInData, error: signInError } = await $supabaseClient.auth.signInWithPassword({
        email: emailToLogin,
        password: credentials.password,
      });
      console.log(`[useLogin] signInWithPassword completed. Error: ${signInError ? signInError.message : 'null'}`); // ログ追加

      if (signInError) {
        // console.error('Supabase signInWithPassword error:', signInError); // 形式変更
        let loginError: LoginError;
        if (signInError instanceof AuthError) {
            let errorMessage = '認証に失敗しました。';
            // ユーザーフレンドリーなメッセージに統一
            if (signInError.message.includes('Invalid login credentials')) {
                errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
            } else if (signInError.message.includes('Email not confirmed')) {
                 errorMessage = 'メールアドレスの確認が完了していません。';
            }
            loginError = { type: 'authentication', error: new Error(errorMessage) };
        } else {
             loginError = { type: 'unknown', error: new Error('ログイン中に不明なエラーが発生しました。') };
        }
        // console.error('Login failed with general error:', loginError.error, signInError); // 形式変更
        console.error('ログインに失敗しました:', signInError.stack || signInError);
        return { success: false, error: loginError };
      }

      if (!signInData || !signInData.user) {
        const error = new Error('ログインに成功しましたが、ユーザー情報の取得に失敗しました。');
        // console.error('signInWithPassword returned no user data:', signInData); // 形式変更
        console.error('signInWithPassword はユーザーデータを返しませんでした:', error.stack || error, '受信データ:', signInData);
        return { success: false, error: { type: 'unknown', error } };
      }

      // 成功時のデータ型を明示的に指定
      const successData: LoginSuccessData = {
          userId: signInData.user.id,
          email: signInData.user.email,
      };
      return { success: true, data: successData };

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      // console.error('Login process failed unexpectedly:', error); // 形式変更
      console.error('ログイン処理中に予期せぬエラーが発生しました:', error.stack || error);
      return { success: false, error: { type: 'unknown', error: new Error('ログイン処理中に予期せぬエラーが発生しました。') } }; // ユーザー向けメッセージに変更
    } finally {
      loading.value = false;
    }
  };

  return {
    loginUser,
    loading,
    // error と validationErrors は返さない
  };
}; 