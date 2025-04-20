// supabase/functions/register-user/index.ts または register-user-function.ts
// Supabase Edge Function: ユーザー登録処理
// HTTP POST リクエストを受け取り、メールアドレス、パスワード、ニックネーム、(任意)アカウントIDを使用して、
// Supabase Auth にユーザーを作成し、同時に public.profiles テーブルに対応するプロフィールレコードを挿入します。
// アカウントIDがリクエストで指定されない場合は、ニックネームから自動生成します。
// 挿入前にアカウントIDとメールアドレスの重複チェックを行い、重複やエラーがあれば適切なエラーコードと共にエラーレスポンスを返します。
// プロフィール作成に失敗した場合、作成された Auth ユーザーを削除するロールバック処理を試みます。

// Deno 標準ライブラリから HTTP サーバー機能をインポートします。
// @ts-ignore - Deno 環境では型解決が不要なため無視します。
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
// Supabase JavaScript クライアントライブラリと認証エラー型をインポートします。
// @ts-ignore - Deno 環境では型解決が不要なため無視します。
import { createClient, AuthApiError } from 'https://esm.sh/@supabase/supabase-js@2';

// プロジェクト共通の型定義 (types/index.ts と同等) を定義します。
// Deno 環境では外部の TypeScript ファイルを直接 import できないため、ここで再定義します。
interface EdgeFunctionErrorResponse { // Edge Function からのエラー応答の型を定義します。
  success: false; // 処理が失敗したことを示すフラグです。
  error: string;  // エラーメッセージを格納します。
  errorCode?: string; // エラーの種類を示すコード (例: 'email_exists') を格納します（任意）。
}

// CORS (Cross-Origin Resource Sharing) 設定ヘッダーを定義します。
// 全てのオリジンからのリクエストを許可する設定です。
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // すべてのドメインからのリクエストを許可します。
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // 許可するリクエストヘッダーを指定します。
};

