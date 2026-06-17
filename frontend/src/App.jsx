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
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApplicationsList from './pages/admin/ApplicationsList';
import AdminApplicationDetail from './pages/admin/ApplicationDetail';
import UsersManagement from './pages/admin/UsersManagement';
import Statistics from './pages/admin/Statistics';
import Layout from './components/Layout';
import TrackApplication from './pages/TrackApplication';

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

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Ochiq sahifalar - login talab qilinmaydi */}
      <Route path="/track" element={<TrackApplication />} />

      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* User routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Default redirect based on role */}
        <Route index element={
          user?.role === 'USER'
            ? <UserDashboard />
            : <Navigate to="/admin" replace />
        } />
        <Route path="applications/new" element={
          <ProtectedRoute roles={['USER']}>
            <ApplicationForm />
          </ProtectedRoute>
        } />
        <Route path="applications/:id/edit" element={
          <ProtectedRoute roles={['USER']}>
            <ApplicationForm />
          </ProtectedRoute>
        } />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="farmers" element={
          <ProtectedRoute roles={['USER']}>
            <FarmersPage />
          </ProtectedRoute>
        } />
        <Route path="change-password" element={<ChangePassword />} />

        {/* Admin routes */}
        <Route path="admin" element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/applications" element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminApplicationsList />
          </ProtectedRoute>
        } />
        <Route path="admin/applications/:id" element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminApplicationDetail />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <UsersManagement />
          </ProtectedRoute>
        } />
        <Route path="admin/statistics" element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <Statistics />
          </ProtectedRoute>
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', background: '#333', color: '#fff' },
            success: { style: { background: '#16a34a' } },
            error: { style: { background: '#dc2626' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
