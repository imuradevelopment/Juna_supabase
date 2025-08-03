#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイルを読み込む
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const allowedOrigins = process.env.ALLOWED_ORIGINS;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!allowedOrigins) {
  console.error('エラー: ALLOWED_ORIGINSが.envファイルに設定されていません');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('エラー: SUPABASE_ANON_KEYが.envファイルに設定されていません');
  process.exit(1);
}

async function setEdgeFunctionsEnv() {
  try {
    console.log('Edge Functions用の環境変数を本番環境に設定しています...\n');

    // ALLOWED_ORIGINSを設定
    console.log(`ALLOWED_ORIGINS: ${allowedOrigins}`);
    const { stdout, stderr } = await execAsync(`supabase secrets set ALLOWED_ORIGINS="${allowedOrigins}"`);
    
    if (stderr) {
      console.error('エラー:', stderr);
    } else {
      console.log('✓ ALLOWED_ORIGINSが正常に設定されました\n');
    }

    // ANON_KEYを設定（SUPABASE_プレフィックスは使用できない）
    console.log(`ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`);
    const { stdout: stdout2, stderr: stderr2 } = await execAsync(`supabase secrets set ANON_KEY="${supabaseAnonKey}"`);
    
    if (stderr2) {
      console.error('エラー:', stderr2);
    } else {
      console.log('✓ ANON_KEYが正常に設定されました\n');
    }

    // 設定済みの環境変数を確認
    console.log('設定済みの環境変数を確認しています...');
    const { stdout: listOutput } = await execAsync('supabase secrets list');
    console.log(listOutput);

  } catch (error) {
    console.error('\nエラーが発生しました:', error.message);
    process.exit(1);
  }
}

setEdgeFunctionsEnv();