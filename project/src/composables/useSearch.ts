import { ref } from 'vue';

interface SearchResult {
  id: string;
  title: string;
  content: any;
  excerpt: string;
  cover_image_path: string;
  published_at: string;
  author_id: string;
  author?: {
    id: string;
    nickname: string;
    avatar_data: string;
  };
  similarity?: number;
  score?: number;
}

interface SearchResponse {
  results: SearchResult[];
  count: number;
  query: string;
  searchType: 'keyword' | 'vector' | 'hybrid';
}

export const useSearch = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const results = ref<SearchResult[]>([]);

  const searchPosts = async (
    query: string,
    searchType: 'keyword' | 'vector' | 'hybrid' = 'hybrid',
    limit: number = 10
  ): Promise<SearchResponse | null> => {
    loading.value = true;
    error.value = null;
    results.value = [];

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-posts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            query,
            searchType,
            limit
          })
        }
      );

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const data: SearchResponse = await response.json();
      results.value = data.results;
      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '検索エラーが発生しました';
      console.error('検索エラー:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    searchPosts,
    loading,
    error,
    results
  };
};