'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative overflow-hidden"
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
