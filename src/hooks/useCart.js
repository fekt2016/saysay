import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import cartApi from '../services/cartApi';
import useAuth from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getCartStructure = (cartData) => {
  if (!cartData) return [];

  const getNestedProperty = (obj, ...paths) => {
    return paths.reduce((current, path) => {
      if (current && typeof current === "object" && path in current) {
        return current[path];
      }
      return undefined;
    }, obj);
  };

  const structures = [
    () => (Array.isArray(cartData) ? cartData : undefined),
    () => getNestedProperty(cartData, "data", "cart", "products"),
    () => getNestedProperty(cartData, "cart", "products"),
    () => getNestedProperty(cartData, "products"),
    () => getNestedProperty(cartData, "data", "products"),
    () => getNestedProperty(cartData, "data", "data", "products"),
    () => getNestedProperty(cartData, "data", "data", "cart", "products"),
  ];

  for (const handler of structures) {
    const result = handler();
    if (Array.isArray(result)) return result;
  }

  console.warn("Unknown cart structure:", cartData);
  return [];
};

const saveGuestCart = async (cartData) => {
  try {
    await AsyncStorage.setItem("guestCart", JSON.stringify(cartData));
  } catch (error) {
    console.error("Failed to save guest cart", error);
  }
};

const getGuestCart = async () => {
  try {
    const guestCart = await AsyncStorage.getItem("guestCart");
    return guestCart ? JSON.parse(guestCart) : { cart: { products: [] } };
  } catch (error) {
    console.error("Error parsing guest cart, resetting", error);
    const emptyCart = { cart: { products: [] } };
    await AsyncStorage.setItem("guestCart", JSON.stringify(emptyCart));
    return emptyCart;
  }
};

const getCartQueryKey = (isAuthenticated) => ["cart", isAuthenticated];

export const useGetCart = () => {
  const { isAuthenticated } = useAuth();
  const queryKey = getCartQueryKey(isAuthenticated);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (isAuthenticated) {
        try {
          const response = await cartApi.getCart();
          return response;
        } catch (error) {
          console.error("Failed to fetch cart:", error);
          return { data: { cart: { products: [] } } };
        }
      }
      return await getGuestCart();
    },
    onSuccess: async (data) => {
      if (!isAuthenticated) await saveGuestCart(data);
    },
  });
};

export const useCartTotals = () => {
  const { data } = useGetCart();
  const products = getCartStructure(data);

  return products.reduce(
    (acc, item) => {
      const price = item?.product?.defaultPrice || item?.product?.price || 0;
      const quantity = item?.quantity || 0;
      const validPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
      const validQuantity = typeof quantity === 'number' && !isNaN(quantity) && quantity > 0 ? quantity : 0;
      acc.total += validPrice * validQuantity;
      acc.count += validQuantity;
      return acc;
    },
    { total: 0, count: 0 }
  );
};

