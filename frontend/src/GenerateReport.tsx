import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  FileText,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Link2,
  ClipboardList,
} from "lucide-react";
import { API_BASE_URL } from "./api";

interface CaseRecord {
  id: number;
  case_id: string;
  case_number: string;
  title: string;
  description?: string | null;
  status: string;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface EvidenceRecord {
  id: number;
  evidence_id: string;
  case_id: string | null;
  case_number: string | null;
  case_title: string | null;
  file_name: string;
  title: string;
  file_size: number;
  file_size_kb: number;
  file_path: string;
  sha256_hash: string;
  hmac_hash: string;
  uploaded_by: number;
  uploaded_by_name: string;
  status: string;
  created_at: string;
}

interface ReportData {
  mode: "evidence" | "case";
  caseData: CaseRecord | null;
  evidence: EvidenceRecord[];
  selectedEvidence: EvidenceRecord | null;
  custodyCount: number;
  auditCount: number;
}

interface GenerateReportProps {
  onBack: () => void;
}

const API = API_BASE_URL;

const GenerateReport: React.FC<GenerateReportProps> = ({
  onBack,
}) => {
  const [mode, setMode] =
    useState<"evidence" | "case">("evidence");

  const [evidenceId, setEvidenceId] =
    useState("");

  const [cases, setCases] =
    useState<CaseRecord[]>([]);

  const [selectedCaseId, setSelectedCaseId] =
    useState("");

  const [report, setReport] =
    useState<ReportData | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [loadingCases, setLoadingCases] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================
     LOAD CASES
     ========================================= */

  const requestCases = async (): Promise<CaseRecord[]> => {
    const response = await fetch(`${API}/cases`);

    if (!response.ok) {
      throw new Error("Unable to load cases.");
    }

    const data = await response.json();

    return Array.isArray(data)
      ? data
      : data.cases || [];
  };

  const loadCases = async () => {
    try {
      setCases(await requestCases());
      setError("");
    } catch (err) {
      console.error("Case loading error:", err);

      setError("Unable to load cases from backend.");
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInitialCases = async () => {
      try {
        const loadedCases = await requestCases();

        if (active) {
          setCases(loadedCases);
          setError("");
        }
      } catch (err) {
        console.error("Case loading error:", err);

        if (active) {
          setError("Unable to load cases from backend.");
        }
      } finally {
        if (active) {
          setLoadingCases(false);
        }
      }
    };

    void loadInitialCases();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================
     GET CUSTODY COUNT
     ========================================= */

  const getCustodyCount = async (
    id: string
  ): Promise<number> => {
    try {
      const response = await fetch(
        `${API}/evidence/custody/${encodeURIComponent(
          id
        )}`
      );

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        return data.length;
      }

      if (Array.isArray(data.custody)) {
        return data.custody.length;
      }

      if (
        Array.isArray(
          data.chain_of_custody
        )
      ) {
        return data.chain_of_custody.length;
      }

      if (typeof data.total === "number") {
        return data.total;
      }

      return 0;
    } catch {
      return 0;
    }
  };

  /* =========================================
     GET AUDIT COUNT
     ========================================= */

  const getAuditCount = async (
    id: string
  ): Promise<number> => {
    try {
      const response = await fetch(
        `${API}/audit-logs/${encodeURIComponent(
          id
        )}`
      );

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        return data.length;
      }

      if (Array.isArray(data.logs)) {
        return data.logs.length;
      }

      if (
        Array.isArray(data.audit_logs)
      ) {
        return data.audit_logs.length;
      }

      if (typeof data.total === "number") {
        return data.total;
      }

      return 0;
    } catch {
      return 0;
    }
  };

  /* =========================================
     SEARCH EVIDENCE ID
     ========================================= */

  const searchEvidence = async () => {
    const searchId =
      evidenceId.trim().toUpperCase();

    setError("");
    setReport(null);

    if (!searchId) {
      setError(
        "Please enter an Evidence ID."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/evidence`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load evidence."
        );
      }

      const data = await response.json();

      const allEvidence: EvidenceRecord[] =
        Array.isArray(data)
          ? data
          : data.evidence || [];

      const foundEvidence =
        allEvidence.find(
          (item) =>
            item.evidence_id?.toUpperCase() ===
            searchId
        );

      if (!foundEvidence) {
        setError(
          `Evidence ID "${searchId}" was not found.`
        );
        return;
      }

      let caseData: CaseRecord | null = null;

      if (foundEvidence.case_id) {
        try {
          const caseResponse =
            await fetch(
              `${API}/cases/${encodeURIComponent(
                foundEvidence.case_id
              )}`
            );

          if (caseResponse.ok) {
            const casePayload =
              await caseResponse.json();

            caseData =
              casePayload.case ||
              casePayload;
          }
        } catch {
          caseData = null;
        }
      }

      const [
        custodyCount,
        auditCount,
      ] = await Promise.all([
        getCustodyCount(
          foundEvidence.evidence_id
        ),
        getAuditCount(
          foundEvidence.evidence_id
        ),
      ]);

      setReport({
        mode: "evidence",
        caseData,
        evidence: [foundEvidence],
        selectedEvidence:
          foundEvidence,
        custodyCount,
        auditCount,
      });
    } catch (err) {
      console.error(
        "Evidence search error:",
        err
      );

      setError(
        "Unable to search evidence."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     CASE REPORT
     ========================================= */

  const generateCaseReport =
    async () => {
      setError("");
      setReport(null);

      if (!selectedCaseId) {
        setError(
          "Please select a case."
        );
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `${API}/cases/${encodeURIComponent(
            selectedCaseId
          )}/evidence`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load case evidence."
          );
        }

        const data =
          await response.json();

        const caseData: CaseRecord =
          data.case;

        const evidence: EvidenceRecord[] =
          data.evidence || [];

        let custodyCount = 0;
        let auditCount = 0;

        if (evidence.length > 0) {
          const results =
            await Promise.all(
              evidence.map(
                async (item) => {
                  const [
                    custody,
                    audit,
                  ] =
                    await Promise.all([
                      getCustodyCount(
                        item.evidence_id
                      ),
                      getAuditCount(
                        item.evidence_id
                      ),
                    ]);

                  return {
                    custody,
                    audit,
                  };
                }
              )
            );

          custodyCount =
            results.reduce(
              (sum, item) =>
                sum + item.custody,
              0
            );

          auditCount =
            results.reduce(
              (sum, item) =>
                sum + item.audit,
              0
            );
        }

        setReport({
          mode: "case",
          caseData,
          evidence,
          selectedEvidence: null,
          custodyCount,
          auditCount,
        });
      } catch (err) {
        console.error(
          "Case report error:",
          err
        );

        setError(
          "Unable to generate case report."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================
     REFRESH
     ========================================= */

  const refreshPage = async () => {
    setError("");
    setReport(null);

    if (mode === "evidence") {
      if (evidenceId.trim()) {
        await searchEvidence();
      }
    } else {
      setLoadingCases(true);
      await loadCases();

      if (selectedCaseId) {
        await generateCaseReport();
      }
    }
  };

  /* =========================================
     HELPERS
     ========================================= */

  const verifiedCount =
    report?.evidence.filter(
      (item) =>
        item.status === "Verified"
    ).length || 0;

  const tamperedCount =
    report?.evidence.filter(
      (item) =>
        item.status === "Tampered"
    ).length || 0;

  const pendingCount =
    report?.evidence.filter(
      (item) =>
        item.status !== "Verified" &&
        item.status !== "Tampered"
    ).length || 0;

  const formatDate = (
    value?: string
  ) => {
    if (!value) return "—";

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString();
  };

  const maskHash = (
    value: string
  ) => {
    if (!value) return "—";

    if (value.length <= 18) {
      return value;
    }

    return `${value.slice(
      0,
      10
    )}...${value.slice(-8)}`;
  };

  /* =========================================
     RENDER
     ========================================= */

  return (
    <>
      {/* PRINT STYLE */}

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .report-page {
            width: 100%;
            min-width: 0;
            min-height: 100vh;
            background: #f5f7fb;
            overflow-x: hidden;
          }

          .report-main {
            width: 100%;
            max-width: 1500px;
            margin: 0 auto;
            padding: 28px 32px 50px;
          }

          .report-header {
            width: 100%;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 24px 26px;
            margin-bottom: 20px;
          }

          .report-search-card {
            width: 100%;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 20px;
          }

          .report-mode-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 22px;
          }

          .report-mode-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 42px;
            padding: 10px 18px;
            border: 1px solid #d9dce5;
            border-radius: 9px;
            background: #ffffff;
            color: #374151;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }

          .report-mode-btn.active {
            background: linear-gradient(
              135deg,
              #7c3aed,
              #9333ea
            );
            color: #ffffff;
            border-color: #7c3aed;
          }

          .report-form-area {
            width: 100%;
          }

          .report-form-label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #374151;
          }

          .report-input-row {
            display: flex;
            align-items: stretch;
            gap: 10px;
            width: 100%;
          }

          .report-input {
            flex: 1;
            min-width: 0;
            height: 44px;
            padding: 0 13px;
            border: 1px solid #d5d9e2;
            border-radius: 9px;
            background: #ffffff;
            color: #111827;
            font-size: 14px;
            outline: none;
          }

          .report-input:focus {
            border-color: #7c3aed;
            box-shadow: 0 0 0 3px rgba(
              124,
              58,
              237,
              0.10
            );
          }

          .report-select {
            cursor: pointer;
          }

          .report-search-btn {
            flex: 0 0 auto;
            min-width: 130px;
          }

          .report-helper-text {
            margin: 8px 0 0;
            color: #6b7280;
            font-size: 12px;
          }

          .report-error {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 16px;
            padding: 12px 14px;
            border: 1px solid #fecaca;
            border-radius: 9px;
            background: #fef2f2;
            color: #b91c1c;
            font-size: 13px;
          }

          .report-card {
            width: 100%;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 30px;
            overflow: hidden;
          }

          .report-title-area {
            text-align: center;
            border-bottom: 1px solid #ddd;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }

          .report-section {
            margin-top: 26px;
          }

          .report-section h3 {
            margin: 0 0 12px;
            color: #1f2937;
            font-size: 17px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
            gap: 12px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(
              4,
              minmax(0, 1fr)
            );
            gap: 12px;
          }

          .summary-box {
            min-width: 0;
            padding: 16px;
            border: 1px solid #e2e4ec;
            border-radius: 10px;
            background: #ffffff;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .summary-icon {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .summary-content {
            min-width: 0;
          }

          .summary-label {
            font-size: 11px;
            color: #777;
            margin-bottom: 3px;
          }

          .summary-value {
            font-size: 22px;
            font-weight: 700;
            color: #111827;
          }

          .evidence-table-wrapper {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
          }

          .evidence-table {
            width: 100%;
            min-width: 900px;
            border-collapse: collapse;
            font-size: 13px;
          }

          .evidence-table th {
            text-align: left;
            padding: 11px 10px;
            border-bottom: 1px solid #ddd;
            background: #f8fafc;
            color: #374151;
            font-weight: 700;
            white-space: nowrap;
          }

          .evidence-table td {
            padding: 11px 10px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
            color: #374151;
          }

          .evidence-table tbody tr:last-child td {
            border-bottom: none;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 9px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
          }

          .status-verified {
            background: #dcfce7;
            color: #166534;
          }

          .status-tampered {
            background: #fee2e2;
            color: #991b1b;
          }

          .status-pending {
            background: #ede9fe;
            color: #6d28d9;
          }

          .report-footer {
            margin-top: 26px;
            padding-top: 14px;
            border-top: 1px solid #ddd;
            color: #777;
            font-size: 12px;
          }

          .report-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 24px;
          }

          .report-empty {
            width: 100%;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 50px 25px;
            text-align: center;
            color: #777;
          }

          .report-empty-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f3e8ff;
            color: #7c3aed;
          }

          .primary-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 42px;
            padding: 10px 18px;
            border: none;
            border-radius: 9px;
            background: linear-gradient(
              135deg,
              #7c3aed,
              #9333ea
            );
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow:
              0 6px 16px
              rgba(124, 58, 237, 0.20);
          }

          .primary-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .back-button {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border: none;
            border-radius: 9px;
            background: linear-gradient(
              135deg,
              #7c3aed,
              #9333ea
            );
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow:
              0 6px 16px
              rgba(124, 58, 237, 0.20);
          }

          .spin {
            animation: report-spin 1s linear infinite;
          }

          @keyframes report-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 900px) {
            .report-main {
              padding: 20px 16px 40px;
            }

            .summary-grid {
              grid-template-columns: repeat(
                2,
                minmax(0, 1fr)
              );
            }

            .info-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 600px) {
            .report-main {
              padding: 14px 10px 30px;
            }

            .report-header,
            .report-search-card,
            .report-card {
              padding: 18px;
              border-radius: 10px;
            }

            .report-input-row {
              flex-direction: column;
            }

            .report-search-btn {
              width: 100%;
            }

            .summary-grid {
              grid-template-columns: 1fr;
            }

            .report-mode-buttons {
              flex-direction: column;
            }

            .report-mode-btn {
              width: 100%;
            }
          }

          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            .report-page {
              width: 100% !important;
              min-height: auto !important;
              background: #ffffff !important;
            }

            .report-main {
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            .no-print {
              display: none !important;
            }

            .report-header,
            .report-search-card {
              display: none !important;
            }

            .report-card {
              width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              overflow: visible !important;
            }

            .evidence-table-wrapper {
              overflow: visible !important;
              border: 1px solid #ddd !important;
            }

            .evidence-table {
              min-width: 0 !important;
              width: 100% !important;
              font-size: 10px !important;
            }

            .evidence-table th,
            .evidence-table td {
              padding: 6px !important;
            }

            .report-section {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .info-grid,
            .summary-grid {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="report-page">
        <main className="report-main">

          {/* BACK TO DASHBOARD */}

          <div
            className="no-print"
            style={{
              marginBottom: "18px",
            }}
          >
            <button
              type="button"
              onClick={onBack}
              className="back-button"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>
          </div>

          {/* HEADER */}

          <header className="report-header">
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "12px",
                letterSpacing: "1.5px",
                fontWeight: 700,
                color: "#7c3aed",
              }}
            >
              INVESTIGATOR / OFFICER
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "28px",
                color: "#111827",
              }}
            >
              Generate Investigation Report
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Search an evidence record or
              generate a complete report for
              a selected case.
            </p>
          </header>

          {/* SEARCH CARD */}

          <section className="report-search-card no-print">

            <div className="report-mode-buttons">

              <button
                type="button"
                className={
                  mode === "evidence"
                    ? "report-mode-btn active"
                    : "report-mode-btn"
                }
                onClick={() => {
                  setMode("evidence");
                  setReport(null);
                  setError("");
                }}
              >
                <Search size={17} />
                Evidence ID Search
              </button>

              <button
                type="button"
                className={
                  mode === "case"
                    ? "report-mode-btn active"
                    : "report-mode-btn"
                }
                onClick={() => {
                  setMode("case");
                  setReport(null);
                  setError("");
                }}
              >
                <FileText size={17} />
                Select Case
              </button>

            </div>

            {/* EVIDENCE SEARCH */}

            {mode === "evidence" && (
              <div className="report-form-area">

                <label className="report-form-label">
                  Search Evidence ID
                </label>

                <div className="report-input-row">

                  <input
                    type="text"
                    value={evidenceId}
                    onChange={(event) =>
                      setEvidenceId(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        searchEvidence();
                      }
                    }}
                    placeholder="Example: EVD-422D9E68"
                    className="report-input"
                  />

                  <button
                    type="button"
                    className="primary-button report-search-btn"
                    onClick={searchEvidence}
                    disabled={loading}
                  >
                    <Search size={17} />

                    {loading
                      ? "Searching..."
                      : "Search"}
                  </button>

                </div>

                <p className="report-helper-text">
                  Enter any previously uploaded
                  Evidence ID.
                </p>

              </div>
            )}

            {/* CASE SELECTION */}

            {mode === "case" && (
              <div className="report-form-area">

                <label className="report-form-label">
                  Select Case
                </label>

                <div className="report-input-row">

                  <select
                    value={selectedCaseId}
                    onChange={(event) =>
                      setSelectedCaseId(
                        event.target.value
                      )
                    }
                    className="report-input report-select"
                  >
                    <option value="">
                      -- Select a case --
                    </option>

                    {cases.map((item) => (
                      <option
                        key={item.case_id}
                        value={item.case_id}
                      >
                        {item.case_number} -{" "}
                        {item.title}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="primary-button report-search-btn"
                    onClick={
                      generateCaseReport
                    }
                    disabled={
                      loading ||
                      loadingCases
                    }
                  >
                    <FileText size={17} />

                    {loading
                      ? "Generating..."
                      : "Generate"}
                  </button>

                </div>

                {loadingCases && (
                  <p className="report-helper-text">
                    Loading cases...
                  </p>
                )}

              </div>
            )}

            {/* REFRESH */}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "18px",
              }}
            >
              <button
                type="button"
                className="report-mode-btn"
                onClick={refreshPage}
                disabled={loading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {/* ERROR */}

            {error && (
              <div className="report-error">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

          </section>

          {/* REPORT */}

          {report && (
            <div className="report-card">

              {/* REPORT HEADER */}

              <div className="report-title-area">

                <div
                  style={{
                    fontSize: "12px",
                    letterSpacing: "2px",
                    fontWeight: 700,
                    color: "#374151",
                  }}
                >
                  SECURE DIGITAL EVIDENCE
                  MANAGEMENT SYSTEM
                </div>

                <h2
                  style={{
                    margin:
                      "8px 0 4px",
                    fontSize: "25px",
                    color: "#111827",
                  }}
                >
                  INVESTIGATION REPORT
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#777",
                    fontSize: "13px",
                  }}
                >
                  Digital Evidence
                  Investigation Summary
                </p>

              </div>

              {/* CASE INFORMATION */}

              {report.caseData && (
                <section className="report-section">

                  <h3>
                    Case Information
                  </h3>

                  <div className="info-grid">

                    <InfoBox
                      label="Case ID"
                      value={
                        report.caseData
                          .case_id
                      }
                    />

                    <InfoBox
                      label="Case Number"
                      value={
                        report.caseData
                          .case_number
                      }
                    />

                    <InfoBox
                      label="Case Title"
                      value={
                        report.caseData
                          .title
                      }
                    />

                    <InfoBox
                      label="Status"
                      value={
                        report.caseData
                          .status
                      }
                    />

                    <InfoBox
                      label="Created By"
                      value={
                        report.caseData
                          .created_by_name ||
                        "—"
                      }
                    />

                    <InfoBox
                      label="Created At"
                      value={formatDate(
                        report.caseData
                          .created_at
                      )}
                    />

                  </div>

                </section>
              )}

              {/* SUMMARY */}

              <section className="report-section">

                <h3>
                  Evidence Summary
                </h3>

                <div className="summary-grid">

                  <SummaryBox
                    label="Total Evidence"
                    value={
                      report.evidence
                        .length
                    }
                    icon={
                      <FileText size={20} />
                    }
                  />

                  <SummaryBox
                    label="Verified"
                    value={
                      verifiedCount
                    }
                    icon={
                      <CheckCircle2
                        size={20}
                      />
                    }
                  />

                  <SummaryBox
                    label="Tampered"
                    value={
                      tamperedCount
                    }
                    icon={
                      <AlertTriangle
                        size={20}
                      />
                    }
                  />

                  <SummaryBox
                    label="Pending"
                    value={
                      pendingCount
                    }
                    icon={
                      <Clock3 size={20} />
                    }
                  />

                </div>

              </section>

              {/* EVIDENCE DETAILS */}

              <section className="report-section">

                <h3>
                  Evidence Details
                </h3>

                {report.evidence.length ===
                0 ? (
                  <div
                    style={{
                      padding: "30px",
                      textAlign: "center",
                      color: "#777",
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: "10px",
                    }}
                  >
                    No evidence is linked
                    to this case.
                  </div>
                ) : (
                  <div className="evidence-table-wrapper">

                    <table className="evidence-table">

                      <thead>
                        <tr>

                          <th>
                            Evidence ID
                          </th>

                          <th>
                            File
                          </th>

                          <th>
                            Title
                          </th>

                          <th>
                            Size
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            SHA-256
                          </th>

                          <th>
                            Uploaded
                          </th>

                        </tr>
                      </thead>

                      <tbody>

                        {report.evidence.map(
                          (item) => (
                            <tr
                              key={
                                item.evidence_id
                              }
                            >

                              <td>
                                {
                                  item.evidence_id
                                }
                              </td>

                              <td>
                                {
                                  item.file_name
                                }
                              </td>

                              <td>
                                {item.title}
                              </td>

                              <td>
                                {
                                  item.file_size_kb
                                }{" "}
                                KB
                              </td>

                              <td>

                                <span
                                  className={`status-badge ${
                                    item.status ===
                                    "Verified"
                                      ? "status-verified"
                                      : item.status ===
                                        "Tampered"
                                      ? "status-tampered"
                                      : "status-pending"
                                  }`}
                                >
                                  {
                                    item.status
                                  }
                                </span>

                              </td>

                              <td>
                                {maskHash(
                                  item.sha256_hash
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  item.created_at
                                )}
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                )}

              </section>

              {/* SELECTED EVIDENCE */}

              {report.selectedEvidence && (
                <section className="report-section">

                  <h3>
                    Integrity Verification
                  </h3>

                  <div className="info-grid">

                    <InfoBox
                      label="Evidence ID"
                      value={
                        report
                          .selectedEvidence
                          .evidence_id
                      }
                    />

                    <InfoBox
                      label="Status"
                      value={
                        report
                          .selectedEvidence
                          .status
                      }
                    />

                    <InfoBox
                      label="SHA-256"
                      value={
                        report
                          .selectedEvidence
                          .sha256_hash
                      }
                    />

                    <InfoBox
                      label="HMAC-SHA256"
                      value={
                        report
                          .selectedEvidence
                          .hmac_hash
                      }
                    />

                  </div>

                </section>
              )}

              {/* CUSTODY / AUDIT */}

              <section className="report-section">

                <h3>
                  Chain of Custody & Audit
                  Summary
                </h3>

                <div
                  className="summary-grid"
                  style={{
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                  }}
                >

                  <SummaryBox
                    label="Chain of Custody"
                    value={
                      report.custodyCount
                    }
                    icon={
                      <Link2 size={20} />
                    }
                  />

                  <SummaryBox
                    label="Audit Logs"
                    value={
                      report.auditCount
                    }
                    icon={
                      <ClipboardList
                        size={20}
                      />
                    }
                  />

                </div>

              </section>

              {/* FOOTER */}

              <div className="report-footer">

                Report generated by:{" "}

                <strong>
                  {localStorage.getItem(
                    "username"
                  ) || "Investigator"}
                </strong>

              </div>

              {/* PRINT */}

              <div className="report-actions no-print">

                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    window.print()
                  }
                >
                  <Printer size={18} />
                  Print / Save as PDF
                </button>

              </div>

            </div>
          )}

          {/* NO REPORT */}

          {!report &&
            !loading &&
            !error && (
              <div className="report-empty">

                <div className="report-empty-icon">
                  <FileText size={35} />
                </div>

                <h3
                  style={{
                    margin:
                      "0 0 8px",
                    color: "#374151",
                  }}
                >
                  Search or Select a Case
                </h3>

                <p
                  style={{
                    margin: 0,
                  }}
                >
                  Search an existing
                  Evidence ID or select a
                  Case to generate the
                  investigation report.
                </p>

              </div>
            )}

          {/* LOADING */}

          {loading && (
            <div className="report-empty">

              <RefreshCw
                size={30}
                className="spin"
                style={{
                  marginBottom: "12px",
                }}
              />

              <h3
                style={{
                  margin:
                    "0 0 8px",
                  color: "#374151",
                }}
              >
                Generating Report...
              </h3>

              <p
                style={{
                  margin: 0,
                }}
              >
                Retrieving evidence,
                integrity and audit
                information.
              </p>

            </div>
          )}

        </main>
      </div>
    </>
  );
};

/* =========================================
   INFO BOX
   ========================================= */

const InfoBox = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div
    style={{
      minWidth: 0,
      padding: "13px",
      border:
        "1px solid #e2e4ec",
      borderRadius: "9px",
      background: "#fafbff",
    }}
  >
    <div
      style={{
        fontSize: "11px",
        fontWeight: 700,
        color: "#777",
        marginBottom: "5px",
      }}
    >
      {label}
    </div>

    <div
      style={{
        fontSize: "13px",
        color: "#1f2937",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {value || "—"}
    </div>
  </div>
);

/* =========================================
   SUMMARY BOX
   ========================================= */

const SummaryBox = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <div className="summary-box">

    <div className="summary-icon">
      {icon}
    </div>

    <div className="summary-content">

      <div className="summary-label">
        {label}
      </div>

      <strong className="summary-value">
        {value}
      </strong>

    </div>

  </div>
);

export default GenerateReport;