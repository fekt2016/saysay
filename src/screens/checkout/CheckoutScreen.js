import React, { useEffect, useMemo, useState, useCallback, useLayoutEffect } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { theme } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { usePaystackPayment } from '../../hooks/usePaystackPayment';
import {
  useGetUserAddress,
  useCreateAddress,
} from '../../hooks/useAddress';
import { useCreateOrder } from '../../hooks/useOrder';
import {
  useGetCart,
  getCartStructure,
  useCartActions,
  useCartTotals,
} from '../../hooks/useCart';
import { useApplyCoupon } from '../../hooks/useCoupon';
import { useCreditBalance } from '../../hooks/useCreditBalance';
import { useValidateCart } from '../../hooks/useCartValidation';
import { sanitizeCouponCode, sanitizeText, sanitizePhone, validateQuantity } from '../../utils/sanitize';
import {
  useGetPickupCenters,
  useCalculateShippingQuote,
} from '../../hooks/useShipping';
import ShippingOptions from '../../components/ShippingOptions';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import NeighborhoodAutocomplete from '../../components/NeighborhoodAutocomplete';
import { calculateCartWeight } from '../../utils/calculateCartWeight';
import locationApi from '../../services/locationApi';
import * as Location from 'expo-location';
import CheckoutSection from '../../components/checkout/CheckoutSection';
import PaymentMethodCard from '../../components/checkout/PaymentMethodCard';
import DeliveryOptionCard from '../../components/checkout/DeliveryOptionCard';
import SummaryCard from '../../components/checkout/SummaryCard';
import CouponField from '../../components/checkout/CouponField';
import AddressCard from '../../components/checkout/AddressCard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const normalizeApiResponse = (response) => {
  if (!response) return null;

  if (response?.data?.data) {
    return response.data.data;
  }
  if (response?.data) {
    return response.data;
  }
  return response;
};

const getShippingItems = (rawItems) => {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    return [];
  }

  const mapped = rawItems
    .map((item) => {
      let sellerId = null;

      if (item.product?.seller) {
        if (typeof item.product.seller === 'string') {
          sellerId = item.product.seller;
        } else if (item.product.seller._id) {
          sellerId = item.product.seller._id;
        } else if (item.product.seller.id) {
          sellerId = item.product.seller.id;
        }
      }

      if (!sellerId && item.product?.sellerId) {
        sellerId = item.product.sellerId;
      }

      return {
        productId: item.product?._id || item.product?.id || item.productId,
        sellerId: sellerId,
        quantity: item.quantity || 1,
      };
    })
    .filter((item) => item.productId && item.sellerId);

  return mapped;
};

