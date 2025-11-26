function getApiUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';
}

function getStripePriceId(): string {
  return import.meta.env.VITE_STRIPE_PRICE_ID || '';
}

export async function createCheckoutSession(token: string): Promise<string> {
  const API_URL = getApiUrl();
  const priceId = getStripePriceId();
  
  if (!priceId) {
    throw new Error('Stripe price ID is not configured. Please set VITE_STRIPE_PRICE_ID in your environment variables.');
  }
  
  try {
    const response = await fetch(`${API_URL}/payments/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
      }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout');
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    return data.checkout_url;
  } catch (error) {
    // Handle network errors (connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend API at ${API_URL}. Please ensure the backend server is running.`);
    }
    throw error;
  }
}

export async function createPortalSession(token: string, returnUrl?: string): Promise<string> {
  const API_URL = getApiUrl();
  
  // Default return URL to subscription page if not provided
  const defaultReturnUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/subscription`;
  const finalReturnUrl = returnUrl || defaultReturnUrl;
  
  // Log the return URL being sent (for debugging)
  if (import.meta.env.DEV) {
    console.log('Creating portal session with return_url:', finalReturnUrl);
  }
  
  try {
    const response = await fetch(`${API_URL}/payments/portal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        return_url: finalReturnUrl,
      }),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create portal session');
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    return data.portal_url;
  } catch (error) {
    // Handle network errors (connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend API at ${API_URL}. Please ensure the backend server is running.`);
    }
    throw error;
  }
}

