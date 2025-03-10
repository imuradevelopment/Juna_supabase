<template>
  <div class="max-w-3xl mx-auto py-8">
    <div class="glass-card p-6">
      <h1 class="text-2xl font-bold mb-6">プロフィール設定</h1>
      
      <!-- エラーメッセージ -->
      <div v-if="error" class="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-6">
        {{ error }}
      </div>
      
      <!-- 成功メッセージ -->
      <div v-if="successMessage" class="bg-green-900/30 border border-green-700 text-green-400 px-4 py-3 rounded mb-6">
        {{ successMessage }}
      </div>
      
      <form @submit.prevent="saveProfile" class="space-y-6">
        <!-- アバター -->
        <div>
          <label class="block text-sm font-medium mb-2">プロフィール画像</label>
          <div class="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <!-- アバター表示部分 -->
            <div class="flex flex-col items-center">
              <div class="relative w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-white text-3xl overflow-hidden">
                <img 
                  v-if="avatarPreview" 
                  :src="avatarPreview" 
                  alt="アバタープレビュー" 
                  class="absolute inset-0 w-full h-full object-cover"
                />
                <img 
                  v-else-if="profileData.avatar_data" 
                  :src="getAvatarUrl(profileData.avatar_data)" 
                  alt="現在のアバター" 
                  class="absolute inset-0 w-full h-full object-cover"
                />
                <span v-else-if="profileData.nickname">{{ getInitials(profileData.nickname) }}</span>
                <span v-else>U</span>
              </div>
              
              <!-- 削除ボタンを画像の下に配置 -->
              <button 
                v-if="avatarPreview || profileData.avatar_data" 
                type="button" 
                @click="removeAvatar"
                class="mt-2 text-red-500 hover:text-red-600 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                削除
              </button>
            </div>
            
            <!-- アップロードボタン -->
            <div class="flex flex-col">
              <label class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                アップロード
                <input 
                  type="file" 
                  accept="image/*" 
                  class="hidden" 
                  @change="handleAvatarUpload" 
                  ref="avatarInput"
                />
              </label>
              <p class="text-sm text-gray-400 mt-2">推奨サイズ: 200x200px (2MB以下)</p>
            </div>
          </div>
        </div>
        
        <!-- 表示名 -->
        <div>
          <label for="nickname" class="block text-sm font-medium mb-1">表示名 <span class="text-red-500">*</span></label>
          <input 
            id="nickname" 
            v-model="profileData.nickname" 
            type="text" 
            required
            class="w-full px-4 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <!-- アカウントID -->
        <div>
          <label for="account_id" class="block text-sm font-medium mb-1">アカウントID</label>
          <div class="flex">
            <span class="inline-flex items-center px-3 py-2 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-600">@</span>
            <input 
              id="account_id" 
              v-model="profileData.account_id" 
              type="text" 
              class="flex-1 px-4 py-2 rounded-r border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="account_id"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">
            半角英数字とアンダースコアのみ使用可能です
          </p>
        </div>
        
        <!-- 自己紹介 -->
        <div>
          <label for="bio" class="block text-sm font-medium mb-1">自己紹介</label>
          <textarea 
            id="bio" 
            v-model="profileData.bio" 
            class="w-full px-4 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            rows="3"
            placeholder="自己紹介を入力してください"
          ></textarea>
        </div>
        
        <!-- 障害種別 -->
        <div>
          <label for="disability_type" class="block text-sm font-medium mb-1">障害種別</label>
          <select 
            id="disability_type" 
            v-model="profileData.disability_type_id"
            class="w-full px-4 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">選択しない</option>
            <option v-for="type in disabilityTypes" :key="type.id" :value="type.id">
              {{ type.name }}
            </option>
          </select>
        </div>
        
        <!-- 障害についての説明 -->
        <div>
          <label for="disability_description" class="block text-sm font-medium mb-1">障害についての説明</label>
          <textarea 
            id="disability_description" 
            v-model="profileData.disability_description" 
            class="w-full px-4 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
            rows="3"
            placeholder="お持ちの障害について、共有したい情報があればご記入ください"
          ></textarea>
        </div>
        
        <!-- 送信ボタン -->
        <div>
          <button 
            type="submit" 
            class="btn btn-primary flex items-center justify-center w-full py-2"
            :disabled="submitting"
          >
            <div class="flex items-center">
              <svg 
                v-if="submitting" 
                class="animate-spin h-5 w-5 mr-2 flex-shrink-0" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ submitting ? '保存中...' : '保存' }}</span>
            </div>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import { v4 as uuidv4 } from 'uuid';
import { getProfileImageUrl } from '../lib/storage';

const authStore = useAuthStore();

// プロフィールデータ
const profileData = ref({
  nickname: '',
  account_id: '',
  bio: '',
  avatar_data: '' as string | null,
  disability_type_id: null as number | null,
  disability_description: '',
});

