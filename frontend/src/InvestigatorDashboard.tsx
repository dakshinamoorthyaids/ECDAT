import React, { useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  FolderOpen,
  UploadCloud,
  ShieldCheck,
  Link2,
  FileText,
  Settings,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Clock3,
  Files,
  ArrowLeft,
  Printer,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { API_BASE_URL } from "./api";
import "./InvestigatorDashboard.css";

import Evidence from "./Evidence";
import UploadEvidence from "./UploadEvidence";
import Verification from "./Verification";
import ChainOfCustody from "./ChainOfCustody";

interface InvestigatorDashboardProps {
  onLogout?: () => void;
  onSettings?: () => void;
}

type ActivePage =
  | "dashboard"
  | "cases"
  | "upload"
  | "verification"
  | "custody"
  | "reports";

type ReportMode = "case" | "evidence";

interface CaseItem {
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

interface EvidenceItem {
  id?: number;
  evidence_id: string;
  case_id?: string | null;
  case_number?: string | null;
  case_title?: string | null;
  file_name: string;
  title?: string | null;
  file_size?: number;
  file_size_kb?: number;
  sha256_hash?: string | null;
  hmac_hash?: string | null;
  status?: string | null;
  uploaded_by?: number;
  uploaded_by_name?: string | null;
  created_at?: string;
}

interface EvidenceReportItem extends EvidenceItem {
  custodyCount: number;
  auditCount: number;
  verificationStatus: string;
}

const InvestigatorDashboard: React.FC<
  InvestigatorDashboardProps
> = ({ onLogout, onSettings }) => {
  const [activePage, setActivePage] =
    useState<ActivePage>("dashboard");

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [evidenceList, setEvidenceList] =
    useState<EvidenceItem[]>([]);

  const [selectedCaseId, setSelectedCaseId] =
    useState<string>("");

  const [reportMode, setReportMode] =
    useState<ReportMode>("case");

  const [evidenceSearchId, setEvidenceSearchId] =
    useState<string>("");

  const [searchedEvidence, setSearchedEvidence] =
    useState<EvidenceReportItem | null>(null);

  const [reportEvidence, setReportEvidence] =
    useState<EvidenceReportItem[]>([]);

  const [reportCase, setReportCase] =
    useState<CaseItem | null>(null);

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [reportError, setReportError] =
    useState("");

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const username =
    localStorage.getItem("username") ||
    "Investigator";

  /* =====================================================
     FETCH CASES
     ===================================================== */

  const fetchCases = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cases`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch cases (${response.status})`
        );
      }

      const data = await response.json();

      const caseArray: CaseItem[] =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.cases)
          ? data.cases
          : [];

      setCases(caseArray);

      return caseArray;
    } catch (error) {
      console.error(
        "Cases fetch error:",
        error
      );

      return [];
    }
  };

  /* =====================================================
     FETCH EVIDENCE
     ===================================================== */

  const fetchEvidence = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/evidence`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch evidence (${response.status})`
        );
      }

      const data = await response.json();

      const evidenceArray: EvidenceItem[] =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.evidence)
          ? data.evidence
          : [];

      setEvidenceList(evidenceArray);

      return evidenceArray;
    } catch (error) {
      console.error(
        "Evidence fetch error:",
        error
      );

      return [];
    }
  };

  /* =====================================================
     INITIAL DATA
     ===================================================== */

  useEffect(() => {
    const loadDashboardData = async () => {
      setDashboardLoading(true);

      await Promise.all([
        fetchCases(),
        fetchEvidence(),
      ]);

      setDashboardLoading(false);
    };

    loadDashboardData();
  }, []);

  /* =====================================================
     NAVIGATION ITEMS
     ===================================================== */

  const menuItems: {
    id: ActivePage;
    label: string;
    icon: React.ElementType;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "cases",
      label: "Cases",
      icon: FolderOpen,
    },
    {
      id: "upload",
      label: "Upload Evidence",
      icon: UploadCloud,
    },
    {
      id: "verification",
      label: "Verification",
      icon: ShieldCheck,
    },
    {
      id: "custody",
      label: "Chain of Custody",
      icon: Link2,
    },
    {
      id: "reports",
      label: "Generate Report",
      icon: FileText,
    },
  ];

  /* =====================================================
     MENU CLICK
     ===================================================== */

  const handleMenuClick = (
    id: ActivePage
  ) => {
    setActivePage(id);

    if (id === "dashboard") {
      window.location.assign("#dashboard");
    }

    if (id === "cases") {
      window.location.assign("#evidence");
    }

    if (id === "upload") {
      window.location.assign("#upload-evidence");
    }

    if (id === "verification") {
      window.location.assign("#verification");
    }

    if (id === "custody") {
      window.location.assign("#chain-of-custody");
    }

    if (id === "reports") {
      window.location.assign("#reports");
    }
  };

  /* =====================================================
     BACK TO DASHBOARD
     ===================================================== */

  const goToDashboard = () => {
    setActivePage("dashboard");
    window.location.assign("#dashboard");
  };

  /* =====================================================
     FORMAT HELPERS
     ===================================================== */

  const formatDate = (
    value?: string
  ) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  const formatFileSize = (
    bytes?: number
  ) => {
    if (!bytes && bytes !== 0) {
      return "N/A";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(2)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  };

  /* =====================================================
     COMMON SIDEBAR
     ===================================================== */

  const renderSidebar = () => {
    return (
      <aside className="investigator-sidebar">
        <div className="investigator-brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h2>Secure Digital</h2>

            <h2 className="brand-purple">
              Evidence
            </h2>

            <span>
              INVESTIGATOR PORTAL
            </span>
          </div>
        </div>

        <nav className="investigator-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={`investigator-nav-item ${
                  activePage === item.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMenuClick(item.id)
                }
              >
                <Icon size={20} />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="investigator-sidebar-bottom">
          <button
            type="button"
            className="investigator-nav-item"
            onClick={() =>
              onSettings?.()
            }
          >
            <Settings size={20} />

            <span>Settings</span>
          </button>

          <button
            type="button"
            className="investigator-nav-item logout"
            onClick={() =>
              onLogout?.()
            }
          >
            <LogOut size={20} />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    );
  };

  /* =====================================================
     COMMON HEADER
     ===================================================== */

  const renderHeader = (
    title: string
  ) => {
    return (
      <header className="investigator-header">
        <div>
          <p className="header-label">
            INVESTIGATOR / OFFICER
          </p>

          <h1>{title}</h1>
        </div>

        <div className="header-user">
          <div className="user-avatar">
            {username
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>{username}</strong>

            <span>
              Investigator / Officer
            </span>
          </div>
        </div>
      </header>
    );
  };

  /* =====================================================
     LOAD REPORT FOR CASE
     ===================================================== */

  const loadReport = async (
    caseId: string
  ) => {
    if (!caseId) {
      setReportEvidence([]);
      setReportCase(null);
      return;
    }

    setLoadingReport(true);
    setReportError("");

    try {
      let evidenceData =
        evidenceList;

      if (evidenceData.length === 0) {
        evidenceData =
          await fetchEvidence();
      }

      let caseData =
        cases.find(
          (item) =>
            String(item.case_id) ===
            String(caseId)
        );

      if (!caseData) {
        const freshCases =
          await fetchCases();

        caseData =
          freshCases.find(
            (item) =>
              String(item.case_id) ===
              String(caseId)
          );
      }

      setReportCase(
        caseData || null
      );

      const filteredEvidence =
        evidenceData.filter(
          (item) =>
            String(
              item.case_id || ""
            ) === String(caseId)
        );

      const detailedEvidence =
        await Promise.all(
          filteredEvidence.map(
            async (
              item
            ): Promise<EvidenceReportItem> => {
              let custodyCount = 0;
              let auditCount = 0;

              try {
                const custodyResponse =
                  await fetch(
                    `${API_BASE_URL}/evidence/custody/${encodeURIComponent(
                      item.evidence_id
                    )}`
                  );

                if (
                  custodyResponse.ok
                ) {
                  const custodyData =
                    await custodyResponse.json();

                  const custody =
                    Array.isArray(
                      custodyData?.custody
                    )
                      ? custodyData.custody
                      : Array.isArray(
                          custodyData?.records
                        )
                      ? custodyData.records
                      : Array.isArray(
                          custodyData?.chain_of_custody
                        )
                      ? custodyData.chain_of_custody
                      : [];

                  custodyCount =
                    custody.length;
                }
              } catch (error) {
                console.warn(
                  "Custody fetch failed:",
                  item.evidence_id,
                  error
                );
              }

              try {
                const auditResponse =
                  await fetch(
                    `${API_BASE_URL}/audit-logs/${encodeURIComponent(
                      item.evidence_id
                    )}`
                  );

                if (
                  auditResponse.ok
                ) {
                  const auditData =
                    await auditResponse.json();

                  const auditLogs =
                    Array.isArray(
                      auditData?.audit_logs
                    )
                      ? auditData.audit_logs
                      : Array.isArray(
                          auditData?.logs
                        )
                      ? auditData.logs
                      : [];

                  auditCount =
                    auditLogs.length;
                }
              } catch (error) {
                console.warn(
                  "Audit fetch failed:",
                  item.evidence_id,
                  error
                );
              }

              const status =
                item.status ||
                "Unknown";

              return {
                ...item,
                custodyCount,
                auditCount,
                verificationStatus:
                  status,
              };
            }
          )
        );

      setReportEvidence(
        detailedEvidence
      );
    } catch (error) {
      console.error(
        "Report loading error:",
        error
      );

      setReportError(
        "Unable to load investigation report data."
      );
    } finally {
      setLoadingReport(false);
    }
  };

  /* =====================================================
     SEARCH REPORT BY EVIDENCE ID
     ===================================================== */

  const searchEvidenceReport =
    async () => {
      const searchId =
        evidenceSearchId.trim();

      if (!searchId) {
        setReportError(
          "Please enter an Evidence ID."
        );

        setSearchedEvidence(null);
        setReportEvidence([]);
        setReportCase(null);

        return;
      }

      setLoadingReport(true);
      setReportError("");
      setSearchedEvidence(null);
      setReportEvidence([]);
      setReportCase(null);

      try {
        let evidenceData =
          evidenceList;

        if (evidenceData.length === 0) {
          evidenceData =
            await fetchEvidence();
        }

        const evidence =
          evidenceData.find(
            (item) =>
              String(
                item.evidence_id
              ).toLowerCase() ===
              searchId.toLowerCase()
          );

        if (!evidence) {
          setReportError(
            `Evidence ID "${searchId}" was not found.`
          );

          return;
        }

        let custodyCount = 0;
        let auditCount = 0;

        try {
          const custodyResponse =
            await fetch(
              `${API_BASE_URL}/evidence/custody/${encodeURIComponent(
                evidence.evidence_id
              )}`
            );

          if (
            custodyResponse.ok
          ) {
            const custodyData =
              await custodyResponse.json();

            const custody =
              Array.isArray(
                custodyData?.custody
              )
                ? custodyData.custody
                : Array.isArray(
                    custodyData?.records
                  )
                ? custodyData.records
                : Array.isArray(
                    custodyData?.chain_of_custody
                  )
                ? custodyData.chain_of_custody
                : [];

            custodyCount =
              custody.length;
          }
        } catch (error) {
          console.warn(
            "Custody fetch failed:",
            evidence.evidence_id,
            error
          );
        }

        try {
          const auditResponse =
            await fetch(
              `${API_BASE_URL}/audit-logs/${encodeURIComponent(
                evidence.evidence_id
              )}`
            );

          if (
            auditResponse.ok
          ) {
            const auditData =
              await auditResponse.json();

            const auditLogs =
              Array.isArray(
                auditData?.audit_logs
              )
                ? auditData.audit_logs
                : Array.isArray(
                    auditData?.logs
                  )
                ? auditData.logs
                : [];

            auditCount =
              auditLogs.length;
          }
        } catch (error) {
          console.warn(
            "Audit fetch failed:",
            evidence.evidence_id,
            error
          );
        }

        const detailedEvidence: EvidenceReportItem =
          {
            ...evidence,
            custodyCount,
            auditCount,
            verificationStatus:
              evidence.status ||
              "Unknown",
          };

        setSearchedEvidence(
          detailedEvidence
        );

        setReportEvidence([
          detailedEvidence,
        ]);

        if (evidence.case_id) {
          const foundCase =
            cases.find(
              (item) =>
                String(
                  item.case_id
                ) ===
                String(
                  evidence.case_id
                )
            );

          if (foundCase) {
            setReportCase(
              foundCase
            );
          } else {
            const freshCases =
              await fetchCases();

            const freshCase =
              freshCases.find(
                (item) =>
                  String(
                    item.case_id
                  ) ===
                  String(
                    evidence.case_id
                  )
              );

            setReportCase(
              freshCase || null
            );
          }
        }
      } catch (error) {
        console.error(
          "Evidence report search error:",
          error
        );

        setReportError(
          "Unable to search evidence report."
        );
      } finally {
        setLoadingReport(false);
      }
    };

  /* =====================================================
     SELECTED CASE
     ===================================================== */

  const selectedCase =
    useMemo(() => {
      return (
        reportCase ||
        cases.find(
          (item) =>
            String(
              item.case_id
            ) ===
            String(
              selectedCaseId
            )
        )
      );
    }, [
      cases,
      selectedCaseId,
      reportCase,
    ]);

  /* =====================================================
     REPORT COUNTS
     ===================================================== */

  const reportCounts =
    useMemo(() => {
      const total =
        reportEvidence.length;

      const verified =
        reportEvidence.filter(
          (item) =>
            String(
              item.status || ""
            ).toLowerCase() ===
            "verified"
        ).length;

      const tampered =
        reportEvidence.filter(
          (item) =>
            String(
              item.status || ""
            ).toLowerCase() ===
            "tampered"
        ).length;

      const pending =
        total -
        verified -
        tampered;

      return {
        total,
        verified,
        tampered,
        pending,
      };
    }, [reportEvidence]);

  /* =====================================================
     REPORT PAGE
     ===================================================== */

  if (activePage === "reports") {
    return (
      <div className="investigator-layout">
        {renderSidebar()}

        <main className="investigator-main">
          {renderHeader(
            "Generate Investigation Report"
          )}

          <section className="investigator-section">
            <div className="section-heading">
              <div>
                <h2>
                  Evidence Investigation Report
                </h2>

                <p>
                  Search an evidence record
                  or generate a report for
                  an entire case.
                </p>
              </div>

              <button
                type="button"
                className="view-all-button"
                onClick={async () => {
                  setReportError("");

                  await Promise.all([
                    fetchCases(),
                    fetchEvidence(),
                  ]);

                  if (
                    reportMode ===
                    "case" &&
                    selectedCaseId
                  ) {
                    await loadReport(
                      selectedCaseId
                    );
                  }

                  if (
                    reportMode ===
                    "evidence" &&
                    evidenceSearchId
                  ) {
                    await searchEvidenceReport();
                  }
                }}
              >
                <RefreshCw size={17} />

                Refresh
              </button>
            </div>

            {/* REPORT MODE */}

            <div
              style={{
                background:
                  "#ffffff",
                border:
                  "1px dashed #d8d4fe",
                borderRadius:
                  "16px",
                padding:
                  "24px",
                marginBottom:
                  "20px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  gap: "10px",
                  marginBottom:
                    "22px",
                  flexWrap:
                    "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setReportMode(
                      "evidence"
                    );
                    setReportError(
                      ""
                    );
                    setReportEvidence(
                      []
                    );
                    setReportCase(
                      null
                    );
                  }}
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "8px",
                    padding:
                      "11px 18px",
                    borderRadius:
                      "10px",
                    border:
                      reportMode ===
                      "evidence"
                        ? "none"
                        : "1px solid #ddd6fe",
                    background:
                      reportMode ===
                      "evidence"
                        ? "#7c3aed"
                        : "#ffffff",
                    color:
                      reportMode ===
                      "evidence"
                        ? "#ffffff"
                        : "#6d28d9",
                    fontWeight:
                      700,
                    cursor:
                      "pointer",
                  }}
                >
                  <Search
                    size={17}
                  />

                  Evidence ID Search
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReportMode(
                      "case"
                    );
                    setReportError(
                      ""
                    );
                    setSearchedEvidence(
                      null
                    );
                    setReportEvidence(
                      []
                    );
                    setReportCase(
                      null
                    );
                  }}
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "8px",
                    padding:
                      "11px 18px",
                    borderRadius:
                      "10px",
                    border:
                      reportMode ===
                      "case"
                        ? "none"
                        : "1px solid #ddd6fe",
                    background:
                      reportMode ===
                      "case"
                        ? "#7c3aed"
                        : "#ffffff",
                    color:
                      reportMode ===
                      "case"
                        ? "#ffffff"
                        : "#6d28d9",
                    fontWeight:
                      700,
                    cursor:
                      "pointer",
                  }}
                >
                  <FileText
                    size={17}
                  />

                  Case Selection
                </button>
              </div>

              {/* EVIDENCE ID SEARCH */}

              {reportMode ===
                "evidence" && (
                <div
                  style={{
                    maxWidth:
                      "620px",
                    margin:
                      "0 auto",
                  }}
                >
                  <label
                    htmlFor="evidence-report-search"
                    style={{
                      display:
                        "block",
                      fontWeight:
                        700,
                      marginBottom:
                        "9px",
                      color:
                        "#172554",
                    }}
                  >
                    Search Evidence ID
                  </label>

                  <div
                    style={{
                      display:
                        "flex",
                      gap: "10px",
                      alignItems:
                        "center",
                    }}
                  >
                    <input
                      id="evidence-report-search"
                      type="text"
                      value={
                        evidenceSearchId
                      }
                      onChange={(
                        event
                      ) =>
                        setEvidenceSearchId(
                          event
                            .target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          searchEvidenceReport();
                        }
                      }}
                      placeholder="Example: EVD-422D9E68"
                      style={{
                        flex:
                          1,
                        padding:
                          "13px 14px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "10px",
                        fontSize:
                          "14px",
                        outline:
                          "none",
                      }}
                    />

                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        searchEvidenceReport
                      }
                    >
                      <Search
                        size={17}
                      />

                      Search
                    </button>
                  </div>

                  <p
                    style={{
                      margin:
                        "9px 0 0",
                      color:
                        "#64748b",
                      fontSize:
                        "13px",
                    }}
                  >
                    Enter any previously
                    uploaded Evidence ID.
                    It does not need to be
                    newly uploaded.
                  </p>
                </div>
              )}

              {/* CASE SELECTION */}

              {reportMode ===
                "case" && (
                <div
                  style={{
                    maxWidth:
                      "720px",
                    margin:
                      "0 auto",
                  }}
                >
                  <label
                    htmlFor="report-case"
                    style={{
                      display:
                        "block",
                      fontWeight:
                        700,
                      marginBottom:
                        "10px",
                      color:
                        "#172554",
                    }}
                  >
                    Select Case
                  </label>

                  <select
                    id="report-case"
                    value={
                      selectedCaseId
                    }
                    onChange={async (
                      event
                    ) => {
                      const value =
                        event
                          .target
                          .value;

                      setSelectedCaseId(
                        value
                      );
                      setSearchedEvidence(
                        null
                      );
                      setReportCase(
                        null
                      );

                      if (value) {
                        await loadReport(
                          value
                        );
                      } else {
                        setReportEvidence(
                          []
                        );
                      }
                    }}
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px 14px",
                      borderRadius:
                        "10px",
                      border:
                        "1px solid #d1d5db",
                      background:
                        "#ffffff",
                      fontSize:
                        "14px",
                      outline:
                        "none",
                    }}
                  >
                    <option value="">
                      -- Select a case --
                    </option>

                    {cases.map(
                      (item) => (
                        <option
                          key={
                            item.case_id
                          }
                          value={
                            item.case_id
                          }
                        >
                          {
                            item.case_number
                          }{" "}
                          -{" "}
                          {
                            item.title
                          }
                        </option>
                      )
                    )}
                  </select>

                  {cases.length ===
                    0 && (
                    <p
                      style={{
                        marginTop:
                          "10px",
                        color:
                          "#6b7280",
                        fontSize:
                          "13px",
                      }}
                    >
                      No cases found.
                      Make sure the
                      backend is running
                      and cases exist.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ERROR */}

            {reportError && (
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                  padding:
                    "14px 16px",
                  marginBottom:
                    "20px",
                  borderRadius:
                    "10px",
                  background:
                    "#fef2f2",
                  color:
                    "#b91c1c",
                  border:
                    "1px solid #fecaca",
                }}
              >
                <AlertTriangle
                  size={19}
                />

                <span>
                  {reportError}
                </span>
              </div>
            )}

            {/* LOADING */}

            {loadingReport && (
              <div
                style={{
                  background:
                    "#ffffff",
                  borderRadius:
                    "16px",
                  padding:
                    "35px",
                  textAlign:
                    "center",
                  border:
                    "1px solid #e5e7eb",
                  marginBottom:
                    "20px",
                }}
              >
                <RefreshCw
                  size={30}
                  style={{
                    animation:
                      "spin 1s linear infinite",
                  }}
                />

                <p
                  style={{
                    marginTop:
                      "12px",
                    color:
                      "#64748b",
                  }}
                >
                  Loading report
                  data...
                </p>
              </div>
            )}

            {/* ACTUAL REPORT */}

            {!loadingReport &&
              selectedCase &&
              reportEvidence.length >
                0 && (
                <div
                  id="investigation-report"
                  style={{
                    background:
                      "#ffffff",
                    borderRadius:
                      "16px",
                    border:
                      "1px solid #dbe3f0",
                    padding:
                      "32px",
                    boxShadow:
                      "0 8px 25px rgba(15, 23, 42, 0.06)",
                  }}
                >
                  {/* REPORT HEADER */}

                  <div
                    style={{
                      textAlign:
                        "center",
                      borderBottom:
                        "2px solid #e5e7eb",
                      paddingBottom:
                        "20px",
                      marginBottom:
                        "25px",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "13px",
                        fontWeight:
                          700,
                        letterSpacing:
                          "1.5px",
                        color:
                          "#7c3aed",
                      }}
                    >
                      SECURE DIGITAL
                      EVIDENCE
                      MANAGEMENT
                      SYSTEM
                    </div>

                    <h2
                      style={{
                        margin:
                          "10px 0 6px",
                        fontSize:
                          "27px",
                        color:
                          "#172554",
                      }}
                    >
                      INVESTIGATION
                      REPORT
                    </h2>

                    <p
                      style={{
                        margin:
                          0,
                        color:
                          "#64748b",
                      }}
                    >
                      Digital Evidence
                      Investigation
                      Summary
                    </p>
                  </div>

                  {/* EVIDENCE IDENTIFICATION */}

                  {reportMode ===
                    "evidence" &&
                    searchedEvidence && (
                      <div
                        style={{
                          marginBottom:
                            "28px",
                        }}
                      >
                        <h3
                          style={{
                            color:
                              "#172554",
                            marginBottom:
                              "14px",
                          }}
                        >
                          Evidence Identification
                        </h3>

                        <div
                          style={{
                            padding:
                              "16px",
                            background:
                              "#f5f3ff",
                            border:
                              "1px solid #ddd6fe",
                            borderRadius:
                              "12px",
                          }}
                        >
                          <strong>
                            Evidence ID
                          </strong>

                          <p
                            style={{
                              margin:
                                "7px 0 0",
                              color:
                                "#6d28d9",
                              fontWeight:
                                800,
                            }}
                          >
                            {
                              searchedEvidence.evidence_id
                            }
                          </p>
                        </div>
                      </div>
                    )}

                  {/* CASE INFORMATION */}

                  {selectedCase && (
                    <div
                      style={{
                        marginBottom:
                          "28px",
                      }}
                    >
                      <h3
                        style={{
                          color:
                            "#172554",
                          marginBottom:
                            "14px",
                        }}
                      >
                        Case Information
                      </h3>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                          gap:
                            "14px",
                        }}
                      >
                        <ReportInfo
                          label="Case ID"
                          value={
                            selectedCase.case_id
                          }
                        />

                        <ReportInfo
                          label="Case Number"
                          value={
                            selectedCase.case_number
                          }
                        />

                        <ReportInfo
                          label="Case Title"
                          value={
                            selectedCase.title
                          }
                        />

                        <ReportInfo
                          label="Status"
                          value={
                            selectedCase.status
                          }
                        />

                        <ReportInfo
                          label="Created By"
                          value={
                            selectedCase.created_by_name ||
                            username
                          }
                        />

                        <ReportInfo
                          label="Created At"
                          value={formatDate(
                            selectedCase.created_at
                          )}
                        />
                      </div>

                      {selectedCase.description && (
                        <div
                          style={{
                            marginTop:
                              "14px",
                            padding:
                              "14px",
                            background:
                              "#f8fafc",
                            borderRadius:
                              "10px",
                          }}
                        >
                          <strong>
                            Description
                          </strong>

                          <p
                            style={{
                              margin:
                                "7px 0 0",
                              color:
                                "#475569",
                            }}
                          >
                            {
                              selectedCase.description
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUMMARY */}

                  <div
                    style={{
                      marginBottom:
                        "28px",
                    }}
                  >
                    <h3
                      style={{
                        color:
                          "#172554",
                        marginBottom:
                          "14px",
                      }}
                    >
                      Evidence Summary
                    </h3>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(4, minmax(0, 1fr))",
                        gap:
                          "12px",
                      }}
                    >
                      <ReportStat
                        label="Total Evidence"
                        value={
                          reportCounts.total
                        }
                      />

                      <ReportStat
                        label="Verified"
                        value={
                          reportCounts.verified
                        }
                      />

                      <ReportStat
                        label="Tampered"
                        value={
                          reportCounts.tampered
                        }
                      />

                      <ReportStat
                        label="Pending"
                        value={
                          reportCounts.pending
                        }
                      />
                    </div>
                  </div>

                  {/* EVIDENCE TABLE */}

                  <div
                    style={{
                      marginBottom:
                        "28px",
                    }}
                  >
                    <h3
                      style={{
                        color:
                          "#172554",
                        marginBottom:
                          "14px",
                      }}
                    >
                      Evidence Details
                    </h3>

                    <div
                      style={{
                        overflowX:
                          "auto",
                      }}
                    >
                      <table
                        style={{
                          width:
                            "100%",
                          borderCollapse:
                            "collapse",
                          fontSize:
                            "13px",
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={
                                tableHeaderStyle
                              }
                            >
                              Evidence ID
                            </th>

                            <th
                              style={
                                tableHeaderStyle
                              }
                            >
                              File
                            </th>

                            <th
                              style={
                                tableHeaderStyle
                              }
                            >
                              Size
                            </th>

                            <th
                              style={
                                tableHeaderStyle
                              }
                            >
                              Status
                            </th>

                            <th
                              style={
                                tableHeaderStyle
                              }
                            >
                              SHA-256
                            </th>

                            <th
                              style={
                                tableHeaderStyle
                              }
                            >
                              Uploaded
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {reportEvidence.map(
                            (
                              item
                            ) => (
                              <tr
                                key={
                                  item.evidence_id
                                }
                              >
                                <td
                                  style={
                                    tableCellStyle
                                  }
                                >
                                  {
                                    item.evidence_id
                                  }
                                </td>

                                <td
                                  style={
                                    tableCellStyle
                                  }
                                >
                                  <strong>
                                    {
                                      item.file_name
                                    }
                                  </strong>

                                  {item.title && (
                                    <div
                                      style={{
                                        color:
                                          "#64748b",
                                        marginTop:
                                          "3px",
                                      }}
                                    >
                                      {
                                        item.title
                                      }
                                    </div>
                                  )}
                                </td>

                                <td
                                  style={
                                    tableCellStyle
                                  }
                                >
                                  {formatFileSize(
                                    item.file_size
                                  )}
                                </td>

                                <td
                                  style={
                                    tableCellStyle
                                  }
                                >
                                  <span
                                    style={{
                                      display:
                                        "inline-flex",
                                      alignItems:
                                        "center",
                                      gap:
                                        "5px",
                                      padding:
                                        "5px 9px",
                                      borderRadius:
                                        "999px",
                                      background:
                                        getStatusBackground(
                                          item.status
                                        ),
                                      color:
                                        getStatusColor(
                                          item.status
                                        ),
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {
                                      item.status ||
                                      "Unknown"
                                    }
                                  </span>
                                </td>

                                <td
                                  style={{
                                    ...tableCellStyle,
                                    maxWidth:
                                      "230px",
                                    wordBreak:
                                      "break-all",
                                  }}
                                >
                                  {
                                    item.sha256_hash ||
                                    "N/A"
                                  }
                                </td>

                                <td
                                  style={
                                    tableCellStyle
                                  }
                                >
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
                  </div>

                  {/* INTEGRITY INFORMATION */}

                  <div
                    style={{
                      marginBottom:
                        "28px",
                    }}
                  >
                    <h3
                      style={{
                        color:
                          "#172554",
                        marginBottom:
                          "14px",
                      }}
                    >
                      Integrity Verification
                    </h3>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap:
                          "14px",
                      }}
                    >
                      <div
                        style={{
                          padding:
                            "16px",
                          borderRadius:
                            "12px",
                          background:
                            "#f8fafc",
                          border:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <strong>
                          SHA-256
                        </strong>

                        <p
                          style={{
                            margin:
                              "7px 0 0",
                            color:
                              "#475569",
                          }}
                        >
                          SHA-256 hashes
                          are recorded
                          for the evidence
                          listed above.
                        </p>
                      </div>

                      <div
                        style={{
                          padding:
                            "16px",
                          borderRadius:
                            "12px",
                          background:
                            "#f8fafc",
                          border:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <strong>
                          HMAC-SHA256
                        </strong>

                        <p
                          style={{
                            margin:
                              "7px 0 0",
                            color:
                              "#475569",
                          }}
                        >
                          HMAC authentication
                          values are recorded
                          for evidence integrity.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CUSTODY + AUDIT */}

                  <div
                    style={{
                      marginBottom:
                        "28px",
                    }}
                  >
                    <h3
                      style={{
                        color:
                          "#172554",
                        marginBottom:
                          "14px",
                      }}
                    >
                      Chain of Custody &
                      Audit Summary
                    </h3>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(2, minmax(0, 1fr))",
                        gap:
                          "14px",
                      }}
                    >
                      <div
                        style={{
                          padding:
                            "18px",
                          borderRadius:
                            "12px",
                          background:
                            "#f8fafc",
                          border:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <strong>
                          Chain of Custody
                        </strong>

                        <p
                          style={{
                            margin:
                              "10px 0 0",
                            fontSize:
                              "24px",
                            fontWeight:
                              800,
                            color:
                              "#7c3aed",
                          }}
                        >
                          {reportEvidence.reduce(
                            (
                              total,
                              item
                            ) =>
                              total +
                              item.custodyCount,
                            0
                          )}
                        </p>

                        <span
                          style={{
                            color:
                              "#64748b",
                            fontSize:
                              "13px",
                          }}
                        >
                          Total custody
                          records
                        </span>
                      </div>

                      <div
                        style={{
                          padding:
                            "18px",
                          borderRadius:
                            "12px",
                          background:
                            "#f8fafc",
                          border:
                            "1px solid #e2e8f0",
                        }}
                      >
                        <strong>
                          Audit Logs
                        </strong>

                        <p
                          style={{
                            margin:
                              "10px 0 0",
                            fontSize:
                              "24px",
                            fontWeight:
                              800,
                            color:
                              "#2563eb",
                          }}
                        >
                          {reportEvidence.reduce(
                            (
                              total,
                              item
                            ) =>
                              total +
                              item.auditCount,
                            0
                          )}
                        </p>

                        <span
                          style={{
                            color:
                              "#64748b",
                            fontSize:
                              "13px",
                          }}
                        >
                          Total audit
                          records
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* REPORT FOOTER */}

                  <div
                    style={{
                      borderTop:
                        "1px solid #e5e7eb",
                      paddingTop:
                        "18px",
                      color:
                        "#64748b",
                      fontSize:
                        "12px",
                    }}
                  >
                    <p>
                      Report generated by:{" "}
                      <strong>
                        {username}
                      </strong>
                    </p>

                    <p>
                      Generated at:{" "}
                      {new Date().toLocaleString()}
                    </p>
                  </div>

                  {/* ACTIONS */}

                  <div
                    className="report-actions"
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "center",
                      gap:
                        "12px",
                      marginTop:
                        "25px",
                    }}
                  >
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        window.print()
                      }
                    >
                      <Printer
                        size={18}
                      />

                      Print / Save as PDF
                    </button>

                    <button
                      type="button"
                      className="view-all-button"
                      onClick={
                        goToDashboard
                      }
                    >
                      <ArrowLeft
                        size={17}
                      />

                      Back to Dashboard
                    </button>
                  </div>
                </div>
              )}

            {/* NO REPORT / NO CASE */}

            {!loadingReport &&
              reportEvidence.length ===
                0 && (
                <div className="empty-case-card">
                  <div className="empty-case-icon">
                    <FileText
                      size={35}
                    />
                  </div>

                  <h3>
                    {reportMode ===
                    "evidence"
                      ? "Search or Select a Case"
                      : "Select a Case"}
                  </h3>

                  <p>
                    {reportMode ===
                    "evidence"
                      ? "Search an existing Evidence ID or select a Case to generate the investigation report."
                      : "Select a case above to generate the investigation report."}
                  </p>

                  <button
                    type="button"
                    className="view-all-button"
                    onClick={
                      goToDashboard
                    }
                  >
                    <ArrowLeft
                      size={17}
                    />

                    Back to Dashboard
                  </button>
                </div>
              )}
          </section>
        </main>

        {/* PRINT STYLES */}

        <style>
          {`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }

            @media print {
              body {
                background: white !important;
              }

              .investigator-sidebar,
              .investigator-header,
              .section-heading,
              #report-case,
              .report-actions {
                display: none !important;
              }

              .investigator-layout {
                display: block !important;
              }

              .investigator-main {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .investigator-section {
                padding: 0 !important;
                margin: 0 !important;
              }

              #investigation-report {
                box-shadow: none !important;
                border: none !important;
                padding: 20px !important;
              }

              table {
                page-break-inside: auto;
              }

              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }

              h2,
              h3 {
                page-break-after: avoid;
              }
            }
          `}
        </style>
      </div>
    );
  }

  /* =====================================================
     CASES
     ===================================================== */

  if (activePage === "cases") {
    return (
      <Evidence
        onBack={goToDashboard}
        onUpload={() =>
          setActivePage("upload")
        }
      />
    );
  }

  /* =====================================================
     UPLOAD EVIDENCE
     ===================================================== */

  if (activePage === "upload") {
    return (
      <UploadEvidence
        onBack={goToDashboard}
      />
    );
  }

  /* =====================================================
     VERIFICATION
     ===================================================== */

  if (
    activePage ===
    "verification"
  ) {
    return (
      <Verification
        onBack={goToDashboard}
      />
    );
  }

  /* =====================================================
     CHAIN OF CUSTODY
     ===================================================== */

  if (activePage === "custody") {
    return (
      <ChainOfCustody
        onBack={goToDashboard}
      />
    );
  }

  /* =====================================================
     DASHBOARD STATISTICS
     ===================================================== */

  const activeCasesCount =
    cases.filter(
      (item) =>
        String(
          item.status || ""
        ).toLowerCase() ===
        "open"
    ).length;

  const myEvidenceCount =
    evidenceList.filter(
      (item) =>
        String(
          item.uploaded_by_name ||
            ""
        ).toLowerCase() ===
        username.toLowerCase()
    ).length ||
    evidenceList.length;

  const verifiedCount =
    evidenceList.filter(
      (item) =>
        String(
          item.status || ""
        ).toLowerCase() ===
        "verified"
    ).length;

  const pendingCount =
    evidenceList.filter(
      (item) => {
        const status =
          String(
            item.status || ""
          ).toLowerCase();

        return (
          status !== "verified" &&
          status !== "tampered"
        );
      }
    ).length;

  /* =====================================================
     MAIN DASHBOARD
     ===================================================== */

  return (
    <div className="investigator-layout">
      {renderSidebar()}

      <main className="investigator-main">
        {renderHeader(
          "Evidence Investigation"
        )}

        {/* WELCOME */}

        <section className="investigator-welcome">
          <div>
            <p className="welcome-small">
              SECURE EVIDENCE MANAGEMENT
            </p>

            <h2>
              Welcome back{" "}
              <span>{username}</span>
            </h2>

            <p>
              Manage cases, upload
              digital evidence, verify
              integrity, track chain of
              custody and generate
              investigation reports.
            </p>
          </div>

          <div className="welcome-shield">
            <ShieldCheck size={72} />
          </div>
        </section>

        {/* QUICK STATS */}

        <section className="investigator-stats">
          <div className="investigator-stat-card blue">
            <div className="stat-icon">
              <FolderOpen
                size={24}
              />
            </div>

            <div>
              <span>
                Active Cases
              </span>

              <strong>
                {dashboardLoading
                  ? "..."
                  : activeCasesCount}
              </strong>
            </div>
          </div>

          <div className="investigator-stat-card purple">
            <div className="stat-icon">
              <Files size={24} />
            </div>

            <div>
              <span>
                My Evidence
              </span>

              <strong>
                {dashboardLoading
                  ? "..."
                  : myEvidenceCount}
              </strong>
            </div>
          </div>

          <div className="investigator-stat-card green">
            <div className="stat-icon">
              <CheckCircle2
                size={24}
              />
            </div>

            <div>
              <span>
                Verified
              </span>

              <strong>
                {dashboardLoading
                  ? "..."
                  : verifiedCount}
              </strong>
            </div>
          </div>

          <div className="investigator-stat-card orange">
            <div className="stat-icon">
              <Clock3 size={24} />
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong>
                {dashboardLoading
                  ? "..."
                  : pendingCount}
              </strong>
            </div>
          </div>
        </section>

        {/* INVESTIGATION ACTIONS */}

        <section className="investigator-section">
          <div className="section-heading">
            <div>
              <h2>
                Investigation Actions
              </h2>

              <p>
                Start your evidence
                investigation workflow.
              </p>
            </div>
          </div>

          <div className="investigator-actions">
            {/* CASES */}

            <button
              type="button"
              className="action-card"
              onClick={() =>
                handleMenuClick(
                  "cases"
                )
              }
            >
              <div className="action-icon purple">
                <Plus size={26} />
              </div>

              <div>
                <h3>
                  Create / Select Case
                </h3>

                <p>
                  Create a new case or
                  continue an existing
                  investigation.
                </p>
              </div>
            </button>

            {/* UPLOAD */}

            <button
              type="button"
              className="action-card"
              onClick={() =>
                handleMenuClick(
                  "upload"
                )
              }
            >
              <div className="action-icon blue">
                <UploadCloud
                  size={26}
                />
              </div>

              <div>
                <h3>
                  Upload Evidence
                </h3>

                <p>
                  Upload files and enter
                  evidence details.
                </p>
              </div>
            </button>

            {/* VERIFICATION */}

            <button
              type="button"
              className="action-card"
              onClick={() =>
                handleMenuClick(
                  "verification"
                )
              }
            >
              <div className="action-icon green">
                <ShieldCheck
                  size={26}
                />
              </div>

              <div>
                <h3>
                  Verify Evidence
                </h3>

                <p>
                  Check SHA-256 and HMAC
                  integrity.
                </p>
              </div>
            </button>

            {/* CUSTODY */}

            <button
              type="button"
              className="action-card"
              onClick={() =>
                handleMenuClick(
                  "custody"
                )
              }
            >
              <div className="action-icon pink">
                <Link2 size={26} />
              </div>

              <div>
                <h3>
                  Chain of Custody
                </h3>

                <p>
                  View evidence custody
                  and activity history.
                </p>
              </div>
            </button>

            {/* REPORT */}

            <button
              type="button"
              className="action-card"
              onClick={() =>
                handleMenuClick(
                  "reports"
                )
              }
            >
              <div className="action-icon orange">
                <FileText
                  size={26}
                />
              </div>

              <div>
                <h3>
                  Generate Report
                </h3>

                <p>
                  Create an investigation
                  evidence report.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* CURRENT INVESTIGATION */}

        <section className="investigator-section">
          <div className="section-heading">
            <div>
              <h2>
                Current Investigation
              </h2>

              <p>
                Select a case to start
                managing evidence.
              </p>
            </div>

            <button
              type="button"
              className="view-all-button"
              onClick={() =>
                handleMenuClick(
                  "cases"
                )
              }
            >
              <Search size={17} />

              View Cases
            </button>
          </div>

          <div className="empty-case-card">
            <div className="empty-case-icon">
              <FolderOpen
                size={35}
              />
            </div>

            <h3>
              No Case Selected
            </h3>

            <p>
              Create a new case or
              select an existing case
              before uploading evidence.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                handleMenuClick(
                  "cases"
                )
              }
            >
              <Plus size={18} />

              Create / Select Case
            </button>
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
};
     

        
/* =========================================================
   REPORT INFO COMPONENT
   ========================================================= */

