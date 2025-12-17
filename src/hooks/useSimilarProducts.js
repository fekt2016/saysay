export const useSimilarProducts = (userId, options = ) => {
  return useQuery({
    queryKey: ['similar-products', userId],
    queryFn: async () => {
      if (!userId) {
        return { data: { products: [] } };
      }

      const response = await api.get(`/product/similar?userId=${userId}&limit=${options.limit || 10}`);

      const products = response.data?.data?.products || response.data?.products || [];

      return {
        data: {
          products,
        },
      };
    },
    enabled: !!userId && (options.enabled !== false),
    staleTime: 1000 * 60 * 5, 
    retry: 2,
    ...options,
  });
};


