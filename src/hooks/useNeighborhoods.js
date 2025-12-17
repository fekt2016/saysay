export const useSearchNeighborhoods = (query, city, enabled = true) => {
  return useQuery({
    queryKey: ['neighborhoods', 'search', query, city],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await neighborhoodService.searchNeighborhoods(query, city);
      return response?.data?.neighborhoods || response?.neighborhoods || [];
    },
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 1000 * 60 * 5, 
  });
};export const useGetNeighborhoodsByCity = (city, enabled = true) => {
  return useQuery({
    queryKey: ['neighborhoods', 'city', city],
    queryFn: async () => {
      if (!city) return [];
      const response = await neighborhoodService.getNeighborhoodsByCity(city);
      return response?.data?.neighborhoods || response?.neighborhoods || [];
    },
    enabled: enabled && !!city,
    staleTime: 1000 * 60 * 5, 
  });
};export const useGetNeighborhood = (id, enabled = true) => {
  return useQuery({
    queryKey: ['neighborhoods', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await neighborhoodService.getNeighborhood(id);
      return response?.data?.neighborhood || response?.neighborhood || null;
    },
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, 
  });
};


