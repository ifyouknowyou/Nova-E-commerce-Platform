'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme } = useTheme();
  // Start with 'light' on both server and client to match SSR output.
  // The actual theme is read from the DOM after mount via useEffect.
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    // Sync with next-themes after hydration completes.
    const sync = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setThemeState(isDark ? 'dark' : 'light');
    };
    sync();
    // Also listen for theme changes via MutationObserver on <html>.
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative overflow-hidden"
      suppressHydrationWarning
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          <Sun className="h-5 w-5 text-amber-400" />
        </div>
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            isDark ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          <Moon className="h-5 w-5 text-indigo-400" />
        </div>
      </div>
    </Button>
  );
}
