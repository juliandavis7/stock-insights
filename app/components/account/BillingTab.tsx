import { useAuth } from "@clerk/react-router";
import { CreditCard, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { API_BASE_URL } from "~/config/subscription";
import { createPortalSession } from "~/lib/paymentService";
import { getSubscriptionState, formatSubscriptionEndDate } from "~/lib/subscriptionUtils";

export function BillingTab() {
  const { isSignedIn, getToken } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [userData, setUserData] = useState<any>(null);

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

  const handleManageSubscription = async () => {
    if (!isSignedIn) {
      return;
    }

    setLoading(true);
    
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const portalUrl = await createPortalSession(token);
      
      // Redirect to Stripe Customer Portal
      window.location.href = portalUrl;
    } catch (err) {
      console.error('Failed to open portal:', err);
      alert('Failed to open billing portal. Please try again.');
      setLoading(false);
    }
  };


  // Get subscription state using utility function
  const subscriptionState = getSubscriptionState(userData);
  const { isActive, isCanceled, isTrial } = subscriptionState;
  const subscriptionEndsAt = userData?.subscription_ends_at;
  
  const calculateNextBilling = (endsAt: number | null) => {
    if (!endsAt) {
      // Active subscription without end date - calculate next month
      if (isActive && !isCanceled) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      return 'N/A';
    }
    // Convert Unix timestamp (seconds) to Date
    const date = new Date(endsAt * 1000);
    // For canceled subscriptions, show the cancellation date
    if (isCanceled) {
      return formatSubscriptionEndDate(endsAt);
    }
    // For trial, calculate next billing (one month after end)
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loadingUserData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 pb-3 border-b">
        <h1 className="text-lg font-bold">Billing</h1>
      </div>

      {/* 1. Plan Section */}
      <div className="flex items-start justify-between pt-0 pb-6 border-b">
        <div className="w-48 flex-shrink-0">
          <h2 className="text-sm font-normal">Plan</h2>
        </div>
        <div className="flex-1">
          <p className="text-sm font-light">Monthly</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isCanceled 
              ? `Cancels on ${calculateNextBilling(subscriptionEndsAt)}`
              : `Auto-renews on ${calculateNextBilling(subscriptionEndsAt)}`
            }
          </p>
        </div>
      </div>

      {/* 2. Payment Section */}
      <div className="flex items-center justify-between py-6 border-b">
        <div className="w-48 flex-shrink-0">
          <h2 className="text-sm font-normal">Payment method</h2>
        </div>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Manage in Stripe Portal</span>
          </div>
          <button 
            onClick={handleManageSubscription}
            disabled={loading}
            className="text-sm hover:bg-gray-100 px-2 py-1 rounded-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Manage'}
          </button>
        </div>
      </div>

      {/* 3. Invoices Section */}
      <div className="flex items-start justify-between py-6 border-b">
        <div className="w-48 flex-shrink-0">
          <h2 className="text-sm font-normal">Invoices</h2>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            View and download invoices from the Stripe Customer Portal.
          </p>
          <button 
            onClick={handleManageSubscription}
            disabled={loading}
            className="mt-2 text-sm text-primary hover:underline disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'View Invoices →'}
          </button>
        </div>
      </div>

      {/* 4. Manage Subscription Section */}
      <div className="flex items-center justify-between py-6">
        <div className="w-48 flex-shrink-0">
          <h2 className="text-sm font-normal">Manage subscription</h2>
        </div>
        <div className="flex-1">
          <button 
            onClick={handleManageSubscription}
            disabled={loading}
            className="text-sm text-primary hover:bg-gray-100 px-2 py-1 rounded-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Open Stripe Portal'}
          </button>
          <p className="text-xs text-muted-foreground mt-1">
            Update payment method, view invoices, or cancel subscription
          </p>
        </div>
      </div>
    </>
  );
}

