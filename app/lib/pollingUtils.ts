const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 15; // 30 seconds total

export interface PollingCallbacks {
  onStart?: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onPollingStart?: () => void;
  onPollingStop?: () => void;
}

export async function fetchWithPolling<T>(
  fetchFn: () => Promise<T>,
  callbacks: PollingCallbacks = {}
): Promise<T | null> {
  const { onStart, onSuccess, onError, onPollingStart, onPollingStop } = callbacks;

  // Initial fetch
  onStart?.();
  
  try {
    const result = await fetchFn();
    onSuccess?.(result);
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const is404 = errorMessage.toLowerCase().includes('404') || 
                  errorMessage.toLowerCase().includes('not found');

    if (!is404) {
      // Non-404 error - don't poll
      onError?.(errorMessage);
      return null;
    }

    // Start polling for 404 responses
    onPollingStart?.();
    
    let attemptCount = 0;

    const poll = async (): Promise<T | null> => {
      attemptCount += 1;

      try {
        const result = await fetchFn();
        onSuccess?.(result);
        onPollingStop?.();
        return result;
      } catch (pollErr) {
        const pollErrorMessage = pollErr instanceof Error ? pollErr.message : 'Unknown error';
        const isPoll404 = pollErrorMessage.toLowerCase().includes('404') || 
                         pollErrorMessage.toLowerCase().includes('not found');

        if (isPoll404 && attemptCount < MAX_POLLING_ATTEMPTS) {
          // Continue polling
          return new Promise((resolve) => {
            setTimeout(async () => {
              const result = await poll();
              resolve(result);
            }, POLLING_INTERVAL);
          });
        } else {
          // Stop polling - either not a 404 or max attempts reached
          onPollingStop?.();
          if (attemptCount >= MAX_POLLING_ATTEMPTS) {
            onError?.(`Data not available after ${MAX_POLLING_ATTEMPTS} attempts`);
          } else {
            onError?.(pollErrorMessage);
          }
          return null;
        }
      }
    };

    return poll();
  }
}

