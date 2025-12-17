import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from '../services/productApi';

const useProduct = () => {
  const queryClient = useQueryClient();

  
  const getProducts = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
        const response = await productService.getAllProducts();
        console.log("response", response);
        return response;
    },
    staleTime: 1000 * 60 * 5, 
    retry: (failureCount, error) => {
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('[useProduct] Timeout error - not retrying');
        return false;
      }
      
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), 
  });

  
  const useGetProductById = (id) =>
    useQuery({
      queryKey: ["products", id],
      queryFn: async () => {
        if (!id) return null;
        try {
          const res = await productService.getProductById(id);

          return res.data;
        } catch (error) {
          console.error(`Failed to fetch product ${id}:`, error);
          throw new Error(`Failed to load product: ${error.message}`);
        }
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5, 
      retry: 2, 
    });

  
  const useGetAllProductBySeller = (sellerId) => {
    console.log(" product hooksellerId", sellerId);
    return useQuery({
      queryKey: ["products", sellerId],
      queryFn: async () => {
        if (!sellerId) return null;
        try {
          return await productService.getAllProductsBySeller(sellerId);
        } catch (error) {
          throw new Error(`Failed to load seller products: ${error.message}`);
        }
      },
      enabled: !!sellerId,
      staleTime: 1000 * 60 * 2, 
    });
  };

  
  const useGetAllPublicProductBySeller = (sellerId) => {
    return useQuery({
      queryKey: ["products", sellerId],
      queryFn: async () => {
        if (!sellerId) {
          console.log("⚠️ [useGetAllPublicProductBySeller] No sellerId provided");
          return [];
        }
        try {
          console.log("🔍 [useGetAllPublicProductBySeller] Fetching products for seller:", sellerId);
          const response = await productService.getAllPublicProductsBySeller(
            sellerId
          );

          console.log("🔍 [useGetAllPublicProductBySeller] Response received:", response);
       

          
          
          
          
          if (response.data?.products && Array.isArray(response.data.products)) {
            console.log("✅ [useGetAllPublicProductBySeller] Found products at response.data.products:", response.data.products.length);
            return response.data.products;
          }
          
          if (response.data?.data?.products && Array.isArray(response.data.data.products)) {
            console.log("✅ [useGetAllPublicProductBySeller] Found products at response.data.data.products:", response.data.data.products.length);
            return response.data.data.products;
          }
          
          if (response.products && Array.isArray(response.products)) {
            console.log("✅ [useGetAllPublicProductBySeller] Found products at response.products:", response.products.length);
            return response.products;
          }
          
          if (Array.isArray(response)) {
            console.log("✅ [useGetAllPublicProductBySeller] Response is array:", response.length);
            return response;
          }
          console.warn("⚠️ [useGetAllPublicProductBySeller] Could not extract products array from response");
          console.warn("⚠️ [useGetAllPublicProductBySeller] Response structure:", JSON.stringify(response, null, 2));
          return [];
        } catch (error) {
          console.error("Error fetching products:", error);
          console.error("❌ [useGetAllPublicProductBySeller] Error:", error);
          return [];
        }
      },
      enabled: !!sellerId,
      staleTime: 1000 * 60 * 2, 
      
      retry: (failureCount, error) => {
        if (error.message.includes("404")) return false;
        return failureCount < 2;
      },
    });
  };

  const createProduct = useMutation({
    mutationFn: (formData) => productService.createProduct(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  
  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => productService.updateProduct(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries(["product"]);
      console.log("product updated successfully!!!"); 
    },
  });

  
  const deleteProduct = useMutation({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.getQueryData(["product"]);
      console.log("product deleted successfully!!!"); 
    },
  });

  
  const getProductCountByCategory = useQuery({
    queryKey: ["productCountByCategory"],
    queryFn: () => productService.getProductCountByCategory(),
    onSuccess: () => {
      queryClient.invalidateQueries(["productCountByCategory"]);
      console.log("product count by category updated successfully!!!"); 
    },
  });

  const useSimilarProduct = (categoryId, currentProductId) => {
    return useQuery({
      queryKey: ["similarProducts", categoryId, currentProductId],
      queryFn: async () => {
        try {
          if (!categoryId || !currentProductId) return null;
          const res = await productService.getSimilarProducts(
            categoryId,
            currentProductId
          );
          return res.data.filter((product) => product.id !== currentProductId);
        } catch (error) {
          throw new Error(`Failed to load similar products: ${error.message}`);
        }
      },
      enabled: !!categoryId && !!currentProductId,
    });
  };

  const useGetProductsByCategory = (categoryId, params = {}) => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (key === "subcategories" && Array.isArray(value)) {
        queryParams.set(key, value.join(","));
      } else if (value !== undefined && value !== null) {
        queryParams.set(key, value);
      }
    });

    return useQuery({
      queryKey: ["products", params],
      queryFn: async () => {
        if (!categoryId) return null;
        try {
          return await productService.getProductsByCategory(
            categoryId,
            queryParams
          );
        } catch (error) {
          throw new Error(
            `Failed to load products by category: ${error.message}`
          );
        }
      },
      enabled: !!categoryId,
    });
  };

  return {
    getProducts,
    useGetProductById,
    useGetProductsByCategory,
    useGetAllProductBySeller,
    useGetAllPublicProductBySeller,
    getProductCountByCategory,
    useSimilarProduct,
    createProduct: {
      mutate: createProduct.mutate,
      isPending: createProduct.isPending,
      error: createProduct.error,
    },
    updateProduct: {
      mutate: updateProduct.mutate,
      isPending: updateProduct.isPending,
      error: updateProduct.error,
    },
    deleteProduct: {
      mutate: deleteProduct.mutate,
      isLoading: deleteProduct.isPending,
      error: deleteProduct.error,
    },
  };
};

export default useProduct;
