import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'bva.theme';

function readStored(): ThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // Private windows and blocked site data throw on access; the default is fine.
  }
  return 'system';
}

/**
 * Theme preference with an explicit override.
 *
 * Following the operating system is the right default, but it is not enough on
 * its own: someone whose machine is set to dark may still want to read a
 * financial report on a light page, and until now the app gave them no way to
 * say so. The choice is written to the root element as `data-theme`, which the
 * stylesheet already scopes its palettes to, and remembered per browser.
 */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readStored);
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Remembering the choice is a convenience, never a requirement.
    }
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => setPreference(next), []);
  const isDark = preference === 'dark' || (preference === 'system' && systemDark);

  return { preference, setTheme, isDark };
}
