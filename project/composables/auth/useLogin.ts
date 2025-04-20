import { ref } from 'vue';
import type { Database } from '~/types/database';
import { AuthError, type SupabaseClient } from '@supabase/supabase-js';
// FunctionsHttpError は useAccountUtils に移動
// import { FunctionsHttpError } from '@supabase/functions-js';
// Result 型と EdgeFunctionErrorResponse を index.ts からインポート
import type { Result, EdgeFunctionErrorResponse } from '~/types/index';
// 新しいコンポーザブルをインポート
import { useAccountUtils } from './useAccountUtils';
// 変更: 新しい Client Composable をインポート
import { useSupabaseClient } from '~/composables/useSupabaseClient';

// --- データ型の定義 --- // この Composable で使用するデータ構造を定義します。

// ログインフォームから受け取る認証情報の型定義です。
interface LoginCredentials {
  identifier: string; // メールアドレスまたはアカウントIDです。
  password: string; // パスワードです。
}

// ログイン成功時に返されるデータの型定義です。
interface LoginSuccessData {
  userId: string; // ログインしたユーザーのIDです。
  email?: string; // ログインしたユーザーのメールアドレス（取得できない場合もあるためオプショナル）です。
}

// ログイン処理で発生しうるエラーの種類と構造を定義する型です。
type LoginError = { // バリデーションエラー (入力形式誤り、アカウントID未発見など) の型です。
  type: 'validation'; // エラー種別: バリデーション
  errors: { [key: string]: string }; // フィールド名とそのエラーメッセージのマップです。
} | { 
  type: 'authentication'; // 認証エラー (パスワード間違い、メール未確認など) の型です。
  error: Error; // JavaScript の Error オブジェクトです。
} | { 
  type: 'network'; // ネットワークエラー (Supabaseクライアント利用不可、Edge Function 呼び出し失敗など) の型です。
  error: Error; // JavaScript の Error オブジェクトです。
} | { 
  type: 'unknown'; // 上記以外の予期せぬエラーの型です。
  error: Error; // JavaScript の Error オブジェクトです。
};

// 入力された識別子がメールアドレスか、アカウントIDか、または無効な形式かを区別するための型です。
type IdentifierType = 'email' | 'accountId' | 'invalid';

/**
 * ユーザーログイン機能を提供する Vue Composable 関数です。
 * メールアドレスまたはアカウントIDとパスワードを受け取り、Supabase Auth を利用してログイン処理を実行します。
 * アカウントIDが入力された場合は、内部で `useAccountUtils` を使用して対応するメールアドレスを取得します。
 * 処理結果は Result 型 (`{ success: true, data: ... }` または `{ success: false, error: ... }`) で返されます。
 */
