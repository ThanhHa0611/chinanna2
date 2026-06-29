import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SuperAdminRoute() {
  const { admin, loading } = useAuth();

  if (loading) {
    return <p className="loader page-loader">Đang tải...</p>;
  }

  if (!admin?.is_super_admin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
