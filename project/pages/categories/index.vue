<template>
  <!-- カテゴリ管理ページのルート要素 -->
  <div class="container mx-auto p-4">
    <!-- ページタイトル -->
    <h1 class="text-2xl font-bold mb-6 text-secondary-500" data-testid="category-management-page-title">カテゴリ管理</h1>

    <!-- カテゴリ作成フォーム -->
    <!-- ★ RLS: 認証済みユーザーのみ表示 -->
    <div v-if="user" class="mb-6 bg-primary-300 p-4 rounded shadow">
      <h2 class="text-xl font-semibold mb-3 text-secondary-700">新規カテゴリ作成</h2>
      <div class="flex space-x-2">
        <input
          type="text"
          v-model="newCategoryName"
          placeholder="新しいカテゴリ名"
          class="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-secondary-500"
          data-testid="category-management-create-input"
          @keyup.enter="createCategory"
          :disabled="isCreating"
        />
        <button
          @click="createCategory"
          :disabled="isCreating || !newCategoryName.trim()"
          class="px-4 py-2 bg-secondary-500 text-primary-100 rounded hover:bg-secondary-700 disabled:opacity-50 flex items-center"
          data-testid="category-management-create-button"
        >
          <span v-if="isCreating">
            <NuxtIcon name="svg-spinners:8-dots-rotate" class="w-5 h-5 mr-2" /> 作成中...
          </span>
          <span v-else>作成</span>
        </button>
      </div>
      <p v-if="createError" class="mt-2 text-sm text-error-500" data-testid="category-create-error-message">
        エラー: {{ createError }}
      </p>
      <p v-if="createSuccessMessage" class="mt-2 text-sm text-success-500" data-testid="category-create-success-message">
        {{ createSuccessMessage }}
      </p>
    </div>
    <!-- ★ RLS: 未認証ユーザーへのメッセージ -->
    <div v-else class="mb-6 bg-primary-300 p-4 rounded shadow text-center text-gray-500">
      <p>カテゴリを作成・管理するには<NuxtLink to="/login" class="text-secondary-500 hover:underline">ログイン</NuxtLink>が必要です。</p>
    </div>

    <!-- カテゴリ一覧 -->
    <h2 class="text-xl font-semibold mb-3 text-secondary-700">カテゴリ一覧</h2>
    <div v-if="isLoading" class="text-center py-10 text-gray-500">
      <NuxtIcon name="svg-spinners:180-ring" class="w-8 h-8 text-secondary-500 mx-auto mb-2" />
      <p>読み込み中...</p>
    </div>
    <div v-else-if="fetchError" class="bg-error-100 border border-error-500 text-error-700 px-4 py-3 rounded relative mb-6" role="alert">
      <strong class="font-bold">エラー:</strong>
      <span class="block sm:inline">カテゴリ一覧の取得に失敗しました。 {{ fetchError }}</span>
    </div>
    <ul v-else-if="categories.length > 0" class="space-y-3">
      <li
        v-for="category in categories"
        :key="category.id"
        class="bg-primary-300 p-3 rounded shadow flex justify-between items-center group"
        :data-testid="`category-item-${category.id}`"
      >
        <!-- 編集中の表示 -->
        <div v-if="editingCategoryId === category.id" class="flex-grow flex items-center space-x-2" :data-testid="`category-edit-form-${category.id}`">
          <input
            type="text"
            v-model="editCategoryName"
            class="flex-grow p-1 border rounded focus:outline-none focus:ring-1 focus:ring-secondary-500 bg-primary-500"
            :data-testid="`category-edit-input-${category.id}`"
            @keyup.enter="saveCategory(category.id)"
            :disabled="isUpdating"
          />
          <button
            @click="saveCategory(category.id)"
            :disabled="isUpdating || !editCategoryName.trim() || editCategoryName === category.name"
            class="px-2 py-1 bg-success-500 text-white rounded text-xs hover:bg-success-700 disabled:opacity-50"
            :data-testid="`category-save-button-${category.id}`"
          >
             <span v-if="isUpdating">
                <NuxtIcon name="svg-spinners:8-dots-rotate" class="w-4 h-4" />
             </span>
            <span v-else>保存</span>
          </button>
          <button
            @click="cancelEdit"
            :disabled="isUpdating"
            class="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50"
            :data-testid="`category-cancel-edit-button-${category.id}`"
          >
            取消
          </button>
        </div>
        <!-- 通常表示 -->
        <span v-else class="text-gray-300">{{ category.name }}</span>

        <!-- 操作ボタン (編集中でない場合) -->
        <div v-if="editingCategoryId !== category.id" class="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- ★ RLS: ログインユーザーが作成者の場合のみ表示 -->
          <template v-if="user?.id === category.creator_id">
            <button
              @click="startEdit(category)"
              class="p-1 text-secondary-500 hover:text-secondary-700 disabled:opacity-50"
              :data-testid="`category-edit-button-${category.id}`"
              title="編集"
            >
              <NuxtIcon name="material-symbols:edit-outline" class="w-5 h-5" />
            </button>
            <button
              @click="confirmDelete(category)"
              class="p-1 text-error-500 hover:text-error-700 disabled:opacity-50"
              :data-testid="`category-delete-button-${category.id}`"
              title="削除"
            >
              <NuxtIcon name="material-symbols:delete-outline" class="w-5 h-5" />
            </button>
          </template>
        </div>
        <!-- 更新エラー表示 -->
        <p v-if="updateError && editingCategoryId === category.id" class="mt-1 text-xs text-error-500 w-full text-right">
           更新エラー: {{ updateError }}
        </p>
      </li>
      <!-- 更新成功メッセージ -->
       <p v-if="updateSuccessMessage" class="mt-2 text-sm text-success-500 fixed bottom-4 right-4 bg-primary-500 p-3 rounded shadow-lg z-50" data-testid="category-update-success-message">
        {{ updateSuccessMessage }}
      </p>
    </ul>
    <p v-else class="text-gray-500 text-center py-5">
      カテゴリはまだ作成されていません。
    </p>

    <!-- 削除確認ダイアログ -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" data-testid="category-delete-confirm-dialog">
      <div class="bg-primary-300 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <h3 class="text-lg font-bold mb-4 text-secondary-500">カテゴリ削除の確認</h3>
        <p class="mb-6 text-gray-300">
          カテゴリ「<strong class="font-semibold text-secondary-700">{{ categoryToDelete?.name }}</strong>」を削除してもよろしいですか？<br>
          <span class="text-sm text-warning-500">この操作は元に戻せません。</span>
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="cancelDelete"
            :disabled="isDeleting"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            data-testid="category-cancel-delete-button"
          >
            キャンセル
          </button>
          <button
            @click="deleteCategoryConfirmed"
            :disabled="isDeleting"
            class="px-4 py-2 bg-error-500 text-white rounded hover:bg-error-700 disabled:opacity-50 flex items-center"
            data-testid="category-confirm-delete-button"
          >
            <span v-if="isDeleting">
                <NuxtIcon name="svg-spinners:8-dots-rotate" class="w-5 h-5 mr-2" /> 削除中...
            </span>
            <span v-else>削除する</span>
          </button>
        </div>
        <p v-if="deleteError" class="mt-3 text-sm text-error-500 text-center">
          削除エラー: {{ deleteError }}
        </p>
         <p v-if="deleteSuccessMessage" class="mt-3 text-sm text-success-500 text-center" data-testid="category-delete-success-message">
            {{ deleteSuccessMessage }}
         </p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
