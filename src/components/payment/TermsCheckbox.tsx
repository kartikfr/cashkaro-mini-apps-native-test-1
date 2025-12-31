import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const TermsCheckbox = React.forwardRef<HTMLDivElement, TermsCheckboxProps>(
  ({ checked, onCheckedChange, className }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-start gap-3', className)}>
        <Checkbox
          id="payment-terms"
          checked={checked}
          onCheckedChange={(checked) => onCheckedChange(checked === true)}
          className="mt-0.5"
        />
        <label
          htmlFor="payment-terms"
          className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
        >
          I agree to the{' '}
          <a
            href="/terms-and-conditions"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            terms & conditions
          </a>{' '}
          governing payment transfer request listed here.
        </label>
      </div>
    );
  }
);

TermsCheckbox.displayName = 'TermsCheckbox';

export default TermsCheckbox;
