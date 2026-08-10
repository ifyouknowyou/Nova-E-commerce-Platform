'use client';

import { useEffect, useState } from 'react';

/**
 * Countdown to an absolute ISO release/window target.
 * Ticks once a minute while the target is in the future and returns
 * `released: true` the moment it passes, so "coming soon" states flip
 * to available automatically without a reload.
 */
export function useCountdown(targetIso: string | null | undefined) {
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (target === null) return;
    setNow(Date.now());
    if (target <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [target]);

  const released = target === null || target <= now;

  function parts() {
    if (target === null) return { days: 0, hours: 0, minutes: 0 };
    const diff = Math.max(0, target - now);
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
    };
  }

  const { days, hours, minutes } = parts();
  return { released, days, hours, minutes };
}