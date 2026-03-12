import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { InternLayout } from './components/layout/InternLayout';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import InternDashboard from './pages/intern/InternDashboard';
import MyCertificates from './pages/intern/MyCertificates';
import MyTasks from './pages/intern/MyTasks';
import InternProfile from './pages/intern/InternProfile';
import InternNotifications from './pages/intern/InternNotifications';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';

import Interns from './pages/Interns';
import Certificates from './pages/Certificates';
import Permissions from './pages/Permissions';
import TaskManagement from './pages/admin/TaskManagement';
import TaskReview from './pages/admin/TaskReview';
import InternProgress from './pages/admin/InternProgress';
import { ToastProvider } from './context/ToastContext';

import ProtectedRoute from './components/layout/ProtectedRoute';

import { DataProvider } from './context/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/login" element={
                <ProtectedRoute>
                  <LoginPage />
                </ProtectedRoute>
              } />
              <Route path="/register" element={
                <ProtectedRoute>
                  <RegisterPage />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute role="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="interns" element={<Interns />} />
                <Route path="tasks" element={<TaskManagement />} />
                <Route path="task-review" element={<TaskReview />} />
                <Route path="intern-progress" element={<InternProgress />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="permissions" element={<Permissions />} />
              </Route>

              {/* Intern Routes */}
              <Route path="/intern" element={
                <ProtectedRoute role="intern">
                  <InternLayout />
                </ProtectedRoute>
              }>
                <Route index element={<InternDashboard />} />
                <Route path="tasks" element={<MyTasks />} />
                <Route path="certificates" element={<MyCertificates />} />
                <Route path="profile" element={<InternProfile />} />
                <Route path="notifications" element={<InternNotifications />} />
              </Route>

            </Routes>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
