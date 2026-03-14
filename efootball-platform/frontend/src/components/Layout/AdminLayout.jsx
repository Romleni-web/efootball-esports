import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Trophy, DollarSign, AlertCircle, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const { logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/admin/payments', label: 'Payments', icon: DollarSign },
    { path: '/admin/disputes', label: 'Disputes', icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Navbar */}
      <nav className="bg-purple-900 border-b border-purple-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/admin" className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="bg-purple-600 px-3 py-1 rounded text-sm">ADMIN</span>
                eFootball Pro
              </Link>
              
              <div className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 text-sm font-medium ${
                      location.pathname === item.path 
                        ? 'text-white' 
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-purple-200 hover:text-white text-sm">
                Exit Admin
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
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