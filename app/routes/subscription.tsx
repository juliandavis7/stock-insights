import { useAuth } from "@clerk/react-router";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { SUBSCRIPTION_PLAN, API_BASE_URL } from "~/config/subscription";
import { BRAND_COLOR } from "~/config/brand";
import { BlueCheck, BrandNameAndLogo } from "~/components/logos";
import { getAuth } from "@clerk/react-router/ssr.server";
import { createCheckoutSession, createPortalSession } from "~/lib/paymentService";
import { getSubscriptionState, getSubscriptionStatusText } from "~/lib/subscriptionUtils";
import type { Route } from "./+types/subscription";

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  
  return {
    isSignedIn: !!userId,
    hasActiveSubscription: true, // User can access subscription page regardless
    userId
  };
}

export default function SubscriptionPage({ loaderData }: Route.ComponentProps) {
  const { isSignedIn, userId, getToken } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [loadingManage, setLoadingManage] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // Handle checkout success redirect - refetch user data and clean URL
  useEffect(() => {
    const checkoutParam = searchParams.get('checkout');
    if (checkoutParam === 'success') {
      // Clean up the URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('checkout');
      newSearchParams.delete('customer_session_token');
      setSearchParams(newSearchParams, { replace: true });
      
      // Refetch user data to get updated subscription status
      const fetchUserData = async () => {
        if (!isSignedIn) return;
        try {
          const response = await authenticatedFetch(`${API_BASE_URL}/users/me`);
          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        }
      };
      fetchUserData();
    }
  }, [searchParams, setSearchParams, isSignedIn, authenticatedFetch]);

  // Handle expired subscription redirect (after cancellation) - refetch user data and clean URL
  useEffect(() => {
    const expiredParam = searchParams.get('expired');
    if (expiredParam === 'true') {
      // Clean up the URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('expired');
      setSearchParams(newSearchParams, { replace: true });
      
      // Refetch user data to get updated subscription status
      const fetchUserData = async () => {
        if (!isSignedIn) return;
        try {
          const response = await authenticatedFetch(`${API_BASE_URL}/users/me`);
          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        }
      };
      fetchUserData();
    }
  }, [searchParams, setSearchParams, isSignedIn, authenticatedFetch]);

  // Fetch user subscription status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn) {
        setLoadingUserData(false);
        return;
      }

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/me`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        // Don't show error for connection issues - user might not have backend running
        // Just silently fail and let user proceed
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [isSignedIn, authenticatedFetch]);

  const handleBackClick = () => {
    // Check subscription status to determine where to navigate
    const subscriptionState = getSubscriptionState(userData);
    const { isActive, isExpired } = subscriptionState;
    
    if (isActive) {
      // Active subscription: navigate to main app
      navigate('/search');
    } else {
      // Expired/canceled: navigate to landing page
      navigate('/');
    }
  };

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const checkoutUrl = await createCheckoutSession(token);
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start checkout';
      
      // Handle specific error cases
      if (errorMessage.includes('already have an active subscription')) {
        // User is already subscribed, show manage button
        setError(null);
      } else {
        setError(errorMessage);
        setLoading(false);
      }
    }
  };

  const handleManageSubscription = async () => {
    if (!isSignedIn) {
      window.location.href = "/sign-in";
      return;
    }

    setLoadingManage(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Set return URL to subscription page with expired=true query param
      const returnUrl = `${window.location.origin}/subscription?expired=true`;
      const portalUrl = await createPortalSession(token, returnUrl);
      
      // Redirect to Stripe Customer Portal
      window.location.href = portalUrl;
    } catch (err) {
      console.error('Portal error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to open subscription portal';
      setError(errorMessage);
      setLoadingManage(false);
    }
  };

  // Loading state
  if (loadingUserData) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  // Get subscription state using utility function
  const subscriptionState = getSubscriptionState(userData);
  const { isActive: isSubscribed, isExpired, isTrial: isOnTrial, isCanceled } = subscriptionState;
  
  // Get subscription status text using utility function
  const subscriptionStatusText = getSubscriptionStatusText(userData);

  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-page-background">
      {/* Back Button - Top Left */}
      <button
        onClick={handleBackClick}
        className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>

      <div className="w-full" style={{ maxWidth: '700px' }}>
        {/* Content - Card Container (matching home page style) */}
        <div 
          className="bg-white border border-gray-200 rounded-xl text-center"
          style={{
            padding: '48px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3 text-center">
            <h1>
              <BrandNameAndLogo size="large" marginLeft="1rem" />
            </h1>
            
            {/* Status text below brand name - shown for all subscription states */}
            {userData && (
              <div className="flex items-center justify-center gap-2">
                {isExpired ? (
                  <AlertCircle className="w-4 h-4" style={{ color: '#EA580C' }} />
                ) : (isSubscribed || isOnTrial) && (
                  <CheckCircle className="w-4 h-4" style={{ color: BRAND_COLOR }} />
                )}
                <p className={`text-sm ${
                  isExpired 
                    ? 'text-red-600 font-medium' 
                    : ''
                }`} style={!isExpired ? { color: BRAND_COLOR } : undefined}>
                  {subscriptionStatusText}
                </p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-2 text-center">
            <div>
              <span className="text-5xl font-bold tracking-tight">${SUBSCRIPTION_PLAN.price}</span>
              <span className="text-xl text-muted-foreground">/{SUBSCRIPTION_PLAN.interval}</span>
            </div>
            {!isSubscribed && (
              <p className="text-sm text-muted-foreground">
                Full access to all features. Cancel anytime.
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="pt-4 text-center">
            {!isSubscribed ? (
              <div className="space-y-3">
                <Button 
                  onClick={handleSubscribe}
                  disabled={loading || !isSignedIn}
                  size="lg"
                  className="w-full text-base h-12 hover:opacity-90"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Starting checkout...
                    </>
                  ) : !isSignedIn ? (
                    'Sign in to Subscribe'
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You'll be redirected to Stripe for secure payment processing
                </p>
              </div>
            ) : (
              <Button 
                onClick={handleManageSubscription}
                disabled={loadingManage}
                variant="outline"
                size="lg"
                className="w-full text-base h-12 hover:bg-gray-50 hover:text-gray-900"
              >
                {loadingManage ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Opening portal...
                  </>
                ) : (
                  'Manage Subscription'
                )}
              </Button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          {/* Features List */}
          <div className="pt-8 border-t">
            <ul className="space-y-3 text-left">
              {SUBSCRIPTION_PLAN.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <BlueCheck />
                  <span 
                    className="text-gray-700" 
                    style={{ fontSize: '14px', lineHeight: '1.5' }}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust Indicators - Minimal */}
          {!isSubscribed && (
            <div className="pt-4 text-xs text-muted-foreground">
              Secure payment • Cancel anytime
            </div>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}

