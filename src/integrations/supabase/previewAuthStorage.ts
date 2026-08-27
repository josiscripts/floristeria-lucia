// Preview auth storage adapter for Supabase
// This enables Supabase auth to work in preview/development mode

import { AuthChangeEvent, AuthSession } from '@supabase/supabase-js';

export function brokeredPreviewStorage() {
  const createStorageWithFallback = () => {
    // In browser environment, use localStorage
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            // Silently fail in restricted environments
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
          } catch {
            // Silently fail in restricted environments
          }
        },
      };
    }

    // Fallback in-memory storage
    const memoryStorage: Record<string, string> = {};
    return {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => {
        memoryStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStorage[key];
      },
    };
  };

  const storage = createStorageWithFallback();

  return {
    getItem: (key: string) => storage.getItem(key),
    setItem: (key: string, value: string) => storage.setItem(key, value),
    removeItem: (key: string) => storage.removeItem(key),
  };
}
