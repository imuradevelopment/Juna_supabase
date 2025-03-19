<template>
  <div>
    <label class="block text-sm font-medium mb-1 text-text-muted">アイキャッチ画像</label>
    <div class="flex items-center space-x-4">
      <div v-if="modelValue || preview" class="relative w-32 h-24 bg-surface-variant rounded overflow-hidden">
        <img 
          :src="preview || getCoverImageUrl(modelValue as string)" 
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PhX, PhImage } from '@phosphor-icons/vue';
import { getCoverImageUrl } from '../../../lib/storage';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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

const preview = ref<string | null>(null);
const featuredImageInput = ref<HTMLInputElement | null>(null);
const imageFile = ref<File | null>(null);
const isUploading = ref(false);

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
    
    if (props.richTextEditorRef) {
      preview.value = await props.richTextEditorRef.encodeImageToBase64(file);
      imageFile.value = file;
    } else {
      imageFile.value = file;
      preview.value = URL.createObjectURL(file);
    }
    
    emit('file-selected', file);
  } catch (error: any) {
    console.error('画像処理エラー:', error);
    alert(error.message || '画像の処理に失敗しました');
  } finally {
    const input = event.target as HTMLInputElement;
    if (input) input.value = '';
  }
}

// アイキャッチ画像をアップロードする関数
async function uploadImage(userId: string): Promise<string | null> {
  if (!imageFile.value) return null;
  
  isUploading.value = true;
  emit('upload-started');
  
  try {
    const file = imageFile.value;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uuidv4()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('cover_images')
      .upload(fileName, file);
    
    if (uploadError) throw uploadError;
    
    // アップロード成功時にパスを更新
    emit('update:modelValue', fileName);
    emit('upload-success', fileName);
    
    return fileName;
  } catch (error: any) {
    console.error('画像アップロードエラー:', error);
    emit('upload-error', error.message || '画像のアップロードに失敗しました');
    return null;
  } finally {
    isUploading.value = false;
    emit('upload-finished');
  }
}

function clearImage() {
  preview.value = null;
  imageFile.value = null;
  emit('update:modelValue', null);
  emit('file-selected', null);
}

defineExpose({
  featuredImageInput,
  uploadImage,
  imageFile
});
</script> 