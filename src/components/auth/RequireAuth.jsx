import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getHomePathForRole } from "../../auth/session";

function FullPageState({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" dir="rtl">
      <div
        className="rounded-2xl border px-6 py-5 text-center text-sm font-medium"
        style={{
          background: "var(--gray-1)",
          borderColor: "var(--gray-a6)",
          color: "var(--gray-12)",
        }}
      >
        {message}
      </div>
    </div>
  );
}

export function RequireAuth({ roles = [], children }) {
  const { ready, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <FullPageState message="جاري التحقق من الجلسة..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return children;
}

export function RedirectAuthenticated({ children }) {
  const { ready, isAuthenticated, role } = useAuth();

  if (!ready) {
    return <FullPageState message="جاري التحقق من الجلسة..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return children;
}
