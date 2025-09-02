import { beforeEach, describe, expect, it } from 'vitest'

// We will dynamically import after stubbing env to ensure `import.meta.env` is populated
const importStorage = async () => await import('./storage')

describe('storage url helpers', () => {
  beforeEach(() => {
    vi.unstubAllEnvs?.()
  })

  it('returns empty string for null/empty paths', async () => {
    const { getProfileImageUrl, getPostImageUrl, getCoverImageUrl } = await importStorage()
    expect(getProfileImageUrl(null)).toBe('')
    expect(getPostImageUrl(null)).toBe('')
    expect(getCoverImageUrl(null)).toBe('')
    expect(getProfileImageUrl('')).toBe('')
  })

  it('passes through absolute http(s) urls unchanged', async () => {
    const { getProfileImageUrl, getPostImageUrl, getCoverImageUrl } = await importStorage()
    const url = 'https://example.com/image.png'
    expect(getProfileImageUrl(url)).toBe(url)
    expect(getPostImageUrl(url)).toBe(url)
    expect(getCoverImageUrl(url)).toBe(url)
  })

  it('builds public URLs using VITE_SUPABASE_URL from .env', async () => {
    const { getProfileImageUrl, getPostImageUrl, getCoverImageUrl } = await import('./storage')
    const base = import.meta.env.VITE_SUPABASE_URL
    expect(typeof base).toBe('string')
    expect(base).toBeTruthy()

    expect(getProfileImageUrl('avatars/a.png')).toBe(`${base}/storage/v1/object/public/profile_images/avatars/a.png`)
    expect(getPostImageUrl('posts/p.png')).toBe(`${base}/storage/v1/object/public/post_images/posts/p.png`)
    expect(getCoverImageUrl('covers/c.png')).toBe(`${base}/storage/v1/object/public/cover_images/covers/c.png`)
  })
})
