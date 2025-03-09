<template>
  <div class="post-form glass-card p-6">
    <h2 class="text-2xl font-bold mb-6">{{ isEditMode ? '投稿を編集' : '新しい投稿を作成' }}</h2>
    
    <!-- エラーメッセージ -->
    <div v-if="formError" class="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
      {{ formError }}
    </div>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- タイトル -->
      <div>
        <label for="title" class="block text-sm font-medium mb-1">タイトル <span class="text-red-500">*</span></label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          class="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="投稿のタイトル"
          required
        />
      </div>
      
      <!-- 抜粋 -->
      <div>
        <label for="excerpt" class="block text-sm font-medium mb-1">抜粋</label>
        <textarea
          id="excerpt"
          v-model="formData.excerpt"
          rows="3"
          class="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 !bg-gray-800 !text-white focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="投稿の短い説明（オプション）"
        ></textarea>
      </div>
      
      <!-- アイキャッチ画像 -->
      <div>
        <label class="block text-sm font-medium mb-1">アイキャッチ画像</label>
        <div class="flex items-center space-x-4">
          <!-- 画像プレビュー -->
          <div v-if="featuredImagePreview || formData.cover_image_path" class="relative w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
            <img 
              :src="featuredImagePreview || getCoverImageUrl(formData.cover_image_path as string)" 
              alt="プレビュー" 
              class="w-full h-full object-cover"
            />
            <button 
              type="button"
              @click="clearImage" 
              class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 focus:outline-none"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- アップロードボタン -->
          <div>
            <label class="btn btn-secondary inline-flex items-center cursor-pointer">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              画像をアップロード
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageUpload"
              />
            </label>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">最大サイズ: 2MB</p>
          </div>
        </div>
      </div>
      
      <!-- 本文 -->
      <div>
        <label for="content" class="block text-sm font-medium mb-1">本文 <span class="text-red-500">*</span></label>
        <RichTextEditor
          v-model="formData.content"
          placeholder="投稿の本文を入力してください"
          @images-uploaded="handleImagesUploaded"
        />
      </div>
      
      <!-- カテゴリー -->
      <div>
        <label class="block text-sm font-medium mb-1">カテゴリー <span class="text-red-500">*</span></label>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div 
            v-for="category in availableCategories" 
            :key="category.id"
            class="flex items-center"
          >
            <input 
              type="checkbox" 
              :id="`category-${category.id}`" 
              :value="category.id" 
              v-model="formData.categories"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label :for="`category-${category.id}`" class="ml-2 block text-sm">
              {{ category.name }}
            </label>
          </div>
        </div>
        <p v-if="formData.categories.length === 0" class="text-red-500 text-xs mt-1">
          少なくとも1つのカテゴリーを選択してください
        </p>
      </div>
      
      <!-- 公開設定 -->
      <div>
        <label class="block text-sm font-medium mb-1">公開設定</label>
        <div class="flex items-center space-x-4">
          <label class="inline-flex items-center">
            <input 
              type="radio" 
              v-model="formData.published" 
              :value="true"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300"
            />
            <span class="ml-2">公開</span>
          </label>
          <label class="inline-flex items-center">
            <input 
              type="radio" 
              v-model="formData.published" 
              :value="false"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300"
            />
            <span class="ml-2">下書き</span>
          </label>
        </div>
      </div>
      
      <!-- 送信ボタン -->
      <div class="flex justify-between pt-4">
        <router-link to="/" class="btn btn-ghost">キャンセル</router-link>
        <button 
          type="submit" 
          class="btn btn-primary px-6"
          :disabled="submitting || !isFormValid"
        >
          <svg v-if="submitting" class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ submitting ? '保存中...' : (isEditMode ? '更新する' : '投稿する') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import RichTextEditor from '../editor/RichTextEditor.vue';
import { getCoverImageUrl } from '../../lib/storage';

