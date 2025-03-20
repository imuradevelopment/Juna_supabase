<template>
  <div>
    <label class="block text-sm font-medium mb-1 text-text-muted">アイキャッチ画像</label>
    <div class="flex items-center space-x-4">
      <div v-if="modelValue || preview" class="relative w-32 h-24 bg-surface-variant rounded overflow-hidden">
        <img 
          :src="preview || getImageUrl(modelValue as string)" 
          alt="プレビュー" 
          class="w-full h-full object-cover"
        />
        <button 
          type="button"
          @click="clearImageData" 
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
        <p class="text-xs text-text-muted mt-1">最大サイズ: 1.5MB</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PhX, PhImage } from '@phosphor-icons/vue';
import { useImageUpload } from '../../../composables/useImageUpload';

const props = defineProps({
  modelValue: {
    type: String as () => string | null,
    default: null
  },
  richTextEditorRef: {
    type: Object as () => Record<string, any> | null,
    default: null
  }
});

const emit = defineEmits([
  'update:modelValue', 
  'file-selected', 
  'upload-success', 
  'upload-error',
  'upload-started',
  'upload-finished'
]);

const featuredImageInput = ref<HTMLInputElement | null>(null);

// 画像アップロード用コンポーザブル
const {
  preview,
  originalFile: imageFile,
  error,
  uploadImage,
  handleFileSelect,
  clearImage,
  getImageUrl,
  encodeToBase64
} = useImageUpload('cover_images', {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 800,
  outputFormat: 'webp',
  quality: 0.85
});

// Base64形式のデータを保持する変数
const fileDataBase64 = ref<string | null>(null);

// ファイル選択ハンドラーを拡張してBase64データを設定
async function handleImageUpload(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  
  const input = event.target as HTMLInputElement;
  
  if (!input.files || input.files.length === 0) return;
  
  try {
    const file = input.files[0];
    
    // コンポーザブルを使って画像を処理
    const success = await handleFileSelect(file);
    
    if (success && imageFile.value) {
      // Base64データを取得してセット
      fileDataBase64.value = await encodeToBase64(imageFile.value);
      emit('file-selected', file);
    } else if (error.value) {
      emit('upload-error', error.value);
      alert(error.value);
    }
  } catch (error: any) {
    console.error('画像処理エラー:', error);
    alert(error.message || '画像の処理に失敗しました');
  } finally {
    const input = event.target as HTMLInputElement;
    if (input) input.value = '';
  }
}

// アイキャッチ画像をアップロードする関数
async function uploadImageToStorage(userId: string): Promise<string | null> {
  if (!imageFile.value) return null;
  
  emit('upload-started');
  
  try {
    const result = await uploadImage(userId);
    
    if (result) {
      // アップロード成功時にパスを更新
      emit('update:modelValue', result.path);
      emit('upload-success', result.path);
      
      return result.path;
    }
    
    if (error.value) {
      emit('upload-error', error.value);
    }
    
    return null;
  } catch (e: any) {
    console.error('画像アップロードエラー:', e);
    emit('upload-error', e.message || '画像のアップロードに失敗しました');
    return null;
  } finally {
    emit('upload-finished');
  }
}

// 既存のパスから画像を設定
async function setExistingImage(path: string) {
  if (!path) return;
  preview.value = getImageUrl(path);
}

function clearImageData() {
  clearImage();
  emit('update:modelValue', null);
  emit('file-selected', null);
}

// コンポーネントのマウント時に既存の画像パスがある場合は表示
if (props.modelValue) {
  setExistingImage(props.modelValue);
}

// Base64形式のデータからファイルを復元するメソッド
async function restoreFileFromBase64(base64Data: string, fileName: string, fileType: string): Promise<boolean> {
  try {
    // Base64文字列をBlobに変換
    const byteString = atob(base64Data.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: fileType });
    const file = new File([blob], fileName, { type: fileType });
    
    // 画像処理を実行
    const success = await handleFileSelect(file);
    if (success) {
      fileDataBase64.value = base64Data;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('ファイル復元エラー:', error);
    return false;
  }
}

defineExpose({
  featuredImageInput,
  uploadImage: uploadImageToStorage,
  imageFile,
  preview,
  fileDataBase64,
  setPreview(previewData: string | null) {
    preview.value = previewData;
  },
  clearImage: clearImageData,
  setExistingImage,
  restoreFileFromBase64
});
</script> 