import apiClient from "../api/apiClient";


export const createSubscriptionOrder = async ({
  plan,
  durationDays,
}) => {
  const response = await apiClient.post(
    "/subscription-payments/create-order/",
    {
      plan,
      duration_days: durationDays,
    }
  );

  return response.data;
};


export const verifySubscriptionPayment = async ({
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
}) => {
  const response = await apiClient.post(
    "/subscription-payments/verify/",
    {
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
    }
  );

  return response.data;
};