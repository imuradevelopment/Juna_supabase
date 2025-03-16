<template>
  <div class="max-w-3xl mx-auto py-8">
    <div class="glass-card p-6">
      <h1 class="text-2xl font-bold mb-6 text-heading">プロフィール設定</h1>
      
      <!-- エラーメッセージ -->
      <div v-if="error" class="bg-error/20 border border-error-dark text-error px-4 py-3 rounded mb-6">
        {{ error }}
      </div>
      
      <!-- 成功メッセージ -->
      <div v-if="successMessage" class="bg-success/20 border border-success-dark text-success px-4 py-3 rounded mb-6">
        {{ successMessage }}
      </div>
      
      <form @submit.prevent="saveProfile" class="space-y-6">
        <!-- アバター -->
        <div>
          <label class="block text-sm font-medium mb-2 text-text">プロフィール画像</label>
          <div class="flex flex-col items-start space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
            <!-- アバター表示部分 -->
            <div class="flex flex-col items-center">
              <div class="relative w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-text-white text-3xl overflow-hidden">
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
                class="mt-2 btn btn-outline-error btn-sm"
              >
                <PhTrash class="h-4 w-4 mr-1" />
                削除
              </button>
            </div>
            
            <!-- アップロードボタン -->
            <div class="flex flex-col">
              <label class="btn btn-outline-secondary cursor-pointer">
                <PhCloudArrowUp class="h-5 w-5 mr-2" />
                アップロード
                <input 
                  type="file" 
                  accept="image/*" 
                  class="hidden" 
                  @change="handleAvatarUpload" 
                  ref="avatarInput"
                />
              </label>
              <p class="text-sm text-text-muted mt-2">推奨サイズ: 200x200px (2MB以下)</p>
            </div>
          </div>
        </div>
        
        <!-- 表示名 -->
        <div>
          <label for="nickname" class="block text-sm font-medium mb-1 text-text">表示名 <span class="text-error">*</span></label>
          <input 
            id="nickname" 
            v-model="profileData.nickname" 
            type="text" 
            required
            class="w-full px-4 py-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <!-- アカウントID -->
        <div>
          <label for="account_id" class="block text-sm font-medium mb-1 text-text">アカウントID</label>
          <div class="flex">
            <span class="inline-flex items-center px-3 py-2 rounded-l border border-r-0 border-border bg-surface-accent text-text">@</span>
            <input 
              id="account_id" 
              v-model="profileData.account_id" 
              type="text" 
              class="flex-1 px-4 py-2 rounded-r border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="account_id"
            />
          </div>
          <p class="text-xs text-text-muted mt-1">
            半角英数字とアンダースコアのみ使用可能です
          </p>
        </div>
        
        <!-- 自己紹介 -->
        <div>
          <label for="bio" class="block text-sm font-medium mb-1 text-text">自己紹介</label>
          <textarea 
            id="bio" 
            v-model="profileData.bio" 
            class="w-full px-4 py-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            rows="3"
            placeholder="自己紹介を入力してください"
          ></textarea>
        </div>
        
        <!-- 障害種別（マルチセレクト対応） -->
        <div>
          <label class="block text-sm font-medium mb-1 text-text">障害種別</label>
          
          <!-- 選択された障害種別の表示 -->
          <div v-if="selectedDisabilityTypes.length > 0" class="mb-3 flex flex-wrap gap-2">
            <div 
              v-for="type in selectedDisabilityTypes" 
              :key="type.id" 
              class="flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm text-primary-light"
            >
              {{ type.name }}
              <button 
                type="button" 
                @click="removeDisabilityType(type.id)" 
                class="ml-2 text-primary hover:text-error"
              >
                <PhX class="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <!-- 障害種別の選択 -->
          <div class="flex space-x-2">
            <select 
              v-model="selectedDisabilityTypeId"
              class="flex-1 px-4 py-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">障害種別を選択してください</option>
              <option 
                v-for="type in availableDisabilityTypes" 
                :key="type.id" 
                :value="type.id"
              >
                {{ type.name }}
              </option>
            </select>
            
            <button 
              type="button" 
              @click="addDisabilityType"
              class="btn btn-outline-primary"
              :disabled="!selectedDisabilityTypeId"
            >
              <PhPlus class="h-5 w-5" />
              追加
            </button>
          </div>
          
          <!-- 新しい障害種別の追加 -->
          <div class="mt-3">
            <div class="flex items-center">
              <label class="flex items-center text-sm text-text-muted cursor-pointer" @click="showNewDisabilityType = !showNewDisabilityType">
                <PhPlusCircle class="h-4 w-4 mr-1 text-primary" />
                新しい障害種別を追加する
              </label>
            </div>
            
            <div v-if="showNewDisabilityType" class="mt-2 space-y-2">
              <input 
                v-model="newDisabilityType.name" 
                type="text" 
                placeholder="障害種別の名前"
                class="w-full px-4 py-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              
              <textarea 
                v-model="newDisabilityType.description" 
                placeholder="説明（任意）"
                class="w-full px-4 py-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                rows="2"
              ></textarea>
              
              <div class="flex justify-end">
                <button 
                  type="button" 
                  @click="createAndAddDisabilityType"
                  class="btn btn-primary btn-sm"
                  :disabled="!newDisabilityType.name"
                >
                  作成して追加
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 障害についての説明 -->
        <div>
          <label for="disability_description" class="block text-sm font-medium mb-1 text-text">障害についての説明</label>
          <textarea 
            id="disability_description" 
            v-model="profileData.disability_description" 
            class="w-full px-4 py-2 rounded border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            rows="3"
            placeholder="お持ちの障害について、共有したい情報があればご記入ください"
          ></textarea>
        </div>
        
        <!-- 送信ボタン -->
        <div>
          <button 
            type="submit" 
            class="btn btn-primary w-full"
            :disabled="submitting"
          >
            <div class="flex items-center">
              <PhSpinner v-if="submitting" class="h-5 w-5 mr-2 animate-spin" />
              {{ submitting ? '保存中...' : '保存する' }}
            </div>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import { v4 as uuidv4 } from 'uuid';