interface ReportInfoProps {
  label: string;
  value: string | number;
}

const ReportInfo: React.FC<
  ReportInfoProps
> = ({
  label,
  value,
}) => {
  return (
    <div
      style={{
        padding: "14px",
        background:
          "#f8fafc",
        borderRadius:
          "10px",
        border:
          "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize:
            "11px",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.7px",
          color:
            "#64748b",
          marginBottom:
            "5px",
          fontWeight:
            700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight:
            700,
          color:
            "#172554",
          wordBreak:
            "break-word",
        }}
      >
        {value || "N/A"}
      </div>
    </div>
  );
};

/* =========================================================
   REPORT STAT COMPONENT
   ========================================================= */

interface ReportStatProps {
  label: string;
  value: number;
}

const ReportStat: React.FC<
  ReportStatProps
> = ({
  label,
  value,
}) => {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius:
          "12px",
        background:
          "#f8fafc",
        border:
          "1px solid #e2e8f0",
        textAlign:
          "center",
      }}
    >
      <div
        style={{
          fontSize:
            "25px",
          fontWeight:
            800,
          color:
            "#7c3aed",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop:
            "5px",
          fontSize:
            "12px",
          color:
            "#64748b",
          fontWeight:
            600,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/* =========================================================
   TABLE STYLES
   ========================================================= */

const tableHeaderStyle: React.CSSProperties =
  {
    textAlign:
      "left",
    padding:
      "11px",
    background:
      "#f8fafc",
    borderBottom:
      "1px solid #e2e8f0",
    color:
      "#475569",
    fontWeight:
      700,
  };

const tableCellStyle: React.CSSProperties =
  {
    padding:
      "12px 11px",
    borderBottom:
      "1px solid #e5e7eb",
    verticalAlign:
      "top",
    color:
      "#334155",
  };

/* =========================================================
   STATUS COLORS
   ========================================================= */

const getStatusColor = (
  status?: string | null
) => {
  const value =
    String(
      status || ""
    ).toLowerCase();

  if (
    value ===
    "verified"
  ) {
    return "#15803d";
  }

  if (
    value ===
    "tampered"
  ) {
    return "#b91c1c";
  }

  if (
    value ===
    "encrypted"
  ) {
    return "#7c3aed";
  }

  return "#b45309";
};

const getStatusBackground = (
  status?: string | null
) => {
  const value =
    String(
      status || ""
    ).toLowerCase();

  if (
    value ===
    "verified"
  ) {
    return "#dcfce7";
  }

  if (
    value ===
    "tampered"
  ) {
    return "#fee2e2";
  }

  if (
    value ===
    "encrypted"
  ) {
    return "#ede9fe";
  }

  return "#fef3c7";
};

export default InvestigatorDashboard;