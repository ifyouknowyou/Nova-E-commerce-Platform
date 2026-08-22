'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedNavItemProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href: string;
  active?: boolean;
  badge?: string;
}

/**
 * AnimatedNavItem — magnetic hover + 3D tilt + sliding underline.
 * Wraps a <Link> with decorative animations that respond to pointer movement.
 */
export function AnimatedNavItem({
  href,
  active,
  badge,
  className,
  children,
  ...props
}: AnimatedNavItemProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 18 });
  const sy = useSpring(y, { stiffness: 300, damping: 18 });
  const rotateX = useTransform(y, [-40, 40], [6, -6]);
  const rotateY = useTransform(x, [-40, 40], [-6, 6]);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ perspective: 600 }}
      className="relative"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', x: active ? sx : 0, y: active ? sy : 0 }}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <Link
          href={href}
          className={cn(
            'relative inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            active
              ? 'text-primary'
              : 'text-foreground/70 hover:text-foreground',
            className,
          )}
          {...props}
        >
          {/* Sliding underline */}
          <motion.span
            className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
            initial={{ scaleX: active ? 1 : 0 }}
            animate={{ scaleX: active ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
          {children}
          {badge ? (
            <motion.span
              className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
            >
              {badge}
            </motion.span>
          ) : null}
        </Link>
      </motion.div>
    </motion.div>
  );
}
