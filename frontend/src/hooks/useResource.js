import { useCallback, useEffect, useState } from 'react';

const loading = { phase: 'loading' };

export function useResource(load) {
  const [result, setResult] = useState(loading);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setResult(loading);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setResult(loading);
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ phase: 'ready', data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ phase: 'error', error });
      },
    );
    return () => controller.abort();
  }, [load, attempt]);

  return { ...result, retry };
}
