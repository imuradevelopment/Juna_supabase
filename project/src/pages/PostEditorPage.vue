<template>
  <div class="max-w-3xl mx-auto py-8">
    <div class="post-form glass-card p-6">
      <h1 class="text-2xl font-bold mb-6 text-heading">{{ isEditMode ? '投稿を編集' : '新しい投稿を作成' }}</h1>
      
      <!-- エラーメッセージ -->
      <div v-if="formError" class="bg-error/20 border border-error-dark/50 text-error px-4 py-3 rounded mb-6">
        {{ formError }}
      </div>
      
      <form @submit.prevent="handleSubmit" @keydown.enter.prevent="preventEnterSubmit" class="space-y-6" novalidate>
        <!-- タイトル -->
        <div>
          <label for="title" class="block text-sm font-medium mb-1 text-heading">タイトル <span class="text-error">*</span></label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            class="w-full px-4 py-2 rounded border border-border bg-surface text-heading focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="投稿のタイトル"
            required
          />
        </div>
        
        <!-- 抜粋 -->
        <div>
          <label for="excerpt" class="block text-sm font-medium mb-1 text-text-muted">抜粋</label>
          <textarea
            id="excerpt"
            v-model="formData.excerpt"
            rows="3"
            class="w-full px-4 py-2 rounded border border-border bg-surface text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="投稿の短い説明（オプション）"
          ></textarea>
        </div>
        
        <!-- アイキャッチ画像 -->
        <div>
          <label class="block text-sm font-medium mb-1 text-text-muted">アイキャッチ画像</label>
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
                class="btn-icon btn-icon-error btn-icon-sm absolute top-1 right-1"
              >
                <PhX class="w-4 h-4" />
              </button>
            </div>
            
            <!-- アップロードボタン -->
            <div>
              <label class="btn btn-outline-secondary cursor-pointer inline-flex items-center whitespace-nowrap">
                <PhImage class="w-5 h-5 mr-2" />
                <span>画像をアップロード</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden w-px h-px opacity-0 absolute"
                  @change="handleImageUpload"
                  ref="featuredImageInput"
                />
              </label>
              <p class="text-xs text-text-muted mt-1">最大サイズ: 2MB</p>
            </div>
          </div>
        </div>
        
        <!-- 本文 - 参照を追加 -->
        <div>
          <label for="content" class="block text-sm font-medium mb-1 text-text-muted">本文 <span class="text-error">*</span></label>
          <RichTextEditor
            ref="richTextEditorRef"
            v-model="formData.content"
            placeholder="投稿の本文を入力してください"
            :uploadingExternalImages="isUploading"
            @upload-status-changed="handleUploadStatusChange"
            @pending-images-updated="handlePendingImagesUpdated"
          />
        </div>
        
        <!-- カテゴリ -->
        <div>
          <label class="block text-sm font-medium mb-1 text-text-muted">カテゴリ <span class="text-error">*</span></label>
          
          <!-- カテゴリ選択コンポーネント -->
          <div class="relative">
            <div 
              class="min-h-10 w-full px-4 py-2 rounded border border-border bg-surface flex flex-wrap gap-2 items-center cursor-text"
              @click="isCategoryDropdownOpen = true"
            >
              <!-- 選択済みカテゴリタグ -->
              <div 
                v-for="categoryId in formData.categories" 
                :key="categoryId"
                class="inline-flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
              >
                {{ getCategoryName(categoryId) }}
                <button 
                  type="button" 
                  @click.stop="removeCategory(categoryId)"
                  class="ml-1 text-primary hover:text-primary-dark"
                >
                  <PhX class="w-4 h-4" />
                </button>
              </div>
              
              <!-- 入力フィールド -->
              <input
                ref="categoryInputRef"
                v-model="categorySearchQuery"
                @focus="isCategoryDropdownOpen = true"
                @blur="handleCategoryBlur"
                @keydown.enter.prevent="handleCategoryEnterKey"
                class="flex-1 min-w-[120px] bg-transparent outline-none text-text"
                placeholder="カテゴリを選択または入力..."
              />
            </div>
            
            <!-- ドロップダウンメニュー -->
            <div 
              v-if="isCategoryDropdownOpen" 
              class="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto glass-card border border-border rounded shadow-lg"
            >
              <!-- 新規カテゴリ追加オプション -->
              <div 
                v-if="categorySearchQuery && filteredCategories.length === 0" 
                @click="createNewCategory"
                class="cursor-pointer px-4 py-2 hover:bg-surface-variant text-text-muted flex items-center"
              >
                <PhPlus class="w-5 h-5 mr-2 text-success" />
                <span>「{{ categorySearchQuery }}」を新しいカテゴリとして追加</span>
              </div>
              
              <!-- カテゴリ候補リスト -->
              <div 
                v-for="category in filteredCategories" 
                :key="category.id"
                @click="addCategory(category.id)"
                class="cursor-pointer px-4 py-2 hover:bg-surface-variant text-text"
                :class="{'bg-surface-variant': formData.categories.includes(category.id.toString())}"
              >
                {{ category.name }}
              </div>
              
              <!-- 結果なしメッセージ -->
              <div v-if="!categorySearchQuery && !filteredCategories.length" class="px-4 py-2 text-text-muted">
                利用可能なカテゴリがありません
              </div>
            </div>
          </div>
          
          <p v-if="formData.categories.length === 0" class="text-xs mt-1 text-error">
            少なくとも1つのカテゴリを選択してください
          </p>
        </div>
        
        <!-- 公開設定 -->
        <div>
          <label class="block text-sm font-medium mb-1 text-text-muted">公開設定</label>
          <div class="flex items-center space-x-4">
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="formData.published" 
                :value="true"
                class="w-4 h-4 text-primary focus:ring-primary"
              />
              <span class="ml-2 text-text-muted">公開</span>
            </label>
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="formData.published" 
                :value="false"
                class="w-4 h-4 text-primary focus:ring-primary"
              />
              <span class="ml-2 text-text-muted">下書き</span>
            </label>
          </div>
        </div>
        
        <!-- 送信ボタン - isUploading時には無効化 -->
        <div class="flex justify-between pt-4">
          <router-link to="/" class="btn btn-outline-secondary" type="button">キャンセル</router-link>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="submitting || !isFormValid || isUploading"
          >
            <PhSpinner v-if="submitting" class="w-5 h-5 mr-2 animate-spin" />
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
import { PhX, PhImage, PhSpinner, PhPlus } from '@phosphor-icons/vue';

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

