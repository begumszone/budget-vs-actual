import { useEffect, useState } from 'react';

function resolve(): boolean {
  if (typeof window === 'undefined') return false;
  const stamped = document.documentElement.getAttribute('data-theme');
  if (stamped === 'dark') return true;
  if (stamped === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Whether the charts should draw against a dark surface.
 *
 * The charts paint their own colours in JavaScript, so they cannot inherit the
 * stylesheet's palette. They have to resolve the theme the same way the CSS
 * does: an explicit `data-theme` on the root element wins, and only in its
 * absence does the operating system decide. Watching just the media query left
 * the charts in the wrong palette whenever the in-app theme switch was used.
 */
export function usePrefersDark(): boolean {
  const [dark, setDark] = useState(resolve);

  useEffect(() => {
    const update = () => setDark(resolve());
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mql.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  return dark;
}
