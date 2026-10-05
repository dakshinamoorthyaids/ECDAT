import React, { useEffect, useState } from "react";

import {
  ShieldCheck,
  Upload,
  FileText,
  User,
  Calendar,
  Hash,
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  FolderLock,
  Fingerprint,
  FileCheck2,
  ChevronRight,
  FolderOpen,
} from "lucide-react";

import "./UploadEvidence.css";

interface UploadEvidenceProps {
  onBack: () => void;
}

interface CaseItem {
  id: number;
  case_id: string;
  case_number: string;
  title: string;
  description?: string | null;
  status?: string;
  created_by?: number;
  created_by_name?: string;
  created_at?: string;
  updated_at?: string;
}

export default function UploadEvidence({
  onBack,
}: UploadEvidenceProps) {
  const username =
    localStorage.getItem("username") || "investigator";

  /* ==========================================
     STATE
     ========================================== */

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] =
    useState("");

  const [isLoadingCases, setIsLoadingCases] =
    useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [investigator, setInvestigator] =
    useState(username);

  const [evidenceDate, setEvidenceDate] =
    useState(
      new Date().toISOString().slice(0, 16)
    );

  const [file, setFile] =
    useState<File | null>(null);

  const [hash, setHash] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] =
    useState(false);

  /* ==========================================
     LOAD CASES
     ========================================== */

  useEffect(() => {
    let active = true;

    const loadCases = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/cases"
        );

        if (!response.ok) {
          throw new Error("Unable to load cases");
        }

        const data = await response.json();
        const caseList: CaseItem[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data.cases)
              ? data.cases
              : [];

        if (active) {
          setMessage("");
          setCases(caseList);
          setSelectedCaseId((currentCaseId) =>
            currentCaseId || caseList[0]?.case_id || ""
          );
        }
      } catch (error) {
        console.error("Failed to load cases:", error);

        if (active) {
          setMessage(
            "Unable to load cases. Please make sure the backend is running."
          );
        }
      } finally {
        if (active) {
          setIsLoadingCases(false);
        }
      }
    };

    void loadCases();

    return () => {
      active = false;
    };
  }, []);

  /* ==========================================
     SHA-256 HASH
     ========================================== */

  const calculateSHA256 = async (
    selectedFile: File
  ): Promise<string> => {
    const buffer =
      await selectedFile.arrayBuffer();

    const hashBuffer =
      await crypto.subtle.digest(
        "SHA-256",
        buffer
      );

    const hashArray = Array.from(
      new Uint8Array(hashBuffer)
    );

    return hashArray
      .map((byte) =>
        byte.toString(16).padStart(2, "0")
      )
      .join("");
  };

  /* ==========================================
     FILE SELECT
     ========================================== */

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const maxSize =
      100 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setFile(null);
      setHash("");

      setMessage(
        "File size exceeds the 100MB limit."
      );

      return;
    }

    setFile(selectedFile);
    setMessage("");
    setHash("");

    try {
      const calculatedHash =
        await calculateSHA256(
          selectedFile
        );

      setHash(calculatedHash);
    } catch (error) {
      console.error(
        "SHA-256 calculation error:",
        error
      );

      setHash("");

      setMessage(
        "Unable to calculate SHA-256 hash."
      );
    }
  };

  /* ==========================================
     UPLOAD EVIDENCE
     ========================================== */

  const handleUpload = async () => {
    setMessage("");

    /* Case validation */
    if (!selectedCaseId) {
      setMessage(
        "Please select a case before uploading evidence."
      );

      return;
    }

    /* File validation */
    if (!file) {
      setMessage(
        "Please select an evidence file."
      );

      return;
    }

    /* Title validation */
    if (!title.trim()) {
      setMessage(
        "Please enter evidence title."
      );

      return;
    }

    /* Investigator validation */
    if (!investigator.trim()) {
      setMessage(
        "Please enter investigator name."
      );

      return;
    }

    /* Hash validation */
    if (!hash) {
      setMessage(
        "SHA-256 hash is not available."
      );

      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();

      /* ================================
         IMPORTANT:
         CASE ID IS NOW SENT TO BACKEND
         ================================ */

      formData.append(
        "case_id",
        selectedCaseId
      );

      formData.append(
        "file",
        file
      );

      formData.append(
        "title",
        title.trim()
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "investigator",
        investigator.trim()
      );

      formData.append(
        "evidence_date",
        evidenceDate
      );

      console.log(
        "Uploading evidence for case:",
        selectedCaseId
      );

      const response = await fetch(
        "http://127.0.0.1:8000/evidence/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            "Evidence upload failed."
        );

        return;
      }

      /*
       * Verify that backend actually linked
       * the evidence to the selected case.
       */
      const uploadedCaseId =
        data.case_id || "";

      if (
        uploadedCaseId &&
        uploadedCaseId !== selectedCaseId
      ) {
        console.warn(
          "Warning: uploaded case ID does not match selected case",
          {
            selectedCaseId,
            uploadedCaseId,
          }
        );
      }

      setMessage(
        `Evidence uploaded successfully. ID: ${data.evidence_id}`
      );

      /*
       * Keep selected case.
       * Reset only evidence fields.
       */
      setTitle("");
      setDescription("");
      setFile(null);
      setHash("");

      setEvidenceDate(
        new Date()
          .toISOString()
          .slice(0, 16)
      );

      /*
       * Reset file input visually.
       */
      const fileInput =
        document.getElementById(
          "evidence-file-input"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      setMessage(
        "Cannot connect to backend. Please make sure FastAPI is running."
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* ==========================================
     SELECTED CASE
     ========================================== */

  const selectedCase = cases.find(
    (item) =>
      item.case_id === selectedCaseId
  );

  /* ==========================================
     UI
     ========================================== */

  return (
    <div className="upload-page">

      {/* =====================================
          HEADER
          ===================================== */}

      <header className="upload-header">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
          disabled={isUploading}
        >
          <ArrowLeft size={18} />

          Back to Dashboard
        </button>

        <div className="upload-header-brand">

          <div className="header-brand-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <strong>
              Digital Evidence System
            </strong>

            <span>
              Secure • Verify • Trust
            </span>
          </div>

        </div>

      </header>


      {/* =====================================
          MAIN LAYOUT
          ===================================== */}

      <main className="upload-layout">

        {/* ===================================
            LEFT MAIN CARD
            =================================== */}

        <section className="upload-main-card">

          {/* PAGE TITLE */}

          <div className="upload-page-title">

            <div className="upload-page-title-icon">
              <Upload size={28} />
            </div>

            <div>

              <h1>
                <span className="upload-title-black">
                  Upload
                </span>{" "}
                <span className="upload-title-purple">
                  Evidence
                </span>
              </h1>

              <p>
                Securely add new digital evidence
                to the system.
              </p>

            </div>

            <div className="secure-badge">
              <LockKeyhole size={15} />

              Encrypted &amp; Secure
            </div>

          </div>


          {/* =================================
              PROCESS STEPS
              ================================= */}

          <div className="upload-steps">

            <div className="step-item active">

              <div className="step-number">
                1
              </div>

              <span>
                File Details
              </span>

            </div>

            <div className="step-line active-line" />

            <div className="step-item">

              <div className="step-number">
                2
              </div>

              <span>
                Security Processing
              </span>

            </div>

            <div className="step-line" />

            <div className="step-item">

              <div className="step-number">
                3
              </div>

              <span>
                Review &amp; Upload
              </span>

            </div>

          </div>


          {/* =================================
              FORM
              ================================= */}

          <div className="upload-form">

            {/* =================================
                CASE SELECTION
                ================================= */}

            <div className="form-section">

              <label className="form-label">

                <FolderOpen size={16} />

                Select Case

                <span className="required">
                  *
                </span>

              </label>

              <div className="input-wrapper">

                <FolderOpen size={17} />

                <select
                  className="form-input"
                  value={selectedCaseId}
                  onChange={(event) =>
                    setSelectedCaseId(
                      event.target.value
                    )
                  }
                  disabled={
                    isLoadingCases ||
                    isUploading
                  }
                >

                  <option value="">
                    {isLoadingCases
                      ? "Loading cases..."
                      : "-- Select a case --"}
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

              </div>

              {selectedCase && (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background:
                      "#f6f3ff",
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  <strong>
                    Selected Case:
                  </strong>{" "}
                  {selectedCase.case_id}
                </div>
              )}

              {!isLoadingCases &&
                cases.length === 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#c62828",
                      fontSize: "13px",
                    }}
                  >
                    No cases available.
                    Please create a case first.
                  </div>
                )}

            </div>


            {/* =================================
                EVIDENCE FILE
                ================================= */}

            <div className="form-section">

              <label className="form-label">

                <FileText size={16} />

                Evidence File

                <span className="required">
                  *
                </span>

              </label>

              <label className="file-drop-area">

                <input
                  id="evidence-file-input"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />

                <div className="file-drop-icon">

                  {file ? (
                    <FileCheck2 size={34} />
                  ) : (
                    <Upload size={34} />
                  )}

                </div>

                <div className="file-drop-content">

                  <strong>
                    {file
                      ? file.name
                      : "Drag & drop your file here"}
                  </strong>

                  <span>
                    {file
                      ? `${(
                          file.size / 1024
                        ).toFixed(1)} KB`
                      : "or click to browse"}
                  </span>

                  <small>

                    <FileText size={13} />

                    Supports PDF, JPG, PNG, DOC,
                    DOCX, ZIP, MP4, etc.

                  </small>

                  <small>

                    <LockKeyhole size={13} />

                    Maximum secure file size:
                    100MB

                  </small>

                </div>

                <div className="browse-button">

                  <FolderLock size={17} />

                  Browse File

                </div>

              </label>

            </div>


            <div className="form-divider" />


            {/* =================================
                INVESTIGATOR + DATE
                ================================= */}

            <div className="form-row">

              {/* INVESTIGATOR */}

              <div className="form-section">

                <label className="form-label">

                  <User size={16} />

                  Investigator

                  <span className="required">
                    *
                  </span>

                </label>

                <div className="input-wrapper">

                  <User size={17} />

                  <input
                    type="text"
                    className="form-input"
                    placeholder="Investigator name"
                    value={investigator}
                    onChange={(event) =>
                      setInvestigator(
                        event.target.value
                      )
                    }
                    disabled={isUploading}
                  />

                </div>

              </div>


              {/* DATE */}

              <div className="form-section">

                <label className="form-label">

                  <Calendar size={16} />

                  Evidence Date

                </label>

                <div className="input-wrapper">

                  <Calendar size={17} />

                  <input
                    type="datetime-local"
                    className="form-input"
                    value={evidenceDate}
                    onChange={(event) =>
                      setEvidenceDate(
                        event.target.value
                      )
                    }
                    disabled={isUploading}
                  />

                </div>

              </div>

            </div>


            {/* =================================
                TITLE
                ================================= */}

            <div className="form-section">

              <label className="form-label">

                <FileText size={16} />

                Evidence Title

                <span className="required">
                  *
                </span>

              </label>

              <div className="input-wrapper">

                <FileText size={17} />

                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter evidence title"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  disabled={isUploading}
                />

              </div>

            </div>


            {/* =================================
                DESCRIPTION
                ================================= */}

            <div className="form-section">

              <label className="form-label">

                <FileText size={16} />

                Description

              </label>

              <textarea
                className="form-textarea"
                placeholder="Enter evidence description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                disabled={isUploading}
              />

            </div>


            {/* =================================
                SHA-256
                ================================= */}

            <div className="form-section">

              <label className="form-label hash-label">

                <Hash size={17} />

                SHA-256 Hash

              </label>

              <div className="hash-box">

                {hash ? (
                  <>
                    <div className="hash-value">
                      {hash}
                    </div>

                    <CheckCircle2
                      size={20}
                      className="hash-success"
                    />
                  </>
                ) : (
                  <span>
                    Select a file to generate
                    SHA-256 hash
                  </span>
                )}

              </div>

            </div>


            {/* =================================
                MESSAGE
                ================================= */}

            {message && (
              <div
                className={
                  message.includes(
                    "successfully"
                  )
                    ? "upload-message success"
                    : "upload-message error"
                }
              >

                {message.includes(
                  "successfully"
                ) ? (
                  <CheckCircle2 size={17} />
                ) : (
                  <ShieldCheck size={17} />
                )}

                <span>
                  {message}
                </span>

              </div>
            )}


            {/* =================================
                ACTION BUTTONS
                ================================= */}

            <div className="upload-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={onBack}
                disabled={isUploading}
              >

                <ArrowLeft size={17} />

                Cancel

              </button>


              <button
                type="button"
                className="upload-submit"
                onClick={handleUpload}
                disabled={
                  isUploading ||
                  !selectedCaseId ||
                  cases.length === 0
                }
              >

                {isUploading ? (
                  <>
                    <span className="loading-spinner" />

                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={18} />

                    Upload Evidence

                    <ChevronRight size={18} />
                  </>
                )}

              </button>

            </div>

          </div>

        </section>


        {/* ===================================
            RIGHT INFORMATION PANEL
            =================================== */}

        <aside className="upload-info-panel">

          {/* PROCESS CARD */}

          <div className="info-card">

            <div className="info-card-header">

              <div className="info-header-icon green">

                <ShieldCheck size={22} />

              </div>

              <div>

                <h3>
                  Evidence Upload Process
                </h3>

                <p>
                  Your evidence will be securely
                  processed and encrypted using
                  advanced algorithms.
                </p>

              </div>

            </div>


            <div className="process-list">

              <div className="process-item">

                <div className="process-number green-bg">
                  1
                </div>

                <div className="process-icon green-text">
                  <FileText size={22} />
                </div>

                <div>

                  <strong>
                    File Details
                  </strong>

                  <span>
                    Upload file and provide
                    information
                  </span>

                </div>

              </div>


              <div className="process-item">

                <div className="process-number blue-bg">
                  2
                </div>

                <div className="process-icon blue-text">
                  <Fingerprint size={22} />
                </div>

                <div>

                  <strong>
                    Security Processing
                  </strong>

                  <span>
                    SHA-256, HMAC, AES-256
                    encryption
                  </span>

                </div>

              </div>


              <div className="process-item">

                <div className="process-number purple-bg">
                  3
                </div>

                <div className="process-icon purple-text">
                  <Upload size={22} />
                </div>

                <div>

                  <strong>
                    Review &amp; Upload
                  </strong>

                  <span>
                    Confirm details and save
                    to system
                  </span>

                </div>

              </div>

            </div>

          </div>


          {/* SECURITY FEATURES */}

          <div className="security-card">

            <div className="security-card-title">

              <div className="security-title-icon">

                <ShieldCheck size={21} />

              </div>

              <h3>
                Security Features
              </h3>

            </div>


            <div className="security-list">

              <div>
                <CheckCircle2 />
                <span>
                  SHA-256 Hash Verification
                </span>
              </div>

              <div>
                <CheckCircle2 />
                <span>
                  HMAC Authentication
                </span>
              </div>

              <div>
                <CheckCircle2 />
                <span>
                  AES-256 Encryption
                </span>
              </div>

              <div>
                <CheckCircle2 />
                <span>
                  Secure Storage
                </span>
              </div>

              <div>
                <CheckCircle2 />
                <span>
                  Chain of Custody Tracking
                </span>
              </div>

            </div>

          </div>


          {/* PROTECTION CARD */}

          <div className="protection-card">

            <div className="protection-icon">

              <LockKeyhole size={29} />

            </div>

            <div>

              <strong>
                Your data is protected
              </strong>

              <span>
                End-to-end security for digital
                evidence integrity and authenticity.
              </span>

            </div>

          </div>

        </aside>

      </main>

    </div>
  );
}