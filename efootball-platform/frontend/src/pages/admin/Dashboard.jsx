import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { DollarSign, Users, Trophy, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery('admin-stats', async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  });

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers}
          color="bg-blue-500"
        />
        <StatCard
          icon={Trophy}
          label="Active Tournaments"
          value={stats?.activeTournaments}
          color="bg-green-500"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`KES ${stats?.totalRevenue?.toLocaleString()}`}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          icon={DollarSign}
          title="Pending Payments"
          count={stats?.pendingPayments}
          link="/admin/payments"
          color="text-yellow-500"
        />
        <ActionCard
          icon={AlertCircle}
          title="Active Disputes"
          count={stats?.pendingPayouts}
          link="/admin/disputes"
          color="text-red-500"
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`${color} p-4 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
        <div>
          <p className="text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, count, link, color }) {
  return (
    <Link to={link} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Icon className={color} size={32} />
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className={`text-2xl font-bold ${color}`}>{count} pending</p>
          </div>
        </div>
        <span className="text-gray-400">→</span>
      </div>
    </Link>
  );
}