// 型定義
interface FormData {
  title: string;
  excerpt: string | null;
  content: any; // JSONBを許容するためanyに変更
  cover_image_path: string | null;
  published: boolean;
  categories: string[];
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

const props = defineProps({
  postId: {
    type: String,
    default: ''
  }
});

const router = useRouter();
const authStore = useAuthStore();

// 状態
const formData = reactive<FormData>({
  title: '',
  excerpt: null,
  content: '',
  cover_image_path: null,
  published: false,
  categories: []
});

const availableCategories = ref<Category[]>([]);
const featuredImageFile = ref<File | null>(null);
const featuredImagePreview = ref<string | null>(null);
const submitting = ref(false);
const formError = ref('');
const isEditMode = computed(() => !!props.postId);
const isFormValid = computed(() => {
  return formData.title.trim() !== '' && 
         (typeof formData.content === 'string' ? formData.content.trim() !== '' : true) &&
         formData.categories.length > 0;
});

// アップロードされた画像を追跡
const uploadedImages = ref<{path: string, userId: string}[]>([]);

// 初期化
onMounted(async () => {
  await fetchCategories();
  
  // プロフィールの存在確認
  if (authStore.user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authStore.user.id)
      .single();
    
    if (error || !profile) {
      console.warn('プロフィールが存在しません。作成します。');
      try {
        // 基本的なプロフィールを自動作成（新しいスキーマに合わせる）
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authStore.user.id,
            account_id: authStore.user.email?.split('@')[0] || `user_${Date.now()}`,
            nickname: authStore.user.email?.split('@')[0] || 'ユーザー',
            is_verified: false,
            last_online_at: new Date().toISOString()
          });
        
        if (createError) {
          console.error('プロフィール作成エラー:', createError);
          formError.value = 'プロフィールの作成に失敗しました。設定ページでプロフィールを作成してください。';
        }
      } catch (err) {
        console.error('プロフィール作成中のエラー:', err);
      }
    }
  }
  
  if (isEditMode.value) {
    await loadPostData();
  }
});

// カテゴリ取得
async function fetchCategories() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    availableCategories.value = categories || [];
  } catch (err) {
    console.error('カテゴリ取得エラー:', err);
    formError.value = 'カテゴリーの読み込みに失敗しました';
  }
}

// 投稿データの読み込み関数
async function loadPostData() {
  if (!props.postId) return;
  
  try {
    // 投稿データを取得
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        post_categories(category_id)
      `)
      .eq('id', props.postId)
      .single();
    
    if (postError) throw postError;
    
    if (!postData) {
      throw new Error('投稿が見つかりません');
    }
    
    // ユーザーが投稿者かチェック
    if (postData.author_id !== authStore.user?.id) {
      formError.value = 'この投稿を編集する権限がありません';
      return;
    }
    
    // フォームデータを設定
    formData.title = postData.title;
    formData.excerpt = postData.excerpt || null;
    formData.content = postData.content;
    formData.cover_image_path = postData.cover_image_path;
    formData.published = postData.published;
    
    // カテゴリIDの配列を作成
    formData.categories = postData.post_categories
      ? postData.post_categories.map((pc: any) => pc.category_id.toString())
      : [];
    
  } catch (err: any) {
    console.error('投稿データ取得エラー:', err);
    formError.value = err.message || '投稿データの読み込みに失敗しました';
  }
}

// フォーム送信
async function handleSubmit() {
  formError.value = '';
  
  if (!authStore.user) {
    formError.value = 'ログインが必要です';
    return;
  }
  
  if (!isFormValid.value) {
    formError.value = '必須項目を入力してください';
    return;
  }
  
  submitting.value = true;
  
  try {
    // アイキャッチ画像の処理
    if (featuredImageFile.value) {
      const uploadedImagePath = await uploadImage(featuredImageFile.value);
      formData.cover_image_path = uploadedImagePath;
    }
    
    // 投稿データを準備
    const newPost = {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt || null,
      cover_image_path: formData.cover_image_path,
      published: formData.published,
      author_id: authStore.user.id
    };
    
    // 新規作成または更新
    if (isEditMode.value) {
      await updatePost(newPost);
      router.push(`/posts/${props.postId}`);
    } else {
      const createdPost = await createPost(newPost);
      router.push(`/posts/${createdPost.id}`);
    }
  } catch (err: any) {
    console.error('投稿保存エラー:', err);
    formError.value = err.message || '投稿の保存に失敗しました';
  } finally {
    submitting.value = false;
  }
}

// 画像アップロード
async function uploadImage(file: File): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const userId = authStore.user?.id;
    
    // RLSポリシーに対応するため、ユーザーIDをフォルダ構造に含める
    const filePath = `${userId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('cover_images')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600'
      });
    
    if (uploadError) throw uploadError;
    
    return filePath; // 完全なパスを返す
  } catch (err) {
    console.error('画像アップロードエラー:', err);
    throw new Error('画像のアップロードに失敗しました');
  }
}

// エディタからのアップロード画像を取得
function handleImagesUploaded(images: {path: string, userId: string}[]) {
  uploadedImages.value = images;
}