import { getProfileImageUrl } from '../lib/storage';
import { 
  PhTrash, 
  PhCloudArrowUp, 
  PhSpinner, 
  PhPlus, 
  PhX, 
  PhPlusCircle 
} from '@phosphor-icons/vue';

const authStore = useAuthStore();

// プロフィールデータ
const profileData = ref({
  nickname: '',
  account_id: '',
  bio: '',
  avatar_data: '' as string | null,
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
const selectedDisabilityTypes = ref<any[]>([]);
const selectedDisabilityTypeId = ref('');
const showNewDisabilityType = ref(false);
const newDisabilityType = ref({
  name: '',
  description: ''
});

// 使用可能な障害種別（すでに選択されたものを除外）
const availableDisabilityTypes = computed(() => {
  const selectedIds = selectedDisabilityTypes.value.map(type => type.id);
  return disabilityTypes.value.filter(type => !selectedIds.includes(type.id));
});

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
        disability_description: data.disability_description || '',
      };
      
      if (data.avatar_data) {
        avatarPreview.value = getAvatarUrl(data.avatar_data);
      }
      
      // ユーザーの障害種別を取得
      await fetchUserDisabilityTypes();
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

// ユーザーの障害種別を取得
async function fetchUserDisabilityTypes() {
  if (!authStore.user) return;
  
  try {
    const { data, error: typesError } = await supabase
      .from('user_disability_types')
      .select('disability_type_id, disability_types:disability_type_id(*)')
      .eq('user_id', authStore.user.id);
    
    if (typesError) throw typesError;
    
    // 障害種別データの整形
    selectedDisabilityTypes.value = (data || [])
      .filter(item => item.disability_types)
      .map(item => item.disability_types);
      
  } catch (err) {
    console.error('ユーザー障害種別取得エラー:', err);
  }
}

// 障害種別を追加
function addDisabilityType() {
  if (!selectedDisabilityTypeId.value) return;
  
  const typeId = parseInt(selectedDisabilityTypeId.value);
  const typeToAdd = disabilityTypes.value.find(type => type.id === typeId);
  
  if (typeToAdd && !selectedDisabilityTypes.value.some(t => t.id === typeId)) {
    selectedDisabilityTypes.value.push(typeToAdd);
    selectedDisabilityTypeId.value = '';
  }
}

// 障害種別を削除
function removeDisabilityType(typeId: number) {
  selectedDisabilityTypes.value = selectedDisabilityTypes.value.filter(
    type => type.id !== typeId
  );
}

// 新しい障害種別を作成して追加
async function createAndAddDisabilityType() {
  if (!newDisabilityType.value.name) return;
  
  try {
    const { data, error: createError } = await supabase
      .from('disability_types')
      .insert({
        name: newDisabilityType.value.name,
        description: newDisabilityType.value.description,
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    if (data) {
      // 新しい障害種別を追加
      disabilityTypes.value.push(data);
      selectedDisabilityTypes.value.push(data);
      
      // フォームをリセット
      newDisabilityType.value = { name: '', description: '' };
      showNewDisabilityType.value = false;
    }
  } catch (err: any) {
    console.error('障害種別作成エラー:', err);
    error.value = '障害種別の作成に失敗しました: ' + err.message;
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
        .from('profile_images')
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
        disability_description: profileData.value.disability_description || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', authStore.user.id);
    
    if (updateError) throw updateError;
    
    // 障害種別の関連付けを更新するために一度すべて削除
    const { error: deleteTypeError } = await supabase
      .from('user_disability_types')
      .delete()
      .eq('user_id', authStore.user.id);
    
    if (deleteTypeError) throw deleteTypeError;
    
    // 選択された障害種別を新たに関連付け
    if (selectedDisabilityTypes.value.length > 0) {
      const disabilityTypeLinks = selectedDisabilityTypes.value.map(type => ({
        user_id: authStore.user?.id,
        disability_type_id: type.id
      }));
      
      if (authStore.user) {
        const { error: insertTypesError } = await supabase
          .from('user_disability_types')
          .insert(disabilityTypeLinks);
        
        if (insertTypesError) throw insertTypesError;
      }
    }
    
    // プロフィールデータをストアに反映
    await authStore.fetchUserProfile();
    
    successMessage.value = 'プロフィールを更新しました';
    
    // 古いアバター画像があれば削除（新しい画像がアップロードされた場合）
    if (avatarFile.value && profileData.value.avatar_data && avatarUrl !== profileData.value.avatar_data) {
      await supabase.storage
        .from('profile_images')
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