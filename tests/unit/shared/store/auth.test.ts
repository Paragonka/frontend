import { useAuthStore } from '@/shared/store/auth'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it('stores user', () => {
    const user = { id: '1', email: 'test@test.com', full_name: 'Test' }
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('stores current org', () => {
    useAuthStore.getState().setCurrentOrg('org1')
    expect(useAuthStore.getState().currentOrgId).toBe('org1')
  })

  it('clears state on logout', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'e', full_name: 'n' })
    useAuthStore.getState().setCurrentOrg('org1')
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().currentOrgId).toBeNull()
  })

  it('persists state to localStorage', () => {
    useAuthStore.getState().setUser({ id: '2', email: 'persist@test.com', full_name: 'Persist' })
    useAuthStore.getState().setCurrentOrg('org-persist')

    const raw = localStorage.getItem('paragonka-auth')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.user?.email).toBe('persist@test.com')
    expect(parsed.state.currentOrgId).toBe('org-persist')
  })

  it('restores state from localStorage', () => {
    localStorage.setItem(
      'paragonka-auth',
      JSON.stringify({
        state: {
          user: { id: '3', email: 'restore@test.com', full_name: 'Restore' },
          currentOrgId: 'org-restore',
        },
        version: 0,
      }),
    )

    useAuthStore.persist.rehydrate()
    const state = useAuthStore.getState()
    expect(state.user?.email).toBe('restore@test.com')
    expect(state.currentOrgId).toBe('org-restore')
  })
})
