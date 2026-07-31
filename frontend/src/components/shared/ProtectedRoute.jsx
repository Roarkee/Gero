import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Client-role users belong in the portal, not the freelancer dashboard
  if (user?.role === "client") {
    return <Navigate to="/portal" replace />;
  }

  return children;
}
