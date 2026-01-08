import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  isRefreshing,
  threshold = 80,
}) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  if (!showIndicator) return null;

  return (
    <div 
      className="flex justify-center items-center overflow-hidden transition-all duration-200"
      style={{ 
        height: isRefreshing ? 48 : pullDistance,
        opacity: progress,
      }}
    >
      <div 
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 border border-primary/20",
          isRefreshing && "animate-spin"
        )}
        style={{
          transform: isRefreshing ? 'none' : `rotate(${progress * 360}deg)`,
        }}
      >
        <Loader2 className="w-4 h-4 text-primary" />
      </div>
    </div>
  );
};
