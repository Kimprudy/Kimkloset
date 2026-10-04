import { Redirect } from 'expo-router';

// After Paystack, our website sends people to kimkloset://payment-return (or exp://…/--/payment-return).
// The browser sheet on the checkout screen usually catches that link itself; this route just stops
// a "page not found" screen if the link ever opens the app directly.
export default function PaymentReturn() {
  return <Redirect href="/orders" />;
}
