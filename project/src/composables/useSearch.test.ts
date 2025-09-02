import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSearch } from './useSearch'

const base = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

describe('useSearch', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('successfully searches and returns results', async () => {
    const mockResults = [{ id: '1', title: 'Post', content: {}, excerpt: '', cover_image_path: '', published_at: '', author_id: 'u1' }]
    const json = vi.fn().mockResolvedValue({ results: mockResults, count: 1, query: 'vue', searchType: 'hybrid' })
    const fetchMock = vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true, json } as any)

    const { searchPosts, results, error, loading } = useSearch()
    const res = await searchPosts('vue', 'keyword', 5)

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(res?.results).toEqual(mockResults)
    expect(results.value).toEqual(mockResults)

    expect(fetchMock).toHaveBeenCalledWith(
      `${base}/functions/v1/search-posts`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${anon}`,
          'Content-Type': 'application/json',
        }),
      })
    )
  })

  it('handles non-ok response as error', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: false, json: vi.fn() } as any)
    const { searchPosts, error } = useSearch()
    const res = await searchPosts('oops')
    expect(res).toBeNull()
    expect(error.value).toBe('検索に失敗しました')
  })

  it('handles thrown exceptions', async () => {
    vi.spyOn(global, 'fetch' as any).mockRejectedValue(new Error('network'))
    const { searchPosts, error } = useSearch()
    const res = await searchPosts('vue')
    expect(res).toBeNull()
    expect(error.value).toBe('network')
  })
})

