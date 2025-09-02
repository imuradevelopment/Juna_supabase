import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import SearchPage from './SearchPage.vue'

describe('SearchPage integration', () => {

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const mountWithRouter = async (path = '/search') => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/search', component: SearchPage }],
    })
    await router.push(path)
    await router.isReady()
    const wrapper = mount(SearchPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: false, PhMagnifyingGlass: true, PhSpinner: true, PhUser: true },
      },
    })
    return { wrapper, router }
  }

  it('submits query, triggers search, and displays results', async () => {
    const fetchMock = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { id: 'p1', title: 'Result for vue', excerpt: 'ex', published_at: '2024-01-01', author: { id: 'u', nickname: 'nick', avatar_data: '' } },
        ],
        count: 1,
        query: 'vue',
        searchType: 'keyword',
      }),
    } as any)
    const { wrapper } = await mountWithRouter()
    const input = wrapper.get('input[type="search"]')
    await input.setValue('vue')
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    await nextTick()
    expect(fetchMock).toHaveBeenCalled()
    // results visible
    expect(wrapper.text()).toContain('「vue」の検索結果: 1 件')
    expect(wrapper.text()).toContain('Result for vue')
  })

  it('shows empty state when no results', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [], count: 0, query: 'none', searchType: 'keyword' }),
    } as any)
    const { wrapper } = await mountWithRouter()
    const input = wrapper.get('input[type="search"]')
    await input.setValue('none')
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toContain('に一致する投稿が見つかりませんでした')
  })
})
