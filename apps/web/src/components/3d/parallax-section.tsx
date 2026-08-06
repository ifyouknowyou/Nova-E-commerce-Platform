'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

export interface ParallaxSectionProps {
  /** Scroll distance (px) the content travels as the section passes through. */
  distance?: number;
  className?: string;
  children: ReactNode;
}

/**
 * ParallaxSection — drifts its children against the page scroll for a
 * depth-perception effect. Wraps its content in a full-size container, so it
 * is safe to use around existing section markup. Disabled under reduced motion.
 */
export function ParallaxSection({ distance = 70, className, children }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}
