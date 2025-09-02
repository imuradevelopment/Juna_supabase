import { describe, it, expect, vi } from 'vitest'
import { useNotification, type NotificationsComponent } from './useNotification'

describe('useNotification', () => {
  it('delegates to NotificationsComponent when set', () => {
    const added: any[] = []
    const mock: NotificationsComponent = {
      addNotification: (n) => added.push(n),
      removeNotification: vi.fn(),
      clearAllNotifications: vi.fn(),
      notifications: [],
    }

    const api = useNotification()
    api.setNotificationsRef(mock)

    api.showSuccess('OK')
    api.showError('NG')
    api.showInfo('FYI')
    api.showWarning('Careful')

    expect(added).toHaveLength(4)
    expect(added[0]).toMatchObject({ type: 'success', title: '成功', message: 'OK' })
    expect(added[1]).toMatchObject({ type: 'error', title: 'エラー', message: 'NG' })
  })

  it('clearAllNotifications calls underlying implementation', () => {
    const mock: NotificationsComponent = {
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      clearAllNotifications: vi.fn(),
      notifications: [],
    }
    const api = useNotification()
    api.setNotificationsRef(mock)
    api.clearAllNotifications()
    expect(mock.clearAllNotifications).toHaveBeenCalled()
  })

  it('showConfirm proxies to window.confirm', async () => {
    // jsdom may not provide confirm by default
    const confirmSpy = vi.fn().mockReturnValue(true)
    ;(window as any).confirm = confirmSpy

    const api = useNotification()
    const ok = await api.showConfirm('Title', 'Message')
    expect(ok).toBe(true)
    expect(confirmSpy).toHaveBeenCalled()
  })
})
