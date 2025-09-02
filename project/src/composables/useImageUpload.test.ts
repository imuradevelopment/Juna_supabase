import { describe, expect, it, vi } from 'vitest'
import { useImageUpload } from './useImageUpload'

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: { from: vi.fn(() => ({ upload: vi.fn(), remove: vi.fn() })) },
  },
}))

describe('useImageUpload helpers', () => {
  it('getImageUrl maps bucket to helper', () => {
    const base = import.meta.env.VITE_SUPABASE_URL
    const profile = useImageUpload('profile_images')
    const post = useImageUpload('post_images')
    const cover = useImageUpload('cover_images')

    expect(profile.getImageUrl('u/a.webp')).toBe(`${base}/storage/v1/object/public/profile_images/u/a.webp`)
    expect(post.getImageUrl('u/a.webp')).toBe(`${base}/storage/v1/object/public/post_images/u/a.webp`)
    expect(cover.getImageUrl('u/a.webp')).toBe(`${base}/storage/v1/object/public/cover_images/u/a.webp`)
  })

  it('clearImage resets state', () => {
    const { preview, originalFile, processedFile, uploadResult, imageInfo, clearImage } = useImageUpload('post_images')
    ;(preview as any).value = 'data:'
    ;(originalFile as any).value = {} as File
    ;(processedFile as any).value = {} as File
    ;(uploadResult as any).value = { path: 'x' }
    ;(imageInfo as any).value = { width: 1, height: 1 }

    clearImage()

    expect(preview.value).toBeNull()
    expect(originalFile.value).toBeNull()
    expect(processedFile.value).toBeNull()
    expect(uploadResult.value).toBeNull()
    expect(imageInfo.value).toBeNull()
  })
})

