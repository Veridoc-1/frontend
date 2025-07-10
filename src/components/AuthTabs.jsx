import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

function AuthTabs() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return null; // Don't show auth tabs when user is logged in
  }

  return (
    <div className="flex items-center space-x-2">
      <Link
        to="/login"
        className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        Sign In
      </Link>
      <span className="text-gray-400 dark:text-gray-600">|</span>
      <Link
        to="/login"
        className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
      >
        Sign Up
      </Link>
    </div>
  );
}

export default AuthTabs; 