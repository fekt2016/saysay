import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import wishlistApi, { getSessionId, clearSessionId } from '../services/wishlistApi';
import useAuth from './useAuth';
import * as SecureStore from 'expo-secure-store';

const getWishlistQueryKey = async (userId) => {
  if (userId) return ["wishlist", userId];
  const sessionId = await getSessionId();
  return ["wishlist", "guest", sessionId];
};

export const useWishlist = () => {
  const { userData } = useAuth();
  const user = userData?.data?.data || userData?.data || userData || {};

  return useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      try {
        if (user?.id) {
          const response = await wishlistApi.getWishlist();
          return response;
        } else {
          const response = await wishlistApi.getOrCreateGuestWishlist();
          return response;
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        return { data: { wishlist: { products: [] } } };
      }
    },
    enabled: true,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    meta: { global: false },
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  const { userData } = useAuth();
  const user = userData?.data?.data || userData?.data || userData || {};
  const queryKey = ["wishlist", user?.id];

  return useMutation({
    mutationFn: (productId) => wishlistApi.addToWishlist(productId),
    meta: { global: false },
    
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousWishlist = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        const wishlist = old?.data?.wishlist || old?.data || { products: [] };
        const products = wishlist.products || [];
        
        const exists = products.some(
          (item) => 
            item.product?._id === productId || 
            item.product === productId ||
            item.product?.id === productId
        );

        if (exists) {
          return old;
        }

        return {
          ...old,
          data: {
            ...old?.data,
            wishlist: {
              ...wishlist,
              products: [
                ...products,
                {
                  product: { _id: productId },
                  addedAt: new Date().toISOString(),
                },
              ],
            },
          },
        };
      });

      return { previousWishlist };
    },

    onError: (err, productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(queryKey, context.previousWishlist);
      }
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  const { userData } = useAuth();
  const user = userData?.data?.data || userData?.data || userData || {};
  const queryKey = ["wishlist", user?.id];

  return useMutation({
    mutationFn: (productId) => wishlistApi.removeFromWishlist(productId),
    meta: { global: false },
    
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousWishlist = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        const wishlist = old?.data?.wishlist || old?.data || { products: [] };
        const products = wishlist.products || [];
        
        const filteredProducts = products.filter(
          (item) =>
            item.product?._id !== productId &&
            item.product !== productId &&
            item.product?.id !== productId
        );

        return {
          ...old,
          data: {
            ...old?.data,
            wishlist: {
              ...wishlist,
              products: filteredProducts,
            },
          },
        };
      });

      return { previousWishlist };
    },

    onError: (err, productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(queryKey, context.previousWishlist);
      }
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      });
    },
  });
};

export const useCheckInWishlist = (productId) => {
  const { userData } = useAuth();
  const user = userData?.data?.data || userData?.data || userData || {};
  const { data: wishlistData } = useWishlist();
  
  const isInWishlistFromData = wishlistData?.data?.wishlist?.products?.some(
    (item) =>
      item.product?._id === productId ||
      item.product === productId ||
      item.product?.id === productId
  ) || false;

  const checkQuery = useQuery({
    queryKey: ["wishlist", "check", productId, user?.id],
    queryFn: async () => await wishlistApi.checkInWishlist(productId),
    enabled: !!productId && !!user?.id && !wishlistData,
    staleTime: 10 * 1000,
    meta: { global: false },
  });

  return {
    inWishlist: wishlistData ? isInWishlistFromData : checkQuery.data?.inWishlist || false,
    isLoading: wishlistData ? false : checkQuery.isLoading,
  };
};

export const useMergeWishlists = () => {
  const queryClient = useQueryClient();
  const { userData } = useAuth();
  const user = userData?.data?.data || userData?.data || userData || {};

  return useMutation({
    mutationFn: async () => {
      const response = await wishlistApi.mergeWishlists();
      return response;
    },
    onSuccess: async () => {
      await clearSessionId();
      queryClient.invalidateQueries({
        queryKey: ["wishlist"],
        refetchType: 'active',
      });
    },
  });
};

export const useToggleWishlist = (productId) => {
  const { data: wishlist, isLoading } = useWishlist();
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveFromWishlist();

  const isInWishlist = (
    wishlist?.data?.wishlist?.products ||
    wishlist?.data?.products ||
    []
  ).some(
    (item) =>
      item.product?._id === productId ||
      item.product === productId ||
      item.product?.id === productId
  );

  const toggleWishlist = async () => {
    if (!productId) return;

    if (isInWishlist) {
      await removeMutation.mutateAsync(productId);
    } else {
      await addMutation.mutateAsync(productId);
    }
  };

  return {
    toggleWishlist,
    isInWishlist,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isLoading: isLoading || addMutation.isPending || removeMutation.isPending,
  };
};

export const useGetWishlist = () => {
  return useWishlist();
};

export const useWishlistActions = () => {
  const removeMutation = useRemoveFromWishlist();
  
  return {
    removeFromWishlist: (productId) => removeMutation.mutate(productId),
    isRemoving: removeMutation.isPending,
  };
};
