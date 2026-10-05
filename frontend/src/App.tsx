import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  ShieldCheck,
  Fingerprint,
  Link2,
  UsersRound,
  FileText,
  ClipboardCheck,
  User,
  LockKeyhole,
  Eye,
  UserSearch,
  Scale,
  LogIn,
  ArrowRight,
  EyeOff,
} from "lucide-react";

import { API_BASE_URL } from "./api";

import "./App.css";

import Dashboard from "./Dashboard";
import Evidence from "./Evidence";
import UploadEvidence from "./UploadEvidence";
import Verification from "./Verification";
import ChainOfCustody from "./ChainOfCustody";
import AuditLogs from "./AuditLogs";
import Settings from "./Settings";
import InvestigatorDashboard from "./InvestigatorDashboard";
import ForensicOfficerDashboard from "./ForensicOfficerDashboard";
import ViewerDashboard from "./ViewerDashboard";
import GenerateReport from "./GenerateReport";

/* =========================================
   ROLE
   ========================================= */

type Role =
  | "Admin"
  | "Investigator"
  | "Legal Officer"
  | "Viewer";

/* =========================================
   PAGE
   ========================================= */

type Page =
  | "dashboard"
  | "evidence"
  | "upload-evidence"
  | "verification"
  | "chain-of-custody"
  | "audit-logs"
  | "settings"
  | "reports";

/* =========================================
   APP
   ========================================= */

function App() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  /* =========================================
     LOGIN STATE
     ========================================= */

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  /* =========================================
     PAGE STATE
     ========================================= */

  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash;

    switch (hash) {
      case "#evidence":
        return "evidence";

      case "#upload-evidence":
        return "upload-evidence";

      case "#verification":
        return "verification";

      case "#chain-of-custody":
        return "chain-of-custody";

      case "#audit-logs":
        return "audit-logs";

      case "#settings":
        return "settings";

      case "#reports":
        return "reports";

      default:
        return "dashboard";
    }
  });

  /* =========================================
     LOGIN FORM
     ========================================= */

  const [username, setUsername] = useState(
    () => localStorage.getItem("username") || ""
  );

  const [password, setPassword] = useState("");

  /*
   * IMPORTANT:
   * Read previously logged-in role from localStorage.
   * This makes Investigator Dashboard remain after refresh.
   */
  const [role, setRole] = useState<Role>(() => {
    const savedRole = localStorage.getItem("role");

    if (
      savedRole === "Admin" ||
      savedRole === "Investigator" ||
      savedRole === "Legal Officer" ||
      savedRole === "Viewer"
    ) {
      return savedRole;
    }

    return "Investigator";
  });

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [loginSuccess, setLoginSuccess] = useState(false);

  /* =========================================
     HASH ROUTING
     ========================================= */

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      switch (hash) {
        case "#evidence":
          setPage("evidence");
          break;

        case "#upload-evidence":
          setPage("upload-evidence");
          break;

        case "#verification":
          setPage("verification");
          break;

        case "#chain-of-custody":
          setPage("chain-of-custody");
          break;

        case "#audit-logs":
          setPage("audit-logs");
          break;

        case "#settings":
          setPage("settings");
          break;

        case "#reports":
          setPage("reports");
          break;

        default:
          setPage("dashboard");
          break;
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    handleHashChange();

    return () => {
      window.removeEventListener(
        "hashchange",
        handleHashChange
      );
    };
  }, []);

  /* =========================================
     NAVIGATION
     ========================================= */

  const openDashboard = () => {
    window.location.hash = "#dashboard";
    setPage("dashboard");
  };

  const openEvidence = () => {
    window.location.hash = "#evidence";
    setPage("evidence");
  };

  const openUploadEvidence = () => {
    window.location.hash = "#upload-evidence";
    setPage("upload-evidence");
  };

  const openVerification = () => {
    window.location.hash = "#verification";
    setPage("verification");
  };

  const openChainOfCustody = () => {
    window.location.hash = "#chain-of-custody";
    setPage("chain-of-custody");
  };

  const openAuditLogs = () => {
    window.location.hash = "#audit-logs";
    setPage("audit-logs");
  };

  const openSettings = () => {
    window.location.hash = "#settings";
    setPage("settings");
  };

  /* =========================================
     LOGOUT
     ========================================= */

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("rememberMe");

    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    setRole("Investigator");
    setPage("dashboard");

    window.location.hash = "";
  };

  /* =========================================
     LOGIN
     ========================================= */
