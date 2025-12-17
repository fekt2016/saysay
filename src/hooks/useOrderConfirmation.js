export const useOrderConfirmation = (
  orderFromState,
  orderIdFromUrl,
  paymentReference,
  needsVerification = false
) => {
  const queryClient = useQueryClient();

  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentVerificationError, setPaymentVerificationError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); 

  const hasVerifiedRef = useRef(false);
  const verificationAttemptedRef = useRef(false);
  const queriesInvalidatedRef = useRef(false);

  const lastVerifiedRef = useRef(null);

  const lastOrderIdRef = useRef(null);
  const lastPaymentRefRef = useRef(null);
  const lastOrderFromStateRef = useRef(null);

  const {
    data: orderFromApi,
    isLoading: isOrderLoading,
    error: orderError,
  } = useGetUserOrderById(!orderFromState && orderIdFromUrl ? orderIdFromUrl : null);useEffect(() => {

    const orderIdChanged = lastOrderIdRef.current !== orderIdFromUrl;
    const paymentRefChanged = lastPaymentRefRef.current !== paymentReference;
    const orderFromStateChanged = lastOrderFromStateRef.current !== orderFromState;

    if (!orderIdChanged && !paymentRefChanged && !orderFromStateChanged && verificationAttemptedRef.current) {
      return;
    }

    lastOrderIdRef.current = orderIdFromUrl;
    lastPaymentRefRef.current = paymentReference;
    lastOrderFromStateRef.current = orderFromState;

    if (!orderIdChanged && !paymentRefChanged && !orderFromStateChanged) {
      return;
    }

    if (orderFromState && !needsVerification) {

      verificationAttemptedRef.current = false;
      lastVerifiedRef.current = null;
      setVerificationStatus('idle');
      return;
    }

    if (!needsVerification) {
      setVerificationStatus('idle');
      return;
    }

    if (!paymentReference || !orderIdFromUrl) {
      setVerificationStatus('idle');
      return;
    }

    const currentVerification = `${orderIdFromUrl}_${paymentReference}`;
    if (lastVerifiedRef.current === currentVerification) {
      setVerificationStatus('success');
      return;
    }

    const verificationKey = `payment_verified_${orderIdFromUrl}_${paymentReference}`;
    AsyncStorage.getItem(verificationKey).then((stored) => {
      if (stored === 'success') {

        lastVerifiedRef.current = currentVerification;
        verificationAttemptedRef.current = true;
        hasVerifiedRef.current = true;
        setVerificationStatus('success');
        return;
      }

      if (verificationAttemptedRef.current && lastVerifiedRef.current === currentVerification) {
        return;
      }

      const verifyPayment = async () => {

        verificationAttemptedRef.current = true;
        lastVerifiedRef.current = currentVerification;

        setIsVerifyingPayment(true);
        setPaymentVerificationError(null);
        setVerificationStatus('verifying');

        try {

          if (!paymentApi) {
            console.error('[useOrderConfirmation] ❌ paymentApi is not defined!');
            throw new Error('Payment API is not available');
          }

          if (typeof paymentApi.verifyPaystackPayment !== 'function') {
            console.error('[useOrderConfirmation] ❌ verifyPaystackPayment is not a function!');
            console.error('[useOrderConfirmation] paymentApi:', paymentApi);
            console.error('[useOrderConfirmation] paymentApi keys:', Object.keys(paymentApi || ));
            console.error('[useOrderConfirmation] verifyPaystackPayment type:', typeof paymentApi.verifyPaystackPayment);
            throw new Error('Payment verification function is not available');
          }

          console.log('[useOrderConfirmation] ✅ Calling verifyPaystackPayment with:', { paymentReference, orderIdFromUrl });
          const response = await paymentApi.verifyPaystackPayment(
            paymentReference,
            orderIdFromUrl
          );

          await AsyncStorage.setItem(verificationKey, 'success');

          hasVerifiedRef.current = true;
          setVerificationStatus('success');

          if (!queriesInvalidatedRef.current) {
            queriesInvalidatedRef.current = true;

            setTimeout(() => {

              queryClient.invalidateQueries({ 
                queryKey: ['order', orderIdFromUrl],
                exact: true,
                refetchType: 'active',
              });

              queryClient.invalidateQueries({ 
                queryKey: ['orders'],
              });

              queryClient.invalidateQueries({ 
                queryKey: ['cart'],
              });
            }, 1500); 
          }
        } catch (error) {
          const message =
            error?.response?.data?.message 
            error?.message 
            'Failed to verify payment';
          setPaymentVerificationError(message);
          setVerificationStatus('failed');

          await AsyncStorage.setItem(verificationKey, 'failed');

          if (!queriesInvalidatedRef.current) {
            queriesInvalidatedRef.current = true;
            setTimeout(() => {
              queryClient.invalidateQueries({ 
                queryKey: ['order', orderIdFromUrl],
                exact: true,
                refetchType: 'active',
              });
            }, 1000);
          }
        } finally {
          setIsVerifyingPayment(false);
        }
      };

      verifyPayment();
    }).catch((error) => {
      console.error('[useOrderConfirmation] AsyncStorage error:', error);

    });

  }, [
    paymentReference || '', 
    orderIdFromUrl || '', 
    orderFromState ? 'hasState' : 'noState', 
    needsVerification,
  ]);

  return {

    orderFromApi,
    isOrderLoading,
    orderError,

    isVerifyingPayment,
    paymentVerificationError,
    verificationStatus,
    hasVerified: hasVerifiedRef.current,
  };
};

export default useOrderConfirmation;


