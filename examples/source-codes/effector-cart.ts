import { createStore, createEvent, createEffect, sample, combine } from 'effector';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderPayload {
  items: CartItem[];
  coupon: string;
  total: number;
}

// 1. Events (Entry Points)
export const itemAdded = createEvent<CartItem>('itemAdded');
export const itemRemoved = createEvent<string>('itemRemoved');
export const quantityChanged = createEvent<{ id: string; quantity: number }>('quantityChanged');
export const couponSubmitted = createEvent<string>('couponSubmitted');
export const checkoutClicked = createEvent<void>('checkoutClicked');

// 2. Side Effects (Async APIs)
export const validateCouponFx = createEffect<string, number>(async (code) => {
  if (code.toUpperCase() === 'PROMO20') return 0.2;
  if (code.toUpperCase() === 'VIP50') return 0.5;
  throw new Error('Invalid coupon code');
});

export const submitOrderFx = createEffect<OrderPayload, { orderId: string }>(async (order) => {
  return { orderId: `ord_${Date.now()}` };
});

// 3. Primary State Stores
export const $cartItems = createStore<CartItem[]>([
  { id: 'prod_1', name: 'Mechanical Keyboard', price: 149, quantity: 1 },
  { id: 'prod_2', name: 'USB-C Docking Station', price: 89, quantity: 2 },
], { name: '$cartItems' })
  .on(itemAdded, (items, newItem) => {
    const existing = items.find((i) => i.id === newItem.id);
    if (existing) {
      return items.map((i) => (i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i));
    }
    return [...items, newItem];
  })
  .on(itemRemoved, (items, id) => items.filter((i) => i.id !== id))
  .on(quantityChanged, (items, { id, quantity }) =>
    items.map((i) => (i.id === id ? { ...i, quantity } : i))
  )
  .reset(submitOrderFx.done);

export const $couponCode = createStore<string>('', { name: '$couponCode' })
  .on(couponSubmitted, (_, code) => code);

export const $discountRate = createStore<number>(0, { name: '$discountRate' })
  .reset(couponSubmitted);

export const $couponError = createStore<string | null>(null, { name: '$couponError' })
  .on(validateCouponFx.failData, (_, err) => err.message)
  .reset(couponSubmitted);

// 4. Derived Stores (Combine)
export const $subtotal = combine($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export const $discountAmount = combine($subtotal, $discountRate, (subtotal, rate) =>
  subtotal * rate
);

export const $finalTotal = combine($subtotal, $discountAmount, (subtotal, discount) =>
  Math.max(0, subtotal - discount)
);

export const $isCheckoutEnabled = combine(
  $cartItems,
  submitOrderFx.pending,
  (items, isPending) => items.length > 0 && !isPending
);

// 5. Samples & Data Flow Wiring
// Coupon verification flow
sample({
  clock: couponSubmitted,
  target: validateCouponFx,
});

sample({
  clock: validateCouponFx.doneData,
  target: $discountRate,
});

// Checkout trigger flow
// TODO multiple source handling not ready yet
// sample({
//   clock: checkoutClicked,
//   source: {
//     items: $cartItems,
//     coupon: $couponCode,
//     total: $finalTotal,
//   },
//   filter: $isCheckoutEnabled,
//   target: submitOrderFx,
// });
