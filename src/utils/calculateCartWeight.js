export const calculateCartWeight = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 0.5; 
  }

  const totalWeight = items.reduce((sum, item) => {
    const product = item.product || item;
    const quantity = item.quantity || 1;

    const weight = product.weight || product.productWeight || 0.5; 

    return sum + (weight * quantity);
  }, 0);

  return Math.max(totalWeight, 0.5);
};

export default calculateCartWeight;


