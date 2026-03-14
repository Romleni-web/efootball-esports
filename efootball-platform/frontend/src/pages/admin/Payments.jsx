import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminPayments() {
  const queryClient = useQueryClient();
  
  const { data: payments, isLoading } = useQuery('pending-payments', async () => {
    const res = await api.get('/payments/pending');
    return res.data;
  });

  const verifyMutation = useMutation(
    (id) => api.post(`/payments/${id}/verify`),
    {
      onSuccess: () => {
        toast.success('Payment verified');
        queryClient.invalidateQueries('pending-payments');
      }
    }
  );

  const rejectMutation = useMutation(
    ({ id, reason }) => api.post(`/payments/${id}/reject`, { reason }),
    {
      onSuccess: () => {
        toast.success('Payment rejected');
        queryClient.invalidateQueries('pending-payments');
      }
    }
  );

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Pending Payments</h1>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="text-left p-4 text-gray-300">User</th>
              <th className="text-left p-4 text-gray-300">Tournament</th>
              <th className="text-left p-4 text-gray-300">Amount</th>
              <th className="text-left p-4 text-gray-300">Transaction ID</th>
              <th className="text-left p-4 text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments?.map((payment) => (
              <tr key={payment.id} className="border-t border-gray-700">
                <td className="p-4 text-white">{payment.TournamentParticipant?.User?.username}</td>
                <td className="p-4 text-gray-300">{payment.TournamentParticipant?.Tournament?.name}</td>
                <td className="p-4 text-green-400">KES {payment.amount}</td>
                <td className="p-4 text-gray-300 font-mono">{payment.transactionId}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => verifyMutation.mutate(payment.id)}
                      disabled={verifyMutation.isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) rejectMutation.mutate({ id: payment.id, reason });
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}