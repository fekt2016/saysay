import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import followApi from '../services/followApi';
import { useAuth } from '../../hooks/useAuth';
import { useMemo } from 'react';

export const useToggleFollow = (sellerId) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const userData = useMemo(() => {
    return user || null;
  }, [user]);

  
  const sellerQuery = useQuery({
    queryKey: ['follower', sellerId],
    queryFn: async () => {
      try {
        return await followApi.getFollowStatus(sellerId);
      } catch (error) {
        if (error.response?.status === 401) {
          
          console.warn('Authentication required for follow status');
          return { isFollowing: false, followersCount: 0 };
        }
        throw error;
      }
    },
    enabled: !!sellerId && !!userData, 
  });

  const currentSeller = sellerQuery?.data || {};
  const isFollowing = currentSeller?.isFollowing || false;

  
  const updateCache = (isFollowing) => {
    
    queryClient.setQueryData(['follower', sellerId], (oldData) => {
      const current = oldData || {};

      return {
        ...current,
        isFollowing,
        followersCount: isFollowing
          ? (current.followersCount || 0) + 1
          : Math.max((current.followersCount || 0) - 1, 0),
      };
    });

    
    queryClient.setQueryData(['followed-sellers', userData?.id || userData?._id], (oldData = []) => {
      if (isFollowing) {
        return [...oldData, { _id: sellerId }];
      }
      return oldData.filter((seller) => seller._id !== sellerId);
    });
  };

  
  const follow = useMutation({
    mutationFn: async () => {
      const response = await followApi.followSeller(sellerId);
      return response;
    },
    onMutate: () => {
      const previousSeller =
        queryClient.getQueryData(['follower', sellerId]) || currentSeller;
      const previousFollowed =
        queryClient.getQueryData(['followed-sellers', userData?.id || userData?._id]) || [];

      
      updateCache(true);

      return { previousSeller, previousFollowed };
    },
    onError: (error, variables, context) => {
      console.error('Follow error:', error);
      
      if (context?.previousSeller) {
        queryClient.setQueryData(
          ['follower', sellerId],
          context.previousSeller
        );
      }
      if (context?.previousFollowed) {
        queryClient.setQueryData(
          ['followed-sellers', userData?.id || userData?._id],
          context.previousFollowed
        );
      }
    },
    onSettled: () => {
      
      queryClient.invalidateQueries(['follower', sellerId]);
      queryClient.invalidateQueries(['followed-sellers', userData?.id || userData?._id]);
    },
  });

  
  const unfollow = useMutation({
    mutationFn: async () => {
      const response = await followApi.unfollowSeller(sellerId);
      return response;
    },
    onMutate: () => {
      const previousSeller =
        queryClient.getQueryData(['follower', sellerId]) || currentSeller;
      const previousFollowed =
        queryClient.getQueryData(['followed-sellers', userData?.id || userData?._id]) || [];

      
      updateCache(false);

      return { previousSeller, previousFollowed };
    },
    onError: (error, variables, context) => {
      console.error('Unfollow error:', error);
      
      if (context?.previousSeller) {
        queryClient.setQueryData(
          ['follower', sellerId],
          context.previousSeller
        );
      }
      if (context?.previousFollowed) {
        queryClient.setQueryData(
          ['followed-sellers', userData?.id || userData?._id],
          context.previousFollowed
        );
      }
    },
    onSettled: () => {
      
      queryClient.invalidateQueries(['follower', sellerId]);
      queryClient.invalidateQueries(['followed-sellers', userData?.id || userData?._id]);
    },
  });

  
  const toggleFollow = () => {
    if (!userData) {
      console.log('User is not logged in');
      return;
    }

    if (isFollowing) {
      unfollow.mutate();
    } else {
      follow.mutate();
    }
  };

  return {
    toggleFollow,
    isFollowing,
    isLoading: follow.isPending || unfollow.isPending || sellerQuery.isLoading,
    isError: follow.isError || unfollow.isError || sellerQuery.isError,
    error: follow.error || unfollow.error || sellerQuery.error,
  };
};

export const useGetSellersFollowers = (sellerId) => {
  return useQuery({
    queryKey: ['followers', sellerId],
    queryFn: async () => {
      const response = await followApi.getSellerFollowers(sellerId);
      return response;
    },
    enabled: !!sellerId,
  });
};

export const useGetFollowedSellerByUser = () => {
  return useQuery({
    queryKey: ['followers'],
    queryFn: async () => {
      const response = await followApi.getFollowedShops();
      return response;
    },
    staleTime: 1000 * 60 * 5, 
  });
};

export const useFollowedSellers = () => {
  return useQuery({
    queryKey: ['followed-sellers'],
    queryFn: async () => {
      const res = await followApi.getFollowedShops();
      return res;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export default {
  useToggleFollow,
  useGetSellersFollowers,
  useGetFollowedSellerByUser,
  useFollowedSellers,
};
