import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Layouts
import MainLayout from './components/Layout/MainLayout';
import AdminLayout from './components/Layout/AdminLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import MyMatches from './pages/MyMatches';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTournaments from './pages/admin/Tournaments';
import AdminPayments from './pages/admin/Payments';
import AdminDisputes from './pages/admin/Disputes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

      {/* Protected Routes */}
      <Route element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/my-matches" element={<MyMatches />} />
      </Route>

      {/* Admin Routes */}
      <Route element={isAuthenticated && user?.isAdmin ? <AdminLayout /> : <Navigate to="/" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tournaments" element={<AdminTournaments />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;