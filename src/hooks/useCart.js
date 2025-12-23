import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import cartApi from '../services/cartApi';
import useAuth from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { assertValidCartItem, validateAndNormalizeCartItem, resolveDefaultSku } from '../utils/cartValidation';

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

  let products = null;
  for (const handler of structures) {
    const result = handler();
    if (Array.isArray(result)) {
      products = result;
      break;
    }
  }

  if (!products) {
    console.warn("Unknown cart structure:", cartData);
    return [];
  }

  // CRITICAL: Normalize cart items - clean invalid variant data
  // Use validation helper to ensure items are valid
  const normalizedProducts = products
    .map((item) => {
      if (!item.product) return null;

      // Validate item before normalization
      if (!assertValidCartItem(item)) {
        // Invalid item - will be removed
        return null;
      }

      const hasVariants = item.product?.variants && Array.isArray(item.product.variants) && item.product.variants.length > 0;
      // CRITICAL: Use sku field (standardized), with backward compatibility for variantSku
      let variantSku = item.sku || item.variantSku || null;

      // Clean up invalid variant data
      // Remove variant objects, stringified objects, and IDs
      if (item.variant) {
        // Check if variant is a stringified object (invalid)
        if (typeof item.variant === 'string' && (item.variant.startsWith('{') || item.variant.startsWith('['))) {
          console.warn("Removing invalid stringified variant object from cart item:", {
            productId: item.product?._id,
            productName: item.product?.name,
            variant: item.variant.substring(0, 50) + '...',
          });
          item.variant = undefined;
        }
        // Check if variant is an object (invalid)
        else if (typeof item.variant === 'object' && item.variant !== null) {
          console.warn("Removing invalid variant object from cart item:", {
            productId: item.product?._id,
            productName: item.product?.name,
          });
          item.variant = undefined;
        }
      }

      // Remove variantId (we only use variantSku)
      if (item.variantId) {
        item.variantId = undefined;
      }

      // Normalize variantSku
      if (!variantSku && hasVariants) {
        // Case 1: Single variant product - auto-assign SKU
        if (item.product.variants.length === 1) {
          const sku = item.product.variants[0].sku;
          if (sku) {
            variantSku = sku.trim().toUpperCase();
            item.sku = variantSku; // Standardized field name
            item.variantSku = variantSku; // Keep for backward compatibility
            console.log("Auto-assigned SKU for single-variant product:", {
              productId: item.product._id,
              variantSku,
            });
          } else {
            // Invalid: variant has no SKU
            console.error("Single variant product missing SKU:", {
              productId: item.product._id,
              productName: item.product.name,
            });
            return null; // Remove invalid item
          }
        } else {
          // Case 2: Multi-variant product without SKU - invalid, must be removed
          // This should NEVER happen now - items are validated before being added
          // Keep as safety net for legacy cart data only
          if (__DEV__) {
            console.debug('[cartValidation] Invalid cart item removed (legacy data):', {
              productId: item.product._id,
              productName: item.product.name,
              variantCount: item.product.variants.length,
            });
          }
          return null; // Remove invalid item
        }
      } else if (variantSku) {
        // Normalize SKU format
        variantSku = variantSku.trim().toUpperCase();
        item.sku = variantSku; // Standardized field name
        item.variantSku = variantSku; // Keep for backward compatibility
        
        // Validate SKU exists in product variants
        if (hasVariants) {
          const skuExists = item.product.variants.some(
            (v) => v.sku && v.sku.trim().toUpperCase() === variantSku
          );
          if (!skuExists) {
            console.error("Invalid SKU in cart item - removing:", {
              productId: item.product._id,
              productName: item.product.name,
              variantSku,
            });
            return null; // Remove invalid item
          }
        }
      }

      // Clean up: remove variant and variantId fields (we only use sku)
      delete item.variant;
      delete item.variantId;

      return item;
    })
    .filter((item) => item !== null); // Remove null items (invalid products)

  return normalizedProducts;
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
      if (!isAuthenticated) {
        // Normalize guest cart data - getCartStructure will clean invalid items
        const normalized = getCartStructure(data);
        
        // Always save normalized data to ensure clean cart
        const guestCart = await getGuestCart();
        guestCart.cart.products = normalized;
        await saveGuestCart(guestCart);
      }
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
    mutationFn: async ({ product, quantity, variantSku }) => {
      const productId = product?.id || product?._id;
      
      if (!productId) {
        throw new Error("Product ID is required");
      }

      // CRITICAL: HARD LOG to debug SKU issues
      console.log("[CART_REDUCER_ADD]", {
        productId,
        variantSku,
        quantity,
        productName: product?.name,
        hasVariants: product?.variants?.length > 0,
        variants: product?.variants?.map(v => ({
          id: v._id,
          sku: v.sku,
          status: v.status,
        })) || [],
      });
      
      // CRITICAL: Determine variant count
      const hasVariants = product?.variants && Array.isArray(product.variants) && product.variants.length > 0;
      const variantCount = hasVariants ? product.variants.length : 0;
      
      // STEP 1: Attempt default SKU resolution for multi-variant products
      let finalSku = variantSku;
      if (variantCount > 1 && (!finalSku || typeof finalSku !== 'string' || !finalSku.trim())) {
        // Try to resolve default SKU before blocking
        finalSku = resolveDefaultSku(product);
        if (finalSku) {
          console.log('[useCart] ✅ Auto-resolved default SKU for multi-variant product:', {
            productId,
            productName: product?.name,
            resolvedSku: finalSku,
            variantCount,
          });
        }
      }
      
      // STEP 2: HARD GUARD - Block multi-variant products without SKU
      if (variantCount > 1 && (!finalSku || typeof finalSku !== 'string' || !finalSku.trim())) {
        // DEV ASSERTION
        if (__DEV__) {
          console.warn('[useCart] 🚫 DEV ASSERT: Multi-variant item without SKU blocked', {
            productId,
            productName: product?.name,
            variantCount,
            originalVariantSku: variantSku,
            resolvedSku: finalSku,
          });
        }
        
        console.error('[useCart] ❌ SKU_REQUIRED: Multi-variant product missing SKU', {
          productId,
          productName: product?.name,
          variantCount,
          originalVariantSku: variantSku,
        });
        
        // Return structured error (never throw, never silently continue)
        const error = new Error("Please select a variant before adding to cart");
        error.code = 'SKU_REQUIRED';
        error.productId = productId;
        error.productName = product?.name;
        error.variantCount = variantCount;
        throw error;
      }
      
      // STEP 3: Normalize and validate SKU
      if (finalSku) {
        finalSku = finalSku.trim().toUpperCase();
        
        // Validate SKU exists in product variants
        if (hasVariants) {
          const skuExists = product.variants.some(
            (v) => v.sku && v.sku.trim().toUpperCase() === finalSku
          );
          if (!skuExists) {
            console.error('[useCart] ❌ Invalid SKU for product:', { 
              productId, 
              productName: product?.name, 
              sku: finalSku,
              availableSkus: product.variants.map(v => v.sku).filter(Boolean),
            });
            throw new Error("Invalid variant SKU");
          }
        }
      } else if (variantCount === 0) {
        // No variants - ensure variantSku is not provided
        finalSku = undefined;
      } else if (variantCount === 1) {
        // Single variant - auto-assign SKU if missing
        if (!finalSku) {
          finalSku = resolveDefaultSku(product);
          if (finalSku) {
            console.log('[useCart] ✅ Auto-assigned SKU for single-variant product:', {
              productId,
              sku: finalSku,
            });
          }
        }
      }
      
      // Use finalSku for the rest of the function
      variantSku = finalSku;

      if (isAuthenticated) {
        // Backend still expects variantId for now, but we'll send SKU via variantSku field
        // Extract variantId for backward compatibility with backend API
        let variantId = null;
        if (variantSku && Array.isArray(product?.variants)) {
          const found = product.variants.find((v) => v.sku && v.sku.toUpperCase() === variantSku);
          if (found?._id) {
            variantId = found._id.toString ? found._id.toString() : String(found._id);
          }
        }
        
        const response = await cartApi.addToCart(productId, quantity, variantId);
        return response.data;
      }

      // Guest cart - store ONLY sku string, never variant objects or IDs
      const guestCart = await getGuestCart();
      const products = guestCart?.cart?.products || [];
      
      // CRITICAL: Merge ONLY when productId + sku match (SKU-scoped quantity)
      const existingItem = products?.find(
        (item) => {
          const itemProductId = item.product?._id || item.product?.id;
          const itemSku = item.sku || item.variantSku || null; // Backward compatibility
          return itemProductId === productId && itemSku === variantSku;
        }
      );
      
      if (existingItem) {
        // Merge: Add quantity to existing SKU
        existingItem.quantity += quantity;
      } else {
        // New item: Create separate cart line for this SKU
        // CRITICAL: Normalize cart item shape - only store required fields
        const normalizedItem = {
          _id: `guest-${Date.now()}-${productId}-${variantSku || 'no-sku'}`,
          productId: productId, // Store productId separately for easier access
          product: {
            _id: productId,
            id: productId,
            name: product?.name,
            defaultPrice: product?.defaultPrice || product?.price,
            imageCover: product?.imageCover || product?.image,
            variants: product?.variants || [], // Include variants for validation
          },
          quantity,
          variantCount: variantCount, // Store variant count for validation
        };
        
        // Only add SKU if it exists (multi-variant products MUST have SKU)
        if (variantSku) {
          normalizedItem.sku = variantSku; // Standardized field name
          normalizedItem.variantSku = variantSku; // Keep for backward compatibility
        }
        
        products.push(normalizedItem);
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
        products.map((item) => {
          // Extract variantId from variantSku for backend API (backward compatibility)
          let variantId = null;
          if (item.variantSku && Array.isArray(item.product?.variants)) {
            const found = item.product.variants.find(
              (v) => v.sku && v.sku.toUpperCase() === item.variantSku.toUpperCase()
            );
            if (found?._id) {
              variantId = found._id.toString ? found._id.toString() : String(found._id);
            }
          }
          // Backward compatibility: If variantSku missing, try to extract from variant
          else if (item.variant) {
            if (typeof item.variant === 'string') {
              variantId = item.variant;
            } else if (typeof item.variant === 'object' && item.variant !== null) {
              variantId = item.variant._id || item.variant.id || null;
              if (variantId) {
                variantId = variantId.toString ? variantId.toString() : String(variantId);
              }
            }
          }
          return cartApi.addToCart(item.product._id, item.quantity, variantId);
        })
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
