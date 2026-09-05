import { EffectorEntityDef } from './EffectorAdapter';

export interface PresetScenario {
  id: string;
  title: string;
  framework: string;
  description: string;
  initialValues: Record<string, unknown>;
  definitions: EffectorEntityDef[];
  triggerableEvents: Array<{
    id: string;
    label: string;
    payload: unknown;
    description: string;
  }>;
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'effector-checkout',
    title: 'Effector: E-Commerce Checkout Flow',
    framework: 'effector',
    description:
      'A real-world e-commerce checkout flow with Cart Stores, Derived Totals, Coupon Validation FX, and Order Submission.',
    initialValues: {
      cart_items: [
        { id: 101, name: 'Ergonomic Keyboard', price: 129, qty: 1 },
        { id: 102, name: '4K Monitor Mount', price: 89, qty: 2 },
      ],
      coupon_code: 'SPRING20',
      total_amount: 307,
      discounted_price: 245.6,
      is_valid_checkout: true,
    },
    definitions: [
      // Trigger Events
      {
        id: 'ev_add_item',
        name: 'addItem',
        kind: 'event',
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 12,
        description: 'Dispatched when the user clicks "Add to Cart"',
        targets: [{ targetId: 'store_cart_items', kind: 'update', label: 'append' }],
      },
      {
        id: 'ev_apply_coupon',
        name: 'applyCoupon',
        kind: 'event',
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 15,
        description: 'Dispatched when the user submits a promotional coupon code',
        targets: [{ targetId: 'fx_validate_coupon', kind: 'trigger', label: 'verify' }],
      },
      {
        id: 'ev_checkout_click',
        name: 'checkoutClicked',
        kind: 'event',
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 20,
        description: 'Initiates checkout order submission',
        targets: [{ targetId: 'sample_guard_checkout', kind: 'trigger', label: 'clock' }],
      },

      // Primary Stores
      {
        id: 'store_cart_items',
        name: '$cartItems',
        kind: 'store',
        initialValue: 3,
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 28,
        description: 'Core cart state containing selected items and quantities',
        targets: [
          { targetId: 'derived_total_amount', kind: 'derive', label: 'compute' },
          { targetId: 'comp_cart_drawer', kind: 'render', label: 'useUnit' },
        ],
      },
      {
        id: 'store_coupon_code',
        name: '$coupon',
        kind: 'store',
        initialValue: 'SPRING20',
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 35,
        description: 'Currently applied promo code with discount metadata',
        targets: [
          { targetId: 'derived_discounted_price', kind: 'derive', label: 'apply%' },
        ],
      },

      // Async Effects
      {
        id: 'fx_validate_coupon',
        name: 'validateCouponFx',
        kind: 'effect',
        sourceFile: 'src/features/cart/api.ts',
        sourceLine: 44,
        description: 'Async API endpoint checking coupon validity and discount rate',
        targets: [
          { targetId: 'store_coupon_code', kind: 'update', label: 'doneData' },
        ],
      },
      {
        id: 'fx_submit_order',
        name: 'submitOrderFx',
        kind: 'effect',
        sourceFile: 'src/features/cart/api.ts',
        sourceLine: 56,
        description: 'Sends final payload to the payment gateway and order API',
        targets: [
          { targetId: 'comp_checkout_summary', kind: 'render', label: 'onSuccess' },
        ],
      },

      // Reactions / Samples
      {
        id: 'sample_guard_checkout',
        name: 'sampleCheckout',
        kind: 'sample',
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 68,
        description: 'Guards checkout: passes order payload only if $isValidCheckout is true',
        sources: [
          { sourceId: 'derived_is_valid_checkout', kind: 'dependency', label: 'filter' },
        ],
        targets: [
          { targetId: 'fx_submit_order', kind: 'trigger', label: 'exec' },
        ],
      },

      // Derived Stores
      {
        id: 'derived_total_amount',
        name: '$totalAmount',
        kind: 'derived',
        initialValue: '$307.00',
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 78,
        description: 'Sum of prices of all cart items without promotions',
        targets: [
          { targetId: 'derived_discounted_price', kind: 'derive', label: 'base' },
          { targetId: 'derived_is_valid_checkout', kind: 'derive', label: 'amount>0' },
        ],
      },
      {
        id: 'derived_discounted_price',
        name: '$discountedPrice',
        kind: 'derived',
        initialValue: '$245.60',
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 86,
        description: 'Net price after applying coupon percentage deduction',
        targets: [
          { targetId: 'comp_checkout_summary', kind: 'render', label: 'useUnit' },
        ],
      },
      {
        id: 'derived_is_valid_checkout',
        name: '$isValidCheckout',
        kind: 'derived',
        initialValue: true,
        sourceFile: 'src/features/cart/model.ts',
        sourceLine: 95,
        description: 'Boolean flag confirming non-empty cart and inventory availability',
        targets: [
          { targetId: 'comp_checkout_summary', kind: 'render', label: 'disabled_prop' },
        ],
      },

      // Components
      {
        id: 'comp_cart_drawer',
        name: 'CartDrawer',
        kind: 'component',
        sourceFile: 'src/features/cart/ui/CartDrawer.tsx',
        sourceLine: 10,
        description: 'Slide-over cart UI component displaying line items',
      },
      {
        id: 'comp_checkout_summary',
        name: 'CheckoutSummary',
        kind: 'component',
        sourceFile: 'src/features/cart/ui/CheckoutSummary.tsx',
        sourceLine: 24,
        description: 'Payment summary panel with order button and totals',
      },
    ],
    triggerableEvents: [
      {
        id: 'ev_add_item',
        label: 'Trigger addItem({ name: "Noise-Cancelling Headphones", price: 199 })',
        payload: { name: 'Noise-Cancelling Headphones', price: 199 },
        description: 'Simulate adding item to cart -> updates $cartItems and recalcs $totalAmount',
      },
      {
        id: 'ev_apply_coupon',
        label: 'Trigger applyCoupon("BLACKFRIDAY30")',
        payload: { code: 'BLACKFRIDAY30', discountPercent: 30 },
        description: 'Simulate coupon validation -> triggers validateCouponFx -> updates $coupon',
      },
      {
        id: 'ev_checkout_click',
        label: 'Trigger checkoutClicked()',
        payload: { timestamp: Date.now() },
        description: 'Check validity guard and trigger submitOrderFx',
      },
    ],
  },
  {
    id: 'effector-auth',
    title: 'Effector: Auth & Session Lifecycle',
    framework: 'effector',
    description:
      'Authentication lifecycle showing token persistence, user profile hydration, logout cleanup, and route guard integration.',
    initialValues: {
      auth_token: 'jwt_eyJhbGciOiJIUzI1Ni...',
      user_profile: { id: 42, name: 'Alex Rivera', role: 'admin' },
      is_authenticated: true,
    },
    definitions: [
      {
        id: 'ev_login_submit',
        name: 'loginSubmitted',
        kind: 'event',
        sourceFile: 'src/features/auth/model.ts',
        sourceLine: 8,
        description: 'User submits credentials on login form',
        targets: [{ targetId: 'fx_login', kind: 'trigger', label: 'credentials' }],
      },
      {
        id: 'ev_logout_click',
        name: 'logoutClicked',
        kind: 'event',
        sourceFile: 'src/features/auth/model.ts',
        sourceLine: 14,
        description: 'User clicks sign out',
        targets: [
          { targetId: 'store_auth_token', kind: 'update', label: 'reset' },
          { targetId: 'store_user_profile', kind: 'update', label: 'reset' },
        ],
      },
      {
        id: 'fx_login',
        name: 'loginFx',
        kind: 'effect',
        sourceFile: 'src/features/auth/api.ts',
        sourceLine: 22,
        description: 'Calls /api/auth/login and receives session JWT',
        targets: [
          { targetId: 'store_auth_token', kind: 'update', label: 'onSuccess' },
          { targetId: 'fx_fetch_profile', kind: 'trigger', label: 'fetchUser' },
        ],
      },
      {
        id: 'fx_fetch_profile',
        name: 'fetchProfileFx',
        kind: 'effect',
        sourceFile: 'src/features/auth/api.ts',
        sourceLine: 34,
        description: 'Retrieves current user role, permissions, and settings',
        targets: [
          { targetId: 'store_user_profile', kind: 'update', label: 'doneData' },
        ],
      },
      {
        id: 'store_auth_token',
        name: '$authToken',
        kind: 'store',
        initialValue: 'jwt_active_session',
        sourceFile: 'src/features/auth/model.ts',
        sourceLine: 45,
        description: 'Active bearer token synchronized with localStorage',
        targets: [
          { targetId: 'derived_is_authenticated', kind: 'derive', label: 'Boolean(token)' },
        ],
      },
      {
        id: 'store_user_profile',
        name: '$userProfile',
        kind: 'store',
        initialValue: { name: 'Alex Rivera' },
        sourceFile: 'src/features/auth/model.ts',
        sourceLine: 54,
        description: 'Authenticated user details',
        targets: [
          { targetId: 'comp_user_badge', kind: 'render', label: 'useUnit' },
        ],
      },
      {
        id: 'derived_is_authenticated',
        name: '$isAuthenticated',
        kind: 'derived',
        initialValue: true,
        sourceFile: 'src/features/auth/model.ts',
        sourceLine: 62,
        description: 'Boolean flag indicating verified logged-in state',
        targets: [
          { targetId: 'comp_route_guard', kind: 'render', label: 'protect' },
          { targetId: 'comp_user_badge', kind: 'render', label: 'useUnit' },
        ],
      },
      {
        id: 'comp_route_guard',
        name: 'RouteGuard',
        kind: 'component',
        sourceFile: 'src/features/auth/ui/RouteGuard.tsx',
        sourceLine: 12,
        description: 'Redirects unauthenticated visitors to /login',
      },
      {
        id: 'comp_user_badge',
        name: 'UserBadge',
        kind: 'component',
        sourceFile: 'src/features/auth/ui/UserBadge.tsx',
        sourceLine: 18,
        description: 'Top navigation bar user avatar and role indicator',
      },
    ],
    triggerableEvents: [
      {
        id: 'ev_login_submit',
        label: 'Trigger loginSubmitted({ email: "alex@example.com" })',
        payload: { email: 'alex@example.com', token: 'jwt_mock_token_7788' },
        description: 'Executes loginFx -> stores token -> triggers fetchProfileFx',
      },
      {
        id: 'ev_logout_click',
        label: 'Trigger logoutClicked()',
        payload: { timestamp: Date.now() },
        description: 'Resets $authToken and $userProfile to null',
      },
    ],
  },
  {
    id: 'generic-signals',
    title: 'Signals & Jotai: Multi-Tier Reactive Pipeline',
    framework: 'jotai',
    description:
      'Demonstrates framework portability: fine-grained reactive atom pipeline with dependent calculations and UI nodes.',
    initialValues: {
      count: 10,
      multiplier: 3,
      computed_total: 30,
    },
    definitions: [
      {
        id: 'atom_count',
        name: 'countAtom',
        kind: 'state',
        initialValue: 10,
        sourceFile: 'src/atoms/counter.ts',
        sourceLine: 4,
        description: 'Primitive state atom',
        targets: [
          { targetId: 'atom_computed_total', kind: 'derive', label: 'read(get)' },
        ],
      },
      {
        id: 'atom_multiplier',
        name: 'multiplierAtom',
        kind: 'state',
        initialValue: 3,
        sourceFile: 'src/atoms/counter.ts',
        sourceLine: 8,
        description: 'Scaling factor atom',
        targets: [
          { targetId: 'atom_computed_total', kind: 'derive', label: 'read(get)' },
        ],
      },
      {
        id: 'atom_computed_total',
        name: 'totalAtom',
        kind: 'derived',
        initialValue: 30,
        sourceFile: 'src/atoms/counter.ts',
        sourceLine: 14,
        description: 'Derived atom: countAtom * multiplierAtom',
        targets: [
          { targetId: 'comp_counter_view', kind: 'render', label: 'useAtomValue' },
        ],
      },
      {
        id: 'action_increment',
        name: 'incrementAction',
        kind: 'event',
        sourceFile: 'src/atoms/counter.ts',
        sourceLine: 20,
        description: 'Dispatches +1 to countAtom',
        targets: [{ targetId: 'atom_count', kind: 'update', label: 'set' }],
      },
      {
        id: 'comp_counter_view',
        name: 'CounterDisplay',
        kind: 'component',
        sourceFile: 'src/components/CounterDisplay.tsx',
        sourceLine: 6,
        description: 'Renders computed total with visual pulse',
      },
    ],
    triggerableEvents: [
      {
        id: 'action_increment',
        label: 'Increment count (+1)',
        payload: 1,
        description: 'Increments countAtom and re-evaluates totalAtom',
      },
    ],
  },
];
