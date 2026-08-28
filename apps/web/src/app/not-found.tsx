'use client';

import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { AmbientBackground } from '@/components/layout/ambient-background';
import { Button } from '@/components/ui/button';

/**
 * 404 Page — immersive, 3D-enhanced not-found experience.
 * Uses the same ambient background and motion patterns as the storefront
 * so unauthenticated visitors still get the NOVA visual identity.
 */
export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: -10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.1 }}
        className="relative z-10 px-6 text-center"
      >
        {/* Large 404 number with depth */}
        <motion.div
          className="font-fraunces text-[12rem] font-black leading-none text-primary/10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        >
          404
        </motion.div>

        {/* Depth card for message */}
        <div className="mx-auto mt-[-2rem] w-full max-w-sm rounded-2xl border bg-card/80 p-8 shadow-2xl backdrop-blur-xl depth-2">
          <motion.h2
            className="text-2xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Page Not Found
          </motion.h2>
          <motion.p
            className="mt-3 text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              asChild
              className="mt-6 w-full rounded-full"
              size="lg"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Homepage
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Floating badge */}
        <motion.div
          className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60" />
          NOVA Commerce
        </motion.div>
      </motion.div>
    </div>
  );
}
