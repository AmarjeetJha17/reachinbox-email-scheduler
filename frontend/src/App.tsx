import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import {
  ProtectedRoute
} from "./components/ProtectedRoute";

import {
  DashboardLayout
} from "./layouts/DashboardLayout";

import {
  LoginPage
} from "./pages/LoginPage";

import {
  DashboardPage
} from "./pages/DashboardPage";

import {
  ComposePage
} from "./pages/ComposePage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<DashboardLayout />}
          >
            <Route
              index
              element={<DashboardPage />}
            />

            <Route
              path="compose"
              element={<ComposePage />}
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </AuthProvider>
  );
}