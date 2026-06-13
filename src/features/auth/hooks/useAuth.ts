import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/shared/store/auth'
import * as authApi from '../api'

export function useLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.user) setUser(data.user)
      // Post-login redirect: return to the page that sent the user to /login
      // (e.g. an invite link), otherwise go to org selection.
      const from = (location.state as { from?: unknown } | null)?.from
      navigate(typeof from === 'string' && from.startsWith('/') ? from : '/orgs/select')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      if (data.user) setUser(data.user)
      navigate('/orgs/select')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return async () => {
    try {
      await authApi.logout()
    } catch {
      // proceed with local logout even if API call fails
    }
    logout()
    navigate('/login')
  }
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  })
}

export function useChangePassword() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: authApi.changePassword,
    // The backend revokes every session of the user on success, so the
    // local session is dead - force re-login and explain why on the login page.
    onSuccess: () => {
      logout()
      navigate('/login', { state: { passwordChanged: true } })
    },
  })
}

export function useAuthSessions() {
  return useQuery({
    queryKey: ['auth-sessions'],
    queryFn: authApi.listSessions,
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth-sessions'] }),
  })
}

export function useRevokeAllSessions() {
  const performLogout = useLogout()

  return useMutation({
    mutationFn: () => authApi.revokeAllSessions(),
    // "Sign out everywhere" also kills the current device's session, so finish
    // with a full logout (clears cookies + local state + redirect).
    onSuccess: () => performLogout(),
  })
}