// 新規投稿作成
async function createPost(postData: any) {
  try {
    // ユーザーIDを確認
    if (!authStore.user || !authStore.user.id) {
      throw new Error('ユーザー情報が取得できません。再ログインしてください。');
    }
    
    // プロフィールが存在するか確認
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authStore.user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('プロフィールエラー:', profileError);
      throw new Error('ユーザープロフィールが見つかりません。プロフィールを作成してください。');
    }
    
    // コンテンツ処理の修正
    let contentValue = postData.content;
    
    // すでにオブジェクトの場合はそのまま使用、文字列の場合はHTMLとして扱う
    if (typeof contentValue === 'string') {
      // JSONとして解析できる場合のみパース
      try {
        if (contentValue.trim().startsWith('{') && contentValue.trim().endsWith('}')) {
          contentValue = JSON.parse(contentValue);
        }
        // HTMLの場合はそのままHTMLとして保存
      } catch (e) {
        console.log('ContentはHTML形式として処理します');
      }
    }
    
    // 投稿を作成
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        title: postData.title,
        content: contentValue,
        excerpt: postData.excerpt || null,
        cover_image_path: postData.cover_image_path,
        published: postData.published,
        published_at: postData.published ? new Date().toISOString() : null,
        author_id: authStore.user.id
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('投稿挿入エラー詳細:', insertError);
      throw insertError;
    }
    
    // アップロードされた画像があれば、投稿IDと関連付ける
    if (uploadedImages.value.length > 0) {
      const postImagesData = uploadedImages.value.map((img) => ({
        post_id: newPost.id,
        image_path: img.path,
        author_id: img.userId
      }));
      
      const { error: imagesError } = await supabase
        .from('post_images')
        .insert(postImagesData);
      
      if (imagesError) {
        console.error('画像データの関連付けエラー:', imagesError);
      }
    }
    
    // カテゴリの関連付け
    if (formData.categories.length > 0) {
      const categoryRelations = formData.categories.map(categoryId => ({
        post_id: newPost.id,
        category_id: parseInt(categoryId)
      }));
      
      const { error: categoryError } = await supabase
        .from('post_categories')
        .insert(categoryRelations);
      
      if (categoryError) throw categoryError;
    }
    
    return newPost;
  } catch (err) {
    console.error('投稿作成エラー:', err);
    throw new Error('投稿の作成に失敗しました');
  }
}

// 投稿更新
async function updatePost(postData: any) {
  try {
    // ユーザーIDを確認
    if (!authStore.user || !authStore.user.id) {
      throw new Error('ユーザー情報が取得できません。再ログインしてください。');
    }
    
    // プロフィールが存在するか確認
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authStore.user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('プロフィールエラー:', profileError);
      throw new Error('ユーザープロフィールが見つかりません。プロフィールを作成してください。');
    }
    
    // コンテンツ処理の修正
    let contentValue = postData.content;
    
    // すでにオブジェクトの場合はそのまま使用、文字列の場合はHTMLとして扱う
    if (typeof contentValue === 'string') {
      // JSONとして解析できる場合のみパース
      try {
        if (contentValue.trim().startsWith('{') && contentValue.trim().endsWith('}')) {
          contentValue = JSON.parse(contentValue);
        }
        // HTMLの場合はそのままHTMLとして保存
      } catch (e) {
        console.log('ContentはHTML形式として処理します');
      }
    }

    // 投稿を更新
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title: postData.title,
        excerpt: postData.excerpt,
        content: contentValue,
        cover_image_path: postData.cover_image_path,
        published: postData.published,
        published_at: postData.published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
        last_edited_by: authStore.user!.id
      })
      .eq('id', props.postId)
      .eq('author_id', authStore.user!.id);
    
    if (updateError) throw updateError;
    
    // アップロードされた新しい画像があれば、投稿IDと関連付ける
    if (uploadedImages.value.length > 0) {
      const postImagesData = uploadedImages.value.map((img) => ({
        post_id: props.postId,
        image_path: img.path,
        author_id: img.userId
      }));
      
      const { error: imagesError } = await supabase
        .from('post_images')
        .insert(postImagesData);
      
      if (imagesError) {
        console.error('画像データの関連付けエラー:', imagesError);
      }
    }
    
    // 既存のカテゴリ関連を削除
    const { error: deleteError } = await supabase
      .from('post_categories')
      .delete()
      .eq('post_id', props.postId);
    
    if (deleteError) throw deleteError;
    
    // 新しいカテゴリ関連を追加
    if (formData.categories.length > 0) {
      const categoryRelations = formData.categories.map(categoryId => ({
        post_id: props.postId,
        category_id: parseInt(categoryId)
      }));
      
      const { error: categoryError } = await supabase
        .from('post_categories')
        .insert(categoryRelations);
      
      if (categoryError) throw categoryError;
    }
  } catch (err) {
    console.error('投稿更新エラー:', err);
    throw new Error('投稿の更新に失敗しました');
  }
}

// 画像プレビュー設定
function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  
  if (input.files && input.files.length > 0) {
    featuredImageFile.value = input.files[0];
    featuredImagePreview.value = URL.createObjectURL(input.files[0]);
  }
}

// 画像削除
function clearImage() {
  featuredImageFile.value = null;
  featuredImagePreview.value = null;
  formData.cover_image_path = null;
}
</script> 