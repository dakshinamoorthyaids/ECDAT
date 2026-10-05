import "./ChainOfCustody.css";

import {
  useState,
  type KeyboardEvent,
} from "react";

import {
  ArrowLeft,
  ShieldCheck,
  Clock3,
  UserRound,
  Search,
  RefreshCw,
  Globe2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Eye,
  Database,
  LockKeyhole,
  X,
  CalendarDays,
  Activity,
  CircleCheck,
} from "lucide-react";

/* =========================================================
   TYPES
   ========================================================= */

type CustodyRecord = {
  id: number;
  evidence_id: number;
  user_id: number;
  user_name?: string | null;
  action: string;
  description?: string | null;
  remarks?: string | null;
  ip_address?: string | null;
  created_at: string;
};

type CustodyResponse = {
  evidence_id: string;
  file_name: string;
  total_records: number;
  custody?: CustodyRecord[];
  records?: CustodyRecord[];
  chain_of_custody?: CustodyRecord[];
};

type Props = {
  onBack: () => void;
};

/* =========================================================
   API
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000";

/* =========================================================
   COMPONENT
   ========================================================= */

function ChainOfCustody({ onBack }: Props) {
  const [evidenceId, setEvidenceId] = useState(
    () => localStorage.getItem("selectedEvidenceId") || ""
  );
  const [records, setRecords] = useState<CustodyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error" | "">("");

  const [searched, setSearched] = useState(false);
  const [fileName, setFileName] = useState("");
  const [firstRecordDate, setFirstRecordDate] =
    useState("");

  /* =======================================================
     LOAD CHAIN OF CUSTODY
     ======================================================= */

  const loadCustody = async () => {
    const trimmedEvidenceId =
      evidenceId.trim();

    if (!trimmedEvidenceId) {
      setMessage("Please enter Evidence ID.");
      setMessageType("error");

      setRecords([]);
      setFileName("");
      setFirstRecordDate("");
      setSearched(false);

      return;
    }

    setLoading(true);

    setMessage("");
    setMessageType("");

    setRecords([]);
    setFileName("");
    setFirstRecordDate("");
    setSearched(false);

    try {
      const response = await fetch(
        `${API_BASE}/evidence/custody/${encodeURIComponent(
          trimmedEvidenceId
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data &&
          typeof data === "object" &&
          "detail" in data
            ? String(data.detail)
            : "Failed to load custody records.";

        throw new Error(errorMessage);
      }

      const custodyData =
        data as CustodyResponse;

      const custodyRecords =
        custodyData.custody ||
        custodyData.records ||
        custodyData.chain_of_custody ||
        [];

      setRecords(custodyRecords);

      setFileName(
        custodyData.file_name || ""
      );

      setFirstRecordDate(
        custodyRecords[0]?.created_at || ""
      );

      setSearched(true);

      if (custodyRecords.length > 0) {
        setMessage(
          "Evidence ID found. Showing custody history."
        );

        setMessageType("success");
      } else {
        setMessage(
          "No Chain of Custody records found for this evidence."
        );

        setMessageType("error");
      }
    } catch (error) {
      console.error(
        "Chain of Custody error:",
        error
      );

      setRecords([]);
      setFileName("");
      setFirstRecordDate("");

      setSearched(true);

      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Chain of Custody records."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     ENTER KEY
     ======================================================= */

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      loadCustody();
    }
  };

  /* =======================================================
     CLEAR SEARCH
     ======================================================= */

  const clearSearch = () => {
    setEvidenceId("");
    setRecords([]);
    setFileName("");
    setFirstRecordDate("");

    setMessage("");
    setMessageType("");

    setSearched(false);

    localStorage.removeItem(
      "selectedEvidenceId"
    );
  };

  /* =======================================================
     NORMALIZE ACTION
     ======================================================= */

  const normalizedAction = (
    action: string
  ) => {
    return action.toLowerCase();
  };

  /* =======================================================
     ACTION CLASS
     ======================================================= */

  const getActionClass = (
    action: string
  ) => {
    const normalized =
      normalizedAction(action);

    if (
      normalized.includes("tamper")
    ) {
      return "custody-action-tampered";
    }

    if (
      normalized.includes("verified") ||
      normalized.includes("verify")
    ) {
      return "custody-action-verified";
    }

    if (
      normalized.includes("view")
    ) {
      return "custody-action-viewed";
    }

    if (
      normalized.includes("delete")
    ) {
      return "custody-action-delete";
    }

    if (
      normalized.includes("upload") ||
      normalized.includes("collect")
    ) {
      return "custody-action-upload";
    }

    return "custody-action-default";
  };

  /* =======================================================
     ACTION ICON
     ======================================================= */

  const getActionIcon = (
    action: string
  ) => {
    const normalized =
      normalizedAction(action);

    if (
      normalized.includes("tamper")
    ) {
      return (
        <AlertTriangle
          size={20}
          strokeWidth={2.4}
        />
      );
    }

    if (
      normalized.includes("verified") ||
      normalized.includes("verify")
    ) {
      return (
        <CheckCircle2
          size={20}
          strokeWidth={2.4}
        />
      );
    }

    if (
      normalized.includes("view")
    ) {
      return (
        <Eye
          size={20}
          strokeWidth={2.4}
        />
      );
    }

    if (
      normalized.includes("upload") ||
      normalized.includes("collect")
    ) {
      return (
        <UploadCloud
          size={20}
          strokeWidth={2.4}
        />
      );
    }

    return (
      <Activity
        size={20}
        strokeWidth={2.4}
      />
    );
  };

  /* =======================================================
     ACTION SUBTITLE
     ======================================================= */

  const getActionSubtitle = (
    record: CustodyRecord
  ) => {
    const normalized =
      normalizedAction(record.action);

    if (
      normalized.includes("upload") ||
      normalized.includes("collect")
    ) {
      return (
        record.description ||
        "Evidence uploaded and securely encrypted."
      );
    }

    if (
      normalized.includes("verified") ||
      normalized.includes("verify")
    ) {
      return (
        record.remarks ||
        "Integrity verification completed successfully."
      );
    }

    if (
      normalized.includes("tamper")
    ) {
      return (
        record.remarks ||
        "Integrity verification detected a mismatch."
      );
    }

    if (
      normalized.includes("view")
    ) {
      return (
        record.remarks ||
        "Evidence was viewed."
      );
    }

    return (
      record.remarks ||
      record.description ||
      "Evidence activity recorded."
    );
  };

  /* =======================================================
     FORMAT DATE
     ======================================================= */

  const formatDate = (
    value: string
  ) => {
    if (!value) {
      return "Unknown date";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  };

  /* =======================================================
     USER NAME
     ======================================================= */

  const getUserName = (
    record: CustodyRecord
  ) => {
    return (
      record.user_name?.trim() ||
      `User ${record.user_id}`
    );
  };

  /* =======================================================
     REMARKS
     ======================================================= */

  const getRemarks = (
    record: CustodyRecord
  ) => {
    return (
      record.remarks?.trim() ||
      "No remarks available."
    );
  };

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="coc-page">

      {/* BACKGROUND DECORATION */}

      <div className="coc-bg-orb coc-bg-orb-one" />

      <div className="coc-bg-orb coc-bg-orb-two" />


      <main className="coc-shell">

        {/* =================================================
            PAGE HEADER
            ================================================= */}

        <header className="coc-page-header">

          <button
            type="button"
            className="coc-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={20} />

            <span>
              Back
            </span>
          </button>


          <div className="coc-title-wrap">

            <div className="coc-title-icon">
              <ShieldCheck
                size={31}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1>
                Chain of Custody
              </h1>

              <p>
                Track every action performed
                on digital evidence.
              </p>
            </div>

          </div>


          <div className="coc-header-security">

            <div className="coc-lock-icon">
              <LockKeyhole
                size={28}
              />
            </div>


            <div className="coc-header-count">

              <Database size={18} />

              <strong>
                {records.length} records
              </strong>

            </div>

          </div>

        </header>


        {/* =================================================
            EVIDENCE HISTORY
            ================================================= */}

        <section className="coc-history-card">

          {/* BANNER */}

          <div className="coc-history-banner">

            <div className="coc-search-icon">
              <Search
                size={27}
                strokeWidth={2.4}
              />
            </div>

            <div>

              <h2>
                Evidence History
              </h2>

              <p>
                Search and view custody
                records for your evidence.
              </p>

            </div>

          </div>


          {/* SEARCH ROW */}

          <div className="coc-search-row">

            <div className="coc-input-wrap">

              <FileText size={21} />

              <input
                type="text"
                value={evidenceId}
                onChange={(event) =>
                  setEvidenceId(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Enter Evidence ID"
                disabled={loading}
              />


              {evidenceId && (
                <button
                  type="button"
                  className="coc-clear-button"
                  onClick={clearSearch}
                  aria-label="Clear Evidence ID"
                >
                  <X size={21} />
                </button>
              )}

            </div>


            <button
              type="button"
              className="coc-view-button"
              onClick={loadCustody}
              disabled={loading}
            >

              {loading ? (
                <>
                  <RefreshCw
                    size={19}
                    className="coc-spin"
                  />

                  <span>
                    Loading...
                  </span>
                </>
              ) : (
                <>
                  <Search size={20} />

                  <span>
                    View History
                  </span>
                </>
              )}

            </button>

          </div>


          {/* ALERT */}

          {message && (
            <div
              className={`coc-alert coc-alert-${messageType}`}
            >

              {messageType ===
              "success" ? (
                <CircleCheck
                  size={21}
                />
              ) : (
                <AlertTriangle
                  size={20}
                />
              )}

              <span>
                {message}
              </span>

            </div>
          )}


          {/* EVIDENCE SUMMARY */}

          {searched &&
            fileName && (
              <div className="coc-evidence-summary">

                <div className="coc-summary-item">

                  <div className="coc-summary-icon coc-summary-purple">
                    <FileText size={24} />
                  </div>

                  <div>
                    <span>
                      Evidence ID
                    </span>

                    <strong>
                      {evidenceId.trim()}
                    </strong>
                  </div>

                </div>


                <div className="coc-summary-divider" />


                <div className="coc-summary-item">

                  <div className="coc-summary-icon coc-summary-blue">
                    <FileText size={24} />
                  </div>

                  <div>
                    <span>
                      File Name
                    </span>

                    <strong>
                      {fileName}
                    </strong>
                  </div>

                </div>


                {firstRecordDate && (
                  <div className="coc-summary-date">

                    <CalendarDays
                      size={19}
                    />

                    <strong>
                      {formatDate(
                        firstRecordDate
                      )}
                    </strong>

                  </div>
                )}

              </div>
            )}

        </section>


        {/* =================================================
            CUSTODY TIMELINE
            ================================================= */}

        <section className="coc-timeline-card">

          {/* TIMELINE HEADER */}

          <div className="coc-timeline-header">

            <div className="coc-timeline-title">

              <div className="coc-timeline-title-icon">
                <Clock3 size={26} />
              </div>

              <div>

                <h2>
                  Custody Timeline
                </h2>

                <p>
                  Complete evidence activity history
                </p>

              </div>

            </div>


            <div className="coc-record-pill">

              <FileText size={18} />

              <strong>
                {records.length} records
              </strong>

            </div>

          </div>


          {/* LOADING */}

          {loading && (
            <div className="coc-empty-state">

              <RefreshCw
                size={34}
                className="coc-spin"
              />

              <p>
                Loading custody history...
              </p>

            </div>
          )}


          {/* BEFORE SEARCH */}

          {!loading &&
            !searched && (
              <div className="coc-empty-state">

                <ShieldCheck size={38} />

                <p>
                  Enter an Evidence ID
                  to view its Chain of
                  Custody.
                </p>

              </div>
            )}


          {/* NO RECORDS */}

          {!loading &&
            searched &&
            records.length === 0 && (
              <div className="coc-empty-state">

                <Activity size={38} />

                <p>
                  No custody records found.
                </p>

                <small>
                  Check the Evidence ID
                  and try again.
                </small>

              </div>
            )}


          {/* =================================================
              TIMELINE RECORDS
              ================================================= */}

          {!loading &&
            records.length > 0 && (
              <div className="coc-timeline">

                {records.map(
                  (record, index) => {

                    const actionClass =
                      getActionClass(
                        record.action
                      );

                    const isLast =
                      index ===
                      records.length - 1;

                    return (
                      <article
                        className={`coc-timeline-item ${actionClass}`}
                        key={
                          record.id ??
                          `${record.action}-${record.created_at}-${index}`
                        }
                      >

                        {/* TIMELINE RAIL */}

                        <div className="coc-timeline-rail">

                          <div className="coc-action-icon">
                            {getActionIcon(
                              record.action
                            )}
                          </div>


                          {!isLast && (
                            <div className="coc-timeline-line" />
                          )}

                        </div>


                        {/* EVENT CARD */}

                        <div className="coc-event-card">

                          {/* EVENT HEADER */}

                          <div className="coc-event-top">

                            <div className="coc-event-heading">

                              <span className="coc-step-number">
                                {String(
                                  index + 1
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </span>


                              <div className="coc-event-heading-text">

                                <h3>
                                  {record.action}
                                </h3>

                                <p>
                                  {getActionSubtitle(
                                    record
                                  )}
                                </p>

                              </div>

                            </div>


                            <div className="coc-event-date">

                              <CalendarDays
                                size={17}
                              />

                              <span>
                                {formatDate(
                                  record.created_at
                                )}
                              </span>

                            </div>

                          </div>


                          {/* =================================================
                              USER / ID / IP / REMARKS
                              ================================================= */}

                          <div className="coc-info-grid">

                            {/* USER */}

                            <div className="coc-info-box coc-info-user">

                              <div className="coc-info-icon">
                                <UserRound
                                  size={23}
                                />
                              </div>

                              <div className="coc-info-text">

                                <span>
                                  User
                                </span>

                                <strong>
                                  {getUserName(
                                    record
                                  )}
                                </strong>

                              </div>

                            </div>


                            {/* USER ID */}

                            <div className="coc-info-box coc-info-id">

                              <div className="coc-info-icon">
                                <ShieldCheck
                                  size={23}
                                />
                              </div>

                              <div className="coc-info-text">

                                <span>
                                  User ID
                                </span>

                                <strong>
                                  {record.user_id}
                                </strong>

                              </div>

                            </div>


                            {/* IP ADDRESS */}

                            <div className="coc-info-box coc-info-ip">

                              <div className="coc-info-icon">
                                <Globe2
                                  size={23}
                                />
                              </div>

                              <div className="coc-info-text">

                                <span>
                                  IP Address
                                </span>

                                <strong>
                                  {record.ip_address ||
                                    "Not recorded"}
                                </strong>

                              </div>

                            </div>


                            {/* REMARKS */}

                            <div className="coc-info-box coc-info-remarks">

                              <div className="coc-info-icon">
                                <FileText
                                  size={23}
                                />
                              </div>

                              <div className="coc-info-text coc-remarks-text">

                                <span>
                                  Remarks
                                </span>

                                <strong>
                                  {getRemarks(
                                    record
                                  )}
                                </strong>

                              </div>

                            </div>

                          </div>


                          {/* =================================================
                              DESCRIPTION
                              ================================================= */}

                          <div className="coc-description">

                            <div className="coc-description-icon">
                              <FileText
                                size={20}
                              />
                            </div>

                            <div className="coc-description-content">

                              <strong>
                                Description
                              </strong>

                              <p>
                                {record.description ||
                                  record.remarks ||
                                  "No description available."}
                              </p>

                            </div>

                          </div>

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

        </section>

      </main>
    </div>
  );
}

export default ChainOfCustody;