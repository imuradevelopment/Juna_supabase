import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .envファイルを読み込む
dotenv.config({ path: join(__dirname, '..', '.env') });

async function setupSMTP() {
  // 必要な環境変数をチェック
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_SENDER_EMAIL',
    'SMTP_SENDER_NAME'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ 以下の環境変数が設定されていません:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n📝 .envファイルに以下を追加してください:');
    console.log(`
# Gmail SMTP設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Googleアプリパスワード（16文字）
SMTP_SENDER_EMAIL=your-email@gmail.com
SMTP_SENDER_NAME=Your App Name
`);
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Supabase URLまたはService Role Keyが設定されていません');
    process.exit(1);
  }

  try {
    console.log('🔧 SMTP設定を開始します...\n');

    // Supabase Management APIを使用してSMTP設定を更新
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      console.error('❌ プロジェクト参照を取得できませんでした');
      console.log('ℹ️  ローカル開発環境では、Supabase Dashboardから手動で設定してください');
      process.exit(1);
    }

    // 注意: Supabase Management APIには認証トークンが必要です
    console.log('⚠️  注意: SMTP設定はSupabase Dashboardから手動で行う必要があります');
    console.log('\n以下の手順で設定してください:');
    console.log('1. https://app.supabase.com にアクセス');
    console.log('2. プロジェクトを選択');
    console.log('3. Authentication → Email Templates → SMTP Settings');
    console.log('4. "Enable Custom SMTP" をONにする');
    console.log('5. 以下の情報を入力:');
    console.log(`   - Host: ${process.env.SMTP_HOST}`);
    console.log(`   - Port: ${process.env.SMTP_PORT}`);
    console.log(`   - Username: ${process.env.SMTP_USER}`);
    console.log(`   - Password: ${process.env.SMTP_PASS}`);
    console.log(`   - Sender email: ${process.env.SMTP_SENDER_EMAIL}`);
    console.log(`   - Sender name: ${process.env.SMTP_SENDER_NAME}`);
    console.log('6. "Save" をクリック\n');

    console.log('📌 Gmailを使用する場合の注意事項:');
    console.log('   - Googleアカウントで2段階認証を有効にする');
    console.log('   - アプリパスワードを生成する（通常のパスワードではなく）');
    console.log('   - 生成した16文字のアプリパスワードをSMTP_PASSに設定する');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

setupSMTP();