export const useCartActions = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, logout } = useAuth();
  const queryKey = getCartQueryKey(isAuthenticated);

  const mutationOptions = {
    onError: (error) => {
      if (error.response?.status === 401) logout.mutate();
    },
  };

  const addToCartMutation = useMutation({
    mutationFn: async ({ product, quantity, variant }) => {
      const productId = product?.id || product?._id;
      
      if (!productId) {
        throw new Error("Product ID is required");
      }

      if (isAuthenticated) {
        const variantId = typeof variant === 'object' && variant?._id 
          ? variant._id 
          : variant;
        const response = await cartApi.addToCart(productId, quantity, variantId);
        return response.data;
      }

      const guestCart = await getGuestCart();
      const products = guestCart?.cart?.products || [];
      const existingItem = products?.find(
        (item) => {
          const itemProductId = item.product?._id || item.product?.id;
          return itemProductId === productId;
        }
      );
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        products.push({
          _id: `guest-${Date.now()}-${productId}`,
          product: {
            _id: productId,
            id: productId,
            name: product?.name,
            defaultPrice: product?.defaultPrice || product?.price,
            imageCover: product?.imageCover || product?.image,
          },
          quantity,
          variant: variant ? { _id: variant } : undefined,
        });
      }

      await saveGuestCart(guestCart);
      return guestCart;
    },
    onSuccess: async (apiResponse) => {
      let cartData;
      
      if (apiResponse?.data?.cart) {
        cartData = { data: { cart: apiResponse.data.cart } };
      } else if (apiResponse?.cart) {
        cartData = { data: { cart: apiResponse.cart } };
      } else if (apiResponse?.data) {
        cartData = apiResponse.data;
      } else {
        cartData = apiResponse;
      }
      
      queryClient.setQueryData(queryKey, cartData);
      queryClient.invalidateQueries(queryKey);
    },
    ...mutationOptions,
  });

  const updateCartItemMutation = useMutation({
    mutationFn: async (data) => {
      const { itemId, quantity } = data;

      if (isAuthenticated) {
        const response = await cartApi.updateCartItem(itemId, quantity);
        return response;
      }
      const guestCart = await getGuestCart();
      const item = guestCart?.cart?.products?.find(
        (item) => item?._id === itemId
      );
      if (item) {
        item.quantity = quantity;
      }
      await saveGuestCart(guestCart);
      return { data: guestCart };
    },
    onSuccess: (apiResponse) => {
      const cartData = apiResponse?.data || apiResponse;
      queryClient.setQueryData(queryKey, cartData);
    },
    ...mutationOptions,
  });

  const removeCartItemMutation = useMutation({
    mutationFn: async (itemId) => {
      if (isAuthenticated) {
        await cartApi.removeCartItem(itemId);
        return { itemId, isAuthenticated: true };
      }
      const guestCart = await getGuestCart();

      if (
        guestCart &&
        guestCart.cart &&
        Array.isArray(guestCart.cart.products)
      ) {
        guestCart.cart.products = guestCart.cart.products.filter(
          (item) => item._id !== itemId
        );
      }
      await saveGuestCart(guestCart);
      return { guestCart, isAuthenticated: false };
    },
    onSuccess: (result) => {
      if (result.isAuthenticated) {
        queryClient.invalidateQueries(queryKey);
      } else {
        queryClient.setQueryData(queryKey, result.guestCart);
      }
    },
    ...mutationOptions,
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        const response = await cartApi.clearCart();
        return response;
      }
      const emptyCart = { data: { cart: { products: [] } } };
      await saveGuestCart(emptyCart);
      return emptyCart;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
    ...mutationOptions,
  });

  const syncCartMutation = useMutation({
    mutationFn: async () => {
      const guestCart = await getGuestCart();
      const products =
        guestCart?.data?.cart?.products || guestCart.cart.products || [];
      const results = await Promise.allSettled(
        products.map((item) =>
          cartApi.addToCart(item.product._id, item.quantity)
        )
      );

      const failedItems = results
        .map((result, index) => ({ ...result, item: products[index] }))
        .filter((result) => result.status === "rejected");

      const updatedGuestCart = {
        data: {
          ...guestCart?.data,
          cart: {
            ...guestCart?.data?.cart,
            products: failedItems.map((failed) => failed?.item),
          },
        },
      };

      await saveGuestCart(updatedGuestCart);
      return {
        success: results?.length - failedItems.length,
        failed: failedItems.length,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey });
    },
    ...mutationOptions,
  });

  const addToCartWrapper = useCallback((params, options) => {
    return addToCartMutation.mutate(params, options);
  }, [addToCartMutation]);

  return {
    addToCart: addToCartWrapper,
    updateCartItem: updateCartItemMutation.mutate,
    removeCartItem: removeCartItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    syncCart: syncCartMutation.mutate,
    isAdding: addToCartMutation.isPending,
    isUpdating: updateCartItemMutation.isPending,
    isRemoving: removeCartItemMutation.isPending,
    isClearing: clearCartMutation.isPending,
    isSyncing: syncCartMutation.isPending,
    addToCartMutation,
    updateCartItemMutation,
    removeCartItemMutation,
  };
};

export const useAutoSyncCart = () => {
  const { isAuthenticated } = useAuth();
  const { syncCart } = useCartActions();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated) {
      getGuestCart().then((guestCart) => {
        const hasGuestItems = guestCart.cart?.products?.length > 0;
        if (hasGuestItems) {
          syncCart(undefined, {
            onSuccess: async () => {
              const emptyCart = { cart: { products: [] } };
              await saveGuestCart(emptyCart);
              queryClient.invalidateQueries(["cart", true]);
            },
          });
        }
      });
    }
  }, [isAuthenticated, syncCart, queryClient]);
};
