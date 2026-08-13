import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/client';
import { API_ENDPOINTS } from '../../../api/endpoints';

const PaymentForm = ({ invoice }) => {
  const remainingBalance = (parseFloat(invoice.total_amount || 0) - parseFloat(invoice.amount_paid || 0)).toFixed(2);
  const [amount, setAmount] = useState(remainingBalance);

  const initPaymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      const res = await apiClient.post(API_ENDPOINTS.PAYMENTS_INITIALIZE, paymentData);
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Payment init response data:", data);
      const authUrl = data?.authorization_url || data?.data?.authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        toast.error("Failed to retrieve payment link. Please try again.");
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.error || "Payment initialization failed.";
      toast.error(msg);
    }
  });

  const handlePay = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    if (isNaN(val) || val <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }
    if (val > parseFloat(remainingBalance)) {
      toast.error("Amount cannot exceed the remaining balance.");
      return;
    }

    initPaymentMutation.mutate({
      invoice_id: invoice.id,
      amount: val.toString()
    });
  };

  if (parseFloat(remainingBalance) <= 0) {
    return (
      <div className="p-4 bg-green-100 text-green-800 rounded-md">
        This invoice is already paid in full.
      </div>
    );
  }

  return (
    <form onSubmit={handlePay} className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Pay Invoice</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Amount to Pay (GHS)
        </label>
        <input
          type="number"
          step="0.01"
          max={remainingBalance}
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          required
        />
        <p className="mt-1 text-xs text-gray-500">Remaining Balance: GHS {remainingBalance}</p>
      </div>
      <button
        type="submit"
        disabled={initPaymentMutation.isPending || initPaymentMutation.isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {(initPaymentMutation.isPending || initPaymentMutation.isLoading) ? "Processing..." : `Pay GHS ${amount}`}
      </button>
    </form>
  );
};

export default PaymentForm;
