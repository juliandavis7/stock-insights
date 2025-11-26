/**
 * Route protection utilities for checking subscription status
 */

import { API_BASE_URL } from "~/config/subscription";
import { redirect } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { createClerkClient } from "@clerk/react-router/api.server";

export interface SubscriptionStatus {
  subscription_status: 'trial' | 'active' | 'expired';
  subscription_ends_at: number | null;
}

/**
 * Check if user has an active subscription (trial or active)
 */
export function hasActiveSubscription(status: SubscriptionStatus | null | undefined): boolean {
  if (!status) return false;
  return status.subscription_status === 'trial' || status.subscription_status === 'active';
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(status: SubscriptionStatus | null | undefined): boolean {
  if (!status) return true;
  return status.subscription_status === 'expired';
}

/**
 * Fetch user subscription status from API
 * Used in route loaders
 */
export async function fetchUserSubscriptionStatus(
  userId: string,
  getToken: () => Promise<string | null>
): Promise<SubscriptionStatus | null> {
  try {
    const token = await getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      subscription_status: data.user?.subscription_status || 'expired',
      subscription_ends_at: data.user?.subscription_ends_at || null,
    };
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    return null;
  }
}

/**
 * Protected route loader helper
 * Checks authentication and subscription status, redirects if needed
 * Note: Subscription check happens client-side via useAuthenticatedFetch hook
 * This loader only checks authentication
 */
export async function protectedRouteLoader(args: { request: Request }) {
  const { userId } = await getAuth(args);
  
  // Redirect to homepage if not authenticated
  if (!userId) {
    throw redirect("/");
  }

  // Get user details from Clerk
  const user = await createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  }).users.getUser(userId);

  return { user };
}

