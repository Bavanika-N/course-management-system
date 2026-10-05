import { Navigate, useLocation } from "react-router-dom";

import { getUser, getToken } from "../services/auth";

function ProtectedRoute({ children, role }) {

  const location = useLocation();

  const token = getToken();
  const user = getUser();

  // ---------- 1. Not logged in ----------
  if (!token || !user) {

    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );

  }

  // ---------- 2. Logged in but wrong role ----------
  if (role && user.role !== role) {

    return (
      <div className="container">

        <div className="error">

          <strong>Access denied.</strong>{" "}
          You do not have permission to access this page.

        </div>

      </div>
    );

  }

  // ---------- 3. Allowed ----------
  return children;
}

export default ProtectedRoute;