import { LoginForm } from "@/components/auth/login-form";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </>
  );
}
