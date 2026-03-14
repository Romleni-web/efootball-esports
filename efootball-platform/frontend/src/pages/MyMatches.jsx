import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Gamepad2, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function MyMatches() {
  const { data: matches, isLoading } = useQuery('my-matches', async () => {
    const res = await api.get('/matches/my-matches');
    return res.data;
  });

  if (isLoading) return <div className="text-white">Loading matches...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">My Matches</h1>

      {matches?.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Gamepad2 className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-400">No active matches</p>
          <Link to="/tournaments" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Join a tournament →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches?.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }) {
  const opponent = match.player1?.id === match.player1Id ? match.player2 : match.player1;
  
  return (
    <Link to={`/matches/${match.id}`}>
      <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition border border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">{match.Tournament?.name}</h3>
            <p className="text-gray-400 mt-1">vs {opponent?.username || 'TBD'}</p>
          </div>
          
          <div className="text-right">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded ${
              match.status === 'live' ? 'bg-green-500 text-white' :
              match.status === 'disputed' ? 'bg-red-500 text-white' :
              'bg-gray-700 text-gray-300'
            }`}>
              {match.status === 'live' && <Clock size={16} />}
              {match.status === 'disputed' && <AlertCircle size={16} />}
              {match.status === 'live' ? 'Play Now' : 
               match.status === 'disputed' ? 'Disputed' : 'Waiting'}
            </span>
          </div>
        </div>

        {match.roomId && match.status === 'live' && (
          <div className="mt-4 bg-gray-900 p-4 rounded flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">Room ID</p>
              <p className="text-white font-mono text-lg">{match.roomId}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Password</p>
              <p className="text-white font-mono text-lg">{match.roomPassword}</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}