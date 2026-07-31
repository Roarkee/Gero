import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * Gates the Client Portal.
 * Allows authenticated users to access the Client Portal.
 */
export default function PortalRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
