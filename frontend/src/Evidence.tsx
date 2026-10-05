import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Upload,
  Search,
  RefreshCw,
  FileText,
  ShieldCheck,
  CheckCircle2,
  TriangleAlert,
  Eye,
  CircleAlert,
  Lock,
  Trash2,
} from "lucide-react";

import "./Evidence.css";

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
  file_size?: number;
  created_at?: string | null;
}

interface EvidenceApiResponse {
  evidence?: Partial<EvidenceRecord>[];
}

interface ApiMessage {
  detail?: string;
  message?: string;
}

interface EvidenceProps {
  onBack: () => void;
  onUpload: () => void;
  readOnly?: boolean;
}

const API_BASE_URL =
  "http://127.0.0.1:8000";


/* =========================================================
   FILE TYPE
   ========================================================= */

function getFileType(fileName: string): string {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase() || "";

  if (
    [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "svg",
    ].includes(extension)
  ) {
    return "Image";
  }

  if (extension === "pdf") {
    return "PDF";
  }

  if (
    [
      "mp4",
      "mov",
      "avi",
      "mkv",
      "webm",
      "wmv",
      "m4v",
    ].includes(extension)
  ) {
    return "Video";
  }

  if (
    [
      "mp3",
      "wav",
      "aac",
      "flac",
      "ogg",
      "m4a",
    ].includes(extension)
  ) {
    return "Audio";
  }

  return "Document";
}


/* =========================================================
   FILE SIZE
   ========================================================= */

