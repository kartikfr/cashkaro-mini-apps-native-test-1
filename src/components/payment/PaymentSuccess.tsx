import React from 'react';
import { CheckCircle, PartyPopper, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type PaymentMethodType = 'amazon' | 'flipkart' | 'bank' | 'upi';

interface PaymentSuccessProps {
  method: PaymentMethodType;
  amount: number;
  onContinue?: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  method,
  amount,
  onContinue,
}) => {
  const navigate = useNavigate();

  const getMethodLabel = () => {
    switch (method) {
      case 'amazon': return 'Amazon Pay';
      case 'flipkart': return 'Flipkart Gift Card';
      case 'bank': return 'Bank Transfer';
      case 'upi': return 'UPI';
      default: return 'Payment';
    }
  };

  const getSuccessMessage = () => {
    switch (method) {
      case 'amazon':
        return `We have initiated your Amazon Gift card of ₹${amount.toFixed(0)} to your registered account. We will notify you via SMS once this is done.`;
      case 'flipkart':
        return `We have initiated your Flipkart Gift Card of ₹${amount.toFixed(0)} to your registered email. We will notify you via SMS once this is done.`;
      case 'bank':
        return `We have initiated your bank transfer of ₹${amount.toFixed(0)}. Depending upon your bank, it may take upto 72 hours for the payment to reach you.`;
      case 'upi':
        return `We have initiated your UPI payment of ₹${amount.toFixed(0)}. The amount will be credited to your UPI ID within 24-48 hours.`;
      default:
        return `We have initiated your payment of ₹${amount.toFixed(0)}. We will notify you once the payment is processed.`;
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-8">
      {/* Success Icon with celebration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2">
          <PartyPopper className="w-6 h-6 text-warning" />
        </div>
        <div className="absolute -bottom-1 -left-3">
          <Banknote className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {getMethodLabel()} Payment Initiated
      </h2>

      {/* Success message */}
      <p className="text-muted-foreground mb-6 max-w-sm">
        {getSuccessMessage()}
      </p>

      {/* Amount badge */}
      <div className="bg-success/10 border border-success/20 rounded-xl px-6 py-3 mb-8">
        <p className="text-sm text-muted-foreground mb-1">Amount</p>
        <p className="text-2xl font-bold text-success">₹{amount.toFixed(2)}</p>
      </div>

      {/* CTA Button */}
      <Button
        onClick={handleContinue}
        className="w-full max-w-xs h-12 bg-gradient-primary hover:opacity-90"
      >
        Continue Shopping
      </Button>
    </div>
  );
};

export default PaymentSuccess;
