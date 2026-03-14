import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminDisputes() {
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState(null);
  const [resolution, setResolution] = useState({ winnerId: '', note: '' });

  const { data: disputes, isLoading } = useQuery('disputes', async () => {
    const res = await api.get('/admin/disputes');
    return res.data;
  });

  const resolveMutation = useMutation(
    ({ matchId, data }) => api.post(`/admin/disputes/${matchId}/resolve`, data),
    {
      onSuccess: () => {
        toast.success('Dispute resolved');
        setResolvingId(null);
        setResolution({ winnerId: '', note: '' });
        queryClient.invalidateQueries('disputes');
      }
    }
  );

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Match Disputes</h1>

      <div className="space-y-4">
        {disputes?.map((match) => (
          <div key={match.id} className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {match.Tournament?.name} - Round {match.round}
                </h3>
                <p className="text-gray-400 mt-1">
                  {match.player1?.username} vs {match.player2?.username}
                </p>
                <p className="text-red-400 mt-2">Reason: {match.disputeReason}</p>
              </div>
              <span className="text-gray-500 text-sm">
                {format(new Date(match.updatedAt), 'MMM d, h:mm a')}
              </span>
            </div>

            {match.evidencePlayer1 && (
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">{match.player1?.username}'s evidence:</p>
                <img src={match.evidencePlayer1} alt="Evidence" className="max-w-md rounded" />
              </div>
            )}

            {match.evidencePlayer2 && (
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">{match.player2?.username}'s evidence:</p>
                <img src={match.evidencePlayer2} alt="Evidence" className="max-w-md rounded" />
              </div>
            )}

            {resolvingId === match.id ? (
              <div className="bg-gray-700 p-4 rounded-lg mt-4">
                <h4 className="text-white font-bold mb-4">Resolve Dispute</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Select Winner</label>
                    <select
                      value={resolution.winnerId}
                      onChange={(e) => setResolution({...resolution, winnerId: e.target.value})}
                      className="w-full p-3 rounded bg-gray-600 text-white"
                    >
                      <option value="">Choose winner...</option>
                      <option value={match.player1Id}>{match.player1?.username}</option>
                      <option value={match.player2Id}>{match.player2?.username}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Resolution Note</label>
                    <textarea
                      value={resolution.note}
                      onChange={(e) => setResolution({...resolution, note: e.target.value})}
                      className="w-full p-3 rounded bg-gray-600 text-white"
                      rows="3"
                      placeholder="Explain your decision..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveMutation.mutate({
                        matchId: match.id,
                        data: resolution
                      })}
                      disabled={!resolution.winnerId || !resolution.note || resolveMutation.isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50"
                    >
                      Confirm Resolution
                    </button>
                    <button
                      onClick={() => setResolvingId(null)}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setResolvingId(match.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
              >
                Resolve Dispute
              </button>
            )}
          </div>
        ))}

        {disputes?.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
            No active disputes
          </div>
        )}
      </div>
    </div>
  );
}