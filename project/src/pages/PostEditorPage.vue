<template>
  <div>
    <div class="max-w-3xl mx-auto py-8">
      <div class="post-form glass-card p-6">
        <h1 class="text-2xl font-bold mb-6 text-heading">{{ isEditMode ? '投稿を編集' : '新しい投稿を作成' }}</h1>
        
        <div v-if="formError" class="bg-error/20 border border-error-dark/50 text-error px-4 py-3 rounded mb-6">
          {{ formError }}
        </div>
        
        <form @submit.prevent="handleSubmit" @keydown.enter.prevent="preventEnterSubmit" class="space-y-6" novalidate>
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
          
          <div>
            <label class="block text-sm font-medium mb-1 text-text-muted">アイキャッチ画像</label>
            <div class="flex items-center space-x-4">
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
          
          <div>
            <label class="block text-sm font-medium mb-1 text-text-muted">カテゴリ <span class="text-error">*</span></label>
            
            <div class="relative">
              <div 
                class="min-h-10 w-full px-4 py-2 rounded border border-border bg-surface flex flex-wrap gap-2 items-center cursor-text"
                @click="isCategoryDropdownOpen = true"
              >
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
              
              <div 
                v-if="isCategoryDropdownOpen" 
                class="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto glass-card border border-border rounded shadow-lg"
              >
                <div 
                  v-if="categorySearchQuery && filteredCategories.length === 0" 
                  @click="createNewCategory"
                  class="cursor-pointer px-4 py-2 hover:bg-surface-variant text-text-muted flex items-center"
                >
                  <PhPlus class="w-5 h-5 mr-2 text-success" />
                  <span>「{{ categorySearchQuery }}」を新しいカテゴリとして追加</span>
                </div>
                
                <div 
                  v-for="category in filteredCategories" 
                  :key="category.id"
                  @click="addCategory(category.id)"
                  class="cursor-pointer px-4 py-2 hover:bg-surface-variant text-text"
                  :class="{'bg-surface-variant': formData.categories.includes(category.id.toString())}"
                >
                  {{ category.name }}
                </div>
                
                <div v-if="!categorySearchQuery && !filteredCategories.length" class="px-4 py-2 text-text-muted">
                  利用可能なカテゴリがありません
                </div>
              </div>
            </div>
            
            <p v-if="formData.categories.length === 0" class="text-xs mt-1 text-error">
              少なくとも1つのカテゴリを選択してください
            </p>
          </div>
          
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

    <div v-if="sessionExpiredModalOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="glass-card p-6 max-w-md w-full rounded-lg">
        <h3 class="text-xl font-bold mb-4 text-heading">セッションが切れました</h3>
        <p class="mb-4 text-text">長時間の操作がなかったため、ログインセッションが切れました。内容は一時保存されていますので、再ログイン後に編集を続けることができます。</p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="handleLoginRedirect()" 
            class="btn btn-primary"
          >
            ログイン画面へ
          </button>
        </div>
      </div>
    </div>

    <div v-if="lastAutoSaveTime" class="fixed bottom-4 right-4 text-sm text-text-muted bg-surface-variant p-2 rounded shadow-md opacity-70">
      最終自動保存: {{ lastAutoSaveTime.toLocaleTimeString() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import RichTextEditor from '../components/PostEditorPage/Editor/RichTextEditor.vue';
import { getCoverImageUrl } from '../lib/storage';
import { PhX, PhImage, PhSpinner, PhPlus } from '@phosphor-icons/vue';

interface FormData {
  title: string;
  excerpt: string | null;
  content: any;
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
  id: {
    type: String,
    default: null
  }
});

const router = useRouter();
const authStore = useAuthStore();

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
const isEditMode = computed(() => !!props.id);
const isFormValid = computed(() => {
  let contentValid = false;
  
  if (typeof formData.content === 'string') {
    contentValid = formData.content.trim() !== '';
  } else if (typeof formData.content === 'object' && formData.content !== null) {
    contentValid = true;
    
    if (formData.content.type === 'doc' && formData.content.content) {
      contentValid = formData.content.content.length > 0;
    }
  }
  
  return formData.title.trim() !== '' && 
         contentValid &&
         formData.categories.length > 0;
});

const uploadedImages = ref<{path: string, userId: string}[]>([]);

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

const isUploading = ref(false);

const pendingImages = ref<{file: File, id: string}[]>([]);

const richTextEditorRef = ref<InstanceType<typeof RichTextEditor> | null>(null);

const featuredImageInput = ref<HTMLInputElement | null>(null);

const sessionCheckInterval = ref<number | null>(null);
const sessionExpiredModalOpen = ref(false);
const isSessionValid = ref(true);

onMounted(async () => {
  resetUploadState();
  
  await fetchCategories();
  
  if (props.id) {
    await fetchPost(props.id);
  }
  
  sessionCheckInterval.value = window.setInterval(async () => {
    await checkSessionStatus();
  }, 5 * 60 * 1000);

  const returnParam = new URLSearchParams(window.location.search).get('return');
  if (returnParam === 'login') {
    await restoreFromLocalStorage();
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
});

onBeforeUnmount(() => {
  if (sessionCheckInterval.value) {
    clearInterval(sessionCheckInterval.value);
  }
});

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

async function fetchPost(postId: string) {
  try {
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
    
    formData.title = post.title;
    formData.excerpt = post.excerpt;
    
    if (post.content) {
      if (typeof post.content === 'object') {
        if (post.content.type === 'doc') {
          formData.content = post.content;
        } else if (post.content.text) {
          formData.content = post.content.text;
        }
      } else if (typeof post.content === 'string') {
        formData.content = post.content;
      }
    }
    
    formData.cover_image_path = post.cover_image_path;
    formData.published = post.published;
    
    if (post.post_categories) {
      formData.categories = post.post_categories.map((c: any) => c.category_id.toString());
    }
  } catch (err) {
    console.error('投稿取得エラー:', err);
    formError.value = '投稿の読み込みに失敗しました';
  }
}

function preventEnterSubmit(e: KeyboardEvent) {
  if (!e.target) return;
  
  const target = e.target as HTMLElement;
  
  if (target.tagName === 'TEXTAREA') return;
  
  if (target.closest('.ProseMirror')) return;
  
  if (target.tagName === 'INPUT' && e.key === 'Enter') {
    e.preventDefault();
  }
}

async function handleImageUpload(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  
  const input = event.target as HTMLInputElement;
  
  if (!input.files || input.files.length === 0) return;
  
  try {
    const file = input.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('画像サイズは2MB以下にしてください');
    }
    
    if (richTextEditorRef.value) {
      featuredImagePreview.value = await richTextEditorRef.value.encodeImageToBase64(file);
      featuredImageFile.value = file;
    } else {
      featuredImageFile.value = file;
      featuredImagePreview.value = URL.createObjectURL(file);
    }
  } catch (error: any) {
    console.error('画像処理エラー:', error);
    alert(error.message || '画像の処理に失敗しました');
  } finally {
    const input = event.target as HTMLInputElement;
    if (input) input.value = '';
  }
}

function handleUploadStatusChange(status: boolean) {
  isUploading.value = status;
}

function handlePendingImagesUpdated(images: {file: File, id: string}[]) {
  pendingImages.value = images;
}

async function checkSessionStatus() {
  try {
    const refreshResult = await authStore.refreshSession();
    
    if (!refreshResult) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        isSessionValid.value = false;
        sessionExpiredModalOpen.value = true;
        
        saveToLocalStorage();
      }
    }
  } catch (error) {
    console.error('セッションチェックエラー:', error);
  }
}

