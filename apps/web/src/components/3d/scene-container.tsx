'use client';

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import type { HTMLAttributes, PointerEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SceneContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Render a receding perspective grid floor at the bottom of the scene. */
  grid?: boolean;
  /** Render ambient aurora gradient blobs behind the content. */
  aurora?: boolean;
  /** Render a subtle film-grain overlay on top. */
  noise?: boolean;
  /** Max pointer-parallax tilt in degrees (0 disables). */
  parallax?: number;
  children: ReactNode;
}

/**
 * SceneContainer — establishes the 3D viewport for a spatial composition.
 * Applies a subtle pointer-tracked tilt to its children (which may use
 * `.tz-*` translate-Z helpers for layered depth). Respects reduced motion.
 */
export function SceneContainer({
  grid,
  aurora,
  noise,
  parallax = 3.5,
  className,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: SceneContainerProps) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(mx, [0, 1], [parallax, -parallax]), {
    stiffness: 130,
    damping: 20,
  });
  const rotateX = useSpring(useTransform(my, [0, 1], [-parallax, parallax]), {
    stiffness: 130,
    damping: 20,
  });

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
    onPointerMove?.(e);
  }
  function handleLeave(e: PointerEvent<HTMLDivElement>) {
    mx.set(0.5);
    my.set(0.5);
    onPointerLeave?.(e);
  }

  return (
    <div
      className={cn('scene-perspective relative overflow-hidden', className)}
      onPointerMove={reduce ? onPointerMove : handleMove}
      onPointerLeave={reduce ? onPointerLeave : handleLeave}
      {...props}
    >
      {aurora ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-6 h-80 w-80 rounded-full bg-primary/15 blur-[110px]" />
          <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-success/10 blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-[90px]" />
        </div>
      ) : null}

      {grid ? <div aria-hidden className="scene-grid" /> : null}

      <motion.div
        className="scene-3d relative"
        style={
          reduce
            ? undefined
            : { rotateX, rotateY, transformStyle: 'preserve-3d' }
        }
      >
        {children}
      </motion.div>

      {noise ? <div aria-hidden className="noise-overlay pointer-events-none absolute inset-0" /> : null}
    </div>
  );
}
