import { apiClient } from '@/shared/api/client'

export async function cookieConsent(): Promise<void> {
  await apiClient.post('/consent/cookie', { consent: true })
}
