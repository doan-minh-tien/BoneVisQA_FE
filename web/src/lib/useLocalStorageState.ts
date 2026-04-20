'use client';

import { useCallback, useMemo, useState } from 'react';

type LocalStorageEnvelope<T> = {
  value: T;
  timestamp: number;
};

type UseLocalStorageOptions = {
  ttlMs?: number;
};

export function useLocalStorageState<T>(key: string, initialValue: T, options: UseLocalStorageOptions = {}) {
  const readInitial = useMemo(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      const parsed = JSON.parse(raw) as T | LocalStorageEnvelope<T>;
      if (parsed && typeof parsed === 'object' && 'value' in parsed && 'timestamp' in parsed) {
        const boxed = parsed as LocalStorageEnvelope<T>;
        const expired =
          typeof options.ttlMs === 'number' &&
          options.ttlMs > 0 &&
          Date.now() - boxed.timestamp > options.ttlMs;
        if (expired) {
          window.localStorage.removeItem(key);
          return initialValue;
        }
        return boxed.value;
      }
      return parsed as T;
    } catch {
      return initialValue;
    }
  }, [initialValue, key, options.ttlMs]);

  const [value, setValue] = useState<T>(readInitial);

  const setPersistedValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        try {
          if (typeof window !== 'undefined') {
            const payload: LocalStorageEnvelope<T> = { value: resolved, timestamp: Date.now() };
            window.localStorage.setItem(key, JSON.stringify(payload));
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
