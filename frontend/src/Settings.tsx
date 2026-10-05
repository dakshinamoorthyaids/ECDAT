import { useState } from "react";
import {
  User,
  Mail,
  Shield,
  LockKeyhole,
  ArrowLeft,
  Save,
} from "lucide-react";

import "./Settings.css";

type SettingsProps = {
  onBack: () => void;
};

function Settings({ onBack }: SettingsProps) {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || "admin"
  );

  const [email, setEmail] = useState("");

  const [role] = useState(
    localStorage.getItem("role") || "Admin"
  );

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [twoFactor, setTwoFactor] =
    useState(false);

  const [message, setMessage] = useState("");

  const handleSaveProfile = () => {
    localStorage.setItem("username", username);

    setMessage("Profile settings saved successfully.");
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New password and confirmation do not match.");
      return;
    }

    setMessage(
      "Password change request saved locally. Backend password update is not connected yet."
    );

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSecuritySave = () => {
    localStorage.setItem(
      "twoFactorEnabled",
      String(twoFactor)
    );

    setMessage("Security settings saved successfully.");
  };

  return (
    <div className="settings-page">

      <header className="settings-header">

        <button
          className="settings-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div>
          <h1>Settings</h1>
          <p>
            Manage your profile, account and security settings.
          </p>
        </div>

      </header>

      {message && (
        <div className="settings-message">
          {message}
        </div>
      )}

      <div className="settings-grid">

        {/* PROFILE */}

        <section className="settings-card">

          <div className="settings-card-header">
            <div className="settings-icon">
              <User size={21} />
            </div>

            <div>
              <h2>Profile</h2>
              <p>Manage your account information.</p>
            </div>
          </div>

          <div className="settings-form">

            <label>
              Username
            </label>

            <div className="settings-input-wrapper">
              <User size={17} />

              <input
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
              />
            </div>

            <label>
              Email
            </label>

            <div className="settings-input-wrapper">
              <Mail size={17} />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter email address"
              />
            </div>

            <label>
              Role
            </label>

            <div className="settings-role">
              <Shield size={17} />
              <span>{role}</span>
              <small>Assigned by system</small>
            </div>

            <button
              className="settings-primary-button"
              onClick={handleSaveProfile}
            >
              <Save size={17} />
              Save Profile
            </button>

          </div>

        </section>

        {/* PASSWORD */}

        <section className="settings-card">

          <div className="settings-card-header">
            <div className="settings-icon">
              <LockKeyhole size={21} />
            </div>

            <div>
              <h2>Password</h2>
              <p>Update your account password.</p>
            </div>
          </div>

          <div className="settings-form">

            <label>
              Current Password
            </label>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              placeholder="Enter current password"
            />

            <label>
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="Enter new password"
            />

            <label>
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm new password"
            />

            <button
              className="settings-primary-button"
              onClick={handleChangePassword}
            >
              <LockKeyhole size={17} />
              Change Password
            </button>

          </div>

        </section>

        {/* SECURITY */}

        <section className="settings-card settings-security-card">

          <div className="settings-card-header">
            <div className="settings-icon">
              <Shield size={21} />
            </div>

            <div>
              <h2>Security</h2>
              <p>Configure additional security options.</p>
            </div>
          </div>

          <div className="security-option">

            <div>
              <strong>Two-Factor Authentication</strong>

              <p>
                Add an additional verification step
                to your account.
              </p>
            </div>

            <label className="toggle">

              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(event) =>
                  setTwoFactor(event.target.checked)
                }
              />

              <span className="toggle-slider" />

            </label>

          </div>

          <button
            className="settings-primary-button"
            onClick={handleSecuritySave}
          >
            <Save size={17} />
            Save Security Settings
          </button>

        </section>

      </div>

    </div>
  );
}

export default Settings;