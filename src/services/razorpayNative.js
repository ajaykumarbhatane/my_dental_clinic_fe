import { Capacitor, registerPlugin } from '@capacitor/core';

const RazorpayBridge = registerPlugin('RazorpayBridge');

export const openNativeRazorpay = async ({
  key,
  order_id,
  amount,
  currency = 'INR',
}) => {
  const platform = Capacitor.getPlatform();

  if (platform !== 'android') {
    throw new Error(
      `Razorpay native checkout is only supported on Android. Current platform: ${platform}`
    );
  }

  if (!key) {
    throw new Error('Razorpay key is missing.');
  }

  if (!order_id) {
    throw new Error('Razorpay order ID is missing.');
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error('Razorpay amount must be greater than zero.');
  }

  console.log('[Razorpay Native] Starting native checkout', {
    platform,
    order_id,
    amount: Number(amount),
    currency,
  });

  try {
    const result = await RazorpayBridge.open({
      key,
      order_id,
      amount: Number(amount),
      currency,
    });

    console.log(
      '[Razorpay Native] Native checkout completed',
      result
    );

    return result;

  } catch (error) {

    console.error(
      '[Razorpay Native] Native checkout failed',
      error
    );

    throw new Error(
      error?.message ||
      error?.error ||
      error?.description ||
      'Native Razorpay checkout failed'
    );
  }
};

export default {
  openNativeRazorpay,
};