// @ts-ignore Nuxt 自動インポート
import { useSupabaseClient, useSupabaseUser } from '#imports';
import type { Database } from '@/types/database';

// 型エイリアス
type Category = Database['public']['Tables']['categories']['Row'];

const supabase = useSupabaseClient();
const user = useSupabaseUser(); // ★ RLS 用にユーザー情報を取得
const categories = ref<Category[]>([]);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);

const newCategoryName = ref('');
const isCreating = ref(false);
const createError = ref<string | null>(null);
const createSuccessMessage = ref<string | null>(null);

const editingCategoryId = ref<number | null>(null);
const editCategoryName = ref('');
const isUpdating = ref(false);
const updateError = ref<string | null>(null);
const updateSuccessMessage = ref<string | null>(null);

const showDeleteConfirm = ref(false);
const categoryToDelete = ref<Category | null>(null);
const isDeleting = ref(false);
const deleteError = ref<string | null>(null);
const deleteSuccessMessage = ref<string | null>(null);

// カテゴリ取得処理
const fetchCategories = async () => {
  if (!supabase) {
    fetchError.value = 'Supabase client is not available.';
    return;
  }
  isLoading.value = true;
  fetchError.value = null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*, profiles(nickname)')
      .order('name');

    if (error) throw error;
    categories.value = (data as any[])?.map(c => ({
      ...c,
      creator_nickname: c.profiles?.nickname
    })) || [];
  } catch (err: any) {
    console.error('カテゴリ取得エラー:', err.stack || err);
    fetchError.value = err.message || '不明なエラー';
    categories.value = [];
  } finally {
    isLoading.value = false;
  }
};

