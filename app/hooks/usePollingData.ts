import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePollingDataOptions<T> {
  fetchFn: () => Promise<T>;
  dataType: 'metrics' | 'projections' | 'financials';
  enabled?: boolean;
}

interface UsePollingDataReturn<T> {
  data: T | null;
  loading: boolean;
  polling: boolean;
  error: string | null;
}

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_ATTEMPTS = 15; // 30 seconds total

export function usePollingData<T>({
  fetchFn,
  dataType,
  enabled = true,
}: UsePollingDataOptions<T>): UsePollingDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);

  // Update ref when fetchFn changes
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setPolling(false);
    attemptCountRef.current = 0;
  }, []);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      return; // Already polling
    }

    setPolling(true);
    attemptCountRef.current = 0;

    const poll = async () => {
      if (!isMountedRef.current) {
        stopPolling();
        return;
      }

      attemptCountRef.current += 1;

      try {
        const result = await fetchFnRef.current();
        
        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          setPolling(false);
          setError(null);
          stopPolling();
        }
      } catch (err) {
        if (!isMountedRef.current) {
          stopPolling();
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const is404 = errorMessage.toLowerCase().includes('404') || 
                      errorMessage.toLowerCase().includes('not found');

        if (is404 && attemptCountRef.current < MAX_POLLING_ATTEMPTS) {
          // Continue polling
          return;
        } else {
          // Stop polling - either not a 404 or max attempts reached
          if (isMountedRef.current) {
            setLoading(false);
            setPolling(false);
            if (attemptCountRef.current >= MAX_POLLING_ATTEMPTS) {
              setError(`Data not available after ${MAX_POLLING_ATTEMPTS} attempts`);
            } else {
              setError(errorMessage);
            }
            stopPolling();
          }
        }
      }
    };

    // Start polling immediately
    poll();
    
    // Then poll every interval
    pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL);
  }, [stopPolling]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      attemptCountRef.current = 0;

      try {
        const result = await fetchFnRef.current();
        
        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          setPolling(false);
          setError(null);
        }
      } catch (err) {
        if (!isMountedRef.current) {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const is404 = errorMessage.toLowerCase().includes('404') || 
                      errorMessage.toLowerCase().includes('not found');

        if (is404) {
          // Start polling for 404 responses
          startPolling();
        } else {
          // Non-404 error - don't poll
          setLoading(false);
          setPolling(false);
          setError(errorMessage);
        }
      }
    };

    fetchData();

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return { data, loading, polling, error };
}

