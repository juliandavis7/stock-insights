import { useAuth } from "@clerk/react-router";
// import { useAction, useMutation, useQuery } from "convex/react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
// import { api } from "../../convex/_generated/api";

export default function IntegratedPricing() {
  const { isSignedIn, userId } = useAuth();
  const [searchParams] = useSearchParams();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [plans, setPlans] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);

  // Check if user arrived due to trial expiration
  useEffect(() => {
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      setShowExpiredMessage(true);
    }
  }, [searchParams]);

  // TODO: Re-enable when Convex is properly configured
  // const getPlans = useAction(api.subscriptions.getAvailablePlans);
  // const subscriptionStatus = useQuery(
  //   api.subscriptions.checkUserSubscriptionStatus,
  //   {
  //     userId: isSignedIn ? userId : undefined,
  //   }
  // );
  // const userSubscription = useQuery(api.subscriptions.fetchUserSubscription);
  // const createCheckout = useAction(api.subscriptions.createCheckoutSession);
  // const createPortalUrl = useAction(api.subscriptions.createCustomerPortalUrl);
  // const upsertUser = useMutation(api.users.upsertUser);

  // TODO: Re-enable when Convex is properly configured
  // Sync user when signed in
  // React.useEffect(() => {
  //   if (isSignedIn) {
  //     upsertUser().catch(console.error);
  //   }
  // }, [isSignedIn, upsertUser]);

  // Load plans on component mount
  // React.useEffect(() => {
  //   const loadPlans = async () => {
  //     try {
  //       const result = await getPlans();
  //       setPlans(result);
  //     } catch (error) {
  //       console.error("Failed to load plans:", error);
  //       setError("Failed to load pricing plans. Please try again.");
  //     }
  //   };
  //   loadPlans();
  // }, [getPlans]);

  // TODO: Re-enable when Convex is properly configured
  const handleSubscribe = async (priceId: string) => {
    if (!isSignedIn) {
      // Redirect to sign in
      window.location.href = "/sign-in";
      return;
    }

    // Placeholder for subscription functionality
    console.log("Subscription functionality temporarily disabled");
    setError("Subscription functionality is temporarily unavailable. Please check back later.");
  };

  // TODO: Re-enable when Convex is properly configured
  // For now, show a placeholder message
  return (
    <section className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center mb-12">
        {/* Trial Expired Message */}
        {showExpiredMessage && (
          <div className="mb-8 p-6 bg-orange-50 border-2 border-orange-200 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-orange-900">
                Your Free Trial Has Ended
              </h2>
            </div>
            <p className="text-orange-800 text-lg mb-4">
              Continue accessing premium features by subscribing to one of our plans below.
            </p>
            <p className="text-orange-700 text-sm">
              All your data and settings have been saved and will be available once you subscribe.
            </p>
          </div>
        )}

        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {showExpiredMessage ? 'Choose Your Plan' : 'Pricing Coming Soon'}
        </h1>
        <p className="text-xl text-muted-foreground">
          {showExpiredMessage 
            ? 'Select the plan that works best for you and continue your stock analysis journey.'
            : 'We\'re working on our pricing plans. Please check back later.'
          }
        </p>
        {isSignedIn && !showExpiredMessage && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
            <p className="text-blue-800 font-medium">📋 Setup in Progress</p>
            <p className="text-blue-700 text-sm mt-1">
              Subscription functionality is being set up. You'll be notified when it's ready!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}