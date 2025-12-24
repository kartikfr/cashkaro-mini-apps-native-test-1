import React, { useState } from 'react';
import { Loader2, X, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { raiseTicket } from '@/lib/api';

interface RaiseQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  orderContext: {
    exitClickDate: string;
    storeId: string;
    exitId: string;
    storeName: string;
    orderId?: string;
    queueId?: number;
  };
  configurations?: Array<{
    question?: string;
    title?: string;
    content?: string[];
    attachment_required?: string;
    button_text?: string;
  }>;
}

const RaiseQueryModal: React.FC<RaiseQueryModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  orderContext,
  configurations = [],
}) => {
  const { toast } = useToast();
  
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [transactionId, setTransactionId] = useState(orderContext.orderId || '');
  const [totalAmount, setTotalAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [transactionDetails, setTransactionDetails] = useState('');
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!transactionId.trim()) {
      newErrors.transactionId = 'Order/Transaction ID is required';
    } else if (transactionId.length > 25) {
      newErrors.transactionId = 'Order ID must be 25 characters or less';
    } else if (!/^[a-zA-Z0-9#\-./]+$/.test(transactionId)) {
      newErrors.transactionId = 'Only alphanumeric and #, -, ., / allowed';
    }
    
    if (!totalAmount.trim()) {
      newErrors.totalAmount = 'Amount is required';
    } else {
      const amount = parseFloat(totalAmount);
      if (isNaN(amount) || amount < 1 || amount > 999999999) {
        newErrors.totalAmount = 'Amount must be between 1 and 999999999';
      }
    }
    
    if (couponCode && couponCode.length > 15) {
      newErrors.couponCode = 'Coupon code must be 15 characters or less';
    } else if (couponCode && !/^[a-zA-Z0-9]*$/.test(couponCode)) {
      newErrors.couponCode = 'Only alphanumeric characters allowed';
    }
    
    if (transactionDetails && transactionDetails.length > 750) {
      newErrors.transactionDetails = 'Details must be 750 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await raiseTicket(
        accessToken,
        orderContext.exitClickDate,
        orderContext.storeId,
        orderContext.exitId,
        {
          transaction_id: transactionId,
          total_amount_paid: parseFloat(totalAmount),
          coupon_code_used: couponCode || undefined,
          transaction_details: transactionDetails || undefined,
          missing_txn_queue_id: orderContext.queueId,
        }
      );
      
      setStep('success');
      toast({
        title: 'Query Submitted',
        description: 'Your cashback query has been submitted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit query. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setTransactionId(orderContext.orderId || '');
    setTotalAmount('');
    setCouponCode('');
    setTransactionDetails('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'form' ? 'Raise a Query' : 'Query Submitted'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-4">
            {/* Store Context */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                Raising query for <span className="font-medium text-foreground">{orderContext.storeName}</span>
              </p>
            </div>

            {/* Configuration Questions */}
            {configurations.length > 0 && (
              <div className="space-y-2">
                {configurations.map((config, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    {config.title && <p className="font-medium text-foreground mb-1">{config.title}</p>}
                    {config.question && <p className="text-muted-foreground">{config.question}</p>}
                    {config.content && config.content.map((text, i) => (
                      <p key={i} className="text-muted-foreground">{text}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Transaction ID */}
            <div className="space-y-2">
              <Label htmlFor="transactionId">Order/Transaction ID *</Label>
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your order ID"
                maxLength={25}
                className={errors.transactionId ? 'border-destructive' : ''}
              />
              {errors.transactionId && (
                <p className="text-xs text-destructive">{errors.transactionId}</p>
              )}
            </div>

            {/* Total Amount */}
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount Paid *</Label>
              <Input
                id="totalAmount"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Enter order amount"
                min={1}
                max={999999999}
                className={errors.totalAmount ? 'border-destructive' : ''}
              />
              {errors.totalAmount && (
                <p className="text-xs text-destructive">{errors.totalAmount}</p>
              )}
            </div>

            {/* Coupon Code */}
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
              <Input
                id="couponCode"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="If used any coupon"
                maxLength={15}
                className={errors.couponCode ? 'border-destructive' : ''}
              />
              {errors.couponCode && (
                <p className="text-xs text-destructive">{errors.couponCode}</p>
              )}
            </div>

            {/* Transaction Details */}
            <div className="space-y-2">
              <Label htmlFor="transactionDetails">Additional Details (Optional)</Label>
              <Textarea
                id="transactionDetails"
                value={transactionDetails}
                onChange={(e) => setTransactionDetails(e.target.value)}
                placeholder="Any additional information about your transaction"
                maxLength={750}
                rows={3}
                className={errors.transactionDetails ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground text-right">
                {transactionDetails.length}/750
              </p>
              {errors.transactionDetails && (
                <p className="text-xs text-destructive">{errors.transactionDetails}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Query'
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Query Submitted!</h3>
            <p className="text-muted-foreground mb-6">
              Your cashback query has been submitted. We'll review it and get back to you soon.
            </p>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RaiseQueryModal;
