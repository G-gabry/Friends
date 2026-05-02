import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * AdminRoute — wraps any route that should only be visible to admin users.
 * Non-admins are silently redirected to /dashboard/orders.
 * While the user profile is still loading we show a spinner so there's
 * no flash of the protected content.
 */
export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard/orders" replace />;
  }

  return children;
};