// Deno Deploy で HTTP リクエストを処理するメインの非同期関数です。
serve(async (req: Request) => {
  // --- CORS プリフライトリクエストへの対応 --- 
  // HTTPメソッドが OPTIONS の場合 (ブラウザが CORS の許可を確認するために送信するリクエスト)
  if (req.method === 'OPTIONS') {
    // 'ok' というレスポンスボディと共に、CORS ヘッダーを付けて返します。
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- リクエストボディの解析と必須項目チェック --- 
    // リクエストボディを JSON として非同期で解析し、必要な情報 (email, password, nickname, accountId) を抽出します。
    const { email, password, nickname, accountId } = await req.json();

    // 必須項目 (メールアドレス, パスワード, ニックネーム) が存在するかどうかをチェックします。
    if (!email || !password || !nickname) {
      // 必須項目が不足している場合、エラーレスポンスを作成します。
      const errorResponse: EdgeFunctionErrorResponse = {
        success: false, // 失敗フラグを設定します。
        error: '必須項目が不足しています。', // エラーメッセージを設定します。
        errorCode: 'missing_fields' // エラーコードを設定します。
      };
      // HTTP ステータス 400 (Bad Request) で、JSON形式のエラーレスポンスを返します。
      return new Response(
        JSON.stringify(errorResponse), // エラーオブジェクトをJSON文字列に変換します。
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、CORSヘッダー、Content-Typeを設定します。
      );
    }

    // --- Supabase 管理者クライアントの初期化 --- 
    // Service Role Key を使用して、管理者権限を持つ Supabase クライアントを初期化します。
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno環境では環境変数の存在が前提のため、型エラーを無視します。
      Deno.env.get('SUPABASE_URL') ?? '', // 環境変数から Supabase プロジェクト URL を取得します。なければ空文字を使用します。
      // @ts-ignore - Deno環境では環境変数の存在が前提のため、型エラーを無視します。
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // 環境変数から Service Role Key を取得します。なければ空文字を使用します。
      { auth: { persistSession: false } } // サーバーサイド処理のため、セッション情報は永続化しません。
    );

    // --- アカウントID の決定 --- 
    // リクエストで accountId が指定されていればそれを使用し、なければニックネームから生成します。
    const finalAccountId = accountId || generateAccountId(nickname);

    // --- 1. アカウントID の重複チェック --- 
    // public.profiles テーブルで、決定したアカウントID (finalAccountId) が既に存在しないか確認します。
    const { data: existingProfile, error: checkProfileError } = await supabaseAdmin
      .from('profiles') // public スキーマの profiles テーブルを指定します。
      .select('id') // 存在確認が目的なので、id カラムのみを取得します（データ量を削減）。
      .eq('account_id', finalAccountId) // account_id カラムが finalAccountId と一致するレコードを検索します。
      .maybeSingle(); // 結果が 0行 または 1行 であることを期待します (複数行はDB設計上想定外です)。

    // アカウントIDチェック中にデータベースエラーが発生した場合
    if (checkProfileError) {
        // ★ ログ: データベースエラーの詳細をコンソールに出力します (デバッグ用)。
        console.error('アカウントIDチェックデータベースエラー:', checkProfileError.stack || checkProfileError); // ★理由: DB接続やクエリの問題特定のため、エラー詳細をログに出力します。
        // DBエラーを示すエラーレスポンスを作成します。
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false, // 失敗フラグを設定します。
          error: 'アカウントIDの確認中にデータベースエラーが発生しました。', // エラーメッセージを設定します。
          errorCode: 'db_check_error' // エラーコードを設定します。
        };
        // HTTP ステータス 500 (Internal Server Error) でエラーレスポンスを返します。
        return new Response(
          JSON.stringify(errorResponse), // JSON文字列に変換します。
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、ヘッダーを設定します。
        );
    }
    // 取得したデータ (existingProfile) が存在する場合、アカウントIDが既に使われています。
    if (existingProfile) {
      // アカウントID重複のエラーレスポンスを作成します。
      const errorResponse: EdgeFunctionErrorResponse = {
        success: false, // 失敗フラグを設定します。
        error: 'このアカウントIDは既に使用されています。', // エラーメッセージを設定します。
        errorCode: 'account_id_exists' // エラーコードを設定します。
      };
      // HTTP ステータス 400 (Bad Request) でエラーレスポンスを返します (クライアント側の入力が原因)。
      return new Response(
        JSON.stringify(errorResponse), // JSON文字列に変換します。
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、ヘッダーを設定します。
      );
    }

    // --- 2. Supabase Auth へのユーザー登録 --- 
    // 管理者権限 (supabaseAdmin) で Supabase Auth に新しいユーザーを作成します。
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, // リクエストから受け取ったメールアドレスを使用します。
      password, // リクエストから受け取ったパスワードを使用します。
      email_confirm: true, // デフォルトでメール認証を要求する設定にします (後で管理画面等で変更可能です)。
    });

    // Auth ユーザー登録時にエラー (authError) が発生した場合
    if (authError) {
      // エラーがメールアドレス重複によるものか判定します。
      // Supabase のバージョンや内部実装によりエラーメッセージが変わる可能性を考慮し、複数のパターンでチェックします。
      if ((authError instanceof Error && // authError が Error インスタンスであり、かつ
           (authError.message.toLowerCase().includes('already registered') || // メッセージに 'already registered' (小文字) が含まれるか
            authError.message.toLowerCase().includes('already been registered'))) || // または 'already been registered' が含まれるか
           // または、より寛容なチェック: authError がオブジェクトであり、message プロパティが文字列で、重複を示す文字列が含まれるか
           (typeof authError === 'object' && authError !== null && 'message' in authError && typeof authError.message === 'string' &&
            (authError.message.toLowerCase().includes('already registered') ||
             authError.message.toLowerCase().includes('already been registered'))))
         {
         // メールアドレス重複エラーの場合のエラーレスポンスを作成します。
         const errorResponse: EdgeFunctionErrorResponse = {
           success: false, // 失敗フラグを設定します。
           error: 'このメールアドレスは既に使用されています。', // エラーメッセージを設定します。
           errorCode: 'email_exists' // エラーコードを設定します。
         };
         // HTTP ステータス 400 (Bad Request) でエラーレスポンスを返します (クライアント側の入力が原因)。
         return new Response(
           JSON.stringify(errorResponse), // JSON文字列に変換します。
           { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、ヘッダーを設定します。
         );
      }

      // メールアドレス重複以外の Auth 登録エラーの場合
      // ★ ログ: Auth 登録エラーの詳細をコンソールに出力します (デバッグ用)。
      console.error('Supabase auth admin createUser エラー:', authError.stack || authError); // ★理由: AuthのcreateUserでメール重複以外の予期せぬエラー（権限、設定、一時的な障害等）が発生した場合の原因調査のため。
      // Auth 登録失敗を示すエラーレスポンスを作成します。
      const errorResponse: EdgeFunctionErrorResponse = {
        success: false, // 失敗フラグを設定します。
        // エラーメッセージを安全に取得します (authError が Error インスタンスでない可能性も考慮します)。
        error: `ユーザー認証情報の作成に失敗しました: ${(authError instanceof Error ? authError.message : String(authError)) || '不明な認証エラー'}`, // エラーメッセージを設定します。
        errorCode: 'auth_creation_failed' // エラーコードを設定します。
      };
      // HTTP ステータス 500 (Internal Server Error) でエラーレスポンスを返します。
      return new Response(
        JSON.stringify(errorResponse), // JSON文字列に変換します。
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、ヘッダーを設定します。
      );
    }

    // Auth ユーザーデータ (authData) またはその中の user オブジェクトが取得できなかった場合
    // (createUser が成功すれば通常は発生しないはずですが、念のためチェックします)
    if (!authData || !authData.user) {
        // ★ ログ: ユーザーデータ取得失敗をコンソールに出力します (デバッグ用)。
        console.error('作成後のユーザーデータの取得に失敗しました。'); // ★理由: Authユーザー作成は成功したがレスポンスから必須のユーザー情報が欠落しているという予期せぬ状態を記録するため。
        // ユーザーデータ取得失敗を示すエラーレスポンスを作成します。
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false, // 失敗フラグを設定します。
          error: 'ユーザー情報の取得に失敗しました。', // エラーメッセージを設定します。
          errorCode: 'user_data_fetch_failed' // エラーコードを設定します。
        };
        // HTTP ステータス 500 (Internal Server Error) でエラーレスポンスを返します。
        return new Response(
          JSON.stringify(errorResponse), // JSON文字列に変換します。
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、ヘッダーを設定します。
        );
    }

    // --- 3. プロフィールテーブルへのデータ挿入 --- 
    const userId = authData.user.id; // 作成された Auth ユーザーの ID を取得します。

    // public.profiles テーブルに新しいレコードを挿入します。
    const { error: profileError } = await supabaseAdmin
      .from('profiles') // public スキーマの profiles テーブルを指定します。
      .insert({ // 挿入するデータを指定します。
        id: userId, // profiles テーブルの id を Auth ユーザーの ID と一致させます。
        nickname: nickname, // リクエストから受け取ったニックネームを設定します。
        account_id: finalAccountId, // 事前チェック済みのアカウントIDを設定します。
        // bio, avatar_data は NULL (デフォルト値) または profiles テーブルのデフォルト定義に依存します。
        // created_at, updated_at は profiles テーブルのデフォルト定義 (now()) が使用されます。
      });

    // プロフィール挿入時にエラー (profileError) が発生した場合
    if (profileError) {
        // ★ ログ: プロフィール挿入エラーの詳細をコンソールに出力します (デバッグ用)。
        console.error('Supabase プロフィール挿入エラー:', profileError.stack || profileError); // ★理由: profilesテーブルへのINSERT失敗の原因（制約違反、DBエラー等）を特定するため。
        // --- ロールバック処理: 作成済みの Auth ユーザーを削除 --- 
        try {
          // 管理者権限で、作成した Auth ユーザーを削除します。
          await supabaseAdmin.auth.admin.deleteUser(userId);
          // ★ ログ: ロールバック成功をコンソールに出力します (デバッグ用)。
          console.log(`Authユーザー ${userId.substring(0,8)}... のロールバックに成功しました。`); // ★理由: プロフィール作成失敗に伴うAuthユーザー削除が正常に完了したことを確認するため。
        } catch (rollbackError) {
          // ロールバック処理自体でエラーが発生した場合
          // エラーオブジェクトからスタックトレースまたはメッセージを安全に取得します。
          const errorToLog = rollbackError instanceof Error ? rollbackError.stack || rollbackError : rollbackError;
          // ★ ログ: ロールバック失敗のエラー情報をコンソールに出力します (要監視)。
          console.error(`Authユーザー ${userId.substring(0,8)}... のロールバックに失敗しました:`, errorToLog); // ★理由: ロールバック処理に失敗し、不整合なAuthユーザーが残存する可能性を示すため、エラー詳細を記録します（要監視）。
          // ロールバック失敗は致命的ではない場合もあるため、ログ記録に留めて処理を続行し、元の profileError に基づくエラーを返します。
        }
        // --- ロールバック処理ここまで ---

        // プロフィール挿入エラーの原因がアカウントIDのユニーク制約違反かどうかを判定します。
        if (profileError.message.includes('duplicate key value violates unique constraint "profiles_account_id_key"')) {
            // アカウントID重複エラーを示すエラーレスポンスを作成します。
            const errorResponse: EdgeFunctionErrorResponse = {
              success: false, // 失敗フラグを設定します。
              error: 'このアカウントIDは既に使用されています。(DBエラー)', // エラーメッセージにDBエラーであることを追記します。
              errorCode: 'account_id_exists' // アカウントID重複のエラーコードを返します。
            };
            // HTTP ステータス 400 (Bad Request) でエラーレスポンスを返します (クライアント側の入力が原因)。
            return new Response(
              JSON.stringify(errorResponse), // JSON文字列に変換します。
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、ヘッダーを設定します。
            );
        }
        // その他のプロフィール作成エラー (DB接続エラー、他の制約違反など)
        const errorResponse: EdgeFunctionErrorResponse = {
          success: false, // 失敗フラグを設定します。
          error: `プロフィールの作成中にデータベースエラーが発生しました: ${profileError.message}`, // エラーメッセージを設定します。
          errorCode: 'profile_creation_failed' // エラーコードを設定します。
        };
        // HTTP ステータス 500 (Internal Server Error) でエラーレスポンスを返します。
        return new Response(
          JSON.stringify(errorResponse), // JSON文字列に変換します。
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、ヘッダーを設定します。
        );
    }

    // --- 成功応答 --- 
    // ここまで到達した場合、Auth ユーザー作成とプロフィール作成の両方が成功しています。
    // 成功を示すレスポンスデータを作成します。
    const successResponse = {
      success: true, // 成功フラグを設定します。
      userId // 作成されたユーザーのIDを返します。
    };
    // HTTP ステータス 200 (OK) で成功レスポンスを返します。
    return new Response(
      JSON.stringify(successResponse), // JSON文字列に変換します。
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ヘッダーを設定します。
    ); // 正常終了を示すレスポンス

  // --- 包括的なエラーハンドリング --- 
  } catch (error) {
    // 上記の個別エラーハンドリング (if (checkProfileError)..., if (authError)..., if (profileError)...) で
    // 捕捉されなかった、予期せぬエラーが発生した場合の処理です。
    // エラーオブジェクトからスタックトレースまたはメッセージを安全に取得します。
    const errorToLog = error instanceof Error ? error.stack || error : error;
    // ★ ログ: 予期せぬエラーの詳細をコンソールに出力します (デバッグ用)。
    console.error('register-user function 内で予期せぬエラー:', errorToLog); // ★理由: この関数のメインロジック内で未捕捉の例外（例: req.json()の失敗、環境変数不足による初期化失敗等）が発生した場合の原因特定のため。

    // ユーザーに返すエラーメッセージとエラーコードを組み立てます。
    let errorMessage = '不明なエラーが発生しました。'; // デフォルトのエラーメッセージ
    let errorCode = 'internal_error'; // デフォルトのエラーコード
    // エラーオブジェクトの型に応じてメッセージを抽出します。
    if (error instanceof Error) {
        errorMessage = error.message; // Error オブジェクトの場合は message プロパティを使用します。
        // 特定のエラー型 (例: SyntaxError) に基づいて errorCode を設定するロジックもここに追加可能です。
    } else if (typeof error === 'string') {
        errorMessage = error; // 文字列エラーの場合はそのまま使用します。
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        // message プロパティを持つオブジェクトの場合は message を使用します (より寛容なチェック)。
        errorMessage = String(error.message);
    }

    // 最終的なエラーレスポンスを作成します。
    const errorResponse: EdgeFunctionErrorResponse = {
      success: false, // 失敗フラグを設定します。
      error: errorMessage, // 組み立てたエラーメッセージを設定します。
      errorCode: errorCode // エラーコードを設定します。
    };
    // HTTP ステータス 500 (Internal Server Error) でエラーレスポンスを返します。
    return new Response(
      JSON.stringify(errorResponse), // JSON文字列に変換します。
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // ステータスコード、ヘッダーを設定します。
    );
  }
});

// ヘルパー関数: ニックネームからアカウントIDを生成します。
function generateAccountId(name: string): string { // ニックネーム (name: string) を受け取り、アカウントID (string) を生成する内部関数です。
  // 1. ニックネームを小文字に変換し、英数字以外の文字を削除します。
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  // 2. 衝突を避けるため、ランダムな6文字の英数字サフィックスを生成します。
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  // 3. ベース名とサフィックスをアンダースコアで結合し、データベースの制約に合わせて最大15文字に切り詰めます。
  // (注: profiles.account_id の実際の最大長に合わせて調整が必要になる場合があります)
  return `${baseName}_${randomSuffix}`.substring(0, 15);
} 