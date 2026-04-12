import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: delay * 0.05, type: 'spring', bounce: 0.3 }}
    className="p-3 rounded-2xl glass-card border-white/5 shadow-lg"
  >
    {/* Thumbnail skeleton */}
    <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-white/5 mb-3">
      <div className="absolute inset-0 skeleton-shimmer" />
    </div>
    {/* Text skeletons */}
    <div className="px-0.5 space-y-2.5">
      <div className="skeleton-shimmer h-3.5 rounded-lg w-3/4 bg-white/10" />
      <div className="skeleton-shimmer h-3 rounded-lg w-1/2 bg-white/5" />
    </div>
  </motion.div>
);

/* Single shimmer row skeleton (for library) */
export const SkeletonRow: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay, duration: 0.3 }}
    className="flex items-center gap-4 px-3 py-2.5"
  >
    <div className="skeleton-shimmer w-6 h-4 rounded-md shrink-0" />
    <div className="skeleton-shimmer w-10 h-10 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="skeleton-shimmer h-3.5 rounded-lg w-3/4" />
      <div className="skeleton-shimmer h-3 rounded-md w-1/2" />
    </div>
    <div className="skeleton-shimmer h-3 rounded-md w-12 hidden md:block" />
  </motion.div>
);

/* Grid of N skeleton cards */
export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} delay={i * 0.04} />
    ))}
  </div>
);

export default SkeletonCard;
