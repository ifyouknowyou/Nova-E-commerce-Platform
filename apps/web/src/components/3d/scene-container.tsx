'use client';

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import type { HTMLAttributes, PointerEvent, ReactNode } from 'react';
import { useRef } from 'react';
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
 * Enhanced with volumetric light rays and a subtle glow halo.
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

  const containerRef = useRef<HTMLDivElement>(null);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
    glowX.set((e.clientX - rect.left) / rect.width * 100);
    glowY.set((e.clientY - rect.top) / rect.height * 100);
    onPointerMove?.(e);
  }
  function handleLeave(e: PointerEvent<HTMLDivElement>) {
    mx.set(0.5);
    my.set(0.5);
    glowX.set(50);
    glowY.set(50);
    onPointerLeave?.(e);
  }

  return (
    <div
      ref={containerRef}
      className={cn('scene-perspective relative overflow-hidden', className)}
      onPointerMove={reduce ? onPointerMove : handleMove}
      onPointerLeave={reduce ? onPointerLeave : handleLeave}
      {...props}
    >
      {/* Volumetric glow that follows the pointer */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), color-mix(in oklch, var(--primary) 8%, transparent), transparent 60%)`,
          }}
        />
      )}

      {aurora ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -left-24 top-6 h-80 w-80 rounded-full bg-primary/15 blur-[110px]"
            animate={{ x: [-20, 30, -10, -20], y: [10, -20, 15, 10], scale: [1, 1.08, 0.95, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-0 top-40 h-72 w-72 rounded-full bg-success/10 blur-[100px]"
            animate={{ x: [0, -25, 15, 0], y: [-15, 20, -10, -15], scale: [1, 0.92, 1.06, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-[90px]"
            animate={{ x: [0, 20, -15, 0], y: [0, -25, 10, 0], scale: [1, 1.1, 0.9, 1] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
          {/* Extra accent aurora blobs for depth */}
          <motion.div
            className="absolute left-1/4 top-1/3 h-48 w-48 rounded-full bg-accent/8 blur-[80px]"
            animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
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
