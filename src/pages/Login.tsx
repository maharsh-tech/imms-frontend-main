import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  // If already logged in, redirect to correct dashboard
  if (isAuthenticated && user) {
    switch (user.role) {
      case 'COORDINATOR':
        return <Navigate to="/coordinator" replace />;
      case 'TEACHER':
        return <Navigate to="/teacher" replace />;
      case 'STUDENT':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Internal Marks Management System
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in with your institutional Google account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div>
            <button
              onClick={handleGoogleLogin}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Google
            </button>
          </div>
          <div className="mt-6 text-xs text-center text-gray-500">
            Only @charusat.edu.in and @charusat.ac.in domains are allowed.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
