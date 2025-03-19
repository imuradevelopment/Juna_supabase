<template>
  <div>
    <label class="block text-sm font-medium mb-1 text-text-muted">カテゴリ <span class="text-error">*</span></label>
    
    <div class="relative">
      <div 
        class="min-h-10 w-full px-4 py-2 rounded border border-border bg-surface flex flex-wrap gap-2 items-center cursor-text"
        @click="isCategoryDropdownOpen = true"
      >
        <div 
          v-for="categoryId in modelValue" 
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
          :class="{'bg-surface-variant': modelValue.includes(category.id.toString())}"
        >
          {{ category.name }}
        </div>
        
        <div v-if="!categorySearchQuery && !filteredCategories.length" class="px-4 py-2 text-text-muted">
          利用可能なカテゴリがありません
        </div>
      </div>
    </div>
    
    <p v-if="modelValue.length === 0" class="text-xs mt-1 text-error">
      少なくとも1つのカテゴリを選択してください
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PhX, PhPlus } from '@phosphor-icons/vue';
import { supabase } from '../../../lib/supabase';

interface Category {
  id: number;
  name: string;
  description: string | null;
}

const props = defineProps({
  modelValue: {
    type: Array as () => string[],
    default: () => []
  },
  postId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'error', 'categories-loaded']);

const availableCategories = ref<Category[]>([]);
const isCategoryDropdownOpen = ref(false);
const categorySearchQuery = ref('');
const categoryInputRef = ref<HTMLInputElement | null>(null);
const formError = ref('');

const filteredCategories = computed(() => {
  if (!categorySearchQuery.value.trim()) {
    return availableCategories.value.filter(
      cat => !props.modelValue.includes(cat.id.toString())
    );
  }
  
  const query = categorySearchQuery.value.toLowerCase().trim();
  return availableCategories.value.filter(
    cat => cat.name.toLowerCase().includes(query) && 
           !props.modelValue.includes(cat.id.toString())
  );
});

onMounted(async () => {
  await fetchCategories();
});

async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    availableCategories.value = data || [];
    emit('categories-loaded', availableCategories.value);
  } catch (err) {
    console.error('カテゴリ取得エラー:', err);
    formError.value = 'カテゴリの読み込みに失敗しました';
    emit('error', 'カテゴリの読み込みに失敗しました');
  }
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
  const categoryName = categorySearchQuery.value.trim();
  
  try {
    // まず既存のカテゴリで同名のものを検索
    const { data: existingCategory, error: searchError } = await supabase
      .from('categories')
      .select('*')
      .ilike('name', categoryName)
      .single();
    
    if (!searchError && existingCategory) {
      // 既存のカテゴリが見つかった場合はそれを使用
      availableCategories.value = availableCategories.value.filter(c => c.id !== existingCategory.id);
      availableCategories.value.push(existingCategory);
      addCategory(existingCategory.id);
      categorySearchQuery.value = '';
      return;
    }
    
    // 新しいカテゴリを作成
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: categoryName }])
      .select('*')
      .single();
    
    if (error) {
      // 一意制約違反の場合（既に他のユーザーが作成した）
      if (error.code === '23505') { // PostgreSQLの一意制約違反コード
        console.log('同名カテゴリが既に存在します。既存のカテゴリを使用します。');
        
        // 再度検索して最新のカテゴリを取得
        const { data: newlyAddedCategory } = await supabase
          .from('categories')
          .select('*')
          .ilike('name', categoryName)
          .single();
        
        if (newlyAddedCategory) {
          availableCategories.value = availableCategories.value.filter(c => c.id !== newlyAddedCategory.id);
          availableCategories.value.push(newlyAddedCategory);
          addCategory(newlyAddedCategory.id);
          categorySearchQuery.value = '';
          return;
        }
      }
      throw error;
    }
    
    if (data) {
      availableCategories.value.push(data);
      addCategory(data.id);
      categorySearchQuery.value = '';
    }
  } catch (err: any) {
    console.error('カテゴリ作成エラー:', err);
    
    // エラーメッセージの改善
    if (err.code === '23505') {
      formError.value = '同名のカテゴリが既に存在します。カテゴリリストから選択してください。';
      emit('error', '同名のカテゴリが既に存在します。カテゴリリストから選択してください。');
      
      // カテゴリリストを再取得して最新の状態に
      await fetchCategories();
    } else {
      formError.value = 'カテゴリの作成に失敗しました。再度お試しください。';
      emit('error', 'カテゴリの作成に失敗しました。再度お試しください。');
    }
  }
}

function addCategory(categoryId: number) {
  const categoryIdStr = categoryId.toString();
  if (!props.modelValue.includes(categoryIdStr)) {
    const newCategories = [...props.modelValue, categoryIdStr];
    emit('update:modelValue', newCategories);
  }
  categorySearchQuery.value = '';
  categoryInputRef.value?.focus();
}

function removeCategory(categoryId: string) {
  const newCategories = props.modelValue.filter(id => id !== categoryId);
  emit('update:modelValue', newCategories);
}

function getCategoryName(categoryId: string): string {
  const category = availableCategories.value.find(c => c.id.toString() === categoryId);
  return category ? category.name : 'カテゴリなし';
}

async function savePostCategories(postId: string) {
  try {
    // 既存のカテゴリ関連を削除
    const { error: deleteError } = await supabase
      .from('post_categories')
      .delete()
      .eq('post_id', postId);
    
    if (deleteError) throw deleteError;
    
    if (props.modelValue.length > 0) {
      const categoryRelations = props.modelValue.map(categoryId => ({
        post_id: postId,
        category_id: parseInt(categoryId)
      }));
      
      const { error: categoryError } = await supabase
        .from('post_categories')
        .insert(categoryRelations);
      
      if (categoryError) throw categoryError;
    }
    
    return true;
  } catch (err) {
    console.error('カテゴリ保存エラー:', err);
    emit('error', 'カテゴリの保存に失敗しました');
    return false;
  }
}

// 公開メソッドを定義
defineExpose({
  fetchCategories,
  savePostCategories,
  getAvailableCategories: () => availableCategories.value
});
</script> 