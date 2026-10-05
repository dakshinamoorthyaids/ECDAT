import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  FileText,
  LogIn,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  X,
  UploadCloud,
  Eye,
  Hash,
  Shield,
  LogOut,
  Activity,
} from "lucide-react";
import "./AuditLogs.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

interface AuditLog {
  id: number;
  evidence_id: number | string | null;
  user_id: number | string | null;
  action: string;
  description: string;
  ip_address?: string | null;
  created_at?: string | null;
  timestamp?: string | null;
}

interface AuditLogsProps {
  onBack: () => void;
}

const AuditLogs: React.FC<AuditLogsProps> = ({
  onBack,
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] =
    useState("All Actions");

  const requestAuditLogs = async (): Promise<AuditLog[]> => {
    const response = await fetch(
      `${API_BASE_URL}/audit-logs`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to load audit logs (${response.status})`
      );
    }

    const data = await response.json();

    return Array.isArray(data)
      ? data
      : data.audit_logs || [];
  };

  const fetchAuditLogs = async () => {
    try {
      setLogs(await requestAuditLogs());
      setError("");
    } catch (err) {
      console.error("Audit log error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load audit logs."
      );

      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadAuditLogs = async () => {
      try {
        const auditLogs = await requestAuditLogs();

        if (active) {
          setLogs(auditLogs);
          setError("");
        }
      } catch (err) {
        console.error("Audit log error:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load audit logs."
          );
          setLogs([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadAuditLogs();

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditLogs();
  };

  const handleClear = () => {
    setSearchTerm("");
    setSelectedAction("All Actions");
  };

  const getActionType = (action: string) => {
    const value = action.toLowerCase();

    if (value.includes("login")) {
      return "login";
    }

    if (value.includes("logout")) {
      return "logout";
    }

    if (value.includes("upload")) {
      return "upload";
    }

    if (
      value.includes("verify") ||
      value.includes("verified")
    ) {
      return "verify";
    }

    if (value.includes("tamper")) {
      return "tamper";
    }

    if (value.includes("encrypt")) {
      return "encrypt";
    }

    if (value.includes("hash")) {
      return "hash";
    }

    if (value.includes("view")) {
      return "view";
    }

    return "default";
  };

  const getActionIcon = (action: string) => {
    const type = getActionType(action);

    switch (type) {
      case "login":
        return <LogIn size={15} />;

      case "logout":
        return <LogOut size={15} />;

      case "upload":
        return <UploadCloud size={15} />;

      case "verify":
        return <CheckCircle2 size={15} />;

      case "tamper":
        return <AlertTriangle size={15} />;

      case "encrypt":
        return <Lock size={15} />;

      case "hash":
        return <Hash size={15} />;

      case "view":
        return <Eye size={15} />;

      default:
        return <Activity size={15} />;
    }
  };

  const getActionLabel = (action: string) => {
    const value = action.toLowerCase();

    if (value.includes("login")) return "LOGIN";
    if (value.includes("logout")) return "LOGOUT";
    if (value.includes("upload")) return "UPLOAD";
    if (value.includes("verify")) return "VERIFY";
    if (value.includes("tamper")) return "TAMPER";
    if (value.includes("encrypt")) return "ENCRYPT";
    if (value.includes("hash")) return "HASH";
    if (value.includes("view")) return "VIEW";

    return action;
  };

  const formatTimestamp = (
    timestamp?: string | null
  ) => {
    if (!timestamp) return "—";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const actionOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        logs.map((log) =>
          getActionLabel(log.action)
        )
      )
    );

    return unique;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return logs.filter((log) => {
      const matchesAction =
        selectedAction === "All Actions" ||
        getActionLabel(log.action) ===
          selectedAction;

      if (!matchesAction) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        log.id,
        log.user_id,
        log.evidence_id,
        log.action,
        log.description,
        log.ip_address,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [
    logs,
    searchTerm,
    selectedAction,
  ]);

  const totalLogs = logs.length;

  const loginEvents = logs.filter(
    (log) =>
      getActionType(log.action) === "login"
  ).length;

  const verificationEvents = logs.filter(
    (log) =>
      getActionType(log.action) === "verify"
  ).length;

  const tamperEvents = logs.filter(
    (log) =>
      getActionType(log.action) === "tamper"
  ).length;

  return (
    <div className="audit-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="audit-header">

        <div className="audit-header-main">

          <button
            type="button"
            className="back-dashboard-btn"
            onClick={onBack}
          >
            <ArrowLeft size={19} />
            <span>Back to Dashboard</span>
          </button>

          <div className="audit-title-area">

            <div className="audit-title-icon">
              <ShieldCheck size={29} />
            </div>

            <div>
              <h1>Audit Logs</h1>

              <p>
                Complete record of important activities
                performed inside the evidence management
                system.
              </p>
            </div>

          </div>

        </div>

        <div className="readonly-badge">
          <Lock size={15} />
          <span>Read Only</span>
        </div>

      </header>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="audit-summary">

        <div className="summary-card total-card">

          <div className="summary-icon blue">
            <FileText size={27} />
          </div>

          <div>
            <span>Total Logs</span>
            <strong>{totalLogs}</strong>
          </div>

        </div>


        <div className="summary-card login-card">

          <div className="summary-icon green">
            <LogIn size={27} />
          </div>

          <div>
            <span>Login Events</span>
            <strong>{loginEvents}</strong>
          </div>

        </div>


        <div className="summary-card verify-card">

          <div className="summary-icon purple">
            <CheckCircle2 size={27} />
          </div>

          <div>
            <span>Verification Events</span>
            <strong>{verificationEvents}</strong>
          </div>

        </div>


        <div className="summary-card tamper-card">

          <div className="summary-icon red">
            <AlertTriangle size={27} />
          </div>

          <div>
            <span>Tamper Events</span>
            <strong>{tamperEvents}</strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          SEARCH / FILTER
      ===================================================== */}

      <section className="audit-toolbar">

        <div className="audit-search">

          <Search size={21} />

          <input
            type="text"
            placeholder="Search log ID, user, evidence, action, IP..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

        </div>


        <select
          className="action-select"
          value={selectedAction}
          onChange={(e) =>
            setSelectedAction(e.target.value)
          }
        >
          <option>All Actions</option>

          {actionOptions.map((action) => (
            <option
              key={action}
              value={action}
            >
              {action}
            </option>
          ))}
        </select>


        <button
          type="button"
          className="refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "spin"
                : ""
            }
          />

          Refresh
        </button>


        <button
          type="button"
          className="clear-btn"
          onClick={handleClear}
        >
          <X size={17} />
          Clear
        </button>

      </section>


      {/* =====================================================
          IMMUTABLE NOTICE
      ===================================================== */}

      <section className="immutable-banner">

        <div className="immutable-icon">
          <Lock size={23} />
        </div>

        <div>
          <h3>
            Immutable Audit Trail
          </h3>

          <p>
            Audit records are generated automatically
            by the backend. This page provides read-only
            access. No edit or delete operations are
            available for normal users.
          </p>
        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="audit-error">
          {error}
        </div>
      )}


      {/* =====================================================
          SYSTEM ACTIVITY
      ===================================================== */}

      <section className="activity-card">

        <div className="activity-header">

          <div>
            <h2>System Activity</h2>

            <p>
              {filteredLogs.length} records displayed
            </p>
          </div>

          <span className="activity-count">
            {filteredLogs.length}
          </span>

        </div>


        <div className="table-wrapper">

          <table className="audit-table">

            <thead>
              <tr>
                <th>Log ID</th>
                <th>User ID</th>
                <th>Evidence ID</th>
                <th>Action</th>
                <th>Description</th>
                <th>Timestamp</th>
                <th>IP Address</th>
              </tr>
            </thead>


            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="table-message"
                  >
                    Loading audit logs...
                  </td>
                </tr>

              ) : filteredLogs.length === 0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="table-message"
                  >
                    No audit logs found
                  </td>
                </tr>

              ) : (

                filteredLogs.map((log) => {

                  const actionType =
                    getActionType(
                      log.action
                    );

                  return (
                    <tr key={log.id}>

                      <td className="log-id">
                        #{log.id}
                      </td>

                      <td>
                        <span className="user-id">
                          {log.user_id ?? "—"}
                        </span>
                      </td>

                      <td className="evidence-id">
                        {log.evidence_id ?? "—"}
                      </td>

                      <td>
                        <span
                          className={`action-badge ${actionType}`}
                        >
                          {getActionIcon(
                            log.action
                          )}

                          <span>
                            {getActionLabel(
                              log.action
                            )}
                          </span>
                        </span>
                      </td>

                      <td className="description-cell">
                        {log.description || "—"}
                      </td>

                      <td className="timestamp-cell">
                        {formatTimestamp(
                          log.timestamp ||
                          log.created_at
                        )}
                      </td>

                      <td className="ip-cell">
                        {log.ip_address || "—"}
                      </td>

                    </tr>
                  );
                })

              )}

            </tbody>

          </table>

        </div>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="audit-footer">

          <div className="footer-left">
            <Shield size={17} />

            <span>
              Audit trail is maintained by the
              Secure Digital Evidence Management System.
            </span>
          </div>


          <div className="footer-right">
            <Lock size={15} />

            <span>
              Protected / Read Only
            </span>
          </div>

        </div>

      </section>

    </div>
  );
};

export default AuditLogs;