import { useQuery } from '@tanstack/react-query';
import searchApi from '../services/searchApi';

/**
 * Hook for search suggestions (autocomplete)
 * @param {string} searchTerm - Search term
 * @param {Object} options - Query options
 */
export const useSearchSuggestions = (searchTerm, options = {}) => {
  const { staleTime = 2 * 60 * 1000 } = options;

  return useQuery({
    queryKey: ["searchSuggestions", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return { success: true, data: [] };
      const response = await searchApi.searchSuggestions(searchTerm);

      return response;
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime,
    gcTime: 5 * 60 * 1000,
  });
};

export default useSearchSuggestions;
