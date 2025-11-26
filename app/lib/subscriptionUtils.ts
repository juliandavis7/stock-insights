/**
 * Utility functions for subscription status handling
 * Based on API response format:
 * - subscription_status: 'trial' | 'active' | 'expired'
 * - subscription_ends_at: number | null (Unix timestamp in seconds)
 */

export interface SubscriptionUser {
  subscription_status: 'trial' | 'active' | 'expired';
  subscription_ends_at: number | null;
}

/**
 * Format Unix timestamp (seconds) to readable date string
 */
export function formatSubscriptionEndDate(timestamp: number | null): string {
  if (!timestamp) return '';
  try {
    // Convert Unix timestamp (seconds) to Date
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Check if subscription end date is in the past
 */
export function isSubscriptionDateExpired(subscription_ends_at: number | null): boolean {
  if (!subscription_ends_at) return false;
  const endDate = new Date(subscription_ends_at * 1000);
  const now = new Date();
  return endDate < now;
}

/**
 * Get subscription status text based on guide
 * Display format matches the guide requirements
 */
export function getSubscriptionStatusText(user: SubscriptionUser | null | undefined): string {
  if (!user) return 'Subscription Expired';
  
  const { subscription_status, subscription_ends_at } = user;
  
  if (subscription_status === 'trial') {
    if (subscription_ends_at) {
      // Check if trial end date is expired
      const isDateExpired = isSubscriptionDateExpired(subscription_ends_at);
      if (isDateExpired) {
        return `Trial expired on ${formatSubscriptionEndDate(subscription_ends_at)}`;
      }
      return `Trial active until ${formatSubscriptionEndDate(subscription_ends_at)}`;
    }
    return 'Trial';
  }
  
  if (subscription_status === 'active') {
    if (subscription_ends_at) {
      return `Active until ${formatSubscriptionEndDate(subscription_ends_at)}`;
    }
    return 'Active Subscription';
  }
  
  // Expired status - include date if available
  if (subscription_ends_at) {
    return `Subscription expired on ${formatSubscriptionEndDate(subscription_ends_at)}`;
  }
  
  return 'Subscription Expired';
}

/**
 * @deprecated Use getSubscriptionStatusText instead
 * Kept for backward compatibility
 */
export function getSubscriptionMessage(user: SubscriptionUser | null | undefined): string {
  return getSubscriptionStatusText(user);
}

/**
 * Check subscription state
 * Also checks if subscription_ends_at is in the past to handle expired dates
 */
export function getSubscriptionState(user: SubscriptionUser | null | undefined) {
  if (!user) {
    return {
      isTrial: false,
      isActive: false,
      isExpired: true,
      isCanceled: false,
      isTrialEnding: false,
      isDateExpired: true,
    };
  }

  const { subscription_status, subscription_ends_at } = user;
  
  const isTrial = subscription_status === 'trial';
  const isActive = subscription_status === 'active';
  const isStatusExpired = subscription_status === 'expired';
  const isDateExpired = isSubscriptionDateExpired(subscription_ends_at);
  
  // Subscription is expired if status is expired OR if end date is in the past
  const isExpired = isStatusExpired || isDateExpired;
  const isCanceled = isActive && subscription_ends_at !== null && !isDateExpired;
  const isTrialEnding = isTrial && subscription_ends_at !== null && !isDateExpired;

  return {
    isTrial,
    isActive,
    isExpired,
    isCanceled,
    isTrialEnding,
    isDateExpired,
  };
}