// 状態管理
const error = ref('');
const successMessage = ref('');
const submitting = ref(false);
const loading = ref(false);
const avatarPreview = ref('');
const avatarFile = ref<File | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);
const removeAvatarFlag = ref(false);
const disabilityTypes = ref<any[]>([]);

// 初期データ取得
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    error.value = 'ログインが必要です';
    return;
  }
  
  await Promise.all([
    fetchProfileData(),
    fetchDisabilityTypes()
  ]);
});

// プロフィールデータの取得
async function fetchProfileData() {
  loading.value = true;
  error.value = '';
  
  try {
    if (!authStore.user) throw new Error('ユーザー情報がありません');
    
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (data) {
      profileData.value = {
        nickname: data.nickname || '',
        account_id: data.account_id || '',
        bio: data.bio || '',
        avatar_data: data.avatar_data,
        disability_type_id: data.disability_type_id || null,
        disability_description: data.disability_description || '',
      };
      
      if (data.avatar_data) {
        avatarPreview.value = getAvatarUrl(data.avatar_data);
      }
    }
  } catch (err: any) {
    console.error('プロフィール取得エラー:', err);
    error.value = 'プロフィールの読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}

// 障害種別の取得
async function fetchDisabilityTypes() {
  try {
    const { data, error: fetchError } = await supabase
      .from('disability_types')
      .select('*')
      .order('name');
    
    if (fetchError) throw fetchError;
    if (data) disabilityTypes.value = data;
  } catch (err: any) {
    console.error('障害種別取得エラー:', err);
    error.value = '障害種別の読み込みに失敗しました';
  }
}

// アバター画像のアップロード処理
async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  
  if (!input.files || input.files.length === 0) {
    return;
  }
  
  const file = input.files[0];
  removeAvatarFlag.value = false;
  
  // ファイルサイズチェック（2MB以下）
  if (file.size > 2 * 1024 * 1024) {
    error.value = '画像サイズは2MB以下にしてください';
    return;
  }
  
  // プレビュー表示
  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
}

// アバター画像の削除
function removeAvatar() {
  // 画像プレビューをクリア
  avatarPreview.value = '';
  
  // ファイル選択をリセット
  avatarFile.value = null;
  
  // すでに保存済みの画像を削除するためのフラグをセット
  if (profileData.value.avatar_data) {
    removeAvatarFlag.value = true;
  }
  
  // ファイル入力をリセット（再アップロード可能にする）
  if (avatarInput.value) {
    avatarInput.value.value = '';
  }
}

// プロフィール保存
async function saveProfile() {
  submitting.value = true;
  error.value = '';
  successMessage.value = '';
  
  try {
    if (!authStore.user) throw new Error('ユーザー情報がありません');
    
    // アバターのアップロード処理
    let avatarUrl = profileData.value.avatar_data;
    
    if (avatarFile.value) {
      // ファイル名を一意にする
      const fileExt = avatarFile.value.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${authStore.user.id}/${fileName}`;
      
      // 画像をアップロード - バケット名を変更
      const { error: uploadError } = await supabase.storage
        .from('profile_images')  // 'avatars'から'profile_images'に変更
        .upload(filePath, avatarFile.value);
      
      if (uploadError) throw uploadError;
      
      avatarUrl = filePath;
    } else if (removeAvatarFlag.value) {
      // アバターを削除する場合
      avatarUrl = null;
    }
    
    // プロフィールを更新
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nickname: profileData.value.nickname,
        account_id: profileData.value.account_id,
        bio: profileData.value.bio,
        avatar_data: avatarUrl,
        disability_type_id: profileData.value.disability_type_id,
        disability_description: profileData.value.disability_description || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', authStore.user.id);
    
    if (updateError) throw updateError;
    
    // プロフィールデータをストアに反映
    await authStore.fetchUserProfile();
    
    successMessage.value = 'プロフィールを更新しました';
    
    // 古いアバター画像があれば削除（新しい画像がアップロードされた場合）
    if (avatarFile.value && profileData.value.avatar_data && avatarUrl !== profileData.value.avatar_data) {
      await supabase.storage
        .from('profile_images')  // 'avatars'から'profile_images'に変更
        .remove([profileData.value.avatar_data]);
    }
    
    // 状態を更新
    profileData.value.avatar_data = avatarUrl;
    avatarFile.value = null;
    removeAvatarFlag.value = false;
    
  } catch (err: any) {
    console.error('プロフィール更新エラー:', err);
    error.value = `プロフィールの更新に失敗しました: ${err.message || '不明なエラー'}`;
  } finally {
    submitting.value = false;
  }
}

// ヘルパー関数
function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}
</script>

<style scoped>
/* !importantを使用せずにスタイルの詳細度を高める */
:deep(input), 
:deep(textarea), 
:deep(select) {
  background-color: #1e293b;
  color: #f1f5f9;
  border-color: #475569;
}

:deep(.input-group-text),
:deep(.inline-flex) {
  background-color: #2d3748;
  color: #f1f5f9;
}
</style> 