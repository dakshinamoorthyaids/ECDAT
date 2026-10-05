import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  ShieldCheck,
  Link2,
  FileText,
  LogOut,
  Bell,
  UserCircle,
  CheckCircle2,
  Clock3,
  TriangleAlert,
  ArrowRight,
  Search,
  FileCheck2,
  ChevronDown,
} from "lucide-react";

import "./ForensicOfficerDashboard.css";

import Evidence from "./Evidence";
import Verification from "./Verification";
import ChainOfCustody from "./ChainOfCustody";
import GenerateReport from "./GenerateReport";

const API_BASE_URL = "http://127.0.0.1:8000";

type ActivePage =
  | "dashboard"
  | "evidence"
  | "verification"
  | "custody"
  | "reports";

interface EvidenceItem {
  id?: number;
  evidence_id: string;
  status?: string | null;
  case_id?: string | null;
  file_name?: string;
  title?: string;
}

interface ForensicOfficerDashboardProps {
  onLogout?: () => void;
}

const ForensicOfficerDashboard: React.FC<
  ForensicOfficerDashboardProps
> = ({ onLogout }) => {
  const [activePage, setActivePage] =
    useState<ActivePage>("dashboard");

  const [evidence, setEvidence] =
    useState<EvidenceItem[]>([]);

  const [loading, setLoading] = useState(true);

  const username =
    localStorage.getItem("username") ||
    "Forensic Officer";

  useEffect(() => {
    let active = true;

    const loadEvidenceSummary = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/evidence`,
        );

        if (!response.ok) {
          throw new Error(
            `Evidence request failed (${response.status})`,
          );
        }

        const data = await response.json();

        const records: EvidenceItem[] =
          Array.isArray(data?.evidence)
            ? data.evidence
            : Array.isArray(data)
              ? data
              : [];

        if (active) {
          setEvidence(records);
        }
      } catch (error) {
        console.error(
          "Forensic Officer evidence fetch error:",
          error,
        );

        if (active) {
          setEvidence([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadEvidenceSummary();

    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const verified = evidence.filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "verified",
    ).length;

    const tampered = evidence.filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "tampered",
    ).length;

    const pending = evidence.filter((item) => {
      const status = String(
        item.status || "",
      ).toLowerCase();

      return (
        status !== "verified" &&
        status !== "tampered"
      );
    }).length;

    return {
      total: evidence.length,
      verified,
      tampered,
      pending,
    };
  }, [evidence]);

  const recentEvidence = evidence.slice(0, 3);

  const navigate = (page: ActivePage) => {
    setActivePage(page);

    const hashes: Record<
      ActivePage,
      string
    > = {
      dashboard: "#dashboard",
      evidence: "#evidence",
      verification: "#verification",
      custody: "#chain-of-custody",
      reports: "#reports",
    };

    window.location.hash = hashes[page];
  };

  const statusClass = (
    status?: string | null,
  ) => {
    const normalized = String(
      status || "pending",
    ).toLowerCase();

    if (normalized === "verified")
      return "verified";

    if (normalized === "tampered")
      return "tampered";

    return "pending";
  };

  const renderSidebar = () => (
    <aside className="forensic-sidebar">
      <div className="forensic-brand">
        <div className="forensic-brand-icon">
          <ShieldCheck size={27} />
        </div>

        <div className="forensic-brand-text">
          <h2>Secure</h2>
          <h2>Evidence</h2>
          <span>
            Digital Evidence System
          </span>
        </div>
      </div>

      <nav className="forensic-nav">
        <button
          type="button"
          className={`forensic-nav-item ${
            activePage === "dashboard"
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("dashboard")
          }
        >
          <LayoutDashboard size={21} />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={`forensic-nav-item ${
            activePage === "evidence"
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("evidence")
          }
        >
          <FolderOpen size={21} />
          <span>
            Authorized Evidence
          </span>
        </button>

        <button
          type="button"
          className={`forensic-nav-item ${
            activePage === "verification"
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("verification")
          }
        >
          <ShieldCheck size={21} />
          <span>
            Verify Evidence
          </span>
        </button>

        <button
          type="button"
          className={`forensic-nav-item ${
            activePage === "custody"
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("custody")
          }
        >
          <Link2 size={21} />
          <span>
            Chain of Custody
          </span>
        </button>

        <button
          type="button"
          className={`forensic-nav-item ${
            activePage === "reports"
              ? "active"
              : ""
          }`}
          onClick={() =>
            navigate("reports")
          }
        >
          <FileText size={21} />
          <span>View Reports</span>
        </button>
      </nav>

      <div className="forensic-sidebar-bottom">
        <button
          type="button"
          className="forensic-nav-item logout"
          onClick={() =>
            onLogout?.()
          }
        >
          <LogOut size={21} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );

  const renderHeader = () => (
    <header className="forensic-header">
      <div className="forensic-header-title">
        <p>
          Manage, verify and monitor digital
          evidence securely.
        </p>
      </div>

      <div className="forensic-header-right">
        <button
          type="button"
          className="forensic-header-icon"
          aria-label="Notifications"
        >
          <Bell size={22} />
          <span className="forensic-notification-dot" />
        </button>

        <div className="forensic-header-user">
          <UserCircle size={48} />

          <div>
            <strong>{username}</strong>
            <span>Forensic Officer</span>
          </div>

          <ChevronDown size={18} />
        </div>
      </div>
    </header>
  );

  const renderDashboard = () => (
    <>
      {renderHeader()}

      <main className="forensic-main">
        <section className="forensic-welcome">
          <div className="forensic-welcome-copy">
            <div className="forensic-secure-session">
              <CheckCircle2 size={15} />
              <span>
                SECURE SESSION
              </span>
            </div>

            <h2>
              Welcome back,{" "}
              <span>{username}</span>
            </h2>

            <p>
              Your secure evidence review
              workspace is ready.
            </p>
          </div>

          <div className="forensic-welcome-visual">
            <div className="forensic-visual-card card-one" />
            <div className="forensic-visual-card card-two" />

            <div className="forensic-visual-shield">
              <ShieldCheck size={67} />
            </div>

            <div className="forensic-visual-line" />

            <div className="forensic-visual-quote">
              <em>
                “Digital Evidence.
                <br />
                Real Justice.”
              </em>
            </div>
          </div>
        </section>

        <section className="forensic-stats">
          <div className="forensic-stat-card">
            <div className="forensic-stat-icon total-icon">
              <FolderOpen size={23} />
            </div>

            <div className="forensic-stat-info">
              <strong>
                {loading
                  ? "—"
                  : counts.total}
              </strong>
              <span>
                Authorized Evidence
              </span>
              <small>
                Evidence records
              </small>
            </div>
          </div>

          <div className="forensic-stat-card">
            <div className="forensic-stat-icon verified-icon">
              <FileCheck2 size={23} />
            </div>

            <div className="forensic-stat-info">
              <strong>
                {loading
                  ? "—"
                  : counts.verified}
              </strong>
              <span>
                Verified Evidence
              </span>
              <small>
                Integrity verified
              </small>
            </div>
          </div>

          <div className="forensic-stat-card">
            <div className="forensic-stat-icon tampered-icon">
              <TriangleAlert size={23} />
            </div>

            <div className="forensic-stat-info">
              <strong>
                {loading
                  ? "—"
                  : counts.tampered}
              </strong>
              <span>
                Tampered Evidence
              </span>
              <small>
                Integrity failed
              </small>
            </div>
          </div>

          <div className="forensic-stat-card">
            <div className="forensic-stat-icon pending-icon">
              <Clock3 size={23} />
            </div>

            <div className="forensic-stat-info">
              <strong>
                {loading
                  ? "—"
                  : counts.pending}
              </strong>
              <span>
                Pending Evidence
              </span>
              <small>
                Awaiting verification
              </small>
            </div>
          </div>
        </section>

        <section className="forensic-dashboard-grid">
          <div className="forensic-panel forensic-recent-panel">
            <div className="forensic-panel-header">
              <div>
                <h3>
                  Recent Evidence
                </h3>
                <p>
                  Latest authorized evidence
                  records
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("evidence")
                }
                className="forensic-view-all"
              >
                View all
                <ArrowRight size={15} />
              </button>
            </div>

            <div className="forensic-recent-list">
              {recentEvidence.length ===
              0 ? (
                <div className="forensic-empty">
                  <Search size={27} />
                  <strong>
                    No evidence records
                    available
                  </strong>
                  <span>
                    Authorized evidence will
                    appear here.
                  </span>
                </div>
              ) : (
                recentEvidence.map(
                  (item) => (
                    <button
                      type="button"
                      className="forensic-recent-item"
                      key={
                        item.evidence_id ||
                        item.id
                      }
                      onClick={() =>
                        navigate("evidence")
                      }
                    >
                      <div className="forensic-recent-icon">
                        <FileText size={21} />
                      </div>

                      <div className="forensic-recent-info">
                        <strong>
                          {item.file_name ||
                            item.evidence_id}
                        </strong>

                        <span>
                          {item.title ||
                            "Digital Evidence"}
                        </span>
                      </div>

                      <span
                        className={`forensic-status ${statusClass(
                          item.status,
                        )}`}
                      >
                        {item.status ||
                          "Pending"}
                      </span>
                    </button>
                  ),
                )
              )}
            </div>
          </div>

          <div className="forensic-panel forensic-actions-panel">
            <div className="forensic-panel-header">
              <div>
                <h3>
                  Quick Actions
                </h3>
                <p>
                  Authorized forensic operations
                </p>
              </div>
            </div>

            <div className="forensic-quick-actions">
              <button
                type="button"
                className="forensic-quick-action"
                onClick={() =>
                  navigate("evidence")
                }
              >
                <div className="forensic-quick-icon evidence-action-icon">
                  <Search size={21} />
                </div>

                <div>
                  <strong>
                    View Authorized Evidence
                  </strong>
                  <span>
                    Search and inspect evidence
                  </span>
                </div>

                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="forensic-quick-action"
                onClick={() =>
                  navigate("verification")
                }
              >
                <div className="forensic-quick-icon verify-action-icon">
                  <ShieldCheck size={21} />
                </div>

                <div>
                  <strong>
                    Verify Evidence
                  </strong>
                  <span>
                    Check SHA-256 and HMAC
                  </span>
                </div>

                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="forensic-quick-action"
                onClick={() =>
                  navigate("custody")
                }
              >
                <div className="forensic-quick-icon custody-action-icon">
                  <Link2 size={21} />
                </div>

                <div>
                  <strong>
                    Chain of Custody
                  </strong>
                  <span>
                    View custody history
                  </span>
                </div>

                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="forensic-quick-action"
                onClick={() =>
                  navigate("reports")
                }
              >
                <div className="forensic-quick-icon report-action-icon">
                  <FileText size={21} />
                </div>

                <div>
                  <strong>
                    View Reports
                  </strong>
                  <span>
                    Open investigation reports
                  </span>
                </div>

                <ArrowRight size={18} />
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
              © 2026 Secure Digital Evidence
              Management System
              &nbsp;|&nbsp;
              Developed by{" "}
              <strong>
                Team Cyphora
              </strong>
            </span>
          </div>
        </footer>
      </main>
    </>
  );

  const renderActivePage = () => {
    if (activePage === "evidence") {
      return (
        <Evidence
          onBack={() =>
            navigate("dashboard")
          }
          onUpload={() =>
            undefined
          }
          readOnly
        />
      );
    }

    if (activePage === "verification") {
      return (
        <Verification
          onBack={() =>
            navigate("dashboard")
          }
        />
      );
    }

    if (activePage === "custody") {
      return (
        <ChainOfCustody
          onBack={() =>
            navigate("dashboard")
          }
        />
      );
    }

    if (activePage === "reports") {
      return (
        <GenerateReport
          onBack={() =>
            navigate("dashboard")
          }
        />
      );
    }

    return renderDashboard();
  };

  /*
   * IMPORTANT:
   * Dashboard keeps the existing sidebar.
   *
   * For Evidence / Verification / Custody / Reports,
   * only the selected page is rendered.
   * The Forensic Officer sidebar is not rendered on those pages.
   */

  return activePage === "dashboard" ? (
    <div className="forensic-dashboard">
      {renderSidebar()}

      <div className="forensic-content">
        {renderActivePage()}
      </div>
    </div>
  ) : (
    <div className="forensic-dashboard">
      <div
        className="forensic-content"
        style={{
          width: "100%",
          marginLeft: 0,
        }}
      >
        {renderActivePage()}
      </div>
    </div>
  );
};

export default ForensicOfficerDashboard;