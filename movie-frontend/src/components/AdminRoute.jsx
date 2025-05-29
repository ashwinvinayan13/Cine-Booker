import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to admin login if not authenticated
    return <Navigate to="/admin/login" replace />;
  }

  if (!user?.is_admin) {
    // Redirect to home if not an admin
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute; 