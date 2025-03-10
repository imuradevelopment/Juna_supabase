<template>
  <div class="max-w-3xl mx-auto py-8">
    <div class="post-form glass-card p-6">
      <h1 class="text-2xl font-bold mb-6">{{ isEditMode ? '投稿を編集' : '新しい投稿を作成' }}</h1>
      
      <!-- エラーメッセージ -->
      <div v-if="formError" class="alert alert-error px-4 py-3 rounded mb-6">
        {{ formError }}
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- タイトル -->
        <div>
          <label for="title" class="block text-sm font-medium mb-1">タイトル <span class="text-required">*</span></label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            class="w-full px-4 py-2 rounded border !bg-surface !text-white focus:outline-none focus:ring-2 focus:ring-primary"
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
            class="w-full px-4 py-2 rounded border !bg-surface !text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="投稿の短い説明（オプション）"
          ></textarea>
        </div>
        
        <!-- アイキャッチ画像 -->
        <div>
          <label class="block text-sm font-medium mb-1">アイキャッチ画像</label>
          <div class="flex items-center space-x-4">
            <!-- 画像プレビュー -->
            <div v-if="featuredImagePreview || formData.cover_image_path" class="relative w-32 h-24 bg-surface-variant rounded overflow-hidden">
              <img 
                :src="featuredImagePreview || getCoverImageUrl(formData.cover_image_path as string)" 
                alt="プレビュー" 
                class="w-full h-full object-cover"
              />
              <button 
                type="button"
                @click="clearImage" 
                class="absolute top-1 right-1 bg-error text-white p-1 rounded-full hover:bg-error-dark focus:outline-none"
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
              <p class="text-xs text-gray-400 mt-1">最大サイズ: 2MB</p>
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
          <label class="block text-sm font-medium mb-1">カテゴリー <span class="text-required">*</span></label>
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
                class="form-checkbox h-4 w-4 focus:ring-primary rounded"
              />
              <label :for="`category-${category.id}`" class="ml-2 block text-sm">
                {{ category.name }}
              </label>
            </div>
          </div>
          <p v-if="formData.categories.length === 0" class="text-error text-xs mt-1">
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
                class="h-4 w-4 text-primary focus:ring-primary"
              />
              <span class="ml-2">公開</span>
            </label>
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="formData.published" 
                :value="false"
                class="h-4 w-4 text-primary focus:ring-primary"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import RichTextEditor from '../components/PostEditorPage/RichTextEditor.vue';
import { getCoverImageUrl } from '../lib/storage';

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

// Propsの定義を更新
const props = defineProps({
  postId: {
    type: String,
    default: null
  },
  isEditMode: {
    type: Boolean,
    default: false
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
  // カテゴリ一覧を取得
  await fetchCategories();
  
  // 編集モードの場合、既存の投稿を取得
  if (props.postId) {
    await fetchPost(props.postId);
  }
});

// カテゴリを取得
async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    availableCategories.value = data || [];
  } catch (err) {
    console.error('カテゴリ取得エラー:', err);
    formError.value = 'カテゴリの読み込みに失敗しました';
  }
}

// 既存の投稿を取得
async function fetchPost(postId: string) {
  try {
    // 投稿データを取得
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        post_categories(category_id)
      `)
      .eq('id', postId)
      .single();
    
    if (postError) throw postError;
    
    if (!post) {
      throw new Error('投稿が見つかりません');
    }
    
    // フォームに値を設定
    formData.title = post.title;
    formData.excerpt = post.excerpt;
    formData.content = post.content;
    formData.cover_image_path = post.cover_image_path;
    formData.published = post.published;
    
    // カテゴリIDを設定
    if (post.post_categories) {
      formData.categories = post.post_categories.map((c: any) => c.category_id.toString());
    }
  } catch (err) {
    console.error('投稿取得エラー:', err);
    formError.value = '投稿の読み込みに失敗しました';
  }
}

// フォーム送信処理
async function handleSubmit() {
  // バリデーション
  if (formData.title.trim() === '') {
    formError.value = 'タイトルを入力してください';
    return;
  }
  
  if (formData.categories.length === 0) {
    formError.value = '少なくとも1つのカテゴリを選択してください';
    return;
  }
  
  submitting.value = true;
  formError.value = '';
  
  try {
    // アイキャッチ画像のアップロード処理
    if (featuredImageFile.value) {
      const userId = authStore.user?.id;
      if (!userId) throw new Error('ユーザーIDが取得できません');
      
      // ファイル名を一意にする
      const fileExt = featuredImageFile.value.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // アップロード
      const { error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(filePath, featuredImageFile.value);
      
      if (uploadError) throw uploadError;
      
      // 画像パスを更新
      formData.cover_image_path = filePath;
    }
    
    // 編集モードの場合は更新、そうでなければ新規作成
    if (props.postId) {
      await updatePost(formData);
      router.push(`/posts/${props.postId}`);
    } else {
      const newPost = await createPost(formData);
      router.push(`/posts/${newPost.id}`);
    }
    
  } catch (err: any) {
    console.error('投稿保存エラー:', err);
    formError.value = err.message || '投稿の保存に失敗しました';
  } finally {
    submitting.value = false;
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