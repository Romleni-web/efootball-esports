import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Trophy, Users, DollarSign, Calendar } from 'lucide-react';
import api from '../services/api';

export default function Tournaments() {
  const [filter, setFilter] = useState('all');
  
  const { data: tournaments, isLoading } = useQuery('tournaments', async () => {
    const res = await api.get('/tournaments');
    return res.data.tournaments;
  });

  const filteredTournaments = tournaments?.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  if (isLoading) return <div className="text-white">Loading tournaments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Tournaments</h1>
        
        <div className="flex gap-2">
          {['all', 'open', 'live', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded capitalize ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments?.map((tournament) => (
          <TournamentCard key={tournament.id} tournament={tournament} />
        ))}
      </div>
    </div>
  );
}

function TournamentCard({ tournament }) {
  const statusColors = {
    open: 'bg-green-500',
    full: 'bg-yellow-500',
    live: 'bg-blue-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500'
  };

  return (
    <Link to={`/tournaments/${tournament.id}`}>
      <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
          <span className={`${statusColors[tournament.status]} text-xs px-2 py-1 rounded text-white uppercase`}>
            {tournament.status}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Trophy size={18} className="text-yellow-500" />
            <span>Prize Pool: KES {tournament.prizePool}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <Users size={18} className="text-blue-500" />
            <span>{tournament.Users?.length || 0} / {tournament.maxPlayers} players</span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <DollarSign size={18} className="text-green-500" />
            <span>Entry: KES {tournament.entryFee}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <Calendar size={18} className="text-purple-500" />
            <span>{format(new Date(tournament.startsAt), 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <span className="text-blue-400 text-sm font-medium">View Details →</span>
        </div>
      </div>
    </Link>
  );
}