export const useLogin = () => {
  // --- Composable と状態変数の初期化 --- // 必要な Composable のインスタンス化と、ローディング状態を管理する ref を設定します。
  const supabase: SupabaseClient<Database> | null = useSupabaseClient(); // useSupabaseClient Composable を呼び出して Supabase クライアントインスタンスを取得します。
  const loading = ref(false); // ログイン処理中かどうかを示すリアクティブなブール値です（初期値は false）。
  const { getEmailFromAccountId } = useAccountUtils(); // useAccountUtils Composable を呼び出して、アカウントIDからメールアドレスを取得する関数を取得します。

  /**
   * 入力された文字列が Email 形式か、Account ID 形式か、あるいは無効な形式かを判定する内部ヘルパー関数です。
   * @param identifier 検証対象の文字列（メールアドレスまたはアカウントID）。
   * @returns 'email', 'accountId', または 'invalid' のいずれかの文字列。
   */
  const getIdentifierType = (identifier: string): IdentifierType => {
    // 識別子が空または null の場合は無効とします。
    if (!identifier) return 'invalid';
    // メールアドレスの形式に一致するか正規表現でチェックします。
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      return 'email';
    }
    // アカウントIDの形式チェックを少し緩める (英数字とアンダースコアが含まれる)
    // より厳密なチェックが必要な場合は、register-user-function.ts のロジックと合わせる
    if (/^[a-zA-Z0-9_]+$/.test(identifier)) {
        return 'accountId';
    }
    // 上記のいずれにも一致しない場合は無効とします。
    return 'invalid';
  };

  /**
   * ユーザーをログインさせるメインの非同期関数です。
   * @param credentials ユーザーが入力した識別子（メール or アカウントID）とパスワードを含むオブジェクト。
   * @returns ログイン処理の結果を示す `Result<LoginSuccessData, LoginError>` 型のオブジェクト。
   */
  const loginUser = async (credentials: LoginCredentials): Promise<Result<LoginSuccessData, LoginError>> => {
    // ローディング状態を開始に設定します。
    loading.value = true;
    // バリデーションエラーを格納するオブジェクトを初期化します。
    const validationErrors: { [key: string]: string } = {};

    // Supabase クライアントが利用可能かチェックします。
    if (!supabase) {
      // クライアントが利用できない場合のエラーを作成します。
      const error = new Error('Supabase client is not available');
      // ★ ログ: Supabase クライアント初期化失敗時のエラー詳細をコンソールに出力します。
      console.error('Supabase クライアントが利用できません:', error.stack || error); // ★理由: クライアントサイドでの Supabase 接続確立失敗の原因調査のため。
      // ローディング状態を解除します。
      loading.value = false;
      // ネットワークエラーとして処理結果を返します。
      return { success: false, error: { type: 'network', error: new Error('現在サーバーに接続できません。後ほど再試行してください。') } };
    }

    // --- クライアントサイドでの入力値バリデーション --- // サーバーにリクエストを送る前に入力値を検証します。
    // 入力された識別子の種類を判定します。
    const identifierType = getIdentifierType(credentials.identifier);
    // 識別子が空でなく、かつ無効な形式の場合にエラーメッセージを設定します。
    if (identifierType === 'invalid' && credentials.identifier) {
      validationErrors.identifier = 'メールアドレスまたは有効なアカウントIDを入力してください。';
    // 識別子が空の場合にエラーメッセージを設定します。
    } else if (!credentials.identifier) {
        validationErrors.identifier = 'メールアドレスまたはアカウントIDは必須です。';
    }
    // パスワードが空の場合にエラーメッセージを設定します。
    if (!credentials.password) {
      validationErrors.password = 'パスワードは必須です。';
    }
    // バリデーションエラーが1つ以上存在する場合
    if (Object.keys(validationErrors).length > 0) {
      // ローディング状態を解除します。
      loading.value = false;
      // バリデーションエラーとして処理結果を返します。
      return { success: false, error: { type: 'validation', errors: validationErrors } };
    }

    // --- ログイン処理の実行 --- // バリデーション通過後、実際のログイン処理を開始します。
    try {
      // 最終的に Supabase Auth に渡すメールアドレスを格納する変数を初期化します。
      let emailToLogin: string | null = null;

      // 識別子がアカウントIDの場合
      if (identifierType === 'accountId') {
        // useAccountUtils を使ってアカウントIDからメールアドレスを取得します。
        const emailResult = await getEmailFromAccountId(credentials.identifier);
        // メールアドレスの取得に失敗した場合
        if (!emailResult.success) {
            // getEmailFromAccountId が設定したエラーメッセージをバリデーションエラーとして設定します。
            validationErrors.identifier = emailResult.error.message;
            // ローディング状態を解除します。
            loading.value = false;
            // バリデーションエラーとして処理結果を返します。
            return { success: false, error: { type: 'validation', errors: validationErrors } };
        }
        // 取得したメールアドレスをログインに使用するメールアドレスとして設定します。
        emailToLogin = emailResult.data;
      } else { // 識別子がメールアドレスの場合
        // 入力された識別子をそのままログインに使用するメールアドレスとして設定します。
        emailToLogin = credentials.identifier;
      }

      // メールアドレスが最終的に確定できなかった場合（通常は発生しないはずですが念のため）。
      if (!emailToLogin) {
        // 予期せぬエラーとして処理します。
        throw new Error('ログインに使用するメールアドレスを取得できませんでした。');
      }

      // Supabase Auth の signInWithPassword メソッドを呼び出して認証を実行します。
      // 注意: 現在の supabase-js の型定義では signInWithPassword の戻り値の型推論が不完全な場合があるため、
      //       一時的に any 型アサーションを使用しています。将来的に型定義が改善されれば削除可能です。
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToLogin, // 確定したメールアドレスを渡します。
        password: credentials.password, // 入力されたパスワードを渡します。
      });

      // signInWithPassword でエラーが発生した場合
      if (signInError) {
        // 返すべきエラーオブジェクトを初期化します。
        let loginError: LoginError;
        // エラーが Supabase の AuthError インスタンスの場合
        if (signInError instanceof AuthError) {
            // デフォルトのエラーメッセージを設定します。
            let errorMessage = '認証に失敗しました。';
            // エラーメッセージの内容に応じて、より具体的なユーザー向けメッセージに置き換えます。
            if (signInError.message.includes('Invalid login credentials')) {
                errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
            } else if (signInError.message.includes('Email not confirmed')) {
                 errorMessage = 'メールアドレスの確認が完了していません。';
            }
            // 認証エラーとしてエラーオブジェクトを作成します。
            loginError = { type: 'authentication', error: new Error(errorMessage) };
        } else { // AuthError インスタンス以外の場合（通常は考えにくい）
             // 不明なエラーとしてエラーオブジェクトを作成します。
             loginError = { type: 'unknown', error: new Error('ログイン中に不明なエラーが発生しました。') };
        }
        // ★ ログ: Supabase Auth から返された認証エラーの詳細をコンソールに出力します。
        console.error('ログインに失敗しました:', signInError.stack || signInError); // ★理由: ID/パスワード間違い、メール未確認等の具体的なログイン失敗原因の特定のため。
        // 処理結果として作成したエラーオブジェクトを返します。
        return { success: false, error: loginError };
      }

      // signInWithPassword が成功したにも関わらず、ユーザーデータが含まれていない場合（通常は発生しないはず）。
      if (!signInData || !signInData.user) {
        // エラーオブジェクトを作成します。
        const error = new Error('ログインに成功しましたが、ユーザー情報の取得に失敗しました。');
        // ★ ログ: 予期せぬ成功レスポンスの内容をコンソールに出力します。
        console.error('signInWithPassword はユーザーデータを返しませんでした:', error.stack || error, '受信データ:', signInData); // ★理由: Supabase Auth の API 仕様からの逸脱や、予期せぬ内部状態の調査のため。
        // 不明なエラーとして処理結果を返します。
        return { success: false, error: { type: 'unknown', error } };
      }

      // --- ログイン成功処理 --- // 認証が成功し、ユーザーデータも取得できた場合
      // 成功時のレスポンスデータを作成します。
      const successData: LoginSuccessData = {
          userId: signInData.user.id, // 取得したユーザーIDを設定します。
          email: signInData.user.email, // 取得したメールアドレスを設定します。
      };
      // 成功を示す処理結果を返します。
      return { success: true, data: successData };

    // try ブロック内で JavaScript の実行時エラーが発生した場合
    } catch (err) {
      // エラーオブジェクトを正規化します (Error インスタンスでない場合も考慮)。
      const error = err instanceof Error ? err : new Error(String(err));
      // ★ ログ: ログイン処理中の予期せぬ JavaScript エラーの詳細をコンソールに出力します。
      console.error('ログイン処理中に予期せぬエラーが発生しました:', error.stack || error); // ★理由: コードのバグや想定外の例外発生の原因特定のため。
      // 不明なエラーとして、ユーザー向けの汎用メッセージと共に処理結果を返します。
      return { success: false, error: { type: 'unknown', error: new Error('ログイン処理中に予期せぬエラーが発生しました。') } };
    // try...catch ブロックが完了した後、必ず実行される処理です。
    } finally {
      // ローディング状態を解除します。
      loading.value = false;
    }
  };

  // --- Composable の公開 --- // この Composable が提供する関数と状態を返します。
  return {
    loginUser, // 外部からログイン処理を呼び出すための関数です。
    loading, // ログイン処理中かどうかを示すリアクティブな状態です。
    // error や validationErrors は loginUser の戻り値 (Result型) で詳細に返されるため、
    // Composable のトップレベルでは公開しません。
  };
}; 