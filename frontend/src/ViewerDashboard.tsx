import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Link2,
  LogOut,
  ShieldCheck,
  TriangleAlert,
  UserCircle,
} from "lucide-react";

import { API_BASE_URL } from "./api";
import "./ViewerDashboard.css";

interface EvidenceItem {
  id?: number;
  evidence_id: string;
  file_name?: string;
  title?: string;
  status?: string | null;
  created_at?: string | null;
}

interface ViewerDashboardProps {
  onLogout?: () => void;
}

const ViewerDashboard: React.FC<ViewerDashboardProps> = ({ onLogout }) => {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const username = localStorage.getItem("username") || "Viewer";
  const role = localStorage.getItem("role") || "Viewer";

  const navigate = (
    page: "dashboard" | "evidence" | "custody" | "reports",
  ) => {
    const hashes = {
      dashboard: "#dashboard",
      evidence: "#evidence",
      custody: "#chain-of-custody",
      reports: "#reports",
    };

    window.location.hash = hashes[page];
  };

  useEffect(() => {
    let active = true;

    const loadEvidence = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/evidence`);

        if (!response.ok) {
          throw new Error(`Evidence request failed (${response.status})`);
        }

        const data = await response.json();
        const records: EvidenceItem[] = Array.isArray(data?.evidence)
          ? data.evidence
          : Array.isArray(data)
            ? data
            : [];

        if (active) {
          setEvidence(records);
          setError("");
        }
      } catch (err) {
        console.error("Viewer evidence fetch error:", err);

        if (active) {
          setError("Cannot connect to backend evidence service.");
          setEvidence([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadEvidence();

    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const verified = evidence.filter(
      (item) => String(item.status || "").toLowerCase() === "verified",
    ).length;

    const tampered = evidence.filter(
      (item) => String(item.status || "").toLowerCase() === "tampered",
    ).length;

    return {
      total: evidence.length,
      verified,
      tampered,
    };
  }, [evidence]);

  const recentEvidence = evidence.slice(0, 4);

  const getStatusClass = (status?: string | null) => {
    const normalized = String(status || "").trim().toLowerCase();

    if (normalized === "verified") return "verified";
    if (normalized === "tampered") return "tampered";
    return "pending";
  };

  return (
    <div className="viewer-dashboard">
      <aside className="viewer-sidebar">
        <div className="viewer-brand">
          <div className="viewer-brand-icon">
            <ShieldCheck size={30} strokeWidth={1.8} />
          </div>

          <div className="viewer-brand-text">
            <h2>Secure Evidence</h2>
            <span>Digital Evidence System</span>
          </div>
        </div>

        <nav className="viewer-nav">
          <button
            type="button"
            className="viewer-nav-item active"
            onClick={() => navigate("dashboard")}
          >
            <LayoutDashboard size={21} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="viewer-nav-item"
            onClick={() => navigate("evidence")}
          >
            <FolderOpen size={21} />
            <span>Authorized Evidence</span>
          </button>

          <button
            type="button"
            className="viewer-nav-item"
            onClick={() => navigate("custody")}
          >
            <Link2 size={21} />
            <span>Chain of Custody</span>
          </button>

          <button
            type="button"
            className="viewer-nav-item"
            onClick={() => navigate("reports")}
          >
            <FileText size={21} />
            <span>View Reports</span>
          </button>
        </nav>

        <div className="viewer-sidebar-bottom">
          <button
            type="button"
            className="viewer-nav-item logout"
            onClick={onLogout}
          >
            <LogOut size={21} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="viewer-content">
        <header className="viewer-header">
          <div className="viewer-header-title">
            <p>Read-only evidence review workspace</p>
          </div>

          <div className="viewer-header-right">
            <button
              type="button"
              className="viewer-header-icon"
              title="Notifications"
            >
              <Bell size={23} strokeWidth={2} />
              <span className="viewer-notification-dot" />
            </button>

            <div className="viewer-header-user">
              <UserCircle size={45} strokeWidth={1.8} />

              <div>
                <strong>{username}</strong>
                <span>{role}</span>
              </div>

              <ChevronDown size={17} />
            </div>
          </div>
        </header>

        <main className="viewer-main">
          <section className="viewer-welcome">
            <div className="viewer-welcome-copy">
              <div className="viewer-secure-session">
                <ShieldCheck size={16} strokeWidth={2.2} />
                <span>SECURE READ-ONLY SESSION</span>
              </div>

              <h1>
                Welcome back, <span>{username}</span>
              </h1>

              <p>
                Review authorized digital evidence, chain-of-custody records and
                reports without modifying evidence.
              </p>
            </div>

            <div className="viewer-welcome-visual">
              <div className="viewer-visual-card viewer-card-one" />
              <div className="viewer-visual-card viewer-card-two" />

              <div className="viewer-visual-shield">
                <Eye size={58} />
              </div>

              <div className="viewer-visual-line" />

              <div className="viewer-visual-quote">
                <em>
                  “Digital Evidence.
                  <br />
                  Real Justice.”
                </em>
              </div>
            </div>
          </section>

          {error && <div className="viewer-error">{error}</div>}

          <section className="viewer-stats">
            <div className="viewer-stat-card">
              <div className="viewer-stat-icon total">
                <FolderOpen size={23} />
              </div>

              <div>
                <strong>{loading ? "—" : counts.total}</strong>
                <span>Authorized Evidence</span>
              </div>
            </div>

            <div className="viewer-stat-card">
              <div className="viewer-stat-icon verified">
                <FileCheck2 size={23} />
              </div>

              <div>
                <strong>{loading ? "—" : counts.verified}</strong>
                <span>Verified Evidence</span>
              </div>
            </div>

            <div className="viewer-stat-card">
              <div className="viewer-stat-icon warning">
                <TriangleAlert size={23} />
              </div>

              <div>
                <strong>{loading ? "—" : counts.tampered}</strong>
                <span>Tampered Records</span>
              </div>
            </div>

            <div className="viewer-stat-card">
              <div className="viewer-stat-icon activity">
                <Clock3 size={23} />
              </div>

              <div>
                <strong>{loading ? "—" : evidence.length}</strong>
                <span>Available Records</span>
              </div>
            </div>
          </section>

          <section className="viewer-panels">
            <div className="viewer-panel">
              <div className="viewer-panel-heading">
                <div>
                  <h2>Recent Evidence</h2>
                  <p>Latest records available for viewing</p>
                </div>

                <button
                  type="button"
                  className="viewer-outline-button"
                  onClick={() => navigate("evidence")}
                >
                  View all <ArrowRight size={16} />
                </button>
              </div>

              <div className="viewer-evidence-list">
                {loading && (
                  <div className="viewer-empty">Loading evidence...</div>
                )}

                {!loading && recentEvidence.length === 0 && (
                  <div className="viewer-empty">
                    No evidence records available.
                  </div>
                )}

                {!loading &&
                  recentEvidence.map((item) => (
                    <div
                      className="viewer-evidence-row"
                      key={item.id || item.evidence_id}
                    >
                      <div className="viewer-file-icon">
                        <FileText size={20} />
                      </div>

                      <div className="viewer-evidence-info">
                        <strong>
                          {item.file_name || item.title || item.evidence_id}
                        </strong>

                        <span>{item.title || item.evidence_id}</span>
                      </div>

                      <span
                        className={`viewer-status ${getStatusClass(item.status)}`}
                      >
                        {item.status || "Pending"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="viewer-panel viewer-actions-panel">
              <div className="viewer-panel-heading">
                <div>
                  <h2>Quick Access</h2>
                  <p>Read-only evidence operations</p>
                </div>
              </div>

              <button
                type="button"
                className="viewer-action-card"
                onClick={() => navigate("evidence")}
              >
                <div className="viewer-action-icon evidence-action">
                  <FolderOpen size={21} />
                </div>

                <div>
                  <strong>Authorized Evidence</strong>
                  <span>View evidence records and details</span>
                </div>

                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="viewer-action-card"
                onClick={() => navigate("custody")}
              >
                <div className="viewer-action-icon custody-action">
                  <Link2 size={21} />
                </div>

                <div>
                  <strong>Chain of Custody</strong>
                  <span>Review custody history</span>
                </div>

                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className="viewer-action-card"
                onClick={() => navigate("reports")}
              >
                <div className="viewer-action-icon report-action">
                  <FileText size={21} />
                </div>

                <div>
                  <strong>View Reports</strong>
                  <span>Open available evidence reports</span>
                </div>

                <ArrowRight size={18} />
              </button>
            </div>
          </section>

          <footer className="viewer-footer">
            <div className="viewer-footer-content">
              <div className="viewer-footer-logo">
                <ShieldCheck size={15} strokeWidth={2} />
              </div>

              <span className="viewer-footer-text">
                © 2026 Secure Digital Evidence Management System
                &nbsp;|&nbsp;
                Developed by <strong>Team Cyphora</strong>
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default ViewerDashboard;