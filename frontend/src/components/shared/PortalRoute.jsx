import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * Gates the Client Portal.
 * Allows authenticated users to access the Client Portal.
 */
export default function PortalRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow access if user is marked as client or has access to client portal
  if (!user?.is_client && !user?.has_client_portal) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
