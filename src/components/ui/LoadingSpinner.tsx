import React, { forwardRef } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin ${className}`}
      />
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
