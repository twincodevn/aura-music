import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, DownloadCloud, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'loading' | 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  show: boolean;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  show, 
  type = 'info', 
  onDismiss, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (show && type !== 'loading') {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [show, type, duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'loading': return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default: return <DownloadCloud className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getGlow = () => {
    switch (type) {
      case 'loading': return 'shadow-primary/20 border-primary/30';
      case 'success': return 'shadow-emerald-500/20 border-emerald-500/30';
      case 'error': return 'shadow-rose-500/20 border-rose-500/30';
      default: return 'shadow-indigo-500/20 border-indigo-500/30';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 15, scale: 0.95, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={cn(
                "fixed bottom-32 left-1/2 z-[100] px-6 py-4 rounded-3xl flex items-center gap-4 min-w-[280px] max-w-md",
                "bg-black/40 backdrop-blur-3xl border shadow-2xl",
                getGlow()
            )}
        >
          {/* Kinetic Icon Container */}
          <div className="relative flex-shrink-0">
            <motion.div
               animate={type === 'loading' ? {} : { scale: [0.8, 1.1, 1], opacity: [0, 1] }}
               transition={{ duration: 0.4 }}
            >
              {getIcon()}
            </motion.div>
            
            {/* Subtle pulsar for loading state */}
            {type === 'loading' && (
                <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse rounded-full" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <p className="text-[13px] font-bold text-white/95 leading-tight truncate">
              {message}
            </p>
            {type === 'loading' && (
                <span className="text-[9px] font-black uppercase tracking-widest text-primary mt-1 animate-pulse">
                  Processing...
                </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
