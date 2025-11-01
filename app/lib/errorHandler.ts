/**
 * Centralized error handler for API responses
 * Handles trial expiration, authentication errors, and other common API errors
 */

export const handleApiError = async (response: Response): Promise<Response> => {
  // Handle 403 errors (Forbidden - typically trial expiration or permission issues)
  if (response.status === 403) {
    try {
      const clonedResponse = response.clone();
      const errorData = await clonedResponse.json();
      
      // Check if this is a trial expiration error
      if (errorData.detail?.toLowerCase().includes('trial has expired') || 
          errorData.detail?.toLowerCase().includes('upgrade to continue')) {
        // Prevent redirect if already on pricing page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/pricing')) {
          console.log('Trial expired - redirecting to pricing page');
          window.location.href = '/pricing?expired=true';
        }
        throw new Error('Trial expired');
      }
    } catch (error) {
      // If error is "Trial expired", rethrow it
      if (error instanceof Error && error.message === 'Trial expired') {
        throw error;
      }
      // If JSON parsing fails or other error, continue with normal error handling
    }
  }
  
  // Handle other non-OK responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  
  return response;
};

/**
 * Check if an error is a trial expiration error
 */
export const isTrialExpiredError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message === 'Trial expired' || 
           error.message.toLowerCase().includes('trial has expired');
  }
  return false;
};

/**
 * Format API error messages for display to users
 */
export const formatApiError = (error: unknown): string => {
  if (error instanceof Error) {
    // Don't show technical "Trial expired" message to users
    // The redirect will handle showing the proper message
    if (isTrialExpiredError(error)) {
      return 'Redirecting to pricing...';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
};

