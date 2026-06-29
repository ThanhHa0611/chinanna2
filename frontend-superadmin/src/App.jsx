import { useEffect, useState } from 'react';

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';

import SuperAdminLayout from './components/SuperAdminLayout';

import SuperAdminRoute from './components/SuperAdminRoute';

import { AuthProvider, useAuth } from './context/AuthContext';

import { DeviceModeProvider } from './context/DeviceModeContext';

import AccessRequests from './pages/AccessRequests';

import Login from './pages/Login';

import MenteeDetail from './pages/MenteeDetail';

import Mentees from './pages/Mentees';

import Mentors from './pages/Mentors';

import { api } from './services/api';

import './index.css';

import './device-phone.css';

function AppShell() {
  const { admin } = useAuth();

  const [mentorAlertCount, setMentorAlertCount] = useState(0);

  const [menteeCount, setMenteeCount] = useState(null);



  useEffect(() => {

    if (!admin?.is_super_admin) {

      setMenteeCount(null);

      return;

    }



    api

      .getMentees()

      .then((data) => {

        setMenteeCount(
          data.total_count ??
            (data.groups || []).reduce(
              (sum, group) => sum + (group.mentees?.length || 0),
              0,
            ),
        );

      })

      .catch(() => setMenteeCount(null));

  }, [admin]);



  return (

    <Routes>

      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>

        <Route element={<SuperAdminRoute />}>

          <Route

            element={

              <SuperAdminLayout

                mentorAlertCount={mentorAlertCount}

                menteeCount={menteeCount}

              />

            }

          >

            <Route path="/" element={<Navigate to="/mentors" replace />} />

            <Route

              path="/mentors"

              element={<Mentors onAlertsChange={setMentorAlertCount} />}

            />

            <Route

              path="/mentees"

              element={<Mentees onCountChange={setMenteeCount} />}

            />

            <Route path="/mentees/:menteeId" element={<MenteeDetail />} />

            <Route path="/access-requests" element={<AccessRequests />} />

          </Route>

        </Route>

      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>

  );

}



export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <DeviceModeProvider
      appKey="superadmin"
      title="Super Admin"
      subtitle="Bạn đang đăng nhập bằng điện thoại hay laptop?"
    >
      <AuthProvider>
        <BrowserRouter
          basename={basename || undefined}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </DeviceModeProvider>
  );
}

