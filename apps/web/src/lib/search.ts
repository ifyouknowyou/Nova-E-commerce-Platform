import { apiFetch } from '@/lib/api';
import { getStaticSuggestions, STATIC_CATALOG_MODE } from '@/lib/static-catalog';

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
    if (STATIC_CATALOG_MODE) return Promise.resolve(getStaticSuggestions(q));
    return apiFetch(`/search/suggestions?q=${encodeURIComponent(q)}`);
  },
  popular(): Promise<PopularSearch[]> {
    if (STATIC_CATALOG_MODE) {
      return Promise.resolve(
        getStaticSuggestions('').map(({ name, slug }) => ({ name, slug })),
      );
    }
    return apiFetch('/search/popular');
  },
};