import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { fetchPaymentHistoryDetail, downloadPaymentHistoryExcel, downloadPaymentHistoryPDF } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import LoginPrompt from '@/components/LoginPrompt';

interface TransactionRecord {
  id: number;
  type: string;
  attributes: {
    order_date: string;
    merchant_name: string;
    details: string;
    cashback_type: string;
    donation: string;
    cashback_amount: string;
    cashback_direction: string;
  };
}

interface PaymentMeta {
  total_records: number;
  page_number: number;
  page_size: number;
  payment_status: string;
  total_amount: string;
}

const PaymentHistoryDetail = () => {
  const navigate = useNavigate();
  const { cashoutId } = useParams<{ cashoutId: string }>();
  const { accessToken, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [meta, setMeta] = useState<PaymentMeta | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!accessToken || !cashoutId) return;
      setLoading(true);
      try {
        const response = await fetchPaymentHistoryDetail(accessToken, parseInt(cashoutId), 1, 20);
        setTransactions(response?.data || []);
        setMeta(response?.meta || null);
      } catch (error) {
        console.error('Failed to fetch payment history detail:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && cashoutId) {
      fetchDetails();
    }
  }, [accessToken, cashoutId, isAuthenticated]);

  const handleDownloadExcel = async () => {
    if (!accessToken || !cashoutId) return;
    setDownloadingExcel(true);
    try {
      const response = await downloadPaymentHistoryExcel(accessToken, parseInt(cashoutId));
      // Handle download - assuming API returns blob or URL
      if (response?.url) {
        window.open(response.url, '_blank');
      } else {
        toast({
          title: 'Download Started',
          description: 'Your Excel file is being prepared',
        });
      }
    } catch (error) {
      console.error('Failed to download Excel:', error);
      toast({
        title: 'Error',
        description: 'Failed to download Excel file',
        variant: 'destructive',
      });
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!accessToken || !cashoutId) return;
    setDownloadingPDF(true);
    try {
      const response = await downloadPaymentHistoryPDF(accessToken, parseInt(cashoutId));
      // Handle download - assuming API returns blob or URL
      if (response?.url) {
        window.open(response.url, '_blank');
      } else {
        toast({
          title: 'Download Started',
          description: 'Your PDF file is being prepared',
        });
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF file',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <LoginPrompt 
          title="View Payment Details" 
          description="Please login to view payment details" 
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
            <h1 className="text-xl font-semibold text-foreground">Payment Details</h1>
          </div>
        </div>

        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
          <Card className="p-6">
            {/* Header with Request ID and Download Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Request ID: {cashoutId}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Only 10 orders are shown here. To see more, click Download
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadExcel}
                  disabled={downloadingExcel}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingExcel ? 'Downloading...' : 'Download Excel'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingPDF ? 'Downloading...' : 'Download PDF'}
                </Button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No transaction records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Order Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Details</TableHead>
                      <TableHead className="font-semibold text-foreground">Type</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Cashback Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction, index) => (
                      <TableRow key={transaction.id || index}>
                        <TableCell>{formatDate(transaction.attributes?.order_date)}</TableCell>
                        <TableCell className="font-medium text-primary">
                          {transaction.attributes?.merchant_name || transaction.attributes?.details || '-'}
                        </TableCell>
                        <TableCell>
                          <span className={
                            transaction.attributes?.cashback_type === 'Rewards'
                              ? 'text-purple-600'
                              : 'text-green-600'
                          }>
                            {transaction.attributes?.cashback_type || 'Cashback'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{transaction.attributes?.cashback_amount || '0'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            {meta && (
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Total Records: {meta.total_records}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  Total Amount: ₹{meta.total_amount}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default PaymentHistoryDetail;
