import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Pure client-role users belong in the portal, not the freelancer dashboard
  if (user && !user.is_freelancer && user.is_client) {
    return <Navigate to="/portal" replace />;
  }
  
  // If they are somehow neither (e.g. during loading or corrupt data), just let them hit the dashboard which might show an error or skeleton
  if (user && !user.is_freelancer && !user.is_client) {
     return <div className="p-8 text-red-500">Error: Your account has no assigned role. Please contact support.</div>;
  }

  return children;
}
