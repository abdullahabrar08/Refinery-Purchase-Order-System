import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { BuyerPortalPage } from "./pages/BuyerPortalPage";
import { AdminPortalPage } from "./pages/AdminPortalPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";

interface ProtectedRouteProps {
  allowedRole: "Admin" | "Buyer";
  children: ReactNode;
}

function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={role === "Admin" ? "/admin" : "/buyer"} replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/buyer"
        element={
          <ProtectedRoute allowedRole="Buyer">
            <BuyerPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/orders/:orderId"
        element={
          <ProtectedRoute allowedRole="Buyer">
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="Admin">
            <AdminPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders/:orderId"
        element={
          <ProtectedRoute allowedRole="Admin">
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? (role === "Admin" ? "/admin" : "/buyer") : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
