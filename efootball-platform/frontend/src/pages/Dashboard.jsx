import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Trophy, DollarSign, Gamepad2, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery('dashboard-stats', async () => {
    const res = await api.get('/auth/me');
    return res.data;
  });

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Welcome, {user?.username}!</h1>
        <Link
          to="/tournaments"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          Browse Tournaments
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Trophy}
          label="Rank"
          value={user?.rank || 'Bronze'}
          color="text-yellow-500"
        />
        <StatCard
          icon={Gamepad2}
          label="Matches Won"
          value={user?.wins || 0}
          color="text-green-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Win Rate"
          value={calculateWinRate(user?.wins, user?.losses)}
          color="text-blue-500"
        />
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={`KES ${user?.earningsTotal || 0}`}
          color="text-purple-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Upcoming Matches</h2>
          <p className="text-gray-400">Check your matches to see upcoming games</p>
          <Link to="/my-matches" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            View Matches →
          </Link>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Active Tournaments</h2>
          <p className="text-gray-400">Join tournaments to compete for cash prizes</p>
          <Link to="/tournaments" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Browse Tournaments →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <Icon className={`${color}`} size={32} />
      </div>
    </div>
  );
}

function calculateWinRate(wins, losses) {
  if (!wins && !losses) return '0%';
  const total = (wins || 0) + (losses || 0);
  return `${Math.round(((wins || 0) / total) * 100)}%`;
}