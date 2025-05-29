import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (!user) {
    // Redirect to appropriate login page based on route type
    return <Navigate to={isAdminRoute ? '/admin/login' : '/user/login'} />;
  }

  // For admin routes, check if user is admin
  if (isAdminRoute && !user.isAdmin) {
    return <Navigate to="/user/login" />;
  }

  return children;
}

export default ProtectedRoute; 