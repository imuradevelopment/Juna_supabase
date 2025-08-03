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

const email = process.argv[2];
if (!email) {
  console.error('使い方: node scripts/resend-confirmation-email.js <email>');
  process.exit(1);
}

// Supabase Management APIを使用してメール確認を再送信
async function resendConfirmationEmail() {
  const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/auth/users/resend`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        type: 'signup'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    
    console.log(`確認メールを ${email} に再送信しました`);
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

resendConfirmationEmail();