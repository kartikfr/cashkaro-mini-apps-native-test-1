import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Info } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { fetchPaymentHistoryMonths, fetchPaymentHistoryByMonth } from '@/lib/api';
import LoginPrompt from '@/components/LoginPrompt';

interface MonthYearOption {
  month: string;
  year: number;
  label: string;
}

interface PaymentRecord {
  id: number;
  type: string;
  attributes: {
    cashout_id: number;
    payment_date: string;
    payment_method: string;
    payment_mode: string;
    amount: string;
    reference_number: string;
    status: string;
  };
}

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthsLoading, setMonthsLoading] = useState(true);
  const [monthOptions, setMonthOptions] = useState<MonthYearOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthYearOption | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Fetch available months/years
  useEffect(() => {
    const fetchMonths = async () => {
      if (!accessToken) return;
      setMonthsLoading(true);
      try {
        const response = await fetchPaymentHistoryMonths(accessToken);
        const data = response?.data || [];
        const options: MonthYearOption[] = data.map((item: any) => ({
          month: item.attributes?.month || item.month,
          year: item.attributes?.year || item.year,
          label: `${item.attributes?.month || item.month} ${item.attributes?.year || item.year}`,
        }));
        setMonthOptions(options);
        if (options.length > 0) {
          setSelectedMonth(options[0]);
        }
      } catch (error) {
        console.error('Failed to fetch payment history months:', error);
      } finally {
        setMonthsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchMonths();
    }
  }, [accessToken, isAuthenticated]);

  // Fetch payments for selected month
  useEffect(() => {
    const fetchPayments = async () => {
      if (!accessToken || !selectedMonth) return;
      setLoading(true);
      try {
        const response = await fetchPaymentHistoryByMonth(
          accessToken,
          selectedMonth.month,
          selectedMonth.year
        );
        setPayments(response?.data || []);
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && selectedMonth) {
      fetchPayments();
    }
  }, [accessToken, selectedMonth, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <LoginPrompt 
          title="View Payment History" 
          description="Please login to view your payment history" 
        />
      </AppLayout>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');
  };

  const handleViewDetail = (cashoutId: number) => {
    navigate(`/payment-history/${cashoutId}`);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Payment History</h1>
          </div>
        </div>

        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
          <Card className="p-6">
            {/* Title and Month/Year Dropdown */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Payment Details</h2>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[160px] justify-between"
                    disabled={monthsLoading}
                  >
                    {monthsLoading ? (
                      'Loading...'
                    ) : selectedMonth ? (
                      selectedMonth.label
                    ) : (
                      'Select Month'
                    )}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px] bg-background z-50">
                  {monthOptions.map((option) => (
                    <DropdownMenuItem
                      key={`${option.month}-${option.year}`}
                      onClick={() => setSelectedMonth(option)}
                      className={
                        selectedMonth?.month === option.month &&
                        selectedMonth?.year === option.year
                          ? 'bg-primary text-primary-foreground'
                          : ''
                      }
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Table */}
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No payment records found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Request ID</TableHead>
                      <TableHead className="font-semibold text-foreground">Date Paid</TableHead>
                      <TableHead className="font-semibold text-foreground">Payment Mode</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Amount Paid</TableHead>
                      <TableHead className="font-semibold text-foreground">Reference Number</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Info</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id || payment.attributes?.cashout_id}>
                        <TableCell className="font-medium">
                          {payment.attributes?.cashout_id || payment.id}
                        </TableCell>
                        <TableCell>{formatDate(payment.attributes?.payment_date)}</TableCell>
                        <TableCell>{payment.attributes?.payment_mode || payment.attributes?.payment_method || '-'}</TableCell>
                        <TableCell className="text-center">
                          ₹{payment.attributes?.amount || '0'}
                        </TableCell>
                        <TableCell>{payment.attributes?.reference_number || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="link"
                            className="text-primary p-0 h-auto"
                            onClick={() => handleViewDetail(payment.attributes?.cashout_id || payment.id)}
                          >
                            View →
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Important Information */}
            <div className="mt-6 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-300">Important Information</p>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    CashKaro payments will show up under Pouring Pounds India Pvt Ltd in your bank statement
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default PaymentHistory;
