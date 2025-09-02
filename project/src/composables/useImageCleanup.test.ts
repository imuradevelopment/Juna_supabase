import { beforeEach, describe, expect, it, vi } from 'vitest'

// Create hoisted mocks so vi.mock factory can use them
const hoisted = vi.hoisted(() => {
  const removePostMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const removeCoverMock = vi.fn().mockResolvedValue({ data: null, error: null })
  const fromMock = vi.fn((bucket: string) => ({
    remove: bucket === 'post_images' ? removePostMock : removeCoverMock,
  }))
  return { removePostMock, removeCoverMock, fromMock }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: { from: hoisted.fromMock },
  },
}))

import { useImageCleanup } from './useImageCleanup'

describe('useImageCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes images not present in new content', async () => {
    const { cleanupUnusedImages } = useImageCleanup()

    const oldHtml = `
      <p>text</p>
      <img src="${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/post_images/user1/old-a.webp" />
      <img src="${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/cover_images/user1/old-cover.webp" />
    `
    const newHtml = `
      <p>text</p>
      <img src="${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/post_images/user1/new-a.webp" />
    `

    const result = await cleanupUnusedImages(oldHtml, newHtml)
    expect(result.success).toBe(true)

    // Should delete old-a.webp from post_images and old-cover.webp from cover_images
    expect(hoisted.fromMock).toHaveBeenCalledWith('post_images')
    expect(hoisted.fromMock).toHaveBeenCalledWith('cover_images')
    expect(hoisted.removePostMock).toHaveBeenCalledWith(['user1/old-a.webp'])
    expect(hoisted.removeCoverMock).toHaveBeenCalledWith(['user1/old-cover.webp'])
  })

  it('no deletions when content unchanged', async () => {
    const { cleanupUnusedImages } = useImageCleanup()
    const html = `<img src="/storage/v1/object/public/post_images/u/a.webp" />`
    const result = await cleanupUnusedImages(html, html)
    expect(result.success).toBe(true)
    expect(hoisted.removePostMock).not.toHaveBeenCalled()
    expect(hoisted.removeCoverMock).not.toHaveBeenCalled()
  })

  it('explicit cover image removal handled', async () => {
    const { cleanupUnusedImages } = useImageCleanup()
    const result = await cleanupUnusedImages('', '', 'cover_images/u/old.webp', null)
    expect(result.success).toBe(true)
    expect(hoisted.removeCoverMock).toHaveBeenCalledWith(['u/old.webp'])
  })
})
