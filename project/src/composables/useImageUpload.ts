import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import { getProfileImageUrl, getPostImageUrl, getCoverImageUrl } from '../lib/storage'

// 画像圧縮ライブラリをインポート
import imageCompression from 'browser-image-compression'

export type ImageBucket = 'profile_images' | 'post_images' | 'cover_images'
export type ImageFormat = 'original' | 'webp' | 'jpeg' | 'png'

export interface ImageProcessingOptions {
  // 最大ファイルサイズ (MB)
  maxSizeMB?: number
  // 画像の最大幅 (px)
  maxWidthOrHeight?: number
  // ユーザーID (パス生成用)
  userId?: string
  // 一意のファイル名を生成するか
  generateUniqueName?: boolean
  // 変換後の画像フォーマット
  outputFormat?: ImageFormat
  // 変換時の画質 (0-1)
  quality?: number
  // 常に圧縮するか (最大サイズ以下でも圧縮するか)
  alwaysCompress?: boolean
  // ファイル名のプレフィックス
  fileNamePrefix?: string
}

export interface UploadResult {
  path: string
  url: string
  size: number
  format: string
  width: number
  height: number
  originalSize: number
  compressionRatio: number
}

export function useImageUpload(bucket: ImageBucket, options: ImageProcessingOptions = {}) {
  const {
    maxSizeMB = 2,
    maxWidthOrHeight = 1920,
    userId = '',
    generateUniqueName = true,
    outputFormat = 'webp',
    quality = 0.8,
    alwaysCompress = false,
    fileNamePrefix = ''
  } = options

  const preview = ref<string | null>(null)
  const originalFile = ref<File | null>(null)
  const processedFile = ref<File | null>(null)
  const isUploading = ref(false)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const uploadResult = ref<UploadResult | null>(null)
  
  // 画像の寸法情報
  const imageInfo = ref<{width: number, height: number} | null>(null)
  
  // 画像フォーマットのMIMEタイプを取得
  const getMimeType = (format: ImageFormat, originalType: string): string => {
    if (format === 'original') return originalType
    switch (format) {
      case 'webp': return 'image/webp'
      case 'jpeg': return 'image/jpeg'
      case 'png': return 'image/png'
      default: return 'image/webp'
    }
  }
  
  // 拡張子を取得
  const getExtension = (format: ImageFormat, originalFile: File): string => {
    if (format === 'original') {
      const ext = originalFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      return ext
    }
    return format
  }
  
  // 画像の寸法を取得
  const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        })
      }
      img.src = URL.createObjectURL(file)
    })
  }
  
  // ファイルの検証（サイズチェック）
  const validateFile = (file: File): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes && !alwaysCompress) {
      error.value = `画像サイズは${maxSizeMB}MB以下にしてください`
      return false
    }
    return true
  }
  
  // Base64エンコード処理
  const encodeToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error('画像のエンコードに失敗しました'))
        }
      }
      reader.onerror = (e) => reject(e)
      reader.readAsDataURL(file)
    })
  }
  
  // 画像圧縮処理
  const compressImage = async (file: File, customOptions?: Partial<ImageProcessingOptions>): Promise<File> => {
    isProcessing.value = true
    error.value = null
    
    try {
      // カスタムオプションと既存のオプションをマージ
      const mergedOptions = {
        maxSizeMB: customOptions?.maxSizeMB || maxSizeMB,
        maxWidthOrHeight: customOptions?.maxWidthOrHeight || maxWidthOrHeight,
        quality: customOptions?.quality || quality,
        fileType: getMimeType(customOptions?.outputFormat || outputFormat, file.type)
      }
      
      // 圧縮が必要かチェック
      const maxSizeBytes = mergedOptions.maxSizeMB * 1024 * 1024
      const needsCompression = alwaysCompress || file.size > maxSizeBytes
      
      if (!needsCompression && customOptions?.outputFormat === 'original') {
        return file
      }
      
      // 画像圧縮実行
      const compressedFile = await imageCompression(file, {
        maxSizeMB: mergedOptions.maxSizeMB,
        maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
        useWebWorker: true,
        fileType: mergedOptions.fileType,
        initialQuality: mergedOptions.quality
      })
      
      // 画像の寸法情報を取得
      imageInfo.value = await getImageDimensions(compressedFile)
      
      // 元の名前を基に新しいファイル名を生成
      const extension = getExtension(customOptions?.outputFormat || outputFormat, file)
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'))
      const newFilename = `${nameWithoutExt}.${extension}`
      
      // 新しいFilesオブジェクトを作成（名前を修正）
      return new File([compressedFile], newFilename, { 
        type: mergedOptions.fileType,
        lastModified: new Date().getTime()
      })
    } catch (err: any) {
      console.error('画像圧縮エラー:', err)
      error.value = err.message || '画像の圧縮に失敗しました'
      throw err
    } finally {
      isProcessing.value = false
    }
  }
  
  // ファイル選択処理
  const handleFileSelect = async (file: File, processOptions?: Partial<ImageProcessingOptions>): Promise<boolean> => {
    error.value = null
    
    if (!validateFile(file)) {
      return false
    }
    
    try {
      originalFile.value = file
      
      // オプションに基づいて画像を処理
      const shouldProcess = alwaysCompress || 
                          processOptions?.alwaysCompress || 
                          file.size > (processOptions?.maxSizeMB || maxSizeMB) * 1024 * 1024 ||
                          (processOptions?.outputFormat || outputFormat) !== 'original'
      
      if (shouldProcess) {
        processedFile.value = await compressImage(file, processOptions)
      } else {
        processedFile.value = file
      }
      
      // プレビュー用にBase64を生成
      preview.value = await encodeToBase64(processedFile.value)
      
      // 画像の寸法情報を取得（未取得の場合）
      if (!imageInfo.value) {
        imageInfo.value = await getImageDimensions(processedFile.value)
      }
      
      return true
    } catch (err: any) {
      error.value = err.message || '画像の処理に失敗しました'
      return false
    }
  }
  
  // 画像アップロード処理
  const uploadImage = async (customUserId?: string, uploadOptions?: Partial<ImageProcessingOptions>): Promise<UploadResult | null> => {
    if (!processedFile.value) return null;
    
    const userIdToUse = customUserId || userId
    if (!userIdToUse) {
      error.value = 'ユーザーIDが指定されていません'
      return null
    }
    
    isUploading.value = true
    error.value = null
    
    try {
      // バケット名の検証
      if (!['profile_images', 'post_images', 'cover_images'].includes(bucket)) {
        throw new Error(`無効なバケット名: ${bucket}。許可されるバケット: profile_images, post_images, cover_images`);
      }
      
      const file = processedFile.value
      const originalSize = originalFile.value?.size || 0
      const fileExt = getExtension(uploadOptions?.outputFormat || outputFormat, file)
      const prefix = (uploadOptions?.fileNamePrefix || fileNamePrefix) ? 
                    `${uploadOptions?.fileNamePrefix || fileNamePrefix}_` : ''
      
      let fileName = file.name
      
      if (generateUniqueName) {
        fileName = `${userIdToUse}/${prefix}${uuidv4()}.${fileExt}`
      }
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)
      
      if (uploadError) throw uploadError
      
      // 結果オブジェクトを作成
      uploadResult.value = {
        path: fileName,
        url: getImageUrl(fileName),
        size: file.size,
        format: fileExt,
        width: imageInfo.value?.width || 0,
        height: imageInfo.value?.height || 0,
        originalSize: originalSize,
        compressionRatio: originalSize > 0 ? file.size / originalSize : 1
      }
      
      return uploadResult.value
    } catch (err: any) {
      console.error('画像アップロードエラー:', err)
      error.value = err.message || '画像のアップロードに失敗しました'
      return null
    } finally {
      isUploading.value = false
    }
  }
  
  // 画像の削除処理
  const clearImage = () => {
    preview.value = null
    originalFile.value = null
    processedFile.value = null
    uploadResult.value = null
    imageInfo.value = null
  }
  
  // 画像URLを取得
  const getImageUrl = (path: string | null): string => {
    if (!path) return ''
    
    switch (bucket) {
      case 'profile_images':
        return getProfileImageUrl(path)
      case 'post_images':
        return getPostImageUrl(path)
      case 'cover_images':
        return getCoverImageUrl(path)
      default:
        return ''
    }
  }
  
  // 既存の画像パスからファイルを取得して処理
  const processExistingImage = async (imagePath: string, processOptions?: Partial<ImageProcessingOptions>): Promise<boolean> => {
    try {
      const url = getImageUrl(imagePath)
      if (!url) return false
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('画像の取得に失敗しました')
      
      const blob = await response.blob()
      const fileName = imagePath.split('/').pop() || 'image.jpg'
      const file = new File([blob], fileName, { type: blob.type })
      
      return await handleFileSelect(file, processOptions)
    } catch (err: any) {
      error.value = err.message || '既存画像の処理に失敗しました'
      return false
    }
  }
  
  return {
    // 状態
    preview,
    originalFile,
    processedFile,
    isUploading,
    isProcessing,
    error,
    uploadResult,
    imageInfo,
    
    // メソッド
    handleFileSelect,
    uploadImage,
    clearImage,
    encodeToBase64,
    getImageUrl,
    compressImage,
    processExistingImage
  }
} 