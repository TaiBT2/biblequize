import { apiClient } from './client'

export interface CosmeticItem {
  id: string
  name: string
  tier: number
  unlocked: boolean
  active: boolean
}

export interface CosmeticsData {
  activeFrame: string
  activeTheme: string
  frames: CosmeticItem[]
  themes: CosmeticItem[]
}

export async function getCosmetics(): Promise<CosmeticsData> {
  const res = await apiClient.get('/api/me/cosmetics')
  return res.data
}

export async function updateCosmetics(body: { activeFrame?: string; activeTheme?: string }): Promise<CosmeticsData> {
  const res = await apiClient.patch('/api/me/cosmetics', body)
  return res.data
}
