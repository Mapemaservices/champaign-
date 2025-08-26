import { useRef } from "react";

/**
 * useSuperCache: A simple React hook for in-memory caching of async data.
 * Usage: const { get, set, clear } = useSuperCache();
 */
export function useSuperCache() {
  // The cache is a ref so it persists across renders but doesn't trigger rerenders
  const cache = useRef<Record<string, any>>({});

  function get<T = any>(key: string): T | undefined {
    return cache.current[key];
  }

  function set<T = any>(key: string, value: T) {
    cache.current[key] = value;
  }

  function clear(key?: string) {
    if (key) delete cache.current[key];
    else cache.current = {};
  }

  return { get, set, clear };
}
