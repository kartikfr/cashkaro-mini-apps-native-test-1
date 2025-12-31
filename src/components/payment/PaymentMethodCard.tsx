import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethodType = 'amazon' | 'flipkart' | 'bank' | 'upi';

interface PaymentMethodCardProps {
  id: PaymentMethodType;
  name: string;
  description?: string;
  icon?: LucideIcon;
  iconElement?: React.ReactNode;
  brandColor?: string;
  isSelected?: boolean;
  onClick: (id: PaymentMethodType) => void;
  disabled?: boolean;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  id,
  name,
  description,
  icon: Icon,
  iconElement,
  brandColor = 'hsl(var(--primary))',
  isSelected,
  onClick,
  disabled,
}) => {
  return (
    <button
      onClick={() => onClick(id)}
      disabled={disabled}
      className={cn(
        'w-full card-elevated p-4 text-left hover:border-primary transition-all duration-200 group',
        isSelected && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
          style={{ backgroundColor: `${brandColor}15` }}
        >
          {iconElement ? (
            iconElement
          ) : Icon ? (
            <Icon className="w-6 h-6" style={{ color: brandColor }} />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{name}</p>
          {description && (
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </button>
  );
};

export default PaymentMethodCard;
