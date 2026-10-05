import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  FolderOpen,
  CloudUpload,
  ShieldCheck,
  Link2,
  ClipboardList,
  Settings,
  LogOut,
  Bell,
  UserCircle,
  FileCheck2,
  TriangleAlert,
  Clock3,
  ArrowRight,
  ChevronDown,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
} from "lucide-react";

import UploadEvidence from "./UploadEvidence";
import "./Dashboard.css";

interface DashboardProps {
  onNavigate: () => void;
  onAuditLogs?: () => void;
  onVerification?: () => void;
  onChainOfCustody?: () => void;
  onSettings?: () => void;
}

type Page = "dashboard" | "upload";

interface EvidenceRecord {
  id: number;
  evidence_id: string;
  file_name: string;
  title: string;
  file_path: string;
  sha256_hash: string;
  hmac_hash: string;
  uploaded_by: number;
  status: string;
}

function EvidenceFileIcon({
  fileName,
}: {
  fileName: string;
}) {
  const extension =
    fileName.split(".").pop()?.toLowerCase() || "";

  if (extension === "pdf") {
    return (
      <FileText
        size={21}
        strokeWidth={2}
        style={{ color: "#ef4444" }}
      />
    );
  }

  if (
    extension === "doc" ||
    extension === "docx" ||
    extension === "txt" ||
    extension === "rtf"
  ) {
    return (
      <FileText
        size={21}
        strokeWidth={2}
        style={{ color: "#3b82f6" }}
      />
    );
  }

  if (
    extension === "ppt" ||
    extension === "pptx"
  ) {
    return (
      <FileText
        size={21}
        strokeWidth={2}
        style={{ color: "#f97316" }}
      />
    );
  }

  if (
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "png" ||
    extension === "gif" ||
    extension === "webp" ||
    extension === "bmp" ||
    extension === "svg"
  ) {
    return (
      <FileImage
        size={21}
        strokeWidth={2}
        style={{ color: "#38bdf8" }}
      />
    );
  }

  if (
    extension === "mp4" ||
    extension === "mkv" ||
    extension === "avi" ||
    extension === "mov" ||
    extension === "webm"
  ) {
    return (
      <FileVideo
        size={21}
        strokeWidth={2}
        style={{ color: "#f97316" }}
      />
    );
  }

  if (
    extension === "mp3" ||
    extension === "wav" ||
    extension === "ogg" ||
    extension === "m4a" ||
    extension === "aac"
  ) {
    return (
      <FileAudio
        size={21}
        strokeWidth={2}
        style={{ color: "#a855f7" }}
      />
    );
  }

  if (
    extension === "zip" ||
    extension === "rar" ||
    extension === "7z" ||
    extension === "tar" ||
    extension === "gz"
  ) {
    return (
      <FileArchive
        size={21}
        strokeWidth={2}
        style={{ color: "#eab308" }}
      />
    );
  }

  return (
    <FileText
      size={21}
      strokeWidth={2}
      style={{ color: "#8b5cf6" }}
    />
  );
}

