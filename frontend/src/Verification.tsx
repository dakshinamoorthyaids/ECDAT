import { useState } from "react";

import {
  ShieldCheck,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import "./Verification.css";

type VerificationResult = {
  evidence_id?: string;
  file_name?: string;
  file_size?: number;
  created_at?: string;

  status?: string;

  original_sha256?: string;
  current_sha256?: string;
  sha256_hash?: string;

  hmac_hash?: string;

  sha256_match?: boolean;
  hmac_match?: boolean;

  tampered?: boolean;
  message?: string;
};

type VerificationProps = {
  onBack: () => void;
};

function Verification({
  onBack,
}: VerificationProps) {
  const [evidenceId, setEvidenceId] =
    useState("");

  const [result, setResult] =
    useState<VerificationResult | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================
     VERIFY EVIDENCE
     ========================================== */

  const handleVerify = async () => {
    const trimmedEvidenceId =
      evidenceId.trim();

    if (!trimmedEvidenceId) {
      setError(
        "Please enter an Evidence ID."
      );

      setResult(null);

      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/evidence/verify/${encodeURIComponent(
          trimmedEvidenceId
        )}`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Evidence verification failed."
        );
      }

      setResult(data);
    } catch (error) {
      console.error(
        "VERIFICATION ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to verify evidence."
      );

      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================================
     VIEW PRESERVED TAMPERED FILE
     ========================================== */

  const viewTamperedFile = () => {
    if (!result?.evidence_id) {
      return;
    }

    window.open(
      `http://127.0.0.1:8000/evidence/tampered/${encodeURIComponent(
        result.evidence_id
      )}`,
      "_blank"
    );
  };

  /* ==========================================
     STATUS
     ========================================== */

  const normalizedStatus =
    result?.status
      ?.trim()
      .toLowerCase();

  /* ==========================================
     SHA-256 VALUES
     ========================================== */

  const originalSha256 =
    result?.original_sha256 ||
    result?.sha256_hash ||
    "";

  const currentSha256 =
    result?.current_sha256 ||
    "";

  /* ==========================================
     SHA MATCH STATUS
     ========================================== */

  const shaCheckAvailable =
    typeof result?.sha256_match === "boolean";

  const shaMatched =
    result?.sha256_match === true;

  const shaMismatch =
    shaCheckAvailable &&
    result?.sha256_match === false;

  /* ==========================================
     HMAC MATCH STATUS
     ========================================== */

  const hmacCheckAvailable =
    typeof result?.hmac_match === "boolean";

  const hmacMatched =
    result?.hmac_match === true;

  const hmacMismatch =
    hmacCheckAvailable &&
    result?.hmac_match === false;

  /* ==========================================
     TAMPER DETECTION
     
     Tampered if:
     1. Backend explicitly says tampered
     2. tampered === true
     3. SHA-256 mismatch
     4. HMAC mismatch
     ========================================== */

  const isTampered =
    normalizedStatus === "tampered" ||
    result?.tampered === true ||
    shaMismatch ||
    hmacMismatch;

  const isVerified =
    !isTampered &&
    (
      normalizedStatus === "verified" ||
      (
        shaCheckAvailable &&
        shaMatched &&
        (!hmacCheckAvailable || hmacMatched)
      )
    );

  return (
    <div className="verification-page">

      {/* =====================================
          BACK BUTTON
          ===================================== */}

      <button
        type="button"
        className="verification-back-button"
        onClick={onBack}
      >
        <ArrowLeft size={19} />

        <span>
          Back to dashboard
        </span>
      </button>


      <div className="verification-container">

        {/* ===================================
            HEADER
            =================================== */}

        <div className="verification-header">

          <div className="verification-icon">

            <ShieldCheck
              size={34}
              strokeWidth={1.8}
            />

          </div>


          <div className="verification-heading">

            <h1>

              <span className="title-evidence">
                Evidence
              </span>{" "}

              <span className="title-verification">
                Verification
              </span>

            </h1>


            <p>
              Verify the integrity and
              authenticity of digital evidence.
            </p>

          </div>

        </div>


        {/* ===================================
            VERIFY CARD
            =================================== */}

        <div className="verification-card">

          <div className="verification-card-header">

            <h2>
              Verify Evidence
            </h2>


            <div className="sha-badge">

              <ShieldCheck size={15} />

              <span>
                SHA-256 Integrity Check
              </span>

            </div>

          </div>


          <div className="verification-input-section">

            <label htmlFor="evidence-id">
              Evidence ID
            </label>


            <div className="verification-input-row">

              <div className="verification-input-wrapper">

                <Search size={21} />

                <input
                  id="evidence-id"
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
                      handleVerify();
                    }
                  }}
                  placeholder="Enter Evidence ID"
                  autoComplete="off"
                />

              </div>


              <button
                type="button"
                className="verify-button"
                onClick={handleVerify}
                disabled={isLoading}
              >

                {isLoading ? (
                  <>
                    <Loader2
                      size={19}
                      className="spin"
                    />

                    <span>
                      Verifying...
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck
                      size={20}
                      strokeWidth={2}
                    />

                    <span>
                      Verify Evidence
                    </span>
                  </>
                )}

              </button>

            </div>


            {error && (
              <div className="verification-error">

                <AlertTriangle size={18} />

                <span>
                  {error}
                </span>

              </div>
            )}

          </div>

        </div>


        {/* ===================================
            RESULT
            =================================== */}

        {result && (
          <div className="verification-result-card">

            {/* =================================
                RESULT HEADER
                ================================= */}

            <div className="result-header">

              <div
                className={`result-icon ${
                  isTampered
                    ? "tampered"
                    : "verified"
                }`}
              >

                {isTampered ? (
                  <AlertTriangle size={26} />
                ) : (
                  <CheckCircle2 size={26} />
                )}

              </div>


              <div>

                <h2>

                  {isTampered
                    ? "Evidence Tampered"
                    : isVerified
                    ? "Evidence Verified"
                    : "Verification Complete"}

                </h2>


                <p>

                  {result.message ||
                    (isTampered
                      ? "Integrity verification failed. The evidence does not match the original stored integrity information."
                      : isVerified
                      ? "Evidence integrity has been successfully verified."
                      : "Verification completed. Review the integrity results below.")}

                </p>

              </div>

            </div>


            {/* =================================
                BASIC RESULT DETAILS
                ================================= */}

            <div className="result-details">

              <div className="detail-item">

                <span>
                  Evidence ID
                </span>

                <strong>
                  {result.evidence_id ||
                    trimmedEvidenceIdFallback(
                      evidenceId
                    )}
                </strong>

              </div>


              <div className="detail-item">

                <span>
                  File Name
                </span>

                <strong>
                  {result.file_name ||
                    "—"}
                </strong>

              </div>


              <div className="detail-item">

                <span>
                  Status
                </span>

                <strong
                  className={
                    isTampered
                      ? "status-tampered"
                      : isVerified
                      ? "status-verified"
                      : ""
                  }
                >
                  {isTampered
                    ? "Tampered"
                    : result.status ||
                      "—"}
                </strong>

              </div>


              <div className="detail-item">

                <span>
                  SHA-256 Match
                </span>

                <strong
                  className={
                    shaMatched
                      ? "status-verified"
                      : shaCheckAvailable
                      ? "status-tampered"
                      : ""
                  }
                >

                  {shaMatched
                    ? "Matched"
                    : shaCheckAvailable
                    ? "Failed"
                    : "—"}

                </strong>

              </div>


              <div className="detail-item">

                <span>
                  HMAC Match
                </span>

                <strong
                  className={
                    hmacMatched
                      ? "status-verified"
                      : hmacCheckAvailable
                      ? "status-tampered"
                      : ""
                  }
                >

                  {hmacMatched
                    ? "Matched"
                    : hmacCheckAvailable
                    ? "Failed"
                    : "—"}

                </strong>

              </div>

            </div>


            {/* =================================
                SHA-256 COMPARISON
                ================================= */}

            <div className="sha-comparison-section">

              <div className="sha-comparison-header">

                <div>

                  <h3>
                    SHA-256 Comparison
                  </h3>

                  <p>
                    Original stored hash is
                    compared with the hash
                    calculated from the current
                    evidence file.
                  </p>

                </div>

              </div>


              <div className="hash-comparison-box">

                <div className="hash-label-row">

                  <span>
                    Original SHA-256
                  </span>

                  {shaCheckAvailable && (
                    <span
                      className={
                        shaMatched
                          ? "hash-status matched"
                          : "hash-status mismatch"
                      }
                    >
                      {shaMatched
                        ? "MATCH"
                        : "MISMATCH"}
                    </span>
                  )}

                </div>


                <code className="hash-value">

                  {originalSha256 ||
                    "—"}

                </code>

              </div>


              {isTampered && (
                <div className="hash-comparison-box">

                  <div className="hash-label-row">

                    <span>
                      Current SHA-256
                    </span>

                    {shaCheckAvailable && (
                      <span
                        className={
                          shaMatched
                            ? "hash-status matched"
                            : "hash-status mismatch"
                        }
                      >
                        {shaMatched
                          ? "MATCH"
                          : "MISMATCH"}
                      </span>
                    )}

                  </div>


                  <code className="hash-value">

                    {currentSha256 ||
                      "—"}

                  </code>

                </div>
              )}


              <div
                className={`hash-result ${
                  shaMatched
                    ? "hash-result-success"
                    : shaCheckAvailable
                    ? "hash-result-failed"
                    : "hash-result-neutral"
                }`}
              >

                {shaMatched ? (
                  <CheckCircle2 size={20} />
                ) : shaCheckAvailable ? (
                  <AlertTriangle size={20} />
                ) : (
                  <ShieldCheck size={20} />
                )}


                <div>

                  <strong>

                    {shaMatched
                      ? "SHA-256 Hash Match"
                      : shaCheckAvailable
                      ? "SHA-256 Hash Mismatch"
                      : "SHA-256 Comparison Unavailable"}

                  </strong>


                  <span>

                    {shaMatched
                      ? "The current evidence file matches the original stored hash."
                      : shaCheckAvailable
                      ? "The current evidence file does not match the original stored hash."
                      : "Hash comparison information is not available for this verification result."}

                  </span>

                </div>

              </div>

            </div>


            {/* =================================
                HMAC VERIFICATION
                ================================= */}

            <div className="hmac-verification-section">

              <div className="hmac-header">

                <div>

                  <h3>
                    HMAC Verification
                  </h3>

                  <p>
                    HMAC-SHA256 is used to verify
                    the authenticity of the stored
                    integrity information.
                  </p>

                </div>

              </div>


              <div
                className={`hmac-result ${
                  hmacMatched
                    ? "hmac-success"
                    : hmacCheckAvailable
                    ? "hmac-failed"
                    : "hmac-neutral"
                }`}
              >

                {hmacMatched ? (
                  <CheckCircle2 size={21} />
                ) : hmacCheckAvailable ? (
                  <AlertTriangle size={21} />
                ) : (
                  <ShieldCheck size={21} />
                )}


                <div>

                  <strong>

                    {hmacMatched
                      ? "HMAC Match"
                      : hmacCheckAvailable
                      ? "HMAC Mismatch"
                      : "HMAC Verification Unavailable"}

                  </strong>


                  <span>

                    {hmacMatched
                      ? "The HMAC verification was successful."
                      : hmacCheckAvailable
                      ? "The calculated HMAC does not match the stored HMAC."
                      : "HMAC comparison information is not available."}

                  </span>

                </div>

              </div>

            </div>


            {/* =================================
                VIEW PRESERVED TAMPERED FILE
                ================================= */}

            {isTampered && (
              <div
                className="tampered-file-section"
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >

                <button
                  type="button"
                  className="view-tampered-button"
                  onClick={viewTamperedFile}
                  style={{
                    padding: "12px 20px",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  View Preserved Tampered File
                </button>

              </div>
            )}

          </div>
        )}


        {/* ===================================
            SECURE VERIFICATION
            =================================== */}

        <div className="verification-info">

          <div className="secure-info-icon">

            <ShieldCheck
              size={23}
              strokeWidth={2}
            />

          </div>


          <div>

            <h3>
              Secure Verification
            </h3>

            <p>
              The evidence record is checked
              against its stored integrity
              information to detect unauthorized
              modification.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


/* ==========================================
   FALLBACK
   ========================================== */

function trimmedEvidenceIdFallback(
  value: string
) {
  return value.trim() || "—";
}


export default Verification;  