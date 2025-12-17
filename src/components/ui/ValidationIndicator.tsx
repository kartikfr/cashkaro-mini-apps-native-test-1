import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationIndicatorProps {
  isValid: boolean;
  isTouched: boolean;
  hasValue: boolean;
  validMessage?: string;
  invalidMessage?: string;
  showIcon?: boolean;
  className?: string;
}

export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  isValid,
  isTouched,
  hasValue,
  validMessage,
  invalidMessage,
  showIcon = true,
  className,
}) => {
  // Only show validation state after user has interacted
  const shouldShow = isTouched && hasValue;
  
  if (!shouldShow) return null;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs mt-1', className)}>
      {showIcon && (
        isValid ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <X className="w-3.5 h-3.5 text-destructive" />
        )
      )}
      <span className={isValid ? 'text-green-500' : 'text-destructive'}>
        {isValid ? validMessage : invalidMessage}
      </span>
    </div>
  );
};

// Icon component to show inside input field
export const ValidationIcon: React.FC<{
  isValid: boolean;
  isTouched: boolean;
  hasValue: boolean;
  className?: string;
}> = ({ isValid, isTouched, hasValue, className }) => {
  const shouldShow = isTouched && hasValue;
  
  if (!shouldShow) return null;

  return (
    <div className={cn('absolute right-4 top-1/2 -translate-y-1/2', className)}>
      {isValid ? (
        <Check className="w-5 h-5 text-green-500" />
      ) : (
        <X className="w-5 h-5 text-destructive" />
      )}
    </div>
  );
};

// Helper to get border color class based on validation state
export const getValidationBorderClass = (
  isValid: boolean,
  isTouched: boolean,
  hasValue: boolean
): string => {
  if (!isTouched || !hasValue) return '';
  return isValid 
    ? 'border-green-500 focus-visible:ring-green-500/20' 
    : 'border-destructive focus-visible:ring-destructive/20';
};

export default ValidationIndicator;