export default function Dashboard({
  onNavigate,
  onAuditLogs,
  onVerification,
  onChainOfCustody,
  onSettings,
}: DashboardProps) {
  const [currentPage, setCurrentPage] =
    useState<Page>("dashboard");

  const [evidence, setEvidence] =
    useState<EvidenceRecord[]>([]);

  const [loadingEvidence, setLoadingEvidence] =
    useState(true);

  const username =
    localStorage.getItem("username") || "admin";

  const role =
    localStorage.getItem("role") || "Admin";

  useEffect(() => {
    if (currentPage !== "dashboard") {
      return;
    }

    let active = true;

    const loadEvidence = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/evidence"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch evidence");
        }

        const data = await response.json();

        if (active) {
          setEvidence(
            Array.isArray(data?.evidence)
              ? data.evidence
              : []
          );
        }
      } catch (error) {
        console.error(
          "Dashboard evidence fetch error:",
          error
        );

        if (active) {
          setEvidence([]);
        }
      } finally {
        if (active) {
          setLoadingEvidence(false);
        }
      }
    };

    void loadEvidence();

    return () => {
      active = false;
    };
  }, [currentPage]);

  const totalEvidence = evidence.length;

  const verifiedEvidence = evidence.filter(
    (item) =>
      item.status?.trim().toLowerCase() ===
      "verified"
  ).length;

  const tamperedEvidence = evidence.filter(
    (item) =>
      item.status?.trim().toLowerCase() ===
      "tampered"
  ).length;

  const recentActivity = evidence.length;

  const handleLogout = async () => {
    try {
      await fetch(
        "http://127.0.0.1:8000/logout",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );
    } catch (error) {
      console.error(
        "Logout audit error:",
        error
      );
    }

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("rememberMe");

    window.location.hash = "";
    window.location.reload();
  };

  const openDashboard = () => {
    setCurrentPage("dashboard");
    window.location.hash = "#dashboard";
  };

  const openEvidence = () => {
    onNavigate();
  };

  const openUpload = () => {
    setCurrentPage("upload");
    window.location.hash = "#upload-evidence";
  };

  const openVerificationPage = () => {
    if (onVerification) {
      onVerification();
      return;
    }

    window.location.hash = "#verification";
  };

  const openChainOfCustodyPage = () => {
    if (onChainOfCustody) {
      onChainOfCustody();
      return;
    }

    window.location.hash = "#chain-of-custody";
  };

  const openAuditLogsPage = () => {
    if (onAuditLogs) {
      onAuditLogs();
      return;
    }

    window.location.hash = "#audit-logs";
  };

  const openSettingsPage = () => {
    if (onSettings) {
      onSettings();
      return;
    }

    window.location.hash = "#settings";
  };

  if (currentPage === "upload") {
    return (
      <UploadEvidence
        onBack={openDashboard}
      />
    );
  }

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}

      <aside className="dashboard-sidebar">

        {/* BRAND */}

        <div className="sidebar-brand">

          <div className="brand-icon">
            <ShieldCheck
              size={31}
              strokeWidth={2.2}
            />
          </div>

          <div className="brand-text">
            <h2>
              Secure
              <br />
              Evidence
            </h2>

            <span>
              Digital Evidence System
            </span>
          </div>

        </div>

        {/* MAIN NAVIGATION */}

        <nav className="sidebar-nav">

          <button
            type="button"
            className="sidebar-link sidebar-button active"
            onClick={openDashboard}
          >
            <LayoutDashboard
              className="nav-icon dashboard-icon"
              size={22}
              strokeWidth={2.2}
            />

            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="sidebar-link sidebar-button"
            onClick={openEvidence}
          >
            <FolderOpen
              className="nav-icon evidence-icon"
              size={22}
              strokeWidth={2.2}
            />

            <span>Evidence</span>
          </button>

          <button
            type="button"
            className="sidebar-link sidebar-button"
            onClick={openUpload}
          >
            <CloudUpload
              className="nav-icon upload-icon"
              size={22}
              strokeWidth={2.2}
            />

            <span>Upload Evidence</span>
          </button>

          <button
            type="button"
            className="sidebar-link sidebar-button"
            onClick={openVerificationPage}
          >
            <ShieldCheck
              className="nav-icon verification-icon"
              size={22}
              strokeWidth={2.2}
            />

            <span>Verification</span>
          </button>

          <button
            type="button"
            className="sidebar-link sidebar-button"
            onClick={openChainOfCustodyPage}
          >
            <Link2
              className="nav-icon custody-icon"
              size={22}
              strokeWidth={2.2}
            />

            <span>Chain of Custody</span>
          </button>

          <button
            type="button"
            className="sidebar-link sidebar-button"
            onClick={openAuditLogsPage}
          >
            <ClipboardList
              className="nav-icon audit-icon"
              size={22}
              strokeWidth={2.2}
            />

            <span>Audit Logs</span>
          </button>

        </nav>

        {/* BOTTOM NAVIGATION */}

        <div className="sidebar-bottom">

          <button
            type="button"
            className="sidebar-link sidebar-button"
            onClick={openSettingsPage}
          >
            <Settings
              className="nav-icon settings-icon"
              size={22}
              strokeWidth={2.2}
            />

            <span>Settings</span>
          </button>

          <button
            type="button"
            className="sidebar-link sidebar-button"
            onClick={handleLogout}
          >
            <LogOut
              className="nav-icon logout-icon"
              size={22}
              strokeWidth={2.2}
            />

            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div className="header-title">
            <h1>
              Secure Digital Evidence Dashboard
            </h1>

            <p>
              Manage, verify and monitor
              digital evidence securely.
            </p>
          </div>

          <div className="header-right">

            <button
              type="button"
              className="header-icon-button"
              title="Notifications"
            >
              <Bell
                size={23}
                strokeWidth={2}
              />

              <span className="notification-dot" />
            </button>

            <div className="header-user">

              <UserCircle
                size={44}
                strokeWidth={1.8}
              />

              <div>
                <strong>{username}</strong>
                <span>{role}</span>
              </div>

              <ChevronDown
                size={17}
                strokeWidth={2}
              />

            </div>

          </div>

        </header>

        {/* WELCOME */}

        <section className="welcome-section">

          <div className="welcome-copy">

            <div className="secure-session">

              <ShieldCheck
                size={16}
                strokeWidth={2.2}
              />

              <span>
                SECURE SESSION
              </span>

            </div>

            <h2>
              Welcome back,{" "}
              <span className="username-highlight">
                {username}
              </span>
            </h2>

            <p>
              Your secure evidence management
              workspace is ready.
            </p>

          </div>

          <div
            className="welcome-visual"
            aria-hidden="true"
          >
            <div className="welcome-orbit orbit-one" />
            <div className="welcome-orbit orbit-two" />

            <div className="welcome-shield">
              <ShieldCheck
                size={74}
                strokeWidth={1.7}
              />
            </div>

            <div className="welcome-lock" />
          </div>

          <div className="welcome-quote">
            <span />

            <em>
              “Digital Evidence.
              <br />
              Real Justice.”
            </em>
          </div>

        </section>

        {/* STATISTICS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon total-icon">
              <FolderOpen
                size={27}
                strokeWidth={2}
              />
            </div>

            <div className="stat-info">

              <strong>
                {loadingEvidence
                  ? "..."
                  : totalEvidence}
              </strong>

              <span>Total Evidence</span>

              <small>
                Evidence records
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon verified-icon">
              <FileCheck2
                size={27}
                strokeWidth={2}
              />
            </div>

            <div className="stat-info">

              <strong>
                {loadingEvidence
                  ? "..."
                  : verifiedEvidence}
              </strong>

              <span>Verified Evidence</span>

              <small>
                Integrity verified
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon tampered-icon">
              <TriangleAlert
                size={27}
                strokeWidth={2}
              />
            </div>

            <div className="stat-info">

              <strong>
                {loadingEvidence
                  ? "..."
                  : tamperedEvidence}
              </strong>

              <span>Tampered Evidence</span>

              <small>
                {tamperedEvidence > 0
                  ? "Integrity failed"
                  : "No tampered records"}
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon activity-icon">
              <Clock3
                size={27}
                strokeWidth={2}
              />
            </div>

            <div className="stat-info">

              <strong>
                {loadingEvidence
                  ? "..."
                  : recentActivity}
              </strong>

              <span>Recent Activity</span>

              <small>
                Activity records
              </small>

            </div>

          </div>

        </section>

        {/* LOWER CONTENT */}

        <section className="dashboard-grid">

          {/* RECENT EVIDENCE */}

          <div className="recent-evidence-card">

            <div className="panel-header">

              <div>
                <h3>Recent Evidence</h3>

                <p>
                  Latest evidence records
                </p>
              </div>

              <button
                type="button"
                className="view-all-button"
                onClick={openEvidence}
              >
                View all

                <ArrowRight
                  size={16}
                  strokeWidth={2}
                />
              </button>

            </div>

            {loadingEvidence ? (

              <div className="empty-evidence">

                <div className="empty-icon">
                  <Clock3
                    size={34}
                    strokeWidth={1.8}
                  />
                </div>

                <h4>
                  Loading Evidence
                </h4>

                <p>
                  Loading latest evidence
                  records.
                </p>

              </div>

            ) : evidence.length === 0 ? (

              <div className="empty-evidence">

                <div className="empty-icon">
                  <FolderOpen
                    size={34}
                    strokeWidth={1.8}
                  />
                </div>

                <h4>
                  No Evidence Records
                </h4>

                <p>
                  Uploaded evidence will
                  appear here.
                </p>

                <button
                  type="button"
                  className="upload-empty-button"
                  onClick={openUpload}
                >
                  <CloudUpload
                    size={18}
                    strokeWidth={2.2}
                  />

                  <span>
                    Upload Evidence
                  </span>

                </button>

              </div>

            ) : (

              <div className="recent-evidence-list">

                {evidence
                  .slice(-5)
                  .reverse()
                  .map((item) => {

                    const status =
                      item.status
                        ?.trim()
                        .toLowerCase();

                    return (
                      <div
                        className="recent-evidence-item"
                        key={item.id}
                      >

                        <div className="recent-evidence-icon">
                          <EvidenceFileIcon
                            fileName={
                              item.file_name ||
                              "Evidence File"
                            }
                          />
                        </div>

                        <div className="recent-evidence-info">

                          <strong>
                            {item.file_name ||
                              "Evidence File"}
                          </strong>

                          <span>
                            {item.title ||
                              item.evidence_id}
                          </span>

                        </div>

                        <span
                          className={`recent-evidence-status ${
                            status === "verified"
                              ? "verified"
                              : status === "tampered"
                              ? "tampered"
                              : "encrypted"
                          }`}
                        >
                          {item.status ||
                            "Encrypted"}
                        </span>

                      </div>
                    );
                  })}

              </div>

            )}

          </div>

          {/* QUICK ACTIONS */}

          <div className="quick-actions-card">

            <div className="panel-header">

              <div>
                <h3>Quick Actions</h3>

                <p>
                  Common evidence management
                  operations
                </p>
              </div>

            </div>

            <div className="quick-actions-list">

              <button
                type="button"
                className="quick-action"
                onClick={openUpload}
              >

                <div className="quick-action-icon upload-action-icon">
                  <CloudUpload
                    size={22}
                    strokeWidth={2}
                  />
                </div>

                <div className="quick-action-text">

                  <strong>
                    Upload Evidence
                  </strong>

                  <span>
                    Add new digital evidence
                  </span>

                </div>

                <ArrowRight
                  size={19}
                  strokeWidth={2}
                />

              </button>

              <button
                type="button"
                className="quick-action"
                onClick={openVerificationPage}
              >

                <div className="quick-action-icon verify-action-icon">
                  <ShieldCheck
                    size={22}
                    strokeWidth={2}
                  />
                </div>

                <div className="quick-action-text">

                  <strong>
                    Verify Evidence
                  </strong>

                  <span>
                    Check evidence integrity
                  </span>

                </div>

                <ArrowRight
                  size={19}
                  strokeWidth={2}
                />

              </button>

              <button
                type="button"
                className="quick-action"
                onClick={openChainOfCustodyPage}
              >

                <div className="quick-action-icon custody-action-icon">
                  <Link2
                    size={22}
                    strokeWidth={2}
                  />
                </div>

                <div className="quick-action-text">

                  <strong>
                    Chain of Custody
                  </strong>

                  <span>
                    Track evidence movement
                  </span>

                </div>

                <ArrowRight
                  size={19}
                  strokeWidth={2}
                />

              </button>

              <button
                type="button"
                className="quick-action"
                onClick={openAuditLogsPage}
              >

                <div className="quick-action-icon audit-action-icon">
                  <ClipboardList
                    size={22}
                    strokeWidth={2}
                  />
                </div>

                <div className="quick-action-text">

                  <strong>
                    Audit Logs
                  </strong>

                  <span>
                    Review system activity
                  </span>

                </div>

                <ArrowRight
                  size={19}
                  strokeWidth={2}
                />

              </button>

            </div>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="dashboard-footer">
          <div className="footer-content">

            <div className="footer-logo">
              <ShieldCheck


                size={15}
                strokeWidth={2}
              />
            </div>

            <span className="footer-text">
              © 2026 Secure Digital Evidence Management System
              &nbsp;|&nbsp;
              Developed by{" "}
              <strong>Team Cyphora</strong>
            </span>

          </div>
        </footer>

      </main>

    </div>
  );
}