// Propsの定義をルーターのパラメーター名と一致させる
const props = defineProps({
  id: {  // postId から id に変更
    type: String,
    default: null
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
const isEditMode = computed(() => !!props.id);  // postId から id に変更
const isFormValid = computed(() => {
  // contentがオブジェクトの場合の検証を改善
  let contentValid = false;
  
  if (typeof formData.content === 'string') {
    contentValid = formData.content.trim() !== '';
  } else if (typeof formData.content === 'object' && formData.content !== null) {
    // JSONオブジェクトが有効かつ空でないことを確認
    contentValid = true;
    
    // tiptap形式の場合、contentプロパティを確認
    if (formData.content.type === 'doc' && formData.content.content) {
      // 空のドキュメントでないことを確認（段落がある）
      contentValid = formData.content.content.length > 0;
    }
  }
  
  return formData.title.trim() !== '' && 
         contentValid &&
         formData.categories.length > 0;
});

// アップロードされた画像を追跡
const uploadedImages = ref<{path: string, userId: string}[]>([]);

// カテゴリ選択関連
const isCategoryDropdownOpen = ref(false);
const categorySearchQuery = ref('');
const filteredCategories = computed(() => {
  if (!categorySearchQuery.value.trim()) {
    return availableCategories.value.filter(
      cat => !formData.categories.includes(cat.id.toString())
    );
  }
  
  const query = categorySearchQuery.value.toLowerCase().trim();
  return availableCategories.value.filter(
    cat => cat.name.toLowerCase().includes(query) && 
           !formData.categories.includes(cat.id.toString())
  );
});
const categoryInputRef = ref<HTMLInputElement | null>(null);

// 画像アップロード状態の追跡
const isUploading = ref(false);

// 一時保存された画像を追跡
const pendingImages = ref<{file: File, id: string}[]>([]);

// RichTextEditorへの参照を追加
const richTextEditorRef = ref<InstanceType<typeof RichTextEditor> | null>(null);

// アップロードボタンの参照を追加
const featuredImageInput = ref<HTMLInputElement | null>(null);

// 初期化
onMounted(async () => {
  // 状態をリセット
  resetUploadState();
  
  // カテゴリ一覧を取得
  await fetchCategories();
  
  // 編集モードの場合、既存の投稿を取得
  if (props.id) {
    await fetchPost(props.id);
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
    
    // content処理の修正 - JSONBデータを適切に処理
    if (post.content) {
      if (typeof post.content === 'object') {
        // JSONBオブジェクトをHTMLに変換（tiptapが理解できる形式）
        if (post.content.type === 'doc') {
          // tiptapのJSONデータの場合はそのまま
          formData.content = post.content;
        } else if (post.content.text) {
          // text属性がある場合（古い形式）
          formData.content = post.content.text;
        }
      } else if (typeof post.content === 'string') {
        // 文字列（HTML）の場合はそのまま
        formData.content = post.content;
      }
    }
    
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

// Enterキーによる自動送信防止
function preventEnterSubmit(e: KeyboardEvent) {
  // 最初に対象が存在するか確認
  if (!e.target) return;
  
  const target = e.target as HTMLElement;
  
  // テキストエリア内でのEnterキーは許可
  if (target.tagName === 'TEXTAREA') return;
  
  // リッチテキストエディタ内でのEnterキーは許可
  if (target.closest('.ProseMirror')) return;
  
  // それ以外の入力フィールドでのEnterキーは送信をキャンセル
  if (target.tagName === 'INPUT' && e.key === 'Enter') {
    e.preventDefault();
  }
}

// アイキャッチ画像処理を改善
async function handleImageUpload(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  
  const input = event.target as HTMLInputElement;
  
  if (!input.files || input.files.length === 0) return;
  
  try {
    const file = input.files[0];
    
    // ファイルサイズをチェック（2MB以下）
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('画像サイズは2MB以下にしてください');
    }
    
    if (richTextEditorRef.value) {
      // RichTextEditorのBase64エンコード機能を使用
      featuredImagePreview.value = await richTextEditorRef.value.encodeImageToBase64(file);
      featuredImageFile.value = file;
    } else {
      // フォールバック処理
      featuredImageFile.value = file;
      featuredImagePreview.value = URL.createObjectURL(file);
    }
  } catch (error: any) {
    console.error('画像処理エラー:', error);
    alert(error.message || '画像の処理に失敗しました');
  } finally {
    // ファイル選択をリセット（再選択できるようにする）
    const input = event.target as HTMLInputElement;
    if (input) input.value = '';
  }
}

// アップロード状態の変更を追跡
function handleUploadStatusChange(status: boolean) {
  isUploading.value = status;
}

// 画像の一時保存状態を更新するハンドラ追加
function handlePendingImagesUpdated(images: {file: File, id: string}[]) {
  pendingImages.value = images;
}

// フォーム送信処理を修正
async function handleSubmit() {
  submitting.value = true;
  formError.value = '';
  
  try {
    // 認証情報を更新
    const refreshResult = await authStore.refreshSession();
    if (!refreshResult) {
      // セッション更新に失敗した場合、再取得を試みる
      await authStore.checkSession();
    }
    
    // 現在のセッション情報を取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('セッションエラー:', sessionError);
      throw new Error('認証セッションの取得に失敗しました。再ログインしてください。');
    }
    
    if (!session) {
      // セッションがない場合は認証ページにリダイレクト
      router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath));
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    // 2. アイキャッチ画像のアップロード
    if (featuredImageFile.value) {
      const fileExt = featuredImageFile.value.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cover_images')
        .upload(fileName, featuredImageFile.value);
      
      if (uploadError) throw uploadError;
      formData.cover_image_path = fileName;
    }
    
    // 3. 保留中の本文画像をすべてアップロード
    const uploadedImageMap = new Map<string, string>(); // 一時ID → パスのマッピング
    
    // 保留中の画像を並行してアップロード
    if (pendingImages.value.length > 0) {
      const uploadPromises = pendingImages.value.map(async (img) => {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExt}`;
        const filePath = fileName;
        
        const { error } = await supabase.storage
          .from('post_images')
          .upload(filePath, img.file);
        
        if (error) throw error;
        
        // IDとパスのマッピングを保存
        uploadedImageMap.set(img.id, filePath);
        return { path: filePath, userId };
      });
      
      // 全てのアップロードを待機
      uploadedImages.value = await Promise.all(uploadPromises);
    }
    
    // 4. 本文のBase64画像をアップロード済み画像URLに置換
    let finalContent = formData.content;
    if (typeof finalContent === 'string' && uploadedImageMap.size > 0) {
      // 一時IDを持つ画像タグをSupabaseのURLに置換
      for (const [tempId, filePath] of uploadedImageMap.entries()) {
        const publicUrl = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath).data.publicUrl;
        
        // data-temp-id属性を持つ画像タグを検索して置換
        const regex = new RegExp(`<img[^>]*data-temp-id="${tempId}"[^>]*>`, 'g');
        finalContent = finalContent.replace(regex, `<img src="${publicUrl}">`);
      }
    }
    
    // 5. 投稿を作成または更新
    if (props.id) {
      await updatePost({...formData, content: finalContent});
      router.push(`/posts/${props.id}`);
    } else {
      const newPost = await createPost({...formData, content: finalContent});
      router.push(`/posts/${newPost.id}`);
    }
  } catch (err: any) {
    console.error('投稿保存エラー:', err);
    formError.value = err.message || '投稿の保存に失敗しました';
  } finally {
    submitting.value = false;
  }
}

// 新規投稿作成
async function createPost(postData: any) {
  try {
    // 認証情報を更新
    await authStore.refreshSession();
    
    // 現在のセッション情報を取得（トークンが有効か確認）
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('認証セッションの取得に失敗しました。再ログインしてください。');
    }
    
    if (!session) {
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    // プロフィールが存在するか確認
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
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
        author_id: userId
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
    // 認証情報を更新
    await authStore.refreshSession();
    
    // 現在のセッション情報を取得（トークンが有効か確認）
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('認証セッションの取得に失敗しました。再ログインしてください。');
    }
    
    if (!session) {
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    // プロフィールが存在するか確認
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
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
        last_edited_by: userId
      })
      .eq('id', props.id)  // postId から id に変更
      .eq('author_id', userId);
    
    if (updateError) throw updateError;
    
    // アップロードされた新しい画像があれば、投稿IDと関連付ける
    if (uploadedImages.value.length > 0) {
      const postImagesData = uploadedImages.value.map((img) => ({
        post_id: props.id,
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
      .eq('post_id', props.id);
    
    if (deleteError) throw deleteError;
    
    // 新しいカテゴリ関連を追加
    if (formData.categories.length > 0) {
      const categoryRelations = formData.categories.map(categoryId => ({
        post_id: props.id,
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

// 画像削除
function clearImage() {
  featuredImageFile.value = null;
  featuredImagePreview.value = null;
  formData.cover_image_path = null;
}

// カテゴリ選択関連
function handleCategoryBlur() {
  setTimeout(() => {
    isCategoryDropdownOpen.value = false;
  }, 150);
}

function handleCategoryEnterKey() {
  if (categorySearchQuery.value.trim() && filteredCategories.value.length > 0) {
    addCategory(filteredCategories.value[0].id);
  } else if (categorySearchQuery.value.trim()) {
    createNewCategory();
  }
}

async function createNewCategory() {
  if (!categorySearchQuery.value.trim()) return;
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: categorySearchQuery.value.trim() }])
      .select('*')
      .single();
    
    if (error) throw error;
    
    if (data) {
      availableCategories.value.push(data);
      addCategory(data.id);
      categorySearchQuery.value = '';
    }
  } catch (err) {
    console.error('カテゴリ作成エラー:', err);
    formError.value = 'カテゴリの作成に失敗しました';
  }
}

function addCategory(categoryId: number) {
  const categoryIdStr = categoryId.toString();
  if (!formData.categories.includes(categoryIdStr)) {
    formData.categories.push(categoryIdStr);
  }
  categorySearchQuery.value = '';
  categoryInputRef.value?.focus();
}

function removeCategory(categoryId: string) {
  formData.categories = formData.categories.filter(id => id !== categoryId);
}

function getCategoryName(categoryId: string): string {
  const category = availableCategories.value.find(c => c.id.toString() === categoryId);
  return category ? category.name : 'カテゴリなし';
}

// 念のためアップロード状態をリセットする処理を追加
function resetUploadState() {
  isUploading.value = false;
}

// 必要に応じて、featuredImageInputを公開
defineExpose({
  featuredImageInput
});
</script> 