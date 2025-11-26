# Frontend Stripe Integration Instructions

Replace Polar payment integration with Stripe. This document provides all the API details and code examples needed.

## API Endpoints

### 1. Create Checkout Session

Creates a Stripe Checkout session for the $10/month subscription.

```
POST /payments/checkout
Authorization: Bearer <clerk_token>
Content-Type: application/json

{
  "price_id": "price_1SXkt953fzN2JGtuiNfkredm",
  "success_url": "https://yourapp.com/dashboard?checkout=success",  // optional
  "cancel_url": "https://yourapp.com/pricing?checkout=cancelled"    // optional
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "checkout_id": "cs_xxx",
  "status": "created"
}
```

After receiving response, redirect user to `checkout_url`.

### 2. Customer Portal (Manage/Cancel Subscription)

Creates a Stripe Customer Portal session where users can manage their subscription.

```
POST /payments/portal
Authorization: Bearer <clerk_token>
```

**Response:**
```json
{
  "portal_url": "https://billing.stripe.com/session/..."
}
```

Redirect user to `portal_url` to manage their subscription.

---

## Environment Variable

Add to your `.env`:

```
VITE_STRIPE_PRICE_ID=price_1SXkt953fzN2JGtuiNfkredm
```

---

## API Service Functions

Create or update your payment service:

```typescript
// services/paymentService.ts

const API_URL = import.meta.env.VITE_API_URL;

export async function createCheckoutSession(token: string): Promise<string> {
  const response = await fetch(`${API_URL}/payments/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_id: import.meta.env.VITE_STRIPE_PRICE_ID,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create checkout');
  }

  const data = await response.json();
  return data.checkout_url;
}

export async function createPortalSession(token: string): Promise<string> {
  const response = await fetch(`${API_URL}/payments/portal`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create portal session');
  }

  const data = await response.json();
  return data.portal_url;
}
```

---

## Components

### Subscribe Button

```tsx
// components/SubscribeButton.tsx

import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createCheckoutSession } from '../services/paymentService';

export function SubscribeButton() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      
      const checkoutUrl = await createCheckoutSession(token);
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleSubscribe} disabled={loading}>
        {loading ? 'Loading...' : 'Subscribe - $10/month'}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
```

### Manage Subscription Button

```tsx
// components/ManageSubscriptionButton.tsx

import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createPortalSession } from '../services/paymentService';

export function ManageSubscriptionButton() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      
      const portalUrl = await createPortalSession(token);
      
      // Redirect to Stripe Customer Portal
      window.location.href = portalUrl;
    } catch (err) {
      console.error('Failed to open portal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleManageSubscription} disabled={loading}>
      {loading ? 'Loading...' : 'Manage Subscription'}
    </button>
  );
}
```

---

## Handling Checkout Redirects

Handle success/cancel redirects after checkout:

```tsx
// In your Dashboard or relevant page

import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    
    if (checkoutStatus === 'success') {
      // Show success message
      toast.success('Subscription activated! Welcome to Pro!');
      // Refetch user data to get updated subscription_status
      refetchUser();
      // Clear the query param
      searchParams.delete('checkout');
      setSearchParams(searchParams);
    } else if (checkoutStatus === 'cancelled') {
      toast.info('Checkout cancelled');
      searchParams.delete('checkout');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  // ... rest of component
}
```

---

## Conditional Rendering Based on Subscription Status

```tsx
// Example: Show different UI based on subscription status

function PricingPage() {
  const { user } = useUser(); // Your user context/hook
  
  if (user?.subscription_status === 'active') {
    return (
      <div>
        <p>You have an active subscription!</p>
        <ManageSubscriptionButton />
      </div>
    );
  }
  
  return (
    <div>
      <h2>Subscribe to Pro</h2>
      <p>$10/month - Unlimited access</p>
      <SubscribeButton />
    </div>
  );
}
```

---

## Key Changes from Polar

| Change | Old (Polar) | New (Stripe) |
|--------|-------------|--------------|
| Request field | `product_id` | `price_id` |
| Subscription management | N/A | `POST /payments/portal` |
| Environment variable | `POLAR_PRODUCT_ID` | `VITE_STRIPE_PRICE_ID` |

### Remove:
- Any Polar SDK imports
- Polar-specific configuration
- `POLAR_PRODUCT_ID` environment variable

### Add:
- `VITE_STRIPE_PRICE_ID` environment variable
- Portal session functionality for subscription management

---

## Error Handling

The API returns these specific errors:

| Status | Message | Action |
|--------|---------|--------|
| 400 | "You already have an active subscription." | Show Manage Subscription button instead |
| 404 | "User not found" | User needs to sign up first |
| 404 | "No subscription found" (portal) | User hasn't subscribed yet |
| 500 | Stripe API error | Show generic error, retry |

```tsx
// Example error handling
const handleSubscribe = async () => {
  try {
    const checkoutUrl = await createCheckoutSession(token);
    window.location.href = checkoutUrl;
  } catch (err) {
    if (err.message.includes('already have an active subscription')) {
      // User is already subscribed, show portal instead
      setShowManageButton(true);
    } else {
      setError(err.message);
    }
  }
};
```

---

## Testing

Use these test card numbers in Stripe test mode:

| Scenario | Card Number |
|----------|-------------|
| Success | `4242 4242 4242 4242` |
| Decline | `4000 0000 0000 0002` |
| Requires auth | `4000 0025 0000 3155` |

Any future expiry date and any 3-digit CVC will work.

