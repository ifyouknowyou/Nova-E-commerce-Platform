'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PublicProduct } from '@/lib/api/types';

/**
 * Interactive product gallery: large stage with crossfade between images,
 * click-to-zoom, thumbnail navigation, and keyboard/arrow navigation.
 */
export function ProductGallery({ product }: { product: PublicProduct }) {
  const images = product.images;
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const image = images[Math.min(active, Math.max(0, images.length - 1))];

  useEffect(() => {
    if (!zoomed) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setZoomed(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  function step(dir: 1 | -1): void {
    setActive((a) => (a + dir + images.length) % images.length);
  }

  function onMove(e: React.MouseEvent<HTMLDivElement>): void {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }

  return (
    <div>
      {/* Stage */}
      <div
        className="group relative aspect-square overflow-hidden rounded-xl border bg-muted depth-1"
        onMouseMove={onMove}
        onMouseLeave={() => setZoomed(false)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={active}
            initial={reduce ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={image.alt ?? product.name}
                onClick={() => setZoomed((z) => !z)}
                className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300"
                style={
                  zoomed
                    ? {
                        transform: 'scale(1.9)',
                        transformOrigin: `${mouse.x}% ${mouse.y}%`,
                        cursor: 'zoom-out',
                      }
                    : undefined
                }
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {!zoomed && (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur">
            <ZoomIn className="h-3.5 w-3.5" /> Click to zoom
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition-transform hover:scale-105"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition-transform hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === active}
              aria-label={`View image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border object-cover transition-all',
                i === active ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
