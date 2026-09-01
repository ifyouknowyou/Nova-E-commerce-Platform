'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * AmbientBackground — fixed full-viewport animated mesh gradient with
 * floating particles. Provides an immersive, living backdrop for the
 * entire storefront. No layout impact (position: fixed, z-index: -1).
 * Respects prefers-reduced-motion.
 */
export function AmbientBackground() {
  const reduce = useReducedMotion();
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  if (reduce || !particlesRef.current) return;

  const container = particlesRef.current;
  const count = window.innerWidth < 768 ? 12 : 28;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${18 + Math.random() * 28}s`;
    p.style.animationDelay = `${-Math.random() * 30}s`;
    p.style.width = `${2 + Math.random() * 3}px`;
    p.style.height = p.style.width;
    container.appendChild(p);
  }

  return () => {
    container.innerHTML = '';
  };
}, [reduce]);

  if (reduce) return null;

  return (
    <>
      <div aria-hidden className="ambient-mesh" suppressHydrationWarning>
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="blob blob-c" />
      </div>
      <div aria-hidden className="aurora-wash" suppressHydrationWarning />
      <div ref={particlesRef} className="particles-field" suppressHydrationWarning />
    </>
  );
}