// カテゴリ作成処理
const createCategory = async () => {
  if (!supabase || !user.value) {
    createError.value = 'ログインが必要です。';
    return;
  }
  if (!newCategoryName.value.trim()) return;

  isCreating.value = true;
  createError.value = null;
  createSuccessMessage.value = null;

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.value.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('既に存在するカテゴリ名です。');
      } else {
        throw error;
      }
    }
    if (data) {
      categories.value.push(data);
      categories.value.sort((a, b) => a.name.localeCompare(b.name));
    }
    newCategoryName.value = '';
    createSuccessMessage.value = 'カテゴリを作成しました。';
    setTimeout(() => createSuccessMessage.value = null, 3000);

  } catch (err: any) {
    console.error('カテゴリ作成エラー:', err.stack || err);
    createError.value = err.message || '不明なエラー';
  } finally {
    isCreating.value = false;
  }
};

// 編集開始
const startEdit = (category: Category) => {
  if (user.value?.id !== category.creator_id) {
    console.warn('startEdit: Attempted to edit category without permission.');
    return;
  }
  editingCategoryId.value = category.id;
  editCategoryName.value = category.name;
  updateError.value = null;
  updateSuccessMessage.value = null;
};

// 編集キャンセル
const cancelEdit = () => {
  editingCategoryId.value = null;
  editCategoryName.value = '';
  updateError.value = null;
};

// カテゴリ保存（更新）処理
const saveCategory = async (categoryId: number) => {
  if (!supabase || !user.value) {
    updateError.value = 'ログインが必要です。';
    console.error('saveCategory: Supabase client or user is null');
    return;
  }
  const originalCategory = categories.value.find(c => c.id === categoryId);
  if (!originalCategory || originalCategory.creator_id !== user.value.id) {
      updateError.value = 'このカテゴリを編集する権限がありません。';
      console.warn('saveCategory: Permission denied.');
      return;
  }

  if (!editCategoryName.value.trim() || editCategoryName.value === originalCategory.name) return;

  isUpdating.value = true;
  updateError.value = null;
  updateSuccessMessage.value = null;

  try {
    const { data, error } = await supabase
      .from('categories')
      .update({ name: editCategoryName.value.trim() })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('既に存在するカテゴリ名です。');
        } else {
            throw error;
        }
    }
    const index = categories.value.findIndex(c => c.id === categoryId);
    if (index !== -1 && data) {
      categories.value[index] = data;
      categories.value.sort((a, b) => a.name.localeCompare(b.name));
    }
    updateSuccessMessage.value = 'カテゴリを更新しました。';
    setTimeout(() => updateSuccessMessage.value = null, 3000);
    cancelEdit();

  } catch (err: any) {
    console.error('カテゴリ更新エラー:', err.stack || err);
    updateError.value = err.message || '不明なエラー';
  } finally {
    isUpdating.value = false;
  }
};

// 削除確認表示
const confirmDelete = (category: Category) => {
  if (user.value?.id !== category.creator_id) {
      console.warn('confirmDelete: Permission denied.');
      return;
  }
  categoryToDelete.value = category;
  showDeleteConfirm.value = true;
  deleteError.value = null;
  deleteSuccessMessage.value = null;
};

// 削除キャンセル
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  categoryToDelete.value = null;
  deleteError.value = null;
};

// 削除実行
const deleteCategoryConfirmed = async () => {
  if (!supabase || !user.value || !categoryToDelete.value || user.value.id !== categoryToDelete.value.creator_id) {
    deleteError.value = '削除を実行できません。権限がないか、情報が不足しています。';
    console.error('deleteCategoryConfirmed: Precondition failed.');
    return;
  }

  isDeleting.value = true;
  deleteError.value = null;
  deleteSuccessMessage.value = null;

  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryToDelete.value.id);

    if (error) throw error;

    categories.value = categories.value.filter(c => c.id !== categoryToDelete.value!.id);
    const deletedName = categoryToDelete.value.name;
    deleteSuccessMessage.value = `カテゴリ「${deletedName}」を削除しました。`;
    setTimeout(() => {
      cancelDelete();
    }, 1500);

  } catch (err: any) {
    console.error('カテゴリ削除エラー:', err.stack || err);
    deleteError.value = err.message || '不明なエラー';
  } finally {
    isDeleting.value = false;
  }
};

// コンポーネントマウント時にカテゴリを取得
onMounted(() => {
  fetchCategories();
});

// ユーザー状態の変化を監視して再取得 (任意)
watch(user, (newUser, oldUser) => {
  if (newUser?.id !== oldUser?.id) {
    fetchCategories();
  }
});

</script>

<style scoped>
/* Tailwind CSSを使用 */
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
</style>