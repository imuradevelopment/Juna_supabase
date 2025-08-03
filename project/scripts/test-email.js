import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function testEmail() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.error('使い方: npm run test:email your-email@example.com');
    process.exit(1);
  }
  
  console.log(`テストメールを ${testEmail} に送信します...`);
  
  try {
    // パスワードリセットメールを送信（メール送信のテスト）
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${process.env.SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });
    
    if (error) {
      console.error('メール送信エラー:', error.message);
      console.error('詳細:', error);
    } else {
      console.log('メール送信リクエストが成功しました');
      console.log('メールボックスを確認してください');
      
      // Auth Logsを確認
      console.log('\n最近のAuthログを確認中...');
      const { data: logs, error: logsError } = await supabase
        .from('auth.audit_log_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (logs) {
        console.log('\n最近のAuthイベント:');
        logs.forEach(log => {
          console.log(`- ${new Date(log.created_at).toLocaleString()}: ${log.payload?.type || log.payload?.event_type || 'Unknown event'}`);
        });
      }
    }
  } catch (error) {
    console.error('予期しないエラー:', error);
  }
}

testEmail();