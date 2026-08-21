import { apiFetch } from '@/lib/api';

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  category: string;
  effectivePrice: number;
  image: string | null;
}

export interface PopularSearch {
  name: string;
  slug: string;
}

export const searchApi = {
  suggestions(q: string): Promise<SearchSuggestion[]> {
    return apiFetch(`/search/suggestions?q=${encodeURIComponent(q)}`);
  },
  popular(): Promise<PopularSearch[]> {
    return apiFetch('/search/popular');
  },
};