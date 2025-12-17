import api from './api';

const couponApi = {
  applyCoupon: async ({ couponCode, orderAmount, productIds, categoryIds, sellerIds }) => {
    console.log('[couponApi] Applying coupon:', { couponCode, orderAmount, productIds, categoryIds, sellerIds });
    const response = await api.post('/coupon/apply', {
      couponCode,
      orderAmount,
      productIds,
      categoryIds,
      sellerIds,
    });
    return response.data;
  },
  applyUserCoupon: async (couponCode) => {
    console.log('[couponApi] Applying user coupon:', couponCode);
    const response = await api.post('/coupon/apply-user-coupon', {
      couponCode,
    });
    return response.data;
  },
};

export default couponApi;