const handleForgotPassword = async () => {
  if (!username.trim() || !password) {
    setMessage("Enter username and new password.");
    return;
  }

  try {
    const formData = new URLSearchParams();

    formData.append("username", username.trim());
    formData.append("role", role);
    formData.append("new_password", password);

    const response = await fetch(
      `${API_BASE_URL}/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
      }
    );

    const data = await response.json();

    if (response.ok) {
      setMessage("Password reset successfully.");
      setShowForgotPassword(false);
      setPassword("");
    } else {
      setMessage(
        typeof data.detail === "string"
          ? data.detail
          : "Password reset failed."
      );
    }
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    setMessage(
      "Cannot connect to the backend."
    );
  }
};
  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setLoginSuccess(false);

      setMessage(
        "Please enter username and password."
      );

      return;
    }

    setIsLoading(true);
    setMessage("");
    setLoginSuccess(false);

    try {
      const formData = new URLSearchParams();

      formData.append(
        "username",
        username.trim()
      );

      formData.append(
        "password",
        password
      );

      formData.append(
        "role",
        role
      );

      const response = await fetch(
        `${API_BASE_URL}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",

            Accept: "application/json",
          },

          body: formData.toString(),
          signal: AbortSignal.timeout(10000),
        }
      );

      const data = await response.json();

      console.log(
        "LOGIN STATUS:",
        response.status
      );

      console.log(
        "LOGIN RESPONSE:",
        data
      );

      /* =====================================
         LOGIN SUCCESS
         ===================================== */

      if (response.ok) {
        const loggedUsername =
          data.username ||
          username.trim();

        const loggedRole =
          data.role ||
          role;

        /* Save login information */

        localStorage.setItem(
          "username",
          loggedUsername
        );

        localStorage.setItem(
          "role",
          loggedRole
        );

        localStorage.setItem(
          "isLoggedIn",
          "true"
        );

        if (rememberMe) {
          localStorage.setItem(
            "rememberMe",
            "true"
          );
        } else {
          localStorage.removeItem(
            "rememberMe"
          );
        }

        setUsername(loggedUsername);
        setRole(loggedRole as Role);

        setLoginSuccess(true);

        setMessage(
          `Login successful! Welcome, ${loggedUsername}.`
        );

        setIsLoggedIn(true);

        window.location.hash = "#dashboard";

        setPage("dashboard");

        return;
      }

      /* =====================================
         LOGIN FAILED
         ===================================== */

      setLoginSuccess(false);

      if (
        typeof data.detail === "string"
      ) {
        setMessage(data.detail);
      } else {
        setMessage(
          "Invalid username, password, or role."
        );
      }
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setLoginSuccess(false);

      setMessage(
        error instanceof Error &&
          error.name === "TimeoutError"
          ? "Sign in timed out. Check that the API and PostgreSQL database are running, then try again."
          : "Cannot connect to the backend. Please make sure FastAPI is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================
     LOGGED-IN PAGES
     ========================================= */

  if (isLoggedIn) {

    /* =====================================
       FORENSIC OFFICER DASHBOARD
       ===================================== */

    if (role === "Legal Officer") {
      return (
        <ForensicOfficerDashboard
          onLogout={handleLogout}
        />
      );
    }

    /* =====================================
       VIEWER DASHBOARD / READ-ONLY PAGES
       ===================================== */

    if (role === "Viewer") {
      if (page === "reports") {
        return (
          <GenerateReport
            onBack={openDashboard}
          />
        );
      }

      if (page === "evidence") {
        return (
          <Evidence
            onBack={openDashboard}
            onUpload={() => undefined}
            readOnly
          />
        );
      }

      if (page === "chain-of-custody") {
        return (
          <ChainOfCustody
            onBack={openDashboard}
          />
        );
      }

      return (
        <ViewerDashboard
          onLogout={handleLogout}
        />
      );
    }

    /* =====================================
       GENERATE REPORT
       ===================================== */

    if (page === "reports") {
      return (
        <GenerateReport
          onBack={openDashboard}
        />
      );
    }

    /* =====================================
       INVESTIGATOR DASHBOARD
       ===================================== */

    if (
      role === "Investigator" &&
      page === "dashboard"
    ) {
      return (
        <InvestigatorDashboard
          onLogout={handleLogout}
          onSettings={openSettings}
        />
      );
    }

    /* =====================================
       SETTINGS
       ===================================== */

    if (page === "settings") {
      return (
        <Settings
          onBack={openDashboard}
        />
      );
    }

    /* =====================================
       AUDIT LOGS
       ===================================== */

    if (page === "audit-logs") {
      return (
        <AuditLogs
          onBack={openDashboard}
        />
      );
    }

    /* =====================================
       CHAIN OF CUSTODY
       ===================================== */

    if (page === "chain-of-custody") {
      return (
        <ChainOfCustody
          onBack={openDashboard}
        />
      );
    }

    /* =====================================
       VERIFICATION
       ===================================== */

    if (page === "verification") {
      return (
        <Verification
          onBack={openDashboard}
        />
      );
    }

    /* =====================================
       UPLOAD EVIDENCE
       ===================================== */

    if (page === "upload-evidence") {
      return (
        <UploadEvidence
          onBack={openEvidence}
        />
      );
    }

    /* =====================================
       EVIDENCE
       ===================================== */

    if (page === "evidence") {
      return (
        <Evidence
          onBack={openDashboard}
          onUpload={openUploadEvidence}
        />
      );
    }

    /* =====================================
       ADMIN DASHBOARD
       ===================================== */

    return (
      <Dashboard
        onNavigate={openEvidence}
        onAuditLogs={openAuditLogs}
        onVerification={openVerification}
        onChainOfCustody={openChainOfCustody}
        onSettings={openSettings}
      />
    );
  }

  /* =========================================
     LOGIN PAGE
     ========================================= */

  return (
    <main className="login-page">
      

      <div className="purple-glow glow-one" />

      <div className="purple-glow glow-two" />

      <div className="login-container">

        {/* ===================================
            LEFT SIDE
            =================================== */}

        <section className="left-section">

          <div className="brand">

            <div className="brand-icon">
              <ShieldCheck
                size={30}
                strokeWidth={1.8}
              />
            </div>

            <div>
  <h1>
    ECDAT
  </h1>

  <p>
    Enterprise Cryptographic Discovery & Analysis Tool
  </p>

  <div className="brand-line">
                AUTHENTIC
                <b>•</b>
                SECURE
                <b>•</b>
                TRUSTED
              </div>
            </div>

          </div>

          <div className="hero-content">

            <h2>
              Preserve the Truth,
              <br />
              Secure the{" "}
              <span>Evidence.</span>
            </h2>

            <p>
              A comprehensive platform to manage,
              protect and
              <br />
              verify digital evidence with advanced
              encryption,
              <br />
              blockchain integrity and complete
              audit trails.
            </p>

          </div>

          <div className="features">

            <Feature
              icon={
                <ShieldCheck
                  size={21}
                  strokeWidth={1.8}
                />
              }
              text="End-to-End Encryption"
            />

            <Feature
              icon={
                <Fingerprint
                  size={21}
                  strokeWidth={1.8}
                />
              }
              text="SHA-256 Integrity Check"
            />

            <Feature
              icon={
                <Link2
                  size={21}
                  strokeWidth={1.8}
                />
              }
              text="Blockchain Verification"
            />

            <Feature
              icon={
                <UsersRound
                  size={21}
                  strokeWidth={1.8}
                />
              }
              text="Role-Based Access Control"
            />

            <Feature
              icon={
                <FileText
                  size={21}
                  strokeWidth={1.8}
                />
              }
              text="Chain of Custody Tracking"
            />

            <Feature
              icon={
                <ClipboardCheck
                  size={21}
                  strokeWidth={1.8}
                />
              }
              text="Audit Logs & Reports"
            />

          </div>

          <div className="quote">
            <span>“</span>
            DIGITAL EVIDENCE.
            REAL JUSTICE.
            <span>”</span>
          </div>

        </section>

        {/* ===================================
            RIGHT SIDE
            =================================== */}

        <section className="right-section">

          <div className="login-card">

            <div className="login-logo">
              <Fingerprint
                size={32}
                strokeWidth={1.7}
              />
            </div>

            <h2>
              Welcome Back
            </h2>

            <p className="login-subtitle">
              Sign in to your secure account
            </p>

            <form
              onSubmit={handleLogin}
            >

              {/* USERNAME */}

              <div className="input-wrapper">

                <span className="input-icon">
                  <User
                    size={19}
                    strokeWidth={1.8}
                  />
                </span>

                <input
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  placeholder="Username / Email ID"
                  autoComplete="username"
                />

              </div>

              {/* PASSWORD */}

              <div className="input-wrapper">

                <span className="input-icon">
                  <LockKeyhole
                    size={19}
                    strokeWidth={1.8}
                  />
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>
{showForgotPassword && (
  <div className="forgot-password-box">
    <h3>Reset Password</h3>

    <input
      type="password"
      placeholder="Enter new password"
      onChange={(event) =>
        setPassword(event.target.value)
      }
    />

    <button
      type="button"
      onClick={() => {
        setMessage(
          "Password reset form opened."
        );
      }}
    >
      Reset Password
    </button>
  </div>
)}
              {/* OPTIONS */}

              <div className="options-row">

                <button
                  type="button"
                  className="remember-option"
                  onClick={() =>
                    setRememberMe(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  <span
                    className={`checkbox ${
                      rememberMe
                        ? "checked"
                        : ""
                    }`}
                  >
                    {rememberMe
                      ? "✓"
                      : ""}
                  </span>

                  <span>
                    Remember me
                  </span>

                </button>

             <button
  type="button"
  onClick={handleForgotPassword}
>
  Reset Password
</button>

              </div>

              {/* LOGIN */}

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >

                <LogIn
                  size={19}
                  strokeWidth={2}
                />

                <span>
                  {isLoading
                    ? "Signing in..."
                    : "Login"}
                </span>

                {!isLoading && (
                  <ArrowRight
                    size={19}
                    strokeWidth={2}
                  />
                )}

              </button>

            </form>

            <div className="or-divider">
              <span />
              <p>OR</p>
              <span />
            </div>

            <div className="role-title">
              Login as
            </div>

            <div className="roles">

              {/* ADMIN */}

              <RoleButton
                icon={
                  <ShieldCheck
                    size={25}
                    strokeWidth={1.7}
                  />
                }
                label="Admin"
                selected={
                  role === "Admin"
                }
                onClick={() =>
                  setRole("Admin")
                }
              />

              {/* INVESTIGATOR */}

              <RoleButton
                icon={
                  <UserSearch
                    size={25}
                    strokeWidth={1.7}
                  />
                }
                label="Investigator"
                selected={
                  role === "Investigator"
                }
                onClick={() =>
                  setRole("Investigator")
                }
              />

              {/* FORENSIC / LEGAL OFFICER */}

              <RoleButton
                icon={
                  <Scale
                    size={25}
                    strokeWidth={1.7}
                  />
                }
                label={
                  <>
                    Forensic
                    <br />
                    Officer
                  </>
                }
                selected={
                  role === "Legal Officer"
                }
                onClick={() =>
                  setRole(
                    "Legal Officer"
                  )
                }
              />

              {/* VIEWER */}

              <RoleButton
                icon={
                  <Eye
                    size={25}
                    strokeWidth={1.7}
                  />
                }
                label="Viewer"
                selected={
                  role === "Viewer"
                }
                onClick={() =>
                  setRole("Viewer")
                }
              />

            </div>

            {message && (
              <div
                className={`login-message ${
                  loginSuccess
                    ? "success"
                    : "error"
                }`}
              >
                {message}
              </div>
            )}

            <div className="security-note">

              <ShieldCheck
                size={15}
                strokeWidth={1.8}
              />

              <p>
                Your data is protected with
                advanced security protocols.
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =========================================
   FEATURE
   ========================================= */

function Feature({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="feature">

      <div className="feature-icon">
        {icon}
      </div>

      <p>
        {text}
      </p>

    </div>
  );
}

/* =========================================
   ROLE BUTTON
   ========================================= */

function RoleButton({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: ReactNode;
  label: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`role-button ${
        selected
          ? "selected"
          : ""
      }`}
      onClick={onClick}
    >

      <div className="role-icon">
        {icon}
      </div>

      <div className="role-label">
        {label}
      </div>

    </button>
  );
}

export default App;