function formatFileSize(
  bytes?: number
): string {
  if (
    bytes === undefined ||
    bytes === null ||
    !Number.isFinite(bytes)
  ) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  if (
    bytes <
    1024 * 1024 * 1024
  ) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(2)} GB`;
}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


/* =========================================================
   FILE ICON
   ========================================================= */

function FileTypeIcon({
  type,
}: {
  type: string;
}) {
  const value =
    type.toLowerCase();

  if (value === "image") {
    return (
      <div className="evidence-file-icon image">
        <FileText size={18} />
      </div>
    );
  }

  if (value === "pdf") {
    return (
      <div className="evidence-file-icon pdf">
        <FileText size={18} />
      </div>
    );
  }

  if (value === "video") {
    return (
      <div className="evidence-file-icon video">
        <FileText size={18} />
      </div>
    );
  }

  if (value === "audio") {
    return (
      <div className="evidence-file-icon audio">
        <FileText size={18} />
      </div>
    );
  }

  return (
    <div className="evidence-file-icon document">
      <FileText size={18} />
    </div>
  );
}


/* =========================================================
   COMPONENT
   ========================================================= */

export default function Evidence({
  onBack,
  onUpload,
  readOnly = false,
}: EvidenceProps) {
  const [evidence, setEvidence] =
    useState<EvidenceRecord[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH EVIDENCE
     ======================================================= */

  const requestEvidence =
    async (): Promise<EvidenceRecord[]> => {
      const response = await fetch(
        `${API_BASE_URL}/evidence`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load evidence (${response.status})`
        );
      }

      const data: EvidenceApiResponse =
        await response.json();

      const backendEvidence = Array.isArray(
        data?.evidence
      )
        ? data.evidence
        : [];

      return backendEvidence.map(
        (item) => ({
              id: Number(
                item.id ?? 0
              ),

              evidence_id:
                String(
                  item.evidence_id ??
                  item.id ??
                  "Unknown"
                ),

              file_name:
                item.file_name ??
                "Evidence File",

              title:
                item.title ??
                "Untitled Evidence",

              file_path:
                item.file_path ??
                "",

              sha256_hash:
                item.sha256_hash ??
                "",

              hmac_hash:
                item.hmac_hash ??
                "",

              uploaded_by:
                Number(
                  item.uploaded_by ??
                  0
                ),

              status:
                item.status ??
                "Encrypted",

              file_size:
                item.file_size,

              created_at:
                item.created_at ??
                null,
        })
      );
    };

  const fetchEvidence = async () => {
    try {
      setEvidence(await requestEvidence());
      setError("");
    } catch (err) {
      console.error("Evidence fetch error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load evidence."
      );

      setEvidence([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    let active = true;

    const loadEvidence = async () => {
      try {
        const records = await requestEvidence();

        if (active) {
          setEvidence(records);
          setError("");
        }
      } catch (err) {
        console.error("Evidence fetch error:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load evidence."
          );
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


  /* =======================================================
     SEARCH
     ======================================================= */

  const filteredEvidence =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return evidence;
      }

      return evidence.filter(
        (item) =>
          item.evidence_id
            .toLowerCase()
            .includes(value) ||

          item.file_name
            .toLowerCase()
            .includes(value) ||

          item.title
            .toLowerCase()
            .includes(value) ||

          item.status
            .toLowerCase()
            .includes(value) ||

          item.sha256_hash
            .toLowerCase()
            .includes(value)
      );
    }, [
      evidence,
      search,
    ]);


  /* =======================================================
     COUNTS
     ======================================================= */

  const totalEvidence =
    evidence.length;

  const encryptedEvidence =
    evidence.filter(
      (item) =>
        item.status
          .toLowerCase() ===
        "encrypted"
    ).length;

  const verifiedEvidence =
    evidence.filter(
      (item) =>
        item.status
          .toLowerCase() ===
        "verified"
    ).length;

  const tamperedEvidence =
    evidence.filter(
      (item) =>
        item.status
          .toLowerCase() ===
        "tampered"
    ).length;


  /* =======================================================
     REFRESH
     ======================================================= */

  const handleRefresh =
    async () => {
      setRefreshing(true);
      await fetchEvidence();
    };


  /* =======================================================
     VERIFY
     ======================================================= */

  const verifyEvidence =
    async (
      evidenceId: string
    ) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/evidence/verify/${encodeURIComponent(
              evidenceId
            )}`
          );

        let data: ApiMessage = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          alert(
            data?.detail ||
              "Evidence verification failed."
          );

          return;
        }

        alert(
          data?.message ||
            `Verification completed for ${evidenceId}`
        );

        await fetchEvidence();
      } catch (err) {
        console.error(
          "Verification error:",
          err
        );

        alert(
          "Cannot connect to backend."
        );
      }
    };


  /* =======================================================
     VIEW
     ======================================================= */

  const viewEvidence =
  (item: EvidenceRecord) => {
    const url =
      `${API_BASE_URL}/evidence/view/${encodeURIComponent(
        item.evidence_id
      )}`;

    window.open(url, "_blank");
  };

  /* =======================================================
     DELETE
     ======================================================= */

  const deleteEvidence =
    async (
      evidenceId: string
    ) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete evidence ${evidenceId}?`
      );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/evidence/${encodeURIComponent(
              evidenceId
            )}`,
            {
              method: "DELETE",
            }
          );

        let data: ApiMessage = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          alert(
            data?.detail ||
              "Evidence deletion failed."
          );

          return;
        }

        alert(
          data?.message ||
            `Evidence ${evidenceId} deleted successfully.`
        );

        await fetchEvidence();
      } catch (err) {
        console.error(
          "Delete evidence error:",
          err
        );

        alert(
          "Cannot connect to backend."
        );
      }
    };


  /* =======================================================
     STATUS CLASS
     ======================================================= */

  const getStatusClass =
    (status: string) => {
      const value =
        status.toLowerCase();

      if (value === "verified") {
        return "verified";
      }

      if (value === "tampered") {
        return "tampered";
      }

      return "encrypted";
    };


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="evidence-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="evidence-header">

        <div className="evidence-header-left">

          <button
            type="button"
            className="evidence-back-button"
            onClick={onBack}
          >
            <ArrowLeft
              size={18}
              strokeWidth={2}
            />

            <span>
              Back to Dashboard
            </span>
          </button>


          <div className="evidence-title-block">

            <div className="evidence-title-icon">
              <ShieldCheck
                size={27}
              />
            </div>

            <div>
              <h1>
                Evidence Records
              </h1>

              <p>
                {readOnly
                  ? "View authorized digital evidence records."
                  : "Manage, verify and monitor all secured digital evidence records."}
              </p>
            </div>

          </div>

        </div>


        {!readOnly && (
          <button
            type="button"
            className="evidence-upload-button"
            onClick={onUpload}
          >
            <Upload
              size={17}
              strokeWidth={2}
            />

            <span>
              Upload Evidence
            </span>
          </button>
        )}

      </header>


      {/* =================================================
          MAIN
          ================================================= */}

      <main className="evidence-content">


        {/* =================================================
            STATS
            ================================================= */}

        <section className="evidence-stats">

          <div className="evidence-stat-card total">

            <div className="evidence-stat-icon">
              <FileText size={22} />
            </div>

            <div className="evidence-stat-info">

              <span>
                Total Evidence
              </span>

              <strong>
                {totalEvidence}
              </strong>

            </div>

          </div>


          <div className="evidence-stat-card encrypted">

            <div className="evidence-stat-icon">
              <Lock size={22} />
            </div>

            <div className="evidence-stat-info">

              <span>
                Encrypted
              </span>

              <strong>
                {encryptedEvidence}
              </strong>

            </div>

          </div>


          <div className="evidence-stat-card verified">

            <div className="evidence-stat-icon">
              <CheckCircle2
                size={22}
              />
            </div>

            <div className="evidence-stat-info">

              <span>
                Verified
              </span>

              <strong>
                {verifiedEvidence}
              </strong>

            </div>

          </div>


          <div className="evidence-stat-card tampered">

            <div className="evidence-stat-icon">
              <TriangleAlert
                size={22}
              />
            </div>

            <div className="evidence-stat-info">

              <span>
                Tampered
              </span>

              <strong>
                {tamperedEvidence}
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            SEARCH
            ================================================= */}

        <section className="evidence-toolbar">

          <div className="evidence-search">

            <Search
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search evidence ID, file name, title..."
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}

          </div>


          <button
            type="button"
            className="evidence-refresh-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "spinning"
                  : ""
              }
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>

        </section>


        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="evidence-error">
            <CircleAlert size={18} />

            <span>
              {error}
            </span>
          </div>
        )}


        {/* =================================================
            TABLE CARD
            ================================================= */}

        <section className="evidence-table-card">

          <div className="evidence-table-header">

            <div>
              <h2>
                Evidence Records
              </h2>

              <p>
                {filteredEvidence.length} records displayed
              </p>
            </div>

            <span className="evidence-count">
              {filteredEvidence.length}
            </span>

          </div>


          {loading ? (

            <div className="evidence-state">
              Loading evidence records...
            </div>

          ) : filteredEvidence.length === 0 ? (

            <div className="evidence-state">

              <FileText
                size={38}
              />

              <h3>
                No Evidence Found
              </h3>

              <p>
                No evidence records match
                your search.
              </p>

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
                      Type
                    </th>

                    <th>
                      Size
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Hash
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {filteredEvidence.map(
                    (item) => (

                      <tr
                        key={
                          item.id ||
                          item.evidence_id
                        }
                      >

                        {/* ID */}

                        <td>
                          <span className="evidence-id">
                            {item.evidence_id}
                          </span>
                        </td>


                        {/* FILE */}

                        <td>

                          <div className="evidence-file-cell">

                            <FileTypeIcon
                              type={getFileType(
                                item.file_name
                              )}
                            />

                            <div className="evidence-file-text">

                              <strong>
                                {item.file_name}
                              </strong>

                              <small>
                                {item.title}
                              </small>

                            </div>

                          </div>

                        </td>


                        {/* TYPE */}

                        <td>
                          <span className="evidence-type">
                            {getFileType(
                              item.file_name
                            )}
                          </span>
                        </td>


                        {/* SIZE */}

                        <td>
                          {formatFileSize(
                            item.file_size
                          )}
                        </td>


                        {/* DATE */}

                        <td>
                          <div className="evidence-date">
                            <span>
                              {formatDate(
                                item.created_at
                              )}
                            </span>
                          </div>
                        </td>


                        {/* HASH */}

                        <td>

                          <span
                            className="evidence-hash"
                            title={
                              item.sha256_hash
                            }
                          >
                            {item.sha256_hash
                              ? `${item.sha256_hash.slice(
                                  0,
                                  12
                                )}...`
                              : "—"}
                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`evidence-status ${getStatusClass(
                              item.status
                            )}`}
                          >

                            {getStatusClass(
                              item.status
                            ) ===
                            "verified" ? (
                              <CheckCircle2
                                size={14}
                              />
                            ) : getStatusClass(
                                item.status
                              ) ===
                              "tampered" ? (
                              <TriangleAlert
                                size={14}
                              />
                            ) : (
                              <ShieldCheck
                                size={14}
                              />
                            )}

                            {item.status}

                          </span>

                        </td>


                        {/* ACTION */}

                        <td>

                          <div className="evidence-actions">

                            <button
                              type="button"
                              className="evidence-view-button"
                              title="View evidence"
                              onClick={() =>
                                viewEvidence(
                                  item
                                )
                              }
                            >
                              <Eye size={16} />
                              <span>
                                View
                              </span>
                            </button>


                            {!readOnly && (
                              <button
                                type="button"
                                className="evidence-verify-button"
                                title="Verify evidence"
                                onClick={() =>
                                  verifyEvidence(
                                    item.evidence_id
                                  )
                                }
                              >
                                <ShieldCheck
                                  size={16}
                                />

                                <span>
                                  Verify
                                </span>
                              </button>
                            )}

                            {!readOnly && (
                              <button
                                type="button"
                                className="evidence-delete-button"
                                title="Delete evidence"
                                onClick={() =>
                                  deleteEvidence(
                                    item.evidence_id
                                  )
                                }
                              >
                                <Trash2 size={16} />

                                <span>
                                  Delete
                                </span>
                              </button>
                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

          <footer className="evidence-footer">

            <div>
              <ShieldCheck size={16} />

              <span>
                Evidence records are securely
                maintained by the system.
              </span>
            </div>

            <div>
              <Lock size={15} />

              <span>
                Protected / Secure
              </span>
            </div>

          </footer>

        </section>

      </main>

    </div>
  );
}