function saveToLocalStorage() {
  try {
    const tempData = {
      title: formData.title,
      excerpt: formData.excerpt,
      content: formData.content,
      categories: formData.categories,
      published: formData.published,
      timestamp: new Date().getTime(),
      postId: props.id || null
    };
    
    localStorage.setItem('temp_post_data', JSON.stringify(tempData));
  } catch (error) {
    console.error('一時保存エラー:', error);
  }
}

function restoreFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('temp_post_data');
    if (savedData) {
      const tempData = JSON.parse(savedData);
      
      if (!props.id || (props.id && tempData.postId === props.id)) {
        const oneHour = 60 * 60 * 1000;
        if (new Date().getTime() - tempData.timestamp < oneHour) {
          formData.title = tempData.title;
          formData.excerpt = tempData.excerpt;
          formData.content = tempData.content;
          formData.categories = tempData.categories;
          formData.published = tempData.published;
          
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error('データ復元エラー:', error);
    return false;
  }
}

async function handleSubmit() {
  submitting.value = true;
  formError.value = '';
  
  try {
    const refreshResult = await authStore.refreshSession();
    if (!refreshResult) {
      await authStore.checkSession();
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath));
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    if (featuredImageFile.value) {
      const fileExt = featuredImageFile.value.name.split('.').pop();
      const fileName = `${userId}/${uuidv4()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cover_images')
        .upload(fileName, featuredImageFile.value);
      
      if (uploadError) throw uploadError;
      formData.cover_image_path = fileName;
    }
    
    const uploadedImageMap = new Map<string, string>();
    
    if (pendingImages.value.length > 0) {
      const uploadPromises = pendingImages.value.map(async (img) => {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExt}`;
        const filePath = fileName;
        
        const { error } = await supabase.storage
          .from('post_images')
          .upload(filePath, img.file);
        
        if (error) throw error;
        
        uploadedImageMap.set(img.id, filePath);
        return { path: filePath, userId };
      });
      
      uploadedImages.value = await Promise.all(uploadPromises);
    }
    
    let finalContent = formData.content;
    if (typeof finalContent === 'string' && uploadedImageMap.size > 0) {
      for (const [tempId, filePath] of uploadedImageMap.entries()) {
        const publicUrl = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath).data.publicUrl;
        
        const regex = new RegExp(`<img[^>]*data-temp-id="${tempId}"[^>]*>`, 'g');
        finalContent = finalContent.replace(regex, `<img src="${publicUrl}">`);
      }
    }
    
    if (props.id) {
      await updatePost({...formData, content: finalContent});
      router.push(`/posts/${props.id}`);
    } else {
      const newPost = await createPost({...formData, content: finalContent});
      router.push(`/posts/${newPost.id}`);
    }
    
    localStorage.removeItem('temp_post_data');
  } catch (err: any) {
    console.error('投稿保存エラー:', err);
    formError.value = err.message || '投稿の保存に失敗しました';
  } finally {
    submitting.value = false;
  }
}

