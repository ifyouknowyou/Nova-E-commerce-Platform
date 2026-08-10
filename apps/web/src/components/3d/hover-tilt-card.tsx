'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HoverTiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max tilt angle in degrees. Keep small so content stays readable. */
  maxTilt?: number;
  /** Inner content receives the counter-tilt so text stays legible. */
  innerClassName?: string;
}

/**
 * Subtle 3D tilt on hover. Pure transform (GPU friendly), disabled for users
 * who prefer reduced motion. The inner layer counter-rotates so the content
 * never skews — only the surface gains depth.
 */
export function HoverTiltCard({
  children,
  className,
  maxTilt = 6,
  innerClassName,
}: HoverTiltCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>): void {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--tilt-x', `${(-py * maxTilt).toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${(px * maxTilt).toFixed(2)}deg`);
  }

  function onMouseLeave(): void {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <div className={cn('perspective-1200', className)}>
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        whileHover={prefersReducedMotion ? undefined : { y: -4 }}
        className={cn(
          'preserve-3d relative h-full w-full rounded-xl transition-transform duration-300 ease-out',
          'hover:depth-2',
        )}
        style={{
          transform: 'rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={cn('preserve-3d h-full w-full', innerClassName)}
          style={{ transform: 'translateZ(24px)' }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
