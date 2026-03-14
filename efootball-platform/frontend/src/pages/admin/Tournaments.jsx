import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { Plus, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminTournaments() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: tournaments, isLoading } = useQuery('admin-tournaments', async () => {
    const res = await api.get('/tournaments?limit=100');
    return res.data.tournaments;
  });

  const startMutation = useMutation(
    (id) => api.post(`/tournaments/${id}/start`),
    {
      onSuccess: () => {
        toast.success('Tournament started');
        queryClient.invalidateQueries('admin-tournaments');
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Failed to start');
      }
    }
  );

  if (isLoading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Manage Tournaments</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={20} />
          Create Tournament
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="text-left p-4 text-gray-300">Name</th>
              <th className="text-left p-4 text-gray-300">Status</th>
              <th className="text-left p-4 text-gray-300">Players</th>
              <th className="text-left p-4 text-gray-300">Prize Pool</th>
              <th className="text-left p-4 text-gray-300">Starts</th>
              <th className="text-left p-4 text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tournaments?.map((t) => (
              <tr key={t.id} className="border-t border-gray-700">
                <td className="p-4 text-white font-medium">{t.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs uppercase ${
                    t.status === 'open' ? 'bg-green-500' :
                    t.status === 'live' ? 'bg-blue-500' :
                    t.status === 'completed' ? 'bg-gray-500' :
                    'bg-yellow-500'
                  } text-white`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-gray-300">
                  {t.Users?.length || 0} / {t.maxPlayers}
                </td>
                <td className="p-4 text-green-400">KES {t.prizePool}</td>
                <td className="p-4 text-gray-300">
                  {format(new Date(t.startsAt), 'MMM d, h:mm a')}
                </td>
                <td className="p-4">
                  {(t.status === 'open' || t.status === 'full') && (
                    <button
                      onClick={() => {
                        if (confirm('Start this tournament?')) {
                          startMutation.mutate(t.id);
                        }
                      }}
                      disabled={startMutation.isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      <Play size={16} />
                      Start
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateTournamentModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries('admin-tournaments');
          }}
        />
      )}
    </div>
  );
}

function CreateTournamentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'single_elim',
    maxPlayers: 16,
    entryFee: 200,
    prizeSplit: { "1": 0.6, "2": 0.3, "3": 0.1 },
    platform: 'PS5',
    crossplay: false,
    startsAt: '',
    registrationDeadline: ''
  });

  const createMutation = useMutation(
    () => api.post('/tournaments', formData),
    {
      onSuccess: () => {
        toast.success('Tournament created');
        onSuccess();
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Failed to create');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Create Tournament</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Tournament Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({...formData, format: e.target.value})}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="single_elim">Single Elimination</option>
                <option value="double_elim">Double Elimination</option>
                <option value="round_robin">Round Robin</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Max Players</label>
              <select
                value={formData.maxPlayers}
                onChange={(e) => setFormData({...formData, maxPlayers: parseInt(e.target.value)})}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={32}>32</option>
                <option value={64}>64</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Entry Fee (KES)</label>
              <input
                type="number"
                min="0"
                value={formData.entryFee}
                onChange={(e) => setFormData({...formData, entryFee: parseInt(e.target.value)})}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({...formData, platform: e.target.value})}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="PS5">PS5</option>
                <option value="Xbox">Xbox</option>
                <option value="PC">PC</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({...formData, startsAt: e.target.value})}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Registration Deadline</label>
              <input
                type="datetime-local"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})}
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Tournament'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}