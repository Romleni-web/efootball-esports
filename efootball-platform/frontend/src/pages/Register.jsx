import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    efId: '',
    mpesaNumber: ''
  });
  const [localError, setLocalError] = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    // Format M-Pesa number
    let mpesa = formData.mpesaNumber;
    if (mpesa.startsWith('0')) {
      mpesa = '254' + mpesa.substring(1);
    } else if (mpesa.startsWith('+')) {
      mpesa = mpesa.substring(1);
    }

    const success = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      efId: formData.efId,
      mpesaNumber: mpesa
    });

    if (success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h1>
        
        {(error || localError) && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">{error || localError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">eFootball ID (optional)</label>
            <input
              type="text"
              value={formData.efId}
              onChange={(e) => setFormData({...formData, efId: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">M-Pesa Number</label>
            <input
              type="tel"
              placeholder="254712345678"
              value={formData.mpesaNumber}
              onChange={(e) => setFormData({...formData, mpesaNumber: e.target.value})}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Format: 254XXXXXXXXX</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">Login</Link>
        </p>
      </div>
    </div>
  );
}