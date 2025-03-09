import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { getProfileImageUrl } from '../lib/storage';

// 独自のProfile型を定義
type Profile = {
  id: string;
  account_id: string;
  nickname: string | null;
  bio: string | null;
  avatar_data: string | null;
  disability_type_id: number | null;
  disability_description: string | null;
  created_at: string;
  updated_at: string;
};

export const useAuthStore = defineStore('auth', () => {
  // 状態
  const user = ref<User | null>(null);
  const profile = ref<Profile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // 計算プロパティ
  const isAuthenticated = computed(() => !!user.value);
  const displayName = computed(() => {
    return profile.value?.nickname || user.value?.email || 'ユーザー';
  });
  const avatarUrl = computed(() => {
    if (!profile.value?.avatar_data) return '';
    return getProfileImageUrl(profile.value.avatar_data);
  });
  
  // 初期化
  const checkSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        user.value = data.session.user;
        await fetchUserProfile();
      } else {
        user.value = null;
        profile.value = null;
      }
    } catch (error) {
      console.error('セッション確認エラー:', error);
      user.value = null;
      profile.value = null;
    }
  };
  
  // ユーザープロフィールの取得
  const fetchUserProfile = async () => {
    if (!user.value) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single();
      
      if (error) throw error;
      profile.value = data;
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    }
  };
  
  // ログイン処理 - アカウントIDとメールアドレスの両方に対応
  const login = async (identifier: string, password: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      // メールアドレス形式かどうかを判断
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      
      let email = identifier;
      
      if (!isEmail) {
        // Edge Functionを使用してアカウントIDからメールアドレスを取得
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/login-with-account`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ identifier, password })
          }
        );
        
        const result = await response.json();
        
        if (!result.success) {
          error.value = result.error;
          return {
            success: false,
            error: error.value
          };
        }
        
        email = result.email;
      }
      
      // メールアドレスとパスワードでログイン
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (loginError) {
        error.value = loginError.message;
        return { 
          success: false, 
          error: loginError.message 
        };
      }
      
      if (data.user) {
        user.value = data.user;
        await fetchUserProfile();
        return { success: true };
      } else {
        error.value = 'ユーザー情報の取得に失敗しました';
        return {
          success: false,
          error: error.value
        };
      }
    } catch (err: any) {
      console.error('ログインエラー:', err);
      error.value = err.message || 'ログインに失敗しました';
      return {
        success: false,
        error: error.value
      };
    } finally {
      loading.value = false;
    }
  };
  
  // 会員登録処理
  const register = async (email: string, password: string, displayName: string, accountId: string = '') => {
    loading.value = true;
    error.value = null;
    
    try {
      // Edge Functionを呼び出す
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ email, password, displayName, accountId })
        }
      );
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '登録に失敗しました');
      }
      
      // 登録成功後の処理
      return { success: true };
    } catch (err: any) {
      console.error('登録エラー:', err);
      error.value = err.message || '登録に失敗しました';
      return {
        success: false,
        error: error.value
      };
    } finally {
      loading.value = false;
    }
  };
  
  // ログアウト処理
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      user.value = null;
      profile.value = null;
      return { success: true };
    } catch (error: any) {
      console.error('ログアウトエラー:', error);
      error.value = error.message || 'ログアウトに失敗しました';
      return {
        success: false,
        error: error.value
      };
    }
  };
  
  // パスワードリセット（リセットメール送信）
  async function resetPassword(email: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (resetError) throw resetError;
      
      return { success: true };
    } catch (err: any) {
      console.error('パスワードリセットエラー:', err);
      error.value = 'リセットメールの送信に失敗しました。メールアドレスを確認してください。';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }
  
  // パスワード更新
  async function updatePassword(newPassword: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      return { success: true };
    } catch (err: any) {
      console.error('パスワード更新エラー:', err);
      error.value = 'パスワードの更新に失敗しました。もう一度お試しください。';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }
  
  // プロフィール更新
  async function updateProfile(profileData: any) {
    loading.value = true;
    error.value = null;
    
    try {
      if (!user.value) throw new Error('ユーザーが認証されていません');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.value.id);
      
      if (updateError) throw updateError;
      
      // 更新されたプロフィールを再取得
      await fetchUserProfile();
      
      return { success: true };
    } catch (err: any) {
      console.error('プロフィール更新エラー:', err);
      error.value = 'プロフィールの更新に失敗しました。もう一度お試しください。';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }
  
  // ユーザー情報をクリアするメソッド（新規追加）
  async function clearUser() {
    user.value = null;
    profile.value = null;
    error.value = null;
    
    // セッションを完全に削除
    await supabase.auth.signOut({ scope: 'global' });
    
    // ローカルストレージからの関連データ削除
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('darkMode');
    
    // キャッシュもクリア
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.filter(name => name.includes('supabase')).map(name => caches.delete(name))
        );
      } catch (e) {
        console.error('キャッシュ削除エラー:', e);
      }
    }
  }
  
  return {
    // 状態
    user,
    profile,
    loading,
    error,
    
    // 計算プロパティ
    isAuthenticated,
    displayName,
    avatarUrl,
    
    // アクション
    checkSession,
    fetchUserProfile,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    clearUser
  };
}); 