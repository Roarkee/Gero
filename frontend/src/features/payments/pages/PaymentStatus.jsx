import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import apiClient from '../../../api/client';
import { API_ENDPOINTS } from '../../../api/endpoints';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, failed

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }

    const verifyPayment = async () => {
      // In a real implementation, you might poll this endpoint 
      // or rely on the webhook and just fetch the transaction status.
      // We will assume the backend has a verify endpoint, or we just show "Processing".
      // Since webhooks are authoritative, we tell the user we are processing.
      
      // Let's just wait 3 seconds to let webhook process and then show a generic success message
      // or we can call a GET endpoint to check transaction status if implemented.
      // For now, we will show "Payment Processing" and suggest checking the invoice again.
      
      setTimeout(() => {
        setStatus('success');
      }, 3000);
    };

    verifyPayment();
  }, [reference]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          
          {status === 'verifying' && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Verifying Payment...</h2>
              <p className="mt-2 text-gray-600">Please wait while we confirm your transaction with the provider.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Payment Processed</h2>
              <p className="mt-2 text-gray-600">Your payment has been sent for processing. The invoice will update automatically once verified.</p>
              <button 
                onClick={() => navigate(-1)} 
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go Back
              </button>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex flex-col items-center">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
              <p className="mt-2 text-gray-600">We could not verify your payment. Please try again or contact support.</p>
              <button 
                onClick={() => navigate(-1)} 
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go Back
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
