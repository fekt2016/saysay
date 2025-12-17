export const extractProducts = (productsData) => {
  if (!productsData) return [];

  if (productsData.data?.data && Array.isArray(productsData.data.data)) {
    return productsData.data.data;
  }

  if (productsData.data?.products && Array.isArray(productsData.data.products)) {
    return productsData.data.products;
  }

  if (productsData.products && Array.isArray(productsData.products)) {
    return productsData.products;
  }

  if (productsData.results && Array.isArray(productsData.results)) {
    return productsData.results;
  }

  if (productsData.data && Array.isArray(productsData.data)) {
    return productsData.data;
  }

  if (Array.isArray(productsData)) {
    return productsData;
  }

  return [];
};export const extractCategories = (categoriesData, limit = 6) => {
  const cats = categoriesData?.results || categoriesData?.data?.results || [];
  return cats.filter(cat => !cat.parentCategory).slice(0, limit);
};export const extractEazShopProducts = (eazshopData) => {
  return Array.isArray(eazshopData) ? eazshopData : [];
};export const extractSellers = (sellersData) => {
  if (!sellersData) return [];

  let sellersList = [];
  if (Array.isArray(sellersData)) {
    sellersList = sellersData;
  } else if (Array.isArray(sellersData?.data?.sellers)) {
    sellersList = sellersData.data.sellers;
  } else if (Array.isArray(sellersData?.sellers)) {
    sellersList = sellersData.sellers;
  }

  return sellersList;
};


