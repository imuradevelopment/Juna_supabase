import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const requiredEnvVars = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PROJECT_ID',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_SENDER_EMAIL',
  'SMTP_SENDER_NAME'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('以下の環境変数がありません:', missingVars);
  process.exit(1);
}

const {
  SUPABASE_ACCESS_TOKEN,
  SUPABASE_PROJECT_ID,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SENDER_EMAIL,
  SMTP_SENDER_NAME
} = process.env;

const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/config/auth`;

const body = {
  external_email_enabled: true,
  smtp_admin_email: SMTP_SENDER_EMAIL,
  smtp_host: SMTP_HOST,
  smtp_port: SMTP_PORT, // 文字列のまま送信
  smtp_user: SMTP_USER,
  smtp_pass: SMTP_PASS,
  smtp_sender_name: SMTP_SENDER_NAME
};

fetch(url, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})
  .then(async res => {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`APIエラー: ${res.status} ${text}`);
    }
    return res.json();
  })
  .then(data => {
    console.log('SMTP設定をAPI経由で反映しました:', data);
  })
  .catch(err => {
    console.error('SMTP設定APIエラー:', err);
    process.exit(1);
  });