const validateNewAddress = (newAddress) => {
  const errors = {};
  const requiredFields = ['fullName', 'streetAddress', 'area', 'city', 'region', 'contactPhone'];

  requiredFields.forEach((field) => {
    if (!newAddress[field]) errors[field] = 'This field is required';
  });

  if (
    newAddress.city &&
    !['ACCRA', 'TEMA'].includes(newAddress.city.toUpperCase())
  ) {
    errors.city = 'Saysay currently delivers only in Accra and Tema';
  }

  if (newAddress.contactPhone) {
    const digits = newAddress.contactPhone.replace(/\D/g, '');
    const pattern = /^(020|023|024|025|026|027|028|029|050|054|055|056|057|059)\d{7}$/;
    if (!pattern.test(digits)) {
      errors.contactPhone = 'Invalid Ghana phone number';
    }
  }

  if (
    newAddress.digitalAddress &&
    !/^[A-Z]{2}-\d{3}-\d{4}$/.test(newAddress.digitalAddress)
  ) {
    errors.digitalAddress = 'Invalid format. Use AA-123-4567';
  }

  return errors;
};

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { initializePaystackPayment } = usePaystackPayment();

  const { data: addressData, isLoading: isAddressLoading } = useGetUserAddress();
  const { mutate: createAddress, isPending: isAddressCreating, error: createAddressError } =
    useCreateAddress();
  const { data: cartData, isLoading: isCartLoading } = useGetCart();
  const { mutate: applyCoupon, isPending: isApplyingCoupon, error: couponError } =
    useApplyCoupon();
  const { clearCart } = useCartActions();
  const { total: subTotal } = useCartTotals();
  const { mutate: createOrder, isPending: isCreatingOrder, error: createOrderError } =
    useCreateOrder();
  const { data: creditBalanceData, isLoading: isCreditBalanceLoading } = useCreditBalance();
  const { mutate: validateCart, isPending: isValidatingCart } = useValidateCart();

  const [couponCode, setCouponCode] = useState('');

  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const [backendTotals, setBackendTotals] = useState(null);
  const [activeTab, setActiveTab] = useState('existing');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('payment_on_delivery');
  const [errors, setErrors] = useState();
  const [formError, setFormError] = useState('');
  const [couponData, setCouponData] = useState(null);

  const [deliveryMethod, setDeliveryMethod] = useState('dispatch');
  const [deliverySpeed, setDeliverySpeed] = useState('standard');
  const [isFragileItem, setIsFragileItem] = useState(false);
  const [selectedPickupCenterId, setSelectedPickupCenterId] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingQuote, setShippingQuote] = useState(null);

  const [showStickyButton, setShowStickyButton] = useState(false);
  const scrollViewRef = React.useRef(null);

  const creditBalance = useMemo(() => {
    return creditBalanceData?.data?.wallet?.balance || creditBalanceData?.data?.creditbalance?.balance || 0;
  }, [creditBalanceData]);

  const [newAddress, setNewAddress] = useState({
    fullName: '',
    streetAddress: '',
    area: '',
    landmark: '',
    city: '',
    region: '',
    digitalAddress: '',
    contactPhone: '',
  });

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const address = useMemo(
    () => {}
      addressData?.data?.addresses ||
      addressData?.data?.data?.addresses ||
      [],
    [addressData]
  );

  const defaultAddress = useMemo(
    () => address.find((addr) => addr.isDefault),
    [address]
  );

  const rawItems = useMemo(() => {
    const items = getCartStructure(cartData);
    return items || [];
  }, [cartData]);

  const products = useMemo(
    () => {}
      (rawItems || []).map((item) => ({
        product: item.product,
        quantity: item.quantity,
        variant: item.variant,
      })),
    [rawItems]
  );

  const hasEazShopProducts = useMemo(
    () => {}
      products.some(
        (item) =>
          item.product?.isEazShopProduct 
          item.product?.seller?.role === 'eazshop_store'
      ),
    [products]
  );

  const selectedAddress = address.find((addr) => addr._id === selectedAddressId);

  const buyerCity =
    activeTab === 'existing' && selectedAddress?.city
      ? selectedAddress.city.toUpperCase()
      : activeTab === 'new' && newAddress?.city
        ? newAddress.city.toUpperCase()
        : selectedAddress?.city?.toUpperCase() || null;

  const {
    data: pickupCentersData,
    isLoading: isPickupCentersLoading,
  } = useGetPickupCenters(buyerCity);

  const pickupCenters = useMemo(() => {
    if (!pickupCentersData) return [];
    if (Array.isArray(pickupCentersData)) return pickupCentersData;
    if (pickupCentersData?.data?.pickupCenters) return pickupCentersData.data.pickupCenters;
    if (pickupCentersData?.data?.data?.pickupCenters) return pickupCentersData.data.data.pickupCenters;
    if (Array.isArray(pickupCentersData?.data)) return pickupCentersData.data;
    return [];
  }, [pickupCentersData]);

  const { mutate: calculateShipping, isPending: isCalculatingShipping } =
    useCalculateShippingQuote();

  const round = (val) => Math.round(val * 100) / 100;

  const backendTotal = backendTotals?.totalAmount || null;
  const backendDiscount = backendTotals?.discount || discount;
  const backendSubtotal = backendTotals?.subtotal || subTotal;

  const taxableAmount = Math.max(0, (backendSubtotal || subTotal) - (backendDiscount || discount));
  const basePrice = taxableAmount / 1.15;
  const vat = basePrice * 0.125;
  const nhil = basePrice * 0.025;
  const getfund = basePrice * 0.025;
  const covidLevy = basePrice * 0.01;

  const total = backendTotal || round(taxableAmount + shippingFee);

  const hasInsufficientBalance = useMemo(() => {
    if (paymentMethod !== 'credit_balance') return false;
    return creditBalance < total;
  }, [paymentMethod, creditBalance, total]);

  const shippingItems = useMemo(
    () => getShippingItems(rawItems),
    [rawItems]
  );

  const isValidBuyerCity = buyerCity && ['accra', 'tema'].includes(buyerCity.toLowerCase());

  const handleShippingSelect = useCallback((shippingData) => {
    setDeliverySpeed(shippingData.shippingType);
    setShippingFee(shippingData.shippingFee);
    setShippingQuote({
      totalShippingFee: shippingData.shippingFee,
      deliveryEstimate: shippingData.deliveryEstimate,
      shippingType: shippingData.shippingType,
    });
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Checkout',
    });
  }, [navigation]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigation.navigate('Auth', { screen: 'Login' });
    }
  }, [isAuthenticated, isAuthLoading, navigation]);

  useEffect(() => {
    if (isAddressLoading || address.length === 0) return;

    if (defaultAddress) {
      setSelectedAddressId(defaultAddress._id);
    } else if (address.length > 0) {
      setSelectedAddressId(address[0]._id);
    }
  }, [isAddressLoading, address, defaultAddress]);

  useEffect(() => {
    if (!isAddressLoading && address.length === 0) {
      setActiveTab('new');
    }
  }, [isAddressLoading, address]);

  useEffect(() => {
    if (deliveryMethod === 'dispatch') {
      return;
    }

    if (!isValidBuyerCity || shippingItems.length === 0) {
      setShippingFee(0);
      setShippingQuote(null);
      return;
    }

    if (deliveryMethod === 'pickup_center' && !selectedPickupCenterId) {
      setShippingFee(0);
      return;
    }

    calculateShipping(
      {
        buyerCity,
        items: shippingItems,
        method: deliveryMethod,
        pickupCenterId:
          deliveryMethod === 'pickup_center' ? selectedPickupCenterId : null,
        deliverySpeed: 'standard',
      },
      {
        onSuccess: (response) => {
          const payload = normalizeApiResponse(response);
          const totalFee =
            payload?.totalShippingFee ?? payload?.total_shipping_fee ?? 0;

          setShippingFee(totalFee);
          setShippingQuote(payload);
        },
        onError: (error) => {
          console.error('Shipping calculation error:', error);
          setShippingFee(0);
          setShippingQuote(null);
        },
      }
    );
  }, [
    buyerCity,
    deliveryMethod,
    selectedPickupCenterId,
    shippingItems,
    calculateShipping,
    activeTab,
    selectedAddressId,
    isValidBuyerCity,
  ]);

  const handleDeliveryMethodChange = (method) => {
    setDeliveryMethod(method);
    if (method !== 'dispatch') {
      setDeliverySpeed('standard');
    }
  };

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
    setActiveTab('existing');
  };

  const handleAddressChange = (name, value) => {
    setErrors();
    setFormError('');

    if (name === 'contactPhone') {
      const digits = value.replace(/\D/g, '').substring(0, 10);
      let formatted = digits;
      if (digits.length > 3) {
        formatted = `${digits.substring(0, 3)} ${digits.substring(3, 6)}`;
        if (digits.length > 6) {
          formatted += ` ${digits.substring(6, 10)}`;
        }
      }
      setNewAddress((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === 'digitalAddress') {
      const cleaned = value
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .substring(0, 9);

      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}`;
        if (cleaned.length > 5) {
          formatted += `-${cleaned.substring(5, 9)}`;
        }
      }
      setNewAddress((prev) => ({ ...prev, [name]: formatted }));
      return;
    }

    if (name === 'city') {
      setNewAddress((prev) => ({ ...prev, [name]: value.toUpperCase() }));
      return;
    }

    if (name === 'area') {
      setNewAddress((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const getCurrentLocation = async () => {
    try {
      setIsFetchingLocation(true);
      setLocationError('');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable location services.');
        setIsFetchingLocation(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = position.coords;

      try {
        const response = await locationApi.reverseGeocode(latitude, longitude);
        const data = response?.data || response;

        if (data.error) {
          throw new Error(data.error);
        }

        const address = data.address || {};

        const latSuffix = Math.floor((Math.abs(latitude) % 1) * 10000);
        const lngPrefix = Math.abs(Math.floor(longitude));
        const digitalAddress = `GA-${String(lngPrefix).padStart(3, '0')}-${String(latSuffix).padStart(4, '0')}`;

        setNewAddress((prev) => ({
          ...prev,
          streetAddress: (address.road || address.highway || '').toLowerCase(),
          area: (address.neighborhood || address.sublocality || address.sublocality_level_1 || '').toLowerCase(),
          landmark: (address.landmark || '').toLowerCase(),
          city: (address.city || address.town || address.village || address.county || '').toUpperCase(),
          region: (address.state || address.region || '').toLowerCase(),
          digitalAddress: digitalAddress,
        }));
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        setLocationError('Failed to get address details. Please enter manually.');
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      setLocationError('Location access denied. Please enable location services.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleNewAddress = () => {
    const validationErrors = validateNewAddress(newAddress);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setFormError('Please fix the errors in the form');
      return;
    }

    const formattedAddress = {
      ...newAddress,
      contactPhone: newAddress.contactPhone.replace(/\D/g, ''),
    };

    createAddress(formattedAddress, {
      onSuccess: () => {
        setNewAddress({
          fullName: '',
          streetAddress: '',
          area: '',
          landmark: '',
          city: '',
          region: '',
          digitalAddress: '',
          contactPhone: '',
        });
        setActiveTab('existing');
        setErrors();
        setFormError('');
      },
      onError: (error) => {
        setFormError(
          error.response?.data?.message || 'Failed to create address'
        );
      },
    });
  };

  const handleApplyCoupon = () => {

    const sanitizedCode = sanitizeCouponCode(couponCode);
    if (!sanitizedCode) {
      setCouponMessage('Please enter a valid coupon code');
      return;
    }

    const productIds = products.map(p => p.product._id);
    const categoryIds = products.reduce((acc, p) => {
      if (p.product.parentCategory) acc.push(p.product.parentCategory);
      if (p.product.subCategory) acc.push(p.product.subCategory);
      return acc;
    }, []);
    const sellerIds = [...new Set(products.map(p => p.product.seller?._id || p.product.seller).filter(Boolean))];

    applyCoupon(
      { 
        couponCode: sanitizedCode, 
        orderAmount: backendSubtotal || subTotal, 
        productIds,
        categoryIds,
        sellerIds,
      },
      {
        onSuccess: (data) => {
          if (data.status === 'success' && data.data.valid) {

            const discountAmount = data.data.discountAmount || 0;

            setDiscount(discountAmount);

            if (data.data.totals) {
              setBackendTotals(data.data.totals);
            }
            setCouponMessage(
              data?.data.discountType === 'percentage'
                ? `Coupon applied: ${data.data.discountValue}% off (GH₵${discountAmount.toFixed(2)})`
                : `Coupon applied! GH₵${discountAmount.toFixed(2)} discount`
            );
            setCouponData({
              couponId: data.data.couponId,
              batchId: data.data.batchId,
            });
          } else {
            setDiscount(0);
            setCouponMessage(data.message || 'Invalid coupon code');
            setCouponData(null);
          }
        },
        onError: (error) => {
          setDiscount(0);
          setCouponMessage(
            error.response?.data?.message || 'Failed to apply coupon'
          );
          setCouponData(null);
        },
      }
    );
  };

  const handlePlaceOrder = () => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      setFormError('Please add items to cart');
      return;
    }

    if (!selectedAddressId && activeTab === 'existing') {
      setFormError('Please select a shipping address');
      return;
    }

    if (
      activeTab === 'new' &&
      (!newAddress.city || !newAddress.streetAddress)
    ) {
      setFormError('Please complete the shipping address form');
      return;
    }

    if (deliveryMethod === 'pickup_center' && !selectedPickupCenterId) {
      setFormError('Please select a pickup center');
      return;
    }

    setFormError('');

    const orderItems = products.map((product) => {

      const validatedQuantity = validateQuantity(product.quantity, product.product.stock || 999);

      const displayPrice = product.product.variants?.find(
        (v) => v._id === product.variant || v._id?.toString() === product.variant?.toString()
      )?.price || product.product.defaultPrice || product.product.price || 0;

      if (!displayPrice || displayPrice === 0) {
        console.warn('Product price not found (backend will fetch):', {
          productId: product.product._id,
          productName: product.product.name,
          variant: product.variant,
        });
      }

      return {
        product: product.product._id,
        quantity: validatedQuantity, 

        variant: product.variant,
      };
    });

    const orderData = {
      address: selectedAddressId,
      paymentMethod,
      orderItems,
      ...(couponData && {
        couponCode,
        couponId: couponData.couponId,
        batchId: couponData.batchId,

      }),
      deliveryMethod,
      ...(deliveryMethod === 'pickup_center' &&
        selectedPickupCenterId && {
        pickupCenterId: selectedPickupCenterId,
      }),
      ...(deliveryMethod === 'dispatch' && {
        deliverySpeed: deliverySpeed === 'same_day' ? 'same_day' : 'standard',
        shippingType: deliverySpeed === 'same_day' ? 'same_day' : 'standard',
        shippingFee: shippingFee,
      }),
    };

    console.log('[CheckoutScreen] 🔍 DEBUG - User Info Before Order Creation:');
    console.log('[CheckoutScreen] Current User ID:', user?._id || user?.id);
    console.log('[CheckoutScreen] Current User Email:', user?.email);
    console.log('[CheckoutScreen] Is Authenticated:', isAuthenticated);

    createOrder(orderData, {
      onSuccess: async (orderResponse) => {

        console.log('[CheckoutScreen] 🔍 DEBUG - Order Response Structure:');
        console.log('[CheckoutScreen] orderResponse:', orderResponse);
        console.log('[CheckoutScreen] orderResponse.data:', orderResponse?.data);
        console.log('[CheckoutScreen] orderResponse.data?.data:', orderResponse?.data?.data);
        console.log('[CheckoutScreen] orderResponse.data?.data?.order:', orderResponse?.data?.data?.order);
        console.log('[CheckoutScreen] orderResponse.data?.order:', orderResponse?.data?.order);

        const responseData = orderResponse?.data || orderResponse;
        let order = responseData?.data?.order || responseData?.order || responseData?.data || responseData;

        if (!order || (typeof order === 'object' && !order._id && !order.id)) {
          console.warn('[CheckoutScreen] ⚠️ Order not found in expected structure, trying alternatives...');
          order = orderResponse?.data?.order || orderResponse?.order || orderResponse;
        }

        if (!order) {
          console.error('[CheckoutScreen] ❌ Failed to extract order from response');
          console.error('[CheckoutScreen] Full response:', JSON.stringify(orderResponse, null, 2));
          setFormError('Failed to create order');
          return;
        }

        console.log('[CheckoutScreen] ✅ Order extracted successfully:');
        console.log('[CheckoutScreen] Order ID:', order._id || order.id);
        console.log('[CheckoutScreen] Order keys:', Object.keys(order));
        console.log('[CheckoutScreen] Order totalPrice:', order.totalPrice);
        console.log('[CheckoutScreen] Order total:', order.total);
        console.log('[CheckoutScreen] Order user:', order.user);

        console.log('[CheckoutScreen] 🔍 DEBUG - Order Created:');
        console.log('[CheckoutScreen] Order ID:', order._id);
        console.log('[CheckoutScreen] Order User ID:', order.user?._id || order.user?.id || order.user);
        console.log('[CheckoutScreen] Order User (full):', order.user);
        console.log('[CheckoutScreen] Current User ID:', user?._id || user?.id);
        console.log('[CheckoutScreen] Do they match?', (order.user?._id || order.user?.id || order.user) === (user?._id || user?.id));

        clearCart();
        queryClient.invalidateQueries({ queryKey: ['cart'] });

        if (paymentMethod === 'mobile_money') {
          try {

            console.log('[CheckoutScreen] 🔍 DEBUG - Before Payment Initialization:');
            console.log('[CheckoutScreen] Order ID:', order._id);
            console.log('[CheckoutScreen] Order User:', order.user?._id || order.user?.id || order.user);
            console.log('[CheckoutScreen] Current User:', user?._id || user?.id);
            console.log('[CheckoutScreen] Current User (full):', user);

            const currentUserId = user?._id || user?.id;
            const orderUserId = order.user?._id || order.user?.id || order.user;

            if (currentUserId && orderUserId && String(currentUserId) !== String(orderUserId)) {
              console.error('[CheckoutScreen] ❌ USER MISMATCH DETECTED!');
              console.error('[CheckoutScreen] Order was created by user:', orderUserId);
              console.error('[CheckoutScreen] Current logged-in user:', currentUserId);
              Alert.alert(
                'Authorization Error',
                'The order was created with a different account. Please log in with the correct account.',
                [{ text: 'OK' }]
              );
              setFormError('User mismatch detected. Please ensure you are logged in with the correct account.');
              return;
            }

            const paymentOrderId = order._id || order.id || order.orderId;
            const paymentAmount = order.totalPrice || order.total || order.totalAmount || order.amount;

            const paymentEmail = 
              order.user?.email 
              (typeof order.user === 'string' ? null : null) 
              user?.email 
              user?.user?.email;

            console.log('[CheckoutScreen] 🔍 Payment details extraction:');
            console.log('[CheckoutScreen] Order object:', JSON.stringify(order, null, 2));
            console.log('[CheckoutScreen] Payment details:', {
              orderId: paymentOrderId,
              amount: paymentAmount,
              email: paymentEmail,
              orderKeys: Object.keys(order),
              orderUser: order.user,
              orderUserType: typeof order.user,
              currentUser: user,
              currentUserEmail: user?.email,
            });

            if (!paymentOrderId) {
              console.error('[CheckoutScreen] ❌ Order ID is missing!');
              console.error('[CheckoutScreen] Order object:', order);
              Alert.alert(
                'Payment Error',
                'Order ID is missing. Please try placing the order again.',
                [{ text: 'OK' }]
              );
              setFormError('Order ID is missing. Please try again.');
              return;
            }

            if (paymentAmount === undefined || paymentAmount === null) {
              console.error('[CheckoutScreen] ❌ Order amount is missing!');
              console.error('[CheckoutScreen] Order object:', order);
              Alert.alert(
                'Payment Error',
                'Order amount is missing. Please try placing the order again.',
                [{ text: 'OK' }]
              );
              setFormError('Order amount is missing. Please try again.');
              return;
            }

            if (!paymentEmail || paymentEmail.trim() === '') {
              console.error('[CheckoutScreen] ❌ Email is missing!');
              console.error('[CheckoutScreen] Order user:', order.user);
              console.error('[CheckoutScreen] Current user:', user);
              Alert.alert(
                'Payment Error',
                'Email address is required for payment. Please ensure your account has an email address.',
                [{ text: 'OK' }]
              );
              setFormError('Email address is required for payment.');
              return;
            }

            const token = await SecureStore.getItemAsync('user_token');
            console.log('[CheckoutScreen] 🔐 Token check before payment:', {
              hasToken: !!token,
              tokenPreview: token ? token.substring(0, 20) + '...' : 'MISSING',
            });

            console.log('[CheckoutScreen] 🔍 About to call initializePaystackPayment with:');
            console.log('[CheckoutScreen]   orderId:', paymentOrderId);
            console.log('[CheckoutScreen]   amount:', paymentAmount);
            console.log('[CheckoutScreen]   email:', paymentEmail);

            let paymentResult;
            try {
              paymentResult = await initializePaystackPayment({
                orderId: paymentOrderId,
                amount: paymentAmount,
                email: paymentEmail,
              });
              console.log('[CheckoutScreen] ✅ Payment initialization successful');
              console.log('[CheckoutScreen] 🔍 Payment result:', paymentResult);
              console.log('[CheckoutScreen] Payment result type:', typeof paymentResult);
              console.log('[CheckoutScreen] Payment result keys:', Object.keys(paymentResult || ));
            } catch (paymentError) {
              console.error('[CheckoutScreen] ❌ Payment initialization failed:', paymentError);
              console.error('[CheckoutScreen] Error details:', {
                message: paymentError.message,
                response: paymentError.response?.data,
                status: paymentError.response?.status,
              });
              Alert.alert(
                'Payment Error',
                paymentError.response?.data?.message || paymentError.message || 'Failed to initialize payment. Please try again.',
                [{ text: 'OK' }]
              );
              setFormError(paymentError.response?.data?.message || paymentError.message || 'Payment initialization failed');
              return;
            }

            const redirectTo = 
              paymentResult?.redirectTo ||
              paymentResult?.authorizationUrl ||
              paymentResult?.authorization_url 
              paymentResult?.data?.authorization_url 
              paymentResult?.data?.authorizationUrl;

            console.log('[CheckoutScreen] 🔍 Extracted redirect URL:');
            console.log('[CheckoutScreen] redirectTo:', redirectTo);
            console.log('[CheckoutScreen] redirectTo type:', typeof redirectTo);
            console.log('[CheckoutScreen] redirectTo length:', redirectTo?.length);

            if (!redirectTo || typeof redirectTo !== 'string' || redirectTo.trim() === '') {
              console.error('[CheckoutScreen] ❌ No valid redirect URL in payment result!');
              console.error('[CheckoutScreen] Full payment result:', JSON.stringify(paymentResult, null, 2));
              Alert.alert(
                'Payment Error',
                'No payment URL received. Please try again.',
                [{ text: 'OK' }]
              );
              setFormError('No payment URL received. Please try again.');
              return;
            }

            try {
              const url = new URL(redirectTo);
              const isValidPaystack =
                url.hostname === 'paystack.com' 
                url.hostname.endsWith('.paystack.com') 
                url.hostname === 'checkout.paystack.com';

              if (!isValidPaystack) {
                throw new Error('Invalid payment redirect URL');
              }
            } catch (urlError) {
              console.error('[CheckoutScreen] Invalid redirect URL:', redirectTo, urlError);
              Alert.alert(
                'Payment Error',
                'Invalid payment redirect URL. Please contact support.',
                [{ text: 'OK' }]
              );
              setFormError('Invalid payment redirect URL. Please contact support.');
              return;
            }

            console.log('[CheckoutScreen] Navigating to PaystackWebView with:', {
              authorizationUrl: redirectTo,
              orderId: order._id,
              amount: order.totalPrice || order.total || 0,
              email: order.user?.email || user?.email || '',
            });

            try {
              navigation.navigate('PaystackWebView', {
                authorizationUrl: redirectTo,
                orderId: order._id,
                amount: order.totalPrice || order.total || 0,
                email: order.user?.email || user?.email || '',
              });
              console.log('[CheckoutScreen] ✅ Navigation to PaystackWebView completed');
            } catch (navError) {
              console.error('[CheckoutScreen] ❌ Navigation error:', navError);
              Alert.alert(
                'Navigation Error',
                'Failed to open payment page. Please try again.',
                [{ text: 'OK' }]
              );
            }
          } catch (paymentError) {
            console.error('[CheckoutScreen] Payment initialization error:', paymentError);
            const errorMessage =
              paymentError.response?.data?.message 
                paymentError.message 
              'Failed to initialize payment. Please try again.';

            console.error('[CheckoutScreen] Error details:', {
              message: errorMessage,
              response: paymentError.response?.data,
              status: paymentError.response?.status,
            });

            Alert.alert(
              'Payment Error',
              errorMessage,
              [{ text: 'OK' }]
            );
            setFormError(errorMessage);
          }
        } else if (paymentMethod === 'credit_balance') {

          console.log('[CheckoutScreen] Credit balance payment - navigating to order confirmation');
          navigation.navigate('OrderComplete', {
            orderId: order._id,
            orderNumber: order.orderNumber || order.orderId,
            totalAmount: order.totalPrice || order.totalAmount,
            paymentMethod,
            shippingCost: shippingFee,
            subTotal,
            discount,
            orderDate: order.createdAt,
            deliveryMethod,
          });
        } else {

          console.log('[CheckoutScreen] Navigating to order confirmation (non-Paystack payment)');
          navigation.navigate('OrderComplete', {
            orderId: order._id,
            orderNumber: order.orderNumber || order.orderId,
            totalAmount: order.totalPrice || order.totalAmount,
            paymentMethod,
            shippingCost: shippingFee,
            subTotal,
            discount,
            orderDate: order.createdAt,
            deliveryMethod,
          });
        }
      },
      onError: (error) => {
        console.error('Order creation error:', error);
        setFormError(
          error.response?.data?.message || 'Failed to place order'
        );
      },
    });
  };

  if (isAddressLoading || isCartLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading checkout data...</Text>
      </View>
    );
  }

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

    if (offsetY > 100) {
      setShowStickyButton(true);
    } else {
      setShowStickyButton(false);
    }
  };

  const handleScrollEnd = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY > 100) {
      setShowStickyButton(true);
    }
  };

  const renderCheckoutButton = () => (
    <AppButton
      title={
        isCreatingOrder
          ? 'Placing Order...'
          : paymentMethod === 'mobile_money'
            ? 'Place Order & Pay'
            : paymentMethod === 'credit_balance'
              ? hasInsufficientBalance
                ? 'Insufficient Balance'
                : 'Place Order & Pay'
              : 'Place Order'
      }
      variant="primary"
      size="lg"
      onPress={handlePlaceOrder}
      disabled={isCreatingOrder || hasInsufficientBalance}
      loading={isCreatingOrder}
      fullWidth
    />
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>

        {showStickyButton && (
          <View style={styles.stickyHeader}>
            <SafeAreaView edges={['top']} style={styles.stickyHeaderSafeArea}>
              <View style={styles.stickyHeaderContent}>
                <View style={styles.stickyHeaderInfo}>
                  <Text style={styles.stickyHeaderTotalLabel}>Total</Text>
                  <Text style={styles.stickyHeaderTotalValue}>GH₵{total.toFixed(2)}</Text>
                </View>
                <View style={styles.stickyHeaderButton}>
                  {renderCheckoutButton()}
                </View>
              </View>
            </SafeAreaView>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
        >

          <CheckoutSection title="Shipping Information">

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'existing' && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab('existing')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'existing' && styles.tabButtonTextActive,
                  ]}
                >
                  Select Address
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'new' && styles.tabButtonActive,
                ]}
                onPress={() => setActiveTab('new')}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'new' && styles.tabButtonTextActive,
                  ]}
                >
                  Add New Address
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'existing' ? (
              <View style={styles.addressList}>
                {address.map((addr) => (
                  <AddressCard
                    key={addr._id}
                    address={addr}
                    selected={selectedAddressId === addr._id}
                    onPress={() => handleAddressSelect(addr._id)}
                    isDefault={addr.isDefault}
                  />
                ))}
              </View>
            ) : (
              <View>
                {(formError || createAddressError) && (
                  <View style={styles.errorState}>
                    <Text style={styles.errorStateText}>
                      {formError 
                        createAddressError?.message 
                        'Failed to create address'}
                    </Text>
                  </View>
                )}
                <AppInput
                  label="Full Name *"
                  value={newAddress.fullName}
                  onChangeText={(value) => handleAddressChange('fullName', value)}
                  placeholder="Full name"
                  error={errors.fullName}
                />
                <AppInput
                  label="Street Address *"
                  value={newAddress.streetAddress}
                  onChangeText={(value) => handleAddressChange('streetAddress', value)}
                  placeholder="123 Main Street"
                  error={errors.streetAddress}
                />
                <View style={styles.formRow}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Neighborhood/Area *
                    </Text>
                    <NeighborhoodAutocomplete
                      value={newAddress.area}
                      onChange={(value) => handleAddressChange('area', value)}
                      city={newAddress.city}
                      placeholder="Search neighborhood (e.g., Nima, Cantonments, Tema Community 1)"
                      onSelect={(neighborhood) => {
                        setNewAddress((prev) => ({
                          ...prev,
                          area: neighborhood.name,
                        }));
                      }}
                      error={errors.area}
                    />
                    <Text style={styles.hintText}>
                      Start typing to search for your neighborhood
                    </Text>
                    {errors.area && (
                      <Text style={styles.errorText}>{errors.area}</Text>
                    )}
                  </View>
                  <View style={styles.formGroup}>
                    <AppInput
                      label="Landmark"
                      value={newAddress.landmark}
                      onChangeText={(value) => handleAddressChange('landmark', value)}
                      placeholder="Near Osu Castle (optional)"
                    />
                  </View>
                </View>
                <View style={styles.formRow}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>City *</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Select City',
                          'Saysay currently delivers only in Accra and Tema',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Accra',
                              onPress: () => handleAddressChange('city', 'ACCRA'),
                            },
                            {
                              text: 'Tema',
                              onPress: () => handleAddressChange('city', 'TEMA'),
                            },
                          ]
                        );
                      }}
                      style={[
                        styles.citySelector,
                        errors.city && styles.citySelectorError,
                      ]}
                    >
                      <Text
                        style={[
                          styles.citySelectorText,
                          !newAddress.city && styles.citySelectorPlaceholder,
                        ]}
                      >
                        {newAddress.city || 'Select City'}
                      </Text>
                      <Text style={styles.citySelectorIcon}>▼</Text>
                    </TouchableOpacity>
                    {errors.city && (
                      <Text style={styles.errorText}>{errors.city}</Text>
                    )}
                    <Text style={styles.hintText}>
                      Saysay currently delivers only in Accra and Tema
                    </Text>
                  </View>
                  <View style={styles.formGroup}>
                    <AppInput
                      label="Region *"
                      value={newAddress.region}
                      onChangeText={(value) => handleAddressChange('region', value)}
                      placeholder="Greater Accra"
                      error={errors.region}
                    />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <View style={styles.digitalAddressHeader}>
                    <Text style={styles.label}>Digital Address</Text>
                    <TouchableOpacity
                      onPress={getCurrentLocation}
                      disabled={isFetchingLocation}
                      style={styles.locationButton}
                    >
                      <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.locationButtonText}>
                        {isFetchingLocation ? 'Detecting...' : 'Auto-detect'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <AppInput
                    value={newAddress.digitalAddress}
                    onChangeText={(value) => handleAddressChange('digitalAddress', value)}
                    placeholder="GA-123-4567"
                    error={errors.digitalAddress || locationError}
                  />
                  <Text style={styles.hintText}>
                    Format: AA-123-4567 (e.g., GA-123-4567)
                  </Text>
                </View>
                <AppInput
                  label="Contact Number *"
                  value={newAddress.contactPhone}
                  onChangeText={(value) => handleAddressChange('contactPhone', value)}
                  placeholder="020 123 4567"
                  keyboardType="phone-pad"
                  error={errors.contactPhone}
                />
                <Text style={styles.hintText}>
                  Format: 020, 023, 024, etc. followed by 7 digits
                </Text>
                <View style={styles.buttonRow}>
                  <AppButton
                    title="Cancel"
                    variant="secondary"
                    size="sm"
                    onPress={() => setActiveTab('existing')}
                    style={styles.buttonHalf}
                  />
                  <AppButton
                    title={isAddressCreating ? 'Saving...' : 'Save Shipping Address'}
                    variant="success"
                    size="sm"
                    onPress={handleNewAddress}
                    loading={isAddressCreating}
                    style={styles.buttonHalf}
                  />
                </View>
              </View>
            )}
          </CheckoutSection>

          <CheckoutSection title="Delivery Method">

            <View style={styles.deliveryInfoBanner}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.deliveryInfoText}>
                Saysay currently delivers only in Accra and Tema
              </Text>
            </View>

            <View style={styles.deliveryOptions}>

              <DeliveryOptionCard
                icon="ionicons:storefront-outline"
                title="Pickup from Saysay Center"
                description="Collect your order from one of our pickup centers. Free or minimal fee."
                selected={deliveryMethod === 'pickup_center'}
                onPress={() => {
                  handleDeliveryMethodChange('pickup_center');
                  setSelectedPickupCenterId(null);
                }}
              >
                {deliveryMethod === 'pickup_center' && (
                  <View style={styles.pickupCenterContent}>
                    {buyerCity && (
                      <View style={{ marginBottom: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: theme.colors.green50, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.green200 }}>
                        <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.green700, fontWeight: theme.typography.fontWeight.semibold }}>
                          Shipping Fee: Free
                        </Text>
                      </View>
                    )}
                    {!buyerCity && (
                      <View style={{ marginBottom: theme.spacing.md, padding: theme.spacing.sm, backgroundColor: theme.colors.grey50, borderRadius: theme.borderRadius.sm }}>
                        <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.grey600 }}>
                          Select address to see shipping fee
                        </Text>
                      </View>
                    )}
                    {isPickupCentersLoading ? (
                      <View style={styles.centerLoading}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Loading pickup centers...</Text>
                      </View>
                    ) : pickupCenters.length === 0 ? (
                      <View style={styles.errorContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                          <Ionicons name="warning-outline" size={16} color={theme.colors.error} />
                          <Text style={styles.deliveryErrorText}>No pickup centers available for this city</Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.pickupCenterTitle}>Select Pickup Center *</Text>
                        <View style={styles.pickupCenterList}>
                          {pickupCenters.map((center) => (
                            <TouchableOpacity
                              key={center._id}
                              style={[
                                styles.pickupCenterCard,
                                selectedPickupCenterId === center._id && styles.pickupCenterCardSelected,
                              ]}
                              onPress={() => setSelectedPickupCenterId(center._id)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.pickupCenterCardContent}>
                                <View style={styles.pickupCenterCardHeader}>
                                  <Text
                                    style={[
                                      styles.pickupCenterCardName,
                                      selectedPickupCenterId === center._id && styles.pickupCenterCardNameSelected,
                                    ]}
                                  >
                                    {center.pickupName}
                                  </Text>
                                  {selectedPickupCenterId === center._id && (
                                    <View style={styles.pickupCenterCheckmark}>
                                      <Ionicons name="checkmark" size={14} color={theme.colors.white} />
                                    </View>
                                  )}
                                </View>
                                <View style={styles.pickupCenterCardDetails}>
                                  <View style={styles.pickupCenterDetailRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                                      <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                                      <Text style={styles.pickupCenterDetailLabel}>Address:</Text>
                                    </View>
                                    <Text style={styles.pickupCenterDetailValue}>{center.address}</Text>
                                  </View>
                                  {center.area && (
                                    <View style={styles.pickupCenterDetailRow}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                                        <Ionicons name="business-outline" size={14} color={theme.colors.textSecondary} />
                                        <Text style={styles.pickupCenterDetailLabel}>Area:</Text>
                                      </View>
                                      <Text style={styles.pickupCenterDetailValue}>
                                        {center.area}, {center.city}
                                      </Text>
                                    </View>
                                  )}
                                  {center.openingHours && (
                                    <View style={styles.pickupCenterDetailRow}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                                        <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                                        <Text style={styles.pickupCenterDetailLabel}>Hours:</Text>
                                      </View>
                                      <Text style={styles.pickupCenterDetailValue}>{center.openingHours}</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </DeliveryOptionCard>

              <DeliveryOptionCard
                icon="ionicons:car-outline"
                title="Saysay Dispatch Rider"
                description="Fast delivery by Saysay's own dispatch riders. Calculated based on location and item type."
                selected={deliveryMethod === 'dispatch'}
                onPress={() => handleDeliveryMethodChange('dispatch')}
              >

                {deliveryMethod === 'dispatch' && buyerCity && (
                  <View style={styles.dispatchContent}>
                    <View style={styles.shippingOptionsContainer}>
                      <ShippingOptions
                        weight={null}
                        city={buyerCity}
                        neighborhoodName={
                          activeTab === 'existing' && selectedAddress
                            ? (selectedAddress.area || selectedAddress.landmark || selectedAddress.streetAddress)
                            : activeTab === 'new' && newAddress
                              ? (newAddress.area || newAddress.landmark || newAddress.streetAddress)
                              : null
                        }
                        fragile={isFragileItem}
                        items={shippingItems}
                        selectedShippingType={deliverySpeed || 'standard'}
                        onSelect={handleShippingSelect}
                      />
                    </View>

                    <View style={styles.fragileCheckboxWrapper}>
                      <TouchableOpacity
                        style={styles.fragileCheckbox}
                        onPress={() => setIsFragileItem(!isFragileItem)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.fragileCheckboxBox,
                            isFragileItem && styles.fragileCheckboxBoxChecked,
                          ]}
                        >
                          {isFragileItem && (
                            <Ionicons name="checkmark" size={14} color={theme.colors.white} />
                          )}
                        </View>
                        <Text style={styles.fragileCheckboxLabel}>
                          Fragile Item (Additional handling required)
                        </Text>
                      </TouchableOpacity>
                      {isFragileItem && (
                        <View style={styles.fragileHintBox}>
                          <Text style={styles.fragileHintText}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                              <Ionicons name="warning-outline" size={14} color={theme.colors.warning} />
                              <Text>Fragile items require special handling and may incur additional charges.</Text>
                            </View>
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {isCalculatingShipping && (
                  <View style={styles.shippingCalculationLoader}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.shippingCalculationText}>
                      Calculating shipping...
                    </Text>
                  </View>
                )}
              </DeliveryOptionCard>
            </View>
          </CheckoutSection>

          <CheckoutSection 
            title="Payment Method"
            headerRight={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                <Ionicons name="lock-closed" size={16} color={theme.colors.green700} />
                <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.green700 }}>
                  Secure Payment
                </Text>
              </View>
            }
          >
            <View style={styles.paymentOptions}>

              <PaymentMethodCard
                icon="ionicons:card-outline"
                title="Payment on Delivery"
                description="Pay with cash when your order arrives or pay with mobile money"
                selected={paymentMethod === 'payment_on_delivery'}
                onPress={() => setPaymentMethod('payment_on_delivery')}
              />

              <PaymentMethodCard
                icon="ionicons:phone-portrait-outline"
                title="Mobile Money"
                description="Pay via MTN Mobile Money, Vodafone Cash, etc. You will be redirected to Paystack to complete your payment."
                selected={paymentMethod === 'mobile_money'}
                onPress={() => setPaymentMethod('mobile_money')}
              />

              <PaymentMethodCard
                icon="ionicons:business-outline"
                title="Bank Transfer"
                description="Direct bank transfer"
                selected={paymentMethod === 'bank'}
                onPress={() => setPaymentMethod('bank')}
              >
                {paymentMethod === 'bank' && (
                  <View style={{ marginTop: theme.spacing.sm }}>
                    <View style={{ padding: theme.spacing.md, backgroundColor: theme.colors.grey50, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.grey200 }}>
                      <Text style={{ fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.xs, color: theme.colors.grey700 }}>
                        <Text style={{ fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.grey900 }}>Bank Name:</Text> Ghana Commercial Bank
                      </Text>
                      <Text style={{ fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.xs, color: theme.colors.grey700 }}>
                        <Text style={{ fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.grey900 }}>Account Name:</Text> ShopGH Ltd
                      </Text>
                      <Text style={{ fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.xs, color: theme.colors.grey700 }}>
                        <Text style={{ fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.grey900 }}>Account Number:</Text> 1234567890
                      </Text>
                      <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.grey700 }}>
                        <Text style={{ fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.grey900 }}>Reference:</Text> Order #ORD-20230708
                      </Text>
                    </View>
                    <Text style={{ marginTop: theme.spacing.sm, fontSize: theme.typography.fontSize.sm, color: theme.colors.grey600, fontStyle: 'italic' }}>
                      Please use the reference number when making your payment
                    </Text>
                  </View>
                )}
              </PaymentMethodCard>

              <PaymentMethodCard
                icon="ionicons:wallet-outline"
                title="Account Balance"
                description="Pay using your account credit balance"
                selected={paymentMethod === 'credit_balance'}
                disabled={hasInsufficientBalance}
                onPress={() => !hasInsufficientBalance && setPaymentMethod('credit_balance')}
              >
                {paymentMethod === 'credit_balance' && (
                  <View style={{ marginTop: theme.spacing.sm }}>
                    <View style={{ padding: theme.spacing.md, backgroundColor: theme.colors.grey50, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.grey200, marginBottom: theme.spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs }}>
                        <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.grey700, fontWeight: theme.typography.fontWeight.medium }}>
                          Current Balance:
                        </Text>
                        <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.grey900, fontWeight: theme.typography.fontWeight.semibold }}>
                          GH₵{creditBalance.toFixed(2)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.grey700, fontWeight: theme.typography.fontWeight.medium }}>
                          Order Total:
                        </Text>
                        <Text style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.grey900, fontWeight: theme.typography.fontWeight.semibold }}>
                          GH₵{total.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    {hasInsufficientBalance && (
                      <View style={{ padding: theme.spacing.md, backgroundColor: theme.colors.red50, borderWidth: 1, borderColor: theme.colors.red300, borderRadius: theme.borderRadius.md }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                          <Ionicons name="warning-outline" size={16} color={theme.colors.error} />
                        <Text style={{ color: theme.colors.error, fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium }}>
                            Insufficient Balance. You need GH₵{(total - creditBalance).toFixed(2)} more.
                        </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </PaymentMethodCard>
            </View>
          </CheckoutSection>

          <CheckoutSection title="Order Summary">

            <View style={styles.couponSection}>
              <View style={styles.couponHeader}>
                <View style={styles.couponHeaderLeft}>
                  <Ionicons name="ticket-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.couponTitle}>Have a coupon code?</Text>
                </View>
                {discount > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setCouponCode('');
                      setCouponMessage('');
                      setDiscount(0);
                      setCouponData(null);
                      setCouponError(null);
                    }}
                    style={styles.removeCouponButton}
                  >
                    <Text style={styles.removeCouponText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {discount === 0 ? (
                <View style={styles.couponInputContainer}>
                  <View style={styles.couponInputWrapper}>
                    <TextInput
                      style={[
                        styles.couponInput,
                        couponError && styles.couponInputError,
                        discount > 0 && styles.couponInputSuccess,
                      ]}
                      placeholder="Enter coupon code"
                      placeholderTextColor={theme.colors.grey400}
                      value={couponCode}
                    onChangeText={(text) => {

                      const sanitized = sanitizeCouponCode(text);
                      setCouponCode(sanitized);
                    }}
                    editable={!isApplyingCoupon && discount === 0}
                      autoCapitalize="characters"
                    />
                    <AppButton
                      title={isApplyingCoupon ? 'Applying...' : 'Apply'}
                      variant={couponCode.trim() ? 'primary' : 'secondary'}
                      size="md"
                      onPress={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      loading={isApplyingCoupon}
                      style={styles.couponApplyButton}
                    />
                  </View>

                  {couponMessage && (
                    <View
                      style={[
                        styles.couponMessageContainer,
                        discount > 0
                          ? styles.couponMessageSuccess
                          : styles.couponMessageError,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                        {discount > 0 ? (
                          <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        ) : (
                          <Ionicons name="warning-outline" size={16} color={theme.colors.error} />
                        )}
                      <Text
                        style={[
                          styles.couponMessageText,
                          discount > 0 && styles.couponMessageTextSuccess,
                        ]}
                      >
                        {couponMessage}
                      </Text>
                      </View>
                    </View>
                  )}

                  {couponError && (
                    <View style={styles.couponErrorContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                        <Ionicons name="warning-outline" size={16} color={theme.colors.error} />
                      <Text style={styles.couponErrorText}>
                          {couponError?.message || 'Failed to apply coupon'}
                      </Text>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.couponAppliedContainer}>
                  <View style={styles.couponAppliedContent}>
                    <View style={styles.couponAppliedIcon}>
                      <Text style={styles.couponAppliedIconText}>✓</Text>
                    </View>
                    <View style={styles.couponAppliedInfo}>
                      <Text style={styles.couponAppliedCode}>
                        {couponCode.toUpperCase()}
                      </Text>
                      <Text style={styles.couponAppliedMessage}>
                        {couponMessage || 'Coupon applied successfully!'}
                      </Text>
                      <Text style={styles.couponAppliedDiscount}>
                        You saved GH₵{discount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.summaryContainer}>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Product Price</Text>
                <Text style={styles.summaryValue}>GH₵{subTotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Charges</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isCalculatingShipping ? (
                    <>
                      <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: theme.spacing.xs }} />
                      <Text style={[styles.summaryValue, { color: theme.colors.grey600 }]}>Calculating...</Text>
                    </>
                  ) : shippingFee > 0 ? (
                    <Text style={styles.summaryValue}>GH₵{shippingFee.toFixed(2)}</Text>
                  ) : (
                    <Text style={[styles.summaryValue, { color: theme.colors.green700, fontWeight: theme.typography.fontWeight.medium }]}>Free</Text>
                  )}
                </View>
              </View>

              {discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.green700 }]}>-GH₵{discount.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>GH₵{total.toFixed(2)}</Text>
              </View>
            </View>

              {(createOrderError || formError) && (
                <ErrorState style={{ marginTop: theme.spacing.md }}>
                  <ErrorStateText>
                    {createOrderError?.message 
                      formError 
                      'Something went wrong'}
                  </ErrorStateText>
                </ErrorState>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.lg, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.grey200 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Ionicons name="lock-closed" size={16} color={theme.colors.textSecondary} />
                  <Text style={{ fontSize: theme.typography.fontSize.sm }}>Secure Payment</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <Ionicons name="card-outline" size={16} color={theme.colors.textSecondary} />
                  <Ionicons name="phone-portrait-outline" size={16} color={theme.colors.textSecondary} />
                  <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
                </View>
              </View>
          </CheckoutSection>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>

      <View style={[styles.stickyBottomContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.stickyBottomContent}>
          <View style={styles.stickyBottomInfo}>
            <Text style={styles.stickyBottomTotalLabel}>Total</Text>
            <Text style={styles.stickyBottomTotalValue}>GH₵{total.toFixed(2)}</Text>
          </View>
          <View style={styles.stickyBottomButton}>
            {renderCheckoutButton()}
          </View>
        </View>
      </View>
    </View>
  );
};

const Container = ({style, ...props}) => (
  <View {...props} style={[styles.container, style]} />
);

const ScrollContainer = ({style, ...props}) => (
  <ScrollView {...props} style={[styles.scrollContainer, style]} />
);

const Content = ({style, ...props}) => (
  <View {...props} style={[styles.content, style]} />
);

const Section = ({style, ...props}) => (
  <View {...props} style={[styles.section, style]} />
);

const SectionHeader = ({style, ...props}) => (
  <View {...props} style={[styles.sectionHeader, style]} />
);

const SectionTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.sectionTitle, style]} />
);

const TabContainer = ({style, ...props}) => (
  <View {...props} style={[styles.tabContainer, style]} />
);

const TabButton = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.tabButton, style]} />
);

const TabButtonText = ({style, ...props}) => (
  <Text {...props} style={[styles.tabButtonText, style]} />
);

const AddressList = ({style, ...props}) => (
  <View {...props} style={[styles.addressList, style]} />
);

const AddressItem = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.addressItem, style]} />
);

const AddressContent = ({style, ...props}) => (
  <View {...props} style={[styles.addressContent, style]} />
);

const AddressIcon = ({style, ...props}) => (
  <View {...props} style={[styles.addressIcon, style]} />
);

const AddressInfo = ({style, ...props}) => (
  <View {...props} style={[styles.addressInfo, style]} />
);

const AddressName = ({style, ...props}) => (
  <Text {...props} style={[styles.addressName, style]} />
);

const AddressText = ({style, ...props}) => (
  <Text {...props} style={[styles.addressText, style]} />
);

const DefaultBadge = ({style, ...props}) => (
  <View {...props} style={[styles.defaultBadge, style]} />
);

const DefaultBadgeText = ({style, ...props}) => (
  <Text {...props} style={[styles.defaultBadgeText, style]} />
);

const SelectionCheckmark = ({style, ...props}) => (
  <View {...props} style={[styles.selectionCheckmark, style]} />
);

const FormRow = ({style, ...props}) => (
  <View {...props} style={[styles.formRow, style]} />
);

const FormGroup = ({style, ...props}) => (
  <View {...props} style={[styles.formGroup, style]} />
);

const ErrorText = ({style, ...props}) => (
  <Text {...props} style={[styles.errorText, style]} />
);

const HintText = ({style, ...props}) => (
  <Text {...props} style={[styles.hintText, style]} />
);

const DeliveryOptions = ({style, ...props}) => (
  <View {...props} style={[styles.deliveryOptions, style]} />
);

const DeliveryOption = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.deliveryOption, style]} />
);

const DeliveryContent = ({style, ...props}) => (
  <View {...props} style={[styles.deliveryContent, style]} />
);

const DeliveryIcon = ({style, ...props}) => (
  <View {...props} style={[styles.deliveryIcon, style]} />
);

const DeliveryInfo = ({style, ...props}) => (
  <View {...props} style={[styles.deliveryInfo, style]} />
);

const DeliveryTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.deliveryTitle, style]} />
);

const DeliveryDescription = ({style, ...props}) => (
  <Text {...props} style={[styles.deliveryDescription, style]} />
);

const PickupCenterSelector = ({style, ...props}) => (
  <View {...props} style={[styles.pickupCenterSelector, style]} />
);

const PickupCenterList = ({style, ...props}) => (
  <View {...props} style={[styles.pickupCenterList, style]} />
);

const PickupCenterItem = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.pickupCenterItem, style]} />
);

const PickupCenterName = ({style, ...props}) => (
  <Text {...props} style={[styles.pickupCenterName, style]} />
);

const PickupCenterAddress = ({style, ...props}) => (
  <Text {...props} style={[styles.pickupCenterAddress, style]} />
);

const PaymentOptions = ({style, ...props}) => (
  <View {...props} style={[styles.paymentOptions, style]} />
);

const PaymentOption = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.paymentOption, style]} />
);

const PaymentContent = ({style, ...props}) => (
  <View {...props} style={[styles.paymentContent, style]} />
);

const PaymentIcon = ({style, ...props}) => (
  <View {...props} style={[styles.paymentIcon, style]} />
);

const PaymentInfo = ({style, ...props}) => (
  <View {...props} style={[styles.paymentInfo, style]} />
);

const PaymentTitle = ({style, ...props}) => (
  <Text {...props} style={[styles.paymentTitle, style]} />
);

const PaymentDescription = ({style, ...props}) => (
  <Text {...props} style={[styles.paymentDescription, style]} />
);

const CouponForm = ({style, ...props}) => (
  <View {...props} style={[styles.couponForm, style]} />
);

const CouponInput = ({style, ...props}) => (
  <TextInput {...props} style={[styles.couponInput, style]} />
);

const CouponMessage = ({style, ...props}) => (
  <Text {...props} style={[styles.couponMessage, style]} />
);

const SummaryItem = ({style, ...props}) => (
  <View {...props} style={[styles.summaryItem, style]} />
);

const SummaryTotal = ({style, ...props}) => (
  <SummaryItem {...props} style={[styles.summaryTotal, style]} />
);

const SummaryText = ({style, ...props}) => (
  <Text {...props} style={[styles.summaryText, style]} />
);

const SummaryTotalText = ({style, ...props}) => (
  <Text {...props} style={[styles.summaryTotalText, style]} />
);

const FragileCheckboxContainer = ({style, ...props}) => (
  <View {...props} style={[styles.fragileCheckboxContainer, style]} />
);

const FragileCheckboxLabel = ({style, ...props}) => (
  <TouchableOpacity {...props} style={[styles.fragileCheckboxLabel, style]} />
);

const FragileCheckboxText = ({style, ...props}) => (
  <Text {...props} style={[styles.fragileCheckboxText, style]} />
);

const FragileHint = ({style, ...props}) => (
  <Text {...props} style={[styles.fragileHint, style]} />
);

const InfoText = ({style, ...props}) => (
  <Text {...props} style={[styles.infoText, style]} />
);

const ErrorState = ({style, ...props}) => (
  <View {...props} style={[styles.errorState, style]} />
);

const ErrorStateText = ({style, ...props}) => (
  <Text {...props} style={[styles.errorStateText, style]} />
);

const LoadingContainer = ({style, ...props}) => (
  <View {...props} style={[styles.loadingContainer, style]} />
);

const LoadingText = ({style, ...props}) => (
  <Text {...props} style={[styles.loadingText, style]} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  content: ,
  section: ,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: ,
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    borderBottomWidth: 2,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  tabButtonText: ,
  addressList: ,
  addressItem: {
    borderWidth: 2,
    position: 'relative',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: ,
  addressText: ,
  defaultBadge: {
    alignSelf: 'flex-start',
  },
  defaultBadgeText: ,
  selectionCheckmark: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formRow: {
    flexDirection: 'row',
  },
  formGroup: {
    flex: 1,
  },
  errorText: ,
  hintText: ,
  deliveryOptions: {
    gap: theme.spacing.md,
  },
  deliveryInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.blue50,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.blue500,
  },
  deliveryInfoIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  deliveryInfoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.blue900,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  pickupCenterContent: {
    marginTop: theme.spacing.sm,
  },
  centerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey600,
  },
  errorContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.red50,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.red200,
  },
  deliveryErrorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.red700,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  pickupCenterTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.grey900,
    marginBottom: theme.spacing.md,
  },
  pickupCenterList: {
    gap: theme.spacing.sm,
  },
  pickupCenterCard: {
    borderWidth: 2,
    borderColor: theme.colors.grey200,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  pickupCenterCardSelected: {
    borderColor: theme.colors.primary500,
    backgroundColor: theme.colors.primary50,
    ...theme.shadows.md,
  },
  pickupCenterCardContent: {
    gap: theme.spacing.xs,
  },
  pickupCenterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  pickupCenterCardName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.grey900,
    flex: 1,
  },
  pickupCenterCardNameSelected: {
    color: theme.colors.primary700,
  },
  pickupCenterCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  pickupCenterCardDetails: {
    gap: theme.spacing.xs,
  },
  pickupCenterDetailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  pickupCenterDetailLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.grey700,
    marginRight: theme.spacing.xs,
  },
  pickupCenterDetailValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey600,
    flex: 1,
  },
  dispatchContent: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  shippingOptionsContainer: {
    marginTop: theme.spacing.sm,
  },
  fragileCheckboxWrapper: {
    marginTop: theme.spacing.sm,
  },
  fragileCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  fragileCheckboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  fragileCheckboxBoxChecked: {
    borderColor: theme.colors.primary500,
    backgroundColor: theme.colors.primary500,
  },
  fragileCheckboxLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey900,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  fragileHintBox: {
    marginTop: theme.spacing.xs,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.amber50,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.amber200,
    marginLeft: theme.spacing.xl,
  },
  fragileHintText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.amber900,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  shippingCalculationLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  shippingCalculationText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.grey600,
  },
  deliveryOption: {
    borderWidth: 2,
    position: 'relative',
  },
  deliveryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deliveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: ,
  deliveryDescription: ,
  pickupCenterSelector: ,
  pickupCenterList: ,
  pickupCenterItem: {
    borderWidth: 2,
    position: 'relative',
  },
  pickupCenterName: ,
  pickupCenterAddress: ,
  paymentOptions: {
    gap: theme.spacing.md,
  },
  summaryContainer: {
    marginTop: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grey700,
    fontWeight: theme.typography.fontWeight.medium,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grey900,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.grey200,
    marginVertical: theme.spacing.md,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  summaryTotalLabel: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.grey900,
    fontWeight: theme.typography.fontWeight.bold,
  },
  summaryTotalValue: {
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.primary700,
    fontWeight: theme.typography.fontWeight.bold,
  },
  paymentOption: {
    borderWidth: 2,
    position: 'relative',
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: ,
  paymentDescription: ,
  couponSection: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.grey50,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  couponHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  couponTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.grey900,
  },
  removeCouponButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  removeCouponText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.red600,
    fontWeight: theme.typography.fontWeight.medium,
  },
  couponInputContainer: {
    gap: theme.spacing.sm,
  },
  couponInputWrapper: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.grey300,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.grey900,
    backgroundColor: theme.colors.white,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 1,
  },
  couponInputError: {
    borderColor: theme.colors.red400,
    backgroundColor: theme.colors.red50,
  },
  couponInputSuccess: {
    borderColor: theme.colors.green400,
    backgroundColor: theme.colors.green50,
  },
  couponApplyButton: {
    minWidth: 100,
  },
  couponMessageContainer: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  couponMessageSuccess: {
    backgroundColor: theme.colors.green50,
    borderColor: theme.colors.green200,
  },
  couponMessageError: {
    backgroundColor: theme.colors.red50,
    borderColor: theme.colors.red200,
  },
  couponMessageText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.red700,
    fontWeight: theme.typography.fontWeight.medium,
  },
  couponMessageTextSuccess: {
    color: theme.colors.green700,
  },
  couponErrorContainer: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.red50,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.red200,
  },
  couponErrorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.red700,
    fontWeight: theme.typography.fontWeight.medium,
  },
  couponAppliedContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.green50,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.green300,
  },
  couponAppliedContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  couponAppliedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  couponAppliedIconText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  couponAppliedInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  couponAppliedCode: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.green900,
    letterSpacing: 1,
  },
  couponAppliedMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.green700,
    fontWeight: theme.typography.fontWeight.medium,
  },
  couponAppliedDiscount: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.green800,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing.xs,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryTotal: {
    borderTopWidth: 1,
  },
  summaryText: ,
  summaryTotalText: ,
  fragileCheckboxContainer: ,
  fragileCheckboxLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fragileCheckboxText: ,
  fragileHint: ,
  infoText: {
    borderLeftWidth: 3,
  },
  errorState: ,
  errorStateText: ,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: ,
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 9999,
    elevation: 20, 
    backgroundColor: 'transparent',
  },
  stickyHeaderSafeArea: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
    ...theme.shadows.lg,
  },
  stickyHeaderContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  stickyHeaderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  stickyHeaderTotalLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.grey700,
  },
  stickyHeaderTotalValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary700,
  },
  stickyHeaderButton: {
    width: '100%',
  },
  stickyBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 10000,
    elevation: 25, 
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,

    marginBottom: 80,
  },
  stickyBottomContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  stickyBottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  stickyBottomTotalLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.grey700,
  },
  stickyBottomTotalValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary700,
  },
  stickyBottomButton: {
    width: '100%',
  },
});

export default CheckoutScreen;


