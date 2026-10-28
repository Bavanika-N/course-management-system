import { useEffect, useState } from "react";
import { FaKey, FaSave, FaUser } from "react-icons/fa";

import Navbar from "../components/Navbar";
import api from "../services/api";
import { getUser, saveUser } from "../services/auth";

const getPasswordError = (password) => {
  if ([...password].length < 8) {
    return "New password must be at least 8 characters.";
  }

  if (new TextEncoder().encode(password).length > 72) {
    return "New password must not exceed 72 bytes.";
  }

  return "";
};

function Profile() {
  const [user, setUser] = useState(getUser);
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/users/me");
        setUser(response.data.user);
        setFullName(response.data.user.full_name);
        saveUser(response.data.user);
      } catch (error) {
        setProfileError(
          error.response?.data?.message || "Could not load your profile."
        );
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");

    const trimmedName = fullName.trim();
    const nameLength = [...trimmedName].length;

    if (nameLength < 3 || nameLength > 100) {
      setProfileError("Full name must be between 3 and 100 characters.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await api.put("/users/me", {
        full_name: trimmedName,
      });
      setUser(response.data.user);
      setFullName(response.data.user.full_name);
      saveUser(response.data.user);
      setProfileMessage("Your full name has been updated.");
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Could not update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    const validationError = getPasswordError(newPassword);

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await api.put("/users/me/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordMessage(response.data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Could not change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="container profile-page">
        <header className="page-header">
          <div>
            <h1>My Profile</h1>
            <p className="page-subtitle">
              Update your personal information and password.
            </p>
          </div>
        </header>

        {loadingProfile ? (
          <p role="status">Loading your profile...</p>
        ) : (
          <div className="profile-grid">
            <section className="profile-card">
              <h2><FaUser /> Profile information</h2>
              <p className="page-subtitle">
                Your username and role cannot be changed.
              </p>

              {profileError && <p className="error" role="alert">{profileError}</p>}
              {profileMessage && <p className="success" role="status">{profileMessage}</p>}

              <div className="profile-readonly">
                <p><strong>Username</strong><span>{user?.username}</span></p>
                <p><strong>Role</strong><span>{user?.role}</span></p>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label htmlFor="full-name">Full name</label>
                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    minLength={3}
                    maxLength={100}
                    autoComplete="name"
                    required
                    disabled={savingProfile}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingProfile || loadingProfile}
                >
                  <FaSave />
                  {savingProfile ? "Saving..." : "Save full name"}
                </button>
              </form>
            </section>

            <section className="profile-card">
              <h2><FaKey /> Change password</h2>
              <p className="page-subtitle">
                Choose a password with at least 8 characters.
              </p>

              {passwordError && <p className="error" role="alert">{passwordError}</p>}
              {passwordMessage && <p className="success" role="status">{passwordMessage}</p>}

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="current-password">Current password</label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={savingPassword}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={savingPassword}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={savingPassword}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPassword}
                >
                  <FaKey />
                  {savingPassword ? "Changing..." : "Change password"}
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

export default Profile;
