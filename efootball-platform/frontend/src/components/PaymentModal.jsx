import React, { useState } from 'react';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import api from '../services/api';

export default function PaymentModal({ tournament, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    transactionId: '',
    senderNumber: '',
    screenshot: null
  });

  const submitMutation = useMutation(
    (data) => {
      const form = new FormData();
      form.append('tournamentId', tournament.id);
      form.append('transactionId', data.transactionId);
      form.append('senderNumber', data.senderNumber);
      if (data.screenshot) {
        form.append('screenshot', data.screenshot);
      }
      return api.post('/payments/submit', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    {
      onSuccess: () => {
        toast.success('Payment submitted for verification!');
        onSuccess();
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Failed to submit payment');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <p className="text-gray-300 mb-2">Send KES {tournament.entryFee} to:</p>
          <p className="text-white font-mono text-lg bg-gray-900 p-3 rounded">
            M-Pesa: 2547XX XXX XXX
          </p>
          <p className="text-gray-400 text-sm mt-2">Name: Your Platform Name</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Transaction ID</label>
            <input
              type="text"
              value={formData.transactionId}
              onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="QK7X2P9M"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Your M-Pesa Number</label>
            <input
              type="tel"
              value={formData.senderNumber}
              onChange={(e) => setFormData({...formData, senderNumber: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              placeholder="254712345678"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Screenshot (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({...formData, screenshot: e.target.files[0]})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitMutation.isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded disabled:opacity-50"
          >
            {submitMutation.isLoading ? 'Submitting...' : 'I\'ve Paid - Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}