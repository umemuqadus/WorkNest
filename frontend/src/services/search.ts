import { api } from '@/lib/api'
import type { SearchResults } from '@/types'

export const searchApi = {
  async search(q: string, limit = 5): Promise<SearchResults> {
    const { data } = await api.get<SearchResults>(`/search?q=${encodeURIComponent(q)}&limit=${limit}`)
    return data
  },
}
