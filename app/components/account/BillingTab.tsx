import { useAuth } from "@clerk/react-router";
import { CreditCard, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { API_BASE_URL } from "~/config/subscription";

export function BillingTab() {
  const { isSignedIn } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  
  const [loading, setLoading] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // Fetch user subscription status
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn) {
        setLoadingUserData(false);
        return;
      }

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/me`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [isSignedIn, authenticatedFetch]);

  const handleCancelSubscription = () => {
    // TODO: Integrate with Polar cancellation API
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? You'll lose access to all pro features."
    );
    if (confirmed) {
      alert('Cancellation feature coming soon. Please contact support to cancel your subscription.');
    }
  };

  const handleUpdatePayment = () => {
    // TODO: Integrate with Polar payment method API
    alert('Payment update feature coming soon.');
  };

  // Mock invoice data
  // TODO: Fetch invoices from Polar API
  const mockInvoices = [
    { date: '2025-10-30', total: 20.00, status: 'Paid', invoiceUrl: '#' },
    { date: '2025-09-30', total: 20.00, status: 'Paid', invoiceUrl: '#' },
    { date: '2025-08-30', total: 20.00, status: 'Paid', invoiceUrl: '#' }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateNextBilling = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return 'N/A';
    const date = new Date(trialEndsAt);
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loadingUserData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 pb-3 border-b">
        <h1 className="text-lg font-bold">Billing</h1>
      </div>

      {/* 1. Plan Section */}
      <div className="flex items-start justify-between pt-0 pb-6 border-b">
        <div className="w-48 flex-shrink-0">
          <h2 className="text-sm font-normal">Plan</h2>
        </div>
        <div className="flex-1">
          <p className="text-sm font-light">Monthly</p>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-renews on {calculateNextBilling(userData?.trial_ends_at)}
          </p>
        </div>
      </div>

      {/* 2. Payment Section */}
      <div className="flex items-center justify-between py-6 border-b">
        <div className="w-48 flex-shrink-0">
          <h2 className="text-sm font-normal">Payment method</h2>
        </div>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">Visa •••• 0668</span>
          </div>
          <button 
            onClick={handleUpdatePayment}
            className="text-sm hover:bg-gray-100 px-2 py-1 rounded-sm transition-colors"
          >
            Update
          </button>
        </div>
      </div>

      {/* 3. Invoices Section */}
      <div className="flex items-start justify-between py-6 border-b">
        <div className="w-48 flex-shrink-0">
          <h2 className="text-sm font-normal">Invoices</h2>
        </div>
        <div className="flex-1">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Total</th>
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((invoice, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 text-sm">{formatDate(invoice.date)}</td>
                    <td className="py-3 text-sm">${invoice.total.toFixed(2)}</td>
                    <td className="py-3 text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>Paid</span>
                      </span>
                    </td>
                    <td className="py-3 text-sm text-right">
                      <a 
                        href={invoice.invoiceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm hover:bg-gray-100 px-2 py-1 rounded-sm transition-colors inline-block"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Cancellation Section */}
      <div className="flex items-center justify-between py-6">
        <div className="w-48 flex-shrink-0">
          <h2 className="text-sm font-normal">Cancel subscription</h2>
        </div>
        <div className="flex-1">
          <button 
            onClick={handleCancelSubscription}
            className="text-sm text-destructive hover:bg-red-50 px-2 py-1 rounded-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

