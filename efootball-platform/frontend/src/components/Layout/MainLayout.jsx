import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Trophy, Calendar, Gamepad2, LogOut, User } from 'lucide-react';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: User },
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/my-matches', label: 'My Matches', icon: Gamepad2 },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="text-yellow-500" />
                eFootball Pro
              </Link>
            </div>

            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 text-sm font-medium ${
                    location.pathname === item.path ? 'text-blue-400' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}

              {user?.isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}