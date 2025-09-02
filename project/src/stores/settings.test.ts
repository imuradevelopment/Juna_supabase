import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const hoisted = vi.hoisted(() => {
  const selectMock = vi.fn()
  const updateEqMock = vi.fn().mockResolvedValue({ error: null })
  const updateMock = vi.fn(() => ({ eq: updateEqMock }))
  const fromMock = vi.fn(() => ({ select: selectMock, update: updateMock }))

  // channel mocks
  let savedCallback: ((payload: any) => void) | null = null
  const subscribeReturn = { id: 'ch1' }
  const onMock = vi.fn((_evt, _filter, cb) => {
    savedCallback = cb
    return channelApi
  })
  const subscribeMock = vi.fn(() => subscribeReturn)
  const channelApi = { on: onMock, subscribe: subscribeMock }

  const removeChannelMock = vi.fn()

  return { selectMock, updateMock, updateEqMock, fromMock, onMock, subscribeMock, saved: () => savedCallback, removeChannelMock, subscribeReturn }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: hoisted.fromMock,
    channel: vi.fn(() => ({ on: hoisted.onMock, subscribe: hoisted.subscribeMock })),
    removeChannel: hoisted.removeChannelMock,
  },
}))

import { useSettingsStore } from './settings'

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.documentElement.style.cssText = ''
    vi.clearAllMocks()
  })

  it('fetchSettings populates state and applies theme', async () => {
    const themeColors = { primary: '#112233', text: '#aabbcc' } as any
    hoisted.selectMock.mockResolvedValueOnce({ data: [
      { key: 'theme', value: { colors: themeColors } },
      { key: 'site_metadata', value: { siteName: 'MySite', siteDescription: 'Desc', siteKeywords: '', copyrightText: '', logoText: '' } },
      { key: 'features', value: { enableComments: true, enableLikes: false, requireEmailVerification: false } },
      { key: 'domain_texts', value: { heroTitle: 'Hero', heroSubtitle: 'Sub', aboutTitle: '', aboutDescription: '', feature1Title: '', feature1Description: '', feature2Title: '', feature2Description: '', feature3Title: '', feature3Description: '', targetDisabilitiesTitle: '', targetDisabilities: [], callToAction: '', startPostingButton: '', viewPostsButton: '', recentPostsTitle: '', viewAllPosts: '', noRecentPosts: '' } },
    ], error: null })

    const store = useSettingsStore()
    await store.fetchSettings()

    expect(store.siteName).toBe('MySite')
    expect(store.features.enableComments).toBe(true)
    // theme applied -> CSS variables set
    const style = document.documentElement.style as any
    expect(style.getPropertyValue('--color-primary')).toBe('17 34 51')
    expect(style.getPropertyValue('--color-text')).toBe('170 187 204')
  })

  it('updateSetting persists and updates local state', async () => {
    const store = useSettingsStore()
    const newFeatures = { enableComments: false, enableLikes: true, requireEmailVerification: true }
    const res = await store.updateSetting('features', newFeatures)
    expect(res.success).toBe(true)
    expect(store.features).toEqual(newFeatures)
    expect(hoisted.updateMock).toHaveBeenCalled()
    expect(hoisted.updateEqMock).toHaveBeenCalledWith('key', 'features')
  })

  it('subscribeToSettings reacts to changes and returns cleanup', () => {
    const store = useSettingsStore()
    const stop = store.subscribeToSettings()

    // simulate realtime payload
    hoisted.saved()?.({ new: { key: 'features', value: { enableComments: true, enableLikes: true, requireEmailVerification: false } } })
    expect(store.features.enableLikes).toBe(true)

    // cleanup unsubscribes via removeChannel
    stop()
    expect(hoisted.removeChannelMock).toHaveBeenCalled()
  })
})
