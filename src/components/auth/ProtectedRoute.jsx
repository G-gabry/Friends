import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        <div className="size-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="../login" replace />;
  }

  return children;
};
