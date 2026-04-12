'use client';

import { useCallback, useMemo, useState } from 'react';

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const readInitial = useMemo(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  }, [initialValue, key]);

  const [value, setValue] = useState<T>(readInitial);

  const setPersistedValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(resolved));
          }
        } catch {
          // Ignore localStorage quota or serialization errors.
        }
        return resolved;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    setValue(initialValue);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  }, [initialValue, key]);

  return [value, setPersistedValue, clear] as const;
}
