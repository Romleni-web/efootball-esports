import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Trophy, Users, DollarSign, Calendar, Gamepad2 } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import PaymentModal from '../components/PaymentModal';
import BracketView from '../components/BracketView';

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);

  const { data, isLoading } = useQuery(['tournament', id], async () => {
    const res = await api.get(`/tournaments/${id}`);
    return res.data;
  });

  const joinMutation = useMutation(
    () => api.post(`/tournaments/${id}/join`),
    {
      onSuccess: (res) => {
        if (res.data.requiresPayment) {
          setShowPayment(true);
        } else {
          toast.success('Successfully joined tournament!');
          queryClient.invalidateQueries(['tournament', id]);
        }
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Failed to join');
      }
    }
  );

  if (isLoading) return <div className="text-white">Loading...</div>;

  const { tournament, bracket, participantCount, isFull } = data;
  const isRegistered = tournament.Users?.some(u => u.id === user?.id);
  const isVerified = tournament.TournamentParticipants?.some(
    p => p.userId === user?.id && p.status === 'verified'
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{tournament.name}</h1>
            <p className="text-gray-400">{tournament.description}</p>
          </div>
          <span className={`px-4 py-2 rounded text-white uppercase font-bold ${
            tournament.status === 'open' ? 'bg-green-500' :
            tournament.status === 'live' ? 'bg-blue-500' :
            tournament.status === 'completed' ? 'bg-gray-500' : 'bg-yellow-500'
          }`}>
            {tournament.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <InfoCard icon={Trophy} label="Prize Pool" value={`KES ${tournament.prizePool}`} />
          <InfoCard icon={Users} label="Players" value={`${participantCount}/${tournament.maxPlayers}`} />
          <InfoCard icon={DollarSign} label="Entry Fee" value={`KES ${tournament.entryFee}`} />
          <InfoCard icon={Calendar} label="Starts" value={format(new Date(tournament.startsAt), 'MMM d, h:mm a')} />
        </div>

        {/* Action Button */}
        {tournament.status === 'open' && !isRegistered && (
          <button
            onClick={() => joinMutation.mutate()}
            disabled={isFull || joinMutation.isLoading}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg"
          >
            {isFull ? 'Tournament Full' : joinMutation.isLoading ? 'Joining...' : 'Join Tournament'}
          </button>
        )}

        {isRegistered && !isVerified && (
          <div className="mt-8 bg-yellow-500/20 border border-yellow-500 text-yellow-400 p-4 rounded-lg">
            ⏳ Payment verification pending. You'll be added once confirmed.
          </div>
        )}

        {isVerified && (
          <div className="mt-8 bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-lg">
            ✅ You're registered! Check your matches when the tournament starts.
          </div>
        )}
      </div>

      {/* Bracket */}
      {bracket && (
        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Tournament Bracket</h2>
          <BracketView bracket={bracket} />
        </div>
      )}

      {/* Participants */}
      <div className="bg-gray-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Participants ({participantCount})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tournament.Users?.map((user) => (
            <div key={user.id} className="flex items-center gap-3 bg-gray-700 p-3 rounded">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{user.username}</p>
                <p className="text-gray-400 text-sm">{user.rank}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          tournament={tournament}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            queryClient.invalidateQueries(['tournament', id]);
          }}
        />
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <Icon className="text-blue-400 mb-2" size={24} />
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white font-bold text-lg">{value}</p>
    </div>
  );
}