import { getStaticSuggestions } from '@/lib/static-catalog';

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  category: string;
  effectivePrice: number;
  image: string | null;
}

export const searchApi = {
  suggestions(q: string): Promise<SearchSuggestion[]> {
    return Promise.resolve(getStaticSuggestions(q));
  },
};