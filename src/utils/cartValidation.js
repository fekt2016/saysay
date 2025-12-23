/**
 * Cart Validation Utilities
 * Ensures cart items are valid before being added or restored
 */

import logger from './logger';

/**
 * Assert that a cart item is valid
 * @param {Object} item - Cart item to validate
 * @param {Object} item.product - Product object
 * @param {string} item.sku - SKU string (required for multi-variant products)
 * @param {number} item.variantCount - Number of variants (optional, will be calculated)
 * @returns {boolean} - True if valid, false otherwise
 */
export function assertValidCartItem(item) {
  if (!item || !item.product) {
    return false;
  }

  const hasVariants = item.product?.variants && 
    Array.isArray(item.product.variants) && 
    item.product.variants.length > 0;
  
  const variantCount = hasVariants ? item.product.variants.length : 0;
  const sku = item.sku || item.variantSku || null;

  // Multi-variant products MUST have a SKU
  if (variantCount > 1 && !sku) {
    logger.debug('[cartValidation] Invalid cart item: multi-variant product missing SKU', {
      productId: item.product?._id || item.product?.id,
      productName: item.product?.name,
      variantCount,
    });
    return false;
  }

  // Single-variant products should have SKU (auto-assigned if missing)
  if (variantCount === 1 && !sku) {
    // This is acceptable - will be auto-assigned during normalization
    return true;
  }

  // Products without variants don't need SKU
  if (variantCount === 0) {
    return true;
  }

  // If SKU is provided, validate it's a string
  if (sku && typeof sku !== 'string') {
    logger.debug('[cartValidation] Invalid cart item: SKU must be a string', {
      productId: item.product?._id || item.product?.id,
      sku,
      skuType: typeof sku,
    });
    return false;
  }

  return true;
}

/**
 * Resolve default SKU for a product
 * @param {Object} product - Product object
 * @returns {string|null} - Default SKU or null
 */
export function resolveDefaultSku(product) {
  if (!product?.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
    return null;
  }

  // Priority: active variant with SKU > in-stock variant with SKU > first variant with SKU
  const defaultVariant = 
    product.variants.find(v => v.status === 'active' && v.sku) ||
    product.variants.find(v => (v.stock || 0) > 0 && v.sku) ||
    product.variants.find(v => v.sku) ||
    product.variants[0];

  if (defaultVariant?.sku) {
    return defaultVariant.sku.trim().toUpperCase();
  }

  return null;
}

/**
 * Validate and normalize cart item before adding
 * @param {Object} item - Cart item to validate
 * @returns {Object|null} - Normalized item or null if invalid
 */
export function validateAndNormalizeCartItem(item) {
  if (!item || !item.product) {
    return null;
  }

  const hasVariants = item.product?.variants && 
    Array.isArray(item.product.variants) && 
    item.product.variants.length > 0;
  
  const variantCount = hasVariants ? item.product.variants.length : 0;
  let sku = item.sku || item.variantSku || null;

  // Multi-variant products: SKU is required
  if (variantCount > 1) {
    if (!sku) {
      // Try to resolve default SKU
      sku = resolveDefaultSku(item.product);
      
      if (!sku) {
        logger.debug('[cartValidation] Cannot resolve default SKU for multi-variant product', {
          productId: item.product?._id || item.product?.id,
          productName: item.product?.name,
          variantCount,
        });
        return null; // Invalid - cannot add without SKU
      }
    }
  } else if (variantCount === 1) {
    // Single-variant: Auto-assign SKU if missing
    if (!sku) {
      sku = resolveDefaultSku(item.product);
    }
  }

  // Normalize SKU format
  if (sku) {
    sku = sku.trim().toUpperCase();
  }

  return {
    ...item,
    sku: sku || undefined,
    variantSku: sku || undefined, // Keep for backward compatibility
    variantCount,
  };
}

