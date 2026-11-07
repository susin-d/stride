import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { TodayPage } from '@/pages/TodayPage';
import { InboxPage } from '@/pages/InboxPage';
import { UpcomingPage } from '@/pages/UpcomingPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { HabitsPage } from '@/pages/HabitsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { WeeklyReviewPage } from '@/pages/WeeklyReviewPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { useAuthStore } from '@/store/authStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/today" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/landing',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <AuthRoute>
        <LoginPage />
      </AuthRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthRoute>
        <RegisterPage />
      </AuthRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/today',
        element: <TodayPage />,
      },
      {
        path: '/app',
        element: <Navigate to="/today" replace />,
      },
      {
        path: '/inbox',
        element: <InboxPage />,
      },
      {
        path: '/upcoming',
        element: <UpcomingPage />,
      },
      {
        path: '/projects',
        element: <ProjectsPage />,
      },
      {
        path: '/goals',
        element: <GoalsPage />,
      },
      {
        path: '/habits',
        element: <HabitsPage />,
      },
      {
        path: '/calendar',
        element: <CalendarPage />,
      },
      {
        path: '/weekly',
        element: <WeeklyReviewPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
