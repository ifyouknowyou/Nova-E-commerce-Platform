'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SpatialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  className?: string;
  children: ReactNode;
}

/**
 * SpatialModal — a depth-elevated dialog that scales/tilts into view.
 * Lightweight and dependency-free (no Radix dialog) — emits Escape handling
 * and locks body scroll while open. Use for compact confirmations/panels.
 */
export function SpatialModal({ open, onOpenChange, title, className, children }: SpatialModalProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onOpenChange(false);
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn('relative w-full max-w-lg rounded-2xl border bg-card p-6 text-card-foreground depth-4', className)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, rotateX: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, rotateX: -4, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{ transformOrigin: 'center bottom' }}
          >
            {title ? (
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-display text-lg font-semibold">{title}</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => onOpenChange(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
