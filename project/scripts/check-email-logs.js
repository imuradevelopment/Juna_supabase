import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID } = process.env;

if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_ID) {
  console.error('SUPABASE_ACCESS_TOKEN と SUPABASE_PROJECT_ID が必要です');
  process.exit(1);
}

// Auth設定を取得
async function checkAuthConfig() {
  const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/config/auth`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const config = await response.json();
    
    console.log('=== Auth設定 ===');
    console.log('Email認証が有効:', config.external_email_enabled);
    console.log('SMTP設定:');
    console.log('  - Host:', config.smtp_host || '未設定');
    console.log('  - Port:', config.smtp_port || '未設定');
    console.log('  - User:', config.smtp_user ? '設定済み' : '未設定');
    console.log('  - Password:', config.smtp_pass ? '設定済み' : '未設定');
    console.log('  - Sender Email:', config.smtp_admin_email || '未設定');
    console.log('  - Sender Name:', config.smtp_sender_name || '未設定');
    console.log('');
    console.log('その他の設定:');
    console.log('  - Email確認が必要:', config.email_confirmations_enabled);
    console.log('  - 新規登録許可:', config.enable_signup);
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

// 最近のログを確認
async function checkRecentLogs() {
  const logsUrl = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/logs/edge-functions`;
  
  try {
    const response = await fetch(logsUrl, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Logs API Error: ${response.status}`);
    }
    
    const logs = await response.json();
    
    console.log('\n=== 最近のエッジ関数ログ ===');
    const recentLogs = logs.data?.filter(log => 
      log.metadata?.function_name === 'register-user' &&
      log.timestamp > Date.now() - 3600000 // 過去1時間
    ) || [];
    
    if (recentLogs.length === 0) {
      console.log('過去1時間のregister-user関数のログはありません');
    } else {
      recentLogs.forEach(log => {
        console.log(`\n時刻: ${new Date(log.timestamp).toLocaleString()}`);
        console.log(`レベル: ${log.level}`);
        console.log(`メッセージ: ${log.event_message}`);
        if (log.metadata?.error) {
          console.log(`エラー: ${log.metadata.error}`);
        }
      });
    }
  } catch (error) {
    console.error('ログ取得エラー:', error.message);
  }
}

// 実行
(async () => {
  await checkAuthConfig();
  await checkRecentLogs();
})();