async function createPost(postData: any) {
  try {
    await authStore.refreshSession();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('認証セッションの取得に失敗しました。再ログインしてください。');
    }
    
    if (!session) {
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('プロフィールエラー:', profileError);
      throw new Error('ユーザープロフィールが見つかりません。プロフィールを作成してください。');
    }
    
    let contentValue = postData.content;
    
    if (typeof contentValue === 'string') {
      try {
        if (contentValue.trim().startsWith('{') && contentValue.trim().endsWith('}')) {
          contentValue = JSON.parse(contentValue);
        }
      } catch (e) {
        console.log('ContentはHTML形式として処理します');
      }
    }
    
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

async function updatePost(postData: any) {
  try {
    await authStore.refreshSession();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('認証セッションの取得に失敗しました。再ログインしてください。');
    }
    
    if (!session) {
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('プロフィールエラー:', profileError);
      throw new Error('ユーザープロフィールが見つかりません。プロフィールを作成してください。');
    }
    
    let contentValue = postData.content;
    
    if (typeof contentValue === 'string') {
      try {
        if (contentValue.trim().startsWith('{') && contentValue.trim().endsWith('}')) {
          contentValue = JSON.parse(contentValue);
        }
      } catch (e) {
        console.log('ContentはHTML形式として処理します');
      }
    }

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
      .eq('id', props.id)
      .eq('author_id', userId);
    
    if (updateError) throw updateError;
    
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
    
    const { error: deleteError } = await supabase
      .from('post_categories')
      .delete()
      .eq('post_id', props.id);
    
    if (deleteError) throw deleteError;
    
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

function clearImage() {
  featuredImageFile.value = null;
  featuredImagePreview.value = null;
  formData.cover_image_path = null;
}

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

function resetUploadState() {
  isUploading.value = false;
}

defineExpose({
  featuredImageInput
});

function handleLoginRedirect() {
  saveToLocalStorage();
  router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath));
}

const autoSaveInterval = ref<number | null>(null);
const lastAutoSaveTime = ref<Date | null>(null);

onMounted(async () => {
  autoSaveInterval.value = window.setInterval(() => {
    if (isFormValid.value && !submitting.value) {
      saveToLocalStorage();
      lastAutoSaveTime.value = new Date();
    }
  }, 60 * 1000);
  
  checkForSavedData();
});

onBeforeUnmount(() => {
  if (sessionCheckInterval.value) {
    clearInterval(sessionCheckInterval.value);
  }
  
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value);
  }
});

// 保存データのチェックと復元確認
async function checkForSavedData() {
  const hasData = await restoreFromLocalStorage();
  if (hasData) {
    // 通知またはトースト表示で復元を通知
    // ここではUI実装は省略
  }
}
</script> 