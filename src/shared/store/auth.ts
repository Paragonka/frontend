import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/shared/types'

interface AuthState {
  user: User | null
  currentOrgId: string | null
  setUser: (user: User) => void
  setCurrentOrg: (orgId: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      currentOrgId: null,
      setUser: (user) => set({ user }),
      setCurrentOrg: (orgId) => set({ currentOrgId: orgId }),
      logout: () => set({ user: null, currentOrgId: null }),
    }),
    { name: 'paragonka-auth' },
  ),
)
