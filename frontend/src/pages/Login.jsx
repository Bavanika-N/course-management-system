import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { FaSearch, FaSignInAlt } from "react-icons/fa";

import api from "../services/api";
import { saveAuth } from "../services/auth";
import Navbar from "../components/Navbar";

function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Check whether user came here because of session expiry
  const sessionExpired =
    new URLSearchParams(location.search).get("sessionExpired") === "true";

  // Get the original page saved by api.js
  const queryFrom =
    new URLSearchParams(location.search).get("from");

  // Also support the existing ProtectedRoute state
  const stateFrom = location.state?.from;

  const redirectTo = queryFrom || stateFrom;

  const handleSubmit = async (event) => {

    // Stop the browser from reloading the whole page
    event.preventDefault();

    setError("");

    // Simple client-side check
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {

      const response = await api.post("/auth/login", {
        username,
        password,
      });

      // Save the JWT and the user
      saveAuth(
        response.data.token,
        response.data.user
      );

      // Redirect after successful login
      const role = response.data.user.role;

      // Return to the original page if available
      if (
        redirectTo &&
        !redirectTo.startsWith("/login")
      ) {

        navigate(redirectTo);

      } else if (role === "admin") {

        // Normal admin login
        navigate("/admin");

      } else {

        // Normal student login
        navigate("/student");

      }

    } catch (error) {

      // Server responded with an error
      if (error.response) {

        // Normal failed login
        if (error.response.status === 401) {

          setError("Invalid username or password");

        } else {

          setError(
            error.response.data?.message ||
            `Login failed (status ${error.response.status})`
          );
        }

      } else {

        // Network/server connection error
        setError(
          "Cannot reach the server. Please check that the backend is running on http://localhost:3000"
        );

      }

    } finally {

      // Always stop loading
      setLoading(false);

    }
  };

  return (

    <>
      <Navbar />

      <div className="login-container">

        <h1>Login</h1>

        <p className="login-subtitle">
          Sign in to enroll in courses.
        </p>

        {/* Session expired message */}
        {sessionExpired && (
          <p className="error">
            Your session has expired. Please log in again.
          </p>
        )}

        {/* Login error message */}
        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">

            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              autoComplete="username"
              disabled={loading}
            />

          </div>

          <div className="form-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
            />

          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            <FaSignInAlt />

            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        <p className="login-footer">

          Not sure where to go?{" "}

          <Link to="/courses">
            <FaSearch /> Browse the courses
          </Link>

          {" "}first.

        </p>

      </div>

    </>
  );
}

export default Login;