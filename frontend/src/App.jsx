import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationDetail from './pages/ApplicationDetail';
import ChangePassword from './pages/ChangePassword';
import FarmersPage from './pages/FarmersPage';
import Layout from './components/Layout';
import TrackApplication from './pages/TrackApplication';
import PublicDocument from './pages/PublicDocument';

// Admin (SUPERADMIN)
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApplicationsList from './pages/admin/ApplicationsList';
import AdminApplicationDetail from './pages/admin/ApplicationDetail';
import UsersManagement from './pages/admin/UsersManagement';
import Statistics from './pages/admin/Statistics';

// Tasdiqlovchi
import TasdiqlovchiDashboard from './pages/tasdiqlovchi/Dashboard';
import TasdiqlovchiApplicationsList from './pages/tasdiqlovchi/ApplicationsList';
import TasdiqlovchiApplicationDetail from './pages/tasdiqlovchi/ApplicationDetail';

// Imzolovchi
import ImzolovchiDashboard from './pages/imzolovchi/Dashboard';
import ImzolovchiApplicationsList from './pages/imzolovchi/ApplicationsList';
import ImzolovchiApplicationDetail from './pages/imzolovchi/ApplicationDetail';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'USER') return <UserDashboard />;
  if (user.role === 'TASDIQLOVCHI') return <Navigate to="/tasdiqlovchi" replace />;
  if (user.role === 'IMZOLOVCHI') return <Navigate to="/imzolovchi" replace />;
  return <Navigate to="/admin" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Ochiq sahifalar */}
      <Route path="/track" element={<TrackApplication />} />
      <Route path="/document/:app_number" element={<PublicDocument />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<HomeRedirect />} />
        <Route path="change-password" element={<ChangePassword />} />

        {/* USER */}
        <Route path="applications/new" element={
          <ProtectedRoute roles={['USER']}><ApplicationForm /></ProtectedRoute>
        } />
        <Route path="applications/:id/edit" element={
          <ProtectedRoute roles={['USER']}><ApplicationForm /></ProtectedRoute>
        } />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="farmers" element={
          <ProtectedRoute roles={['USER']}><FarmersPage /></ProtectedRoute>
        } />

        {/* TASDIQLOVCHI */}
        <Route path="tasdiqlovchi" element={
          <ProtectedRoute roles={['TASDIQLOVCHI', 'SUPERADMIN']}><TasdiqlovchiDashboard /></ProtectedRoute>
        } />
        <Route path="tasdiqlovchi/applications" element={
          <ProtectedRoute roles={['TASDIQLOVCHI', 'SUPERADMIN']}><TasdiqlovchiApplicationsList /></ProtectedRoute>
        } />
        <Route path="tasdiqlovchi/applications/:id" element={
          <ProtectedRoute roles={['TASDIQLOVCHI', 'SUPERADMIN']}><TasdiqlovchiApplicationDetail /></ProtectedRoute>
        } />

        {/* IMZOLOVCHI */}
        <Route path="imzolovchi" element={
          <ProtectedRoute roles={['IMZOLOVCHI', 'SUPERADMIN']}><ImzolovchiDashboard /></ProtectedRoute>
        } />
        <Route path="imzolovchi/applications" element={
          <ProtectedRoute roles={['IMZOLOVCHI', 'SUPERADMIN']}><ImzolovchiApplicationsList /></ProtectedRoute>
        } />
        <Route path="imzolovchi/applications/:id" element={
          <ProtectedRoute roles={['IMZOLOVCHI', 'SUPERADMIN']}><ImzolovchiApplicationDetail /></ProtectedRoute>
        } />

        {/* SUPERADMIN */}
        <Route path="admin" element={
          <ProtectedRoute roles={['SUPERADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="admin/applications" element={
          <ProtectedRoute roles={['SUPERADMIN']}><AdminApplicationsList /></ProtectedRoute>
        } />
        <Route path="admin/applications/:id" element={
          <ProtectedRoute roles={['SUPERADMIN']}><AdminApplicationDetail /></ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute roles={['SUPERADMIN']}><UsersManagement /></ProtectedRoute>
        } />
        <Route path="admin/statistics" element={
          <ProtectedRoute roles={['SUPERADMIN']}><Statistics /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
          success: { style: { background: '#16a34a' } },
          error: { style: { background: '#dc2626' } },
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
