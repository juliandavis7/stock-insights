import { useAuth } from "@clerk/react-router";
import { Info, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { SUBSCRIPTION_PLAN, API_BASE_URL } from "~/config/subscription";
import { BRAND_COLOR } from "~/config/brand";
import { BlueCheck, BrandNameAndLogo } from "~/components/logos";
import { getAuth } from "@clerk/react-router/ssr.server";
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
  const { isSignedIn, userId } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  // Check for successful checkout redirect
  useEffect(() => {
    const checkoutParam = searchParams.get('checkout');
    if (checkoutParam === 'success') {
      setShowSuccessBanner(true);
      setJustSubscribed(true);
      // Clean up the URL
      searchParams.delete('checkout');
      searchParams.delete('customer_session_token');
      setSearchParams(searchParams, { replace: true });
      
      // Auto-hide banner after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

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
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [isSignedIn, authenticatedFetch]);

  const handleBackClick = () => {
    // If user just subscribed, navigate to home to avoid the redirect loop
    if (justSubscribed) {
      navigate('/');
    } else {
      // Otherwise, use normal browser back navigation
      window.history.back();
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
      const response = await authenticatedFetch(`${API_BASE_URL}/payments/checkout`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: SUBSCRIPTION_PLAN.polarProductId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
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

  const isSubscribed = userData?.subscription_status === 'active';
  const isExpired = userData?.subscription_status === 'expired';
  const isOnTrial = userData?.subscription_status === 'trial';
  
  // Format trial end date
  const formatTrialEndDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

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
        {/* Success Banner */}
        {showSuccessBanner && (
          <div 
            className="flex items-center justify-center gap-3 mb-3"
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: '8px',
              padding: '16px 24px',
              color: '#166534',
              fontSize: '15px',
              fontWeight: 500
            }}
          >
            <CheckCircle className="flex-shrink-0" style={{ color: '#22C55E' }} size={20} />
            <span>
              Subscription activated successfully! You now have access to all features.
            </span>
          </div>
        )}

        {/* Trial Banner - Only show if success banner is not showing */}
        {!showSuccessBanner && (isExpired || isOnTrial) && userData?.trial_ends_at && (
          <div 
            className="flex items-center justify-center gap-3 mb-3"
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '16px 24px',
              color: '#1E40AF',
              fontSize: '15px',
              fontWeight: 500
            }}
          >
            <Info className="flex-shrink-0" style={{ color: '#3B82F6' }} size={20} />
            <span>
              Your 7-day free trial {isExpired ? 'ended' : 'ends'} on {formatTrialEndDate(userData.trial_ends_at)}
            </span>
          </div>
        )}

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
            
            {isSubscribed && (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" style={{ color: BRAND_COLOR }} />
                <p className="text-sm" style={{ color: BRAND_COLOR }}>Active Subscription</p>
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
            {isSubscribed && userData?.trial_ends_at && (
              <p className="text-base font-large text-muted-foreground">
                Renews {new Date(userData.trial_ends_at).toLocaleDateString()}
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
                  You'll be redirected to Polar for secure payment processing
                </p>
              </div>
            ) : (
              <Button 
                onClick={() => window.location.href = '/account/billing'}
                variant="outline"
                size="lg"
                className="w-full text-base h-12 hover:bg-gray-50 hover:text-gray-900"
              >
                Manage Billing
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

