export const useSearchProducts = (searchTerm) => {
  return useQuery({
    queryKey: ["searchProducts", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const response = await searchApi.searchProducts(searchTerm);
      return response;
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 5 * 60 * 1000, 
  });
};export const useSearchResults = (queryParams) => {
  return useQuery({
    queryKey: ["searchResults", queryParams],
    queryFn: async () => {
      const response = await searchApi.searchResults(queryParams);
      return response;
    },
    enabled: !!queryParams && (!!queryParams.q || !!queryParams.type || !!queryParams.category),
    staleTime: 5 * 60 * 1000,
  });
};

export default { useSearchProducts, useSearchResults };


