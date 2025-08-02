#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .envファイルを読み込む
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
const adminNickname = process.env.ADMIN_NICKNAME || '管理者';
const adminAccountId = process.env.ADMIN_ACCOUNT_ID || 'admin';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('エラー: SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYが必要です');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  try {
    console.log('管理者ユーザーを作成しています...\n');

    // 既存のプロフィールをチェック
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('account_id', adminAccountId)
      .single();

    if (existingProfile) {
      console.log(`✓ 管理者アカウント（${adminAccountId}）は既に存在します`);
      console.log(`  ユーザーID: ${existingProfile.id}`);
      return;
    }

    // 管理者ユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        is_admin: true
      }
    });

    if (authError) {
      // ユーザーが既に存在する場合
      if (authError.message.includes('already registered')) {
        console.log(`! メールアドレス（${adminEmail}）は既に登録されています`);
        console.log('  既存のユーザーIDを取得しています...');
        
        // 既存のユーザーを検索
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = users.find(user => user.email === adminEmail);
        if (!existingUser) {
          throw new Error('既存ユーザーの取得に失敗しました');
        }

        // プロフィールを作成
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: existingUser.id,
            nickname: adminNickname,
            account_id: adminAccountId,
            bio: '管理者アカウント',
            avatar_data: null
          });

        if (profileError) throw profileError;

        console.log('\n✓ 管理者プロフィールが作成されました');
        console.log(`  ユーザーID: ${existingUser.id}`);
        console.log(`  メール: ${adminEmail}`);
        console.log(`  アカウントID: ${adminAccountId}`);
        console.log(`  ニックネーム: ${adminNickname}`);
        return;
      }
      throw authError;
    }

    const userId = authData.user.id;

    // プロフィールを作成
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nickname: adminNickname,
        account_id: adminAccountId,
        bio: '管理者アカウント',
        avatar_data: null
      });

    if (profileError) throw profileError;

    console.log('\n✓ 管理者ユーザーが正常に作成されました');
    console.log(`  ユーザーID: ${userId}`);
    console.log(`  メール: ${adminEmail}`);
    console.log(`  パスワード: ${adminPassword}`);
    console.log(`  アカウントID: ${adminAccountId}`);
    console.log(`  ニックネーム: ${adminNickname}`);

  } catch (error) {
    console.error('\nエラーが発生しました:', error.message);
    process.exit(1);
  }
}

createAdmin();