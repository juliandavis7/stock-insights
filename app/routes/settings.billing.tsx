import { useAuth } from "@clerk/react-router";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { API_BASE_URL, SUBSCRIPTION_PLAN } from "~/config/subscription";
import { Loader2, CreditCard, ExternalLink, CheckCircle } from "lucide-react";
import { Badge } from "~/components/ui/badge";

export default function BillingSettings() {
  const { isSignedIn } = useAuth();
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
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/subscriptions/customer-portal`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.customer_portal_url) {
          window.location.href = data.customer_portal_url;
        }
      } else {
        alert('Failed to access billing portal. Please try again.');
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      alert('Failed to access billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isActive = userData?.subscription_status === 'active';
  const isTrialing = userData?.subscription_status === 'trialing';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      {loadingUserData ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current plan</CardTitle>
              <CardDescription>
                Your subscription status and details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{SUBSCRIPTION_PLAN.name}</h3>
                    {(isActive || isTrialing) && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${SUBSCRIPTION_PLAN.price}/{SUBSCRIPTION_PLAN.billing_interval}
                  </p>
                  {isTrialing && (
                    <p className="text-sm text-blue-600 font-medium">
                      Free trial active
                    </p>
                  )}
                </div>
                <Button asChild variant="outline">
                  <Link to="/subscription">
                    View plans
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {!isActive && !isTrialing && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    You don't have an active subscription. Subscribe to unlock all features.
                  </p>
                  <Button asChild className="mt-3" size="sm">
                    <Link to="/subscription">
                      Subscribe now
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          {(isActive || isTrialing) && (
            <Card>
              <CardHeader>
                <CardTitle>Payment method</CardTitle>
                <CardDescription>
                  Manage your payment information and billing details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Payment details</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your payment method and billing information
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  variant="outline"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage billing
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Billing History */}
          {(isActive || isTrialing) && (
            <Card>
              <CardHeader>
                <CardTitle>Billing history</CardTitle>
                <CardDescription>
                  View and download your past invoices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Access your billing history and invoices through the billing portal.</p>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    variant="link"
                    className="px-0 mt-2"
                  >
                    Open billing portal
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

