from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends,
    Form,
    Response,
    Request,
)

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from sqlalchemy import text, inspect

from database import engine, Base, get_db, SessionLocal

from models import (
    User,
    Case,
    Evidence,
    ChainOfCustody,
    AuditLog,
)

from security import (
    calculate_hmac,
    generate_aes_key,
    encrypt_data,
    decrypt_data,
)

from auth import (
    hash_password,
    verify_password,
    check_role,
)

import os
import uuid
import hashlib
import hmac
import mimetypes


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    users = [
        User(
            username="admin",
            email="admin@secureevidence.com",
            password_hash=hash_password("Admin@123"),
            role="admin",
        ),
        User(
            username="investigator",
            email="investigator@secureevidence.com",
            password_hash=hash_password("Invest@123"),
            role="Investigator",
        ),
        User(
            username="legalofficer",
            email="legal@secureevidence.com",
            password_hash=hash_password("Legal@123"),
            role="Legal Officer",
        ),
        User(
            username="viewer",
            email="viewer@secureevidence.com",
            password_hash=hash_password("Viewer@123"),
            role="Viewer",
        ),
    ]

    for user in users:

        existing_user = (
            db.query(User)
            .filter(
                User.username == user.username
            )
            .first()
        )

        if not existing_user:
            db.add(user)

    db.commit()

finally:
    db.close()


# =========================================================
# DATABASE SCHEMA UPDATE
# =========================================================

def update_chain_of_custody_schema():

    try:

        inspector = inspect(engine)

        if not inspector.has_table(
            "chain_of_custody"
        ):
            return

        existing_columns = {
            column["name"]
            for column in inspector.get_columns(
                "chain_of_custody"
            )
        }

        with engine.begin() as connection:

            if "user_name" not in existing_columns:

                connection.execute(
                    text(
                        """
                        ALTER TABLE chain_of_custody
                        ADD COLUMN user_name VARCHAR(100)
                        """
                    )
                )

            if "remarks" not in existing_columns:

                connection.execute(
                    text(
                        """
                        ALTER TABLE chain_of_custody
                        ADD COLUMN remarks VARCHAR(500)
                        """
                    )
                )

            if "ip_address" not in existing_columns:

                connection.execute(
                    text(
                        """
                        ALTER TABLE chain_of_custody
                        ADD COLUMN ip_address VARCHAR(100)
                        """
                    )
                )

    except Exception as error:

        print(
            "Warning: Chain of Custody schema update failed:",
            error,
        )


def update_evidence_schema():

    try:

        inspector = inspect(engine)

        if not inspector.has_table("evidence"):
            return

        existing_columns = {
            column["name"]
            for column in inspector.get_columns(
                "evidence"
            )
        }

        with engine.begin() as connection:

            if "case_id" not in existing_columns:

                connection.execute(
                    text(
                        """
                        ALTER TABLE evidence
                        ADD COLUMN case_id VARCHAR(50)
                        """
                    )
                )

                print(
                    "Evidence schema updated: "
                    "case_id column added."
                )

            if "encrypted_hmac_hash" not in existing_columns:

                connection.execute(
                    text(
                        """
                        ALTER TABLE evidence
                        ADD COLUMN encrypted_hmac_hash VARCHAR(64)
                        """
                    )
                )

                print(
                    "Evidence schema updated: "
                    "encrypted_hmac_hash column added."
                )

            legacy_evidence = connection.execute(
                text(
                    """
                    SELECT id, file_path
                    FROM evidence
                    WHERE encrypted_hmac_hash IS NULL
                    """
                )
            ).mappings()

            current_storage_path = os.path.realpath(
                os.path.join(
                    os.path.dirname(
                        os.path.abspath(__file__)
                    ),
                    "storage",
                    "current",
                )
            )

            original_storage_path = os.path.join(
                os.path.dirname(
                    os.path.abspath(__file__)
                ),
                "storage",
                "original",
            )

            for legacy_record in legacy_evidence:

                current_file_path = os.path.realpath(
                    legacy_record["file_path"]
                )

                if (
                    os.path.dirname(current_file_path)
                    != current_storage_path
                ):
                    continue

                original_file_path = os.path.join(
                    original_storage_path,
                    os.path.basename(
                        current_file_path
                    ),
                )

                try:

                    with open(
                        current_file_path,
                        "rb",
                    ) as current_file:

                        current_data = (
                            current_file.read()
                        )

                    with open(
                        original_file_path,
                        "rb",
                    ) as original_file:

                        original_data = (
                            original_file.read()
                        )

                except OSError:

                    continue

                if current_data != original_data:
                    continue

                try:

                    encrypted_hmac_hash = (
                        calculate_hmac(
                            current_data
                        )
                    )

                except ValueError:

                    continue

                connection.execute(
                    text(
                        """
                        UPDATE evidence
                        SET encrypted_hmac_hash = :encrypted_hmac_hash
                        WHERE id = :evidence_id
                        """
                    ),
                    {
                        "encrypted_hmac_hash": (
                            encrypted_hmac_hash
                        ),
                        "evidence_id": (
                            legacy_record["id"]
                        ),
                    },
                )

    except Exception as error:

        print(
            "Warning: Evidence schema update failed:",
            error,
        )


update_chain_of_custody_schema()
update_evidence_schema()


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Secure Digital Evidence Management System",
    version="1.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "https://secure-digital-evidence-management-system.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# STORAGE
# =========================================================

STORAGE_DIR = os.path.join(
    os.path.dirname(
        os.path.abspath(__file__)
    ),
    "storage",
)

ORIGINAL_STORAGE_DIR = os.path.join(
    STORAGE_DIR,
    "original",
)

CURRENT_STORAGE_DIR = os.path.join(
    STORAGE_DIR,
    "current",
)

TAMPERED_STORAGE_DIR = os.path.join(
    STORAGE_DIR,
    "tampered",
)


os.makedirs(
    ORIGINAL_STORAGE_DIR,
    exist_ok=True,
)

os.makedirs(
    CURRENT_STORAGE_DIR,
    exist_ok=True,
)

os.makedirs(
    TAMPERED_STORAGE_DIR,
    exist_ok=True,
)


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_client_ip(
    request: Request,
) -> str:

    if request.client:
        return request.client.host

    return "Unknown"


def resolve_user(
    db: Session,
    username: str = "",
) -> User | None:

    username = (
        username or ""
    ).strip()

    if username:

        user = (
            db.query(User)
            .filter(
                User.username == username
            )
            .first()
        )

        if user:
            return user

    fallback_user = (
        db.query(User)
        .filter(
            User.id == 1
        )
        .first()
    )

    return fallback_user


def get_user_name(
    db: Session,
    user_id: int | None,
) -> str:

    if user_id is None:
        return "Unknown"

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user:
        return user.username

    return "Unknown"


def create_custody_record(
    db: Session,
    evidence_id: int,
    user_id: int,
    action: str,
    description: str,
    request: Request,
    remarks: str = "",
    user_name: str | None = None,
):

    if not user_name:

        user_name = get_user_name(
            db,
            user_id,
        )

    ip_address = get_client_ip(
        request
    )

    custody_record = ChainOfCustody(
        evidence_id=evidence_id,
        user_id=user_id,
        user_name=user_name,
        action=action,
        description=description,
        remarks=(
            remarks or description
        ),
        ip_address=ip_address,
    )

    db.add(custody_record)

    return custody_record


def create_audit_log(
    db: Session,
    evidence_id: int | None,
    user_id: int | None,
    action: str,
    description: str,
    request: Request,
):

    ip_address = get_client_ip(
        request
    )

    audit_log = AuditLog(
        evidence_id=evidence_id,
        user_id=user_id,
        action=action,
        description=description,
        ip_address=ip_address,
    )

    db.add(audit_log)

    return audit_log


def serialize_audit_log(
    log: AuditLog,
):

    timestamp = (
        log.created_at.isoformat()
        if log.created_at
        else None
    )

    return {
        "id": log.id,
        "evidence_id": log.evidence_id,
        "user_id": log.user_id,
        "action": log.action,
        "description": log.description,
        "ip_address": log.ip_address,
        "created_at": timestamp,
        "timestamp": timestamp,
    }


# =========================================================
# CASE HELPER
# =========================================================

def serialize_case(
    case: Case,
    db: Session,
):

    creator_name = get_user_name(
        db,
        case.created_by,
    )

    created_at = (
        case.created_at.isoformat()
        if case.created_at
        else None
    )

    updated_at = (
        case.updated_at.isoformat()
        if case.updated_at
        else None
    )

    return {
        "id": case.id,
        "case_id": case.case_id,
        "case_number": case.case_number,
        "title": case.title,
        "description": case.description,
        "status": case.status,
        "created_by": case.created_by,
        "created_by_name": creator_name,
        "created_at": created_at,
        "updated_at": updated_at,
    }


# =========================================================
# EVIDENCE HELPER
# =========================================================

def serialize_evidence(
    evidence: Evidence,
    db: Session,
):

    uploaded_by_name = get_user_name(
        db,
        evidence.uploaded_by,
    )

    case_number = None
    case_title = None

    if evidence.case_id:

        case = (
            db.query(Case)
            .filter(
                Case.case_id == evidence.case_id
            )
            .first()
        )

        if case:

            case_number = case.case_number
            case_title = case.title

    created_at = (
        evidence.created_at.isoformat()
        if evidence.created_at
        else None
    )

    return {
        "id": evidence.id,
        "evidence_id": evidence.evidence_id,

        "case_id": evidence.case_id,
        "case_number": case_number,
        "case_title": case_title,

        "file_name": evidence.file_name,
        "title": evidence.title,
        "file_size": evidence.file_size,
        "file_size_kb": round(
            evidence.file_size / 1024,
            2,
        ),

        "file_path": evidence.file_path,

        "sha256_hash": evidence.sha256_hash,
        "hmac_hash": evidence.hmac_hash,

        "uploaded_by": evidence.uploaded_by,
        "uploaded_by_name": uploaded_by_name,

        "status": evidence.status,

        "created_at": created_at,
    }


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message": "ECDAT API is running",
        "status": "success",
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health_check(
    db: Session = Depends(get_db),
):

    try:

        db.execute(
            text("SELECT 1")
        )

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception:

        raise HTTPException(
            status_code=503,
            detail=(
                "Database connection failed"
            ),
        )


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if not user:

        print(
            "LOGIN CHECK: USER NOT FOUND",
            username,
        )

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid username or password"
            ),
        )

    if not verify_password(
        password,
        user.password_hash,
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid username or password"
            ),
        )

    if user.role != role:

        raise HTTPException(
            status_code=403,
            detail="Role does not match",
        )

    create_audit_log(
        db=db,
        evidence_id=None,
        user_id=user.id,
        action="Login",
        description=(
            f"User {user.username} "
            f"logged into the system successfully."
        ),
        request=request,
    )

    db.commit()

    return {
        "message": "Login successful",
        "username": user.username,
        "user_id": user.id,
        "role": user.role,
        "status": "success",
    }


# =========================================================
# FORGOT PASSWORD
# =========================================================

@app.post("/forgot-password")
def forgot_password(
    request: Request,
    username: str = Form(...),
    role: str = Form(...),
    new_password: str = Form(...),
    db: Session = Depends(get_db),
):

    username = username.strip()
    role = role.strip()
    new_password = new_password.strip()

    if not username:

        raise HTTPException(
            status_code=400,
            detail="Username is required",
        )

    if not role:

        raise HTTPException(
            status_code=400,
            detail="Role is required",
        )

    if not new_password:

        raise HTTPException(
            status_code=400,
            detail="New password is required",
        )

    if len(new_password) < 8:

        raise HTTPException(
            status_code=400,
            detail=(
                "New password must contain "
                "at least 8 characters"
            ),
        )

    user = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.role != role:

        raise HTTPException(
            status_code=403,
            detail="Role does not match",
        )

    user.password_hash = hash_password(
        new_password
    )

    db.commit()

    create_audit_log(
        db=db,
        evidence_id=None,
        user_id=user.id,
        action="Password Reset",
        description=(
            f"Password was reset for user "
            f"{user.username}."
        ),
        request=request,
    )

    db.commit()

    return {
        "message": "Password reset successfully",
        "username": user.username,
        "role": user.role,
        "status": "success",
    }


# =========================================================
# LOGOUT
# =========================================================

@app.post("/logout")
def logout(
    request: Request,
):

    return {
        "message": "Logout successful",
        "status": "success",
    }


# =========================================================
# RBAC TEST
# =========================================================

@app.get("/rbac-test")
def rbac_test(
    role: str,
):

    if not check_role(
        role,
        [
            "Admin",
            "Investigator",
            "Legal Officer",
        ],
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Access denied for this role"
            ),
        )

    return {
        "message": "RBAC access granted",
        "role": role,
    }


# =========================================================
# CASES
# =========================================================

# ---------------------------------------------------------
# CREATE CASE
# ---------------------------------------------------------

@app.post("/cases")
def create_case(
    request: Request,
    case_number: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    created_by: str = Form("investigator"),
    db: Session = Depends(get_db),
):

    case_number = case_number.strip()
    title = title.strip()
    description = description.strip()

    if not case_number:

        raise HTTPException(
            status_code=400,
            detail="Case number is required",
        )

    if not title:

        raise HTTPException(
            status_code=400,
            detail="Case title is required",
        )

    current_user = (
        db.query(User)
        .filter(
            User.username == created_by.strip()
        )
        .first()
    )

    if not current_user:

        raise HTTPException(
            status_code=404,
            detail=(
                f"User '{created_by}' "
                "was not found"
            ),
        )

    user_role = (
        str(current_user.role)
        .strip()
        .lower()
    )

    # FIXED:
    # Removed the duplicate raise that was
    # incorrectly outside the if block.

    if user_role not in [
        "admin",
        "investigator",
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "Only Admin or Investigator "
                "users can create cases"
            ),
        )

    existing_case = (
        db.query(Case)
        .filter(
            Case.case_number == case_number
        )
        .first()
    )

    if existing_case:

        raise HTTPException(
            status_code=409,
            detail=(
                "A case with this case number "
                "already exists"
            ),
        )

    case_id = (
        f"CASE-{uuid.uuid4().hex[:8].upper()}"
    )

    case = Case(
        case_id=case_id,
        case_number=case_number,
        title=title,
        description=(
            description
            if description
            else None
        ),
        status="Open",
        created_by=current_user.id,
    )

    db.add(case)

    db.commit()

    db.refresh(case)

    create_audit_log(
        db=db,
        evidence_id=None,
        user_id=current_user.id,
        action="Case Created",
        description=(
            f"Case {case.case_number} "
            f"({case.case_id}) was created "
            f"by {current_user.username}."
        ),
        request=request,
    )

    db.commit()

    return {
        "message": "Case created successfully",
        "case": serialize_case(
            case,
            db,
        ),
    }


# ---------------------------------------------------------
# GET ALL CASES
# ---------------------------------------------------------

@app.get("/cases")
def get_all_cases(
    db: Session = Depends(get_db),
):

    cases = (
        db.query(Case)
        .order_by(
            Case.id.desc()
        )
        .all()
    )

    case_records = [
        serialize_case(
            case,
            db,
        )
        for case in cases
    ]

    return {
        "total": len(case_records),
        "cases": case_records,
    }


# ---------------------------------------------------------
# GET CASE EVIDENCE
# ---------------------------------------------------------

@app.get("/cases/{case_id}/evidence")
def get_case_evidence(
    case_id: str,
    db: Session = Depends(get_db),
):

    case = (
        db.query(Case)
        .filter(
            Case.case_id == case_id
        )
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    evidence_records = (
        db.query(Evidence)
        .filter(
            Evidence.case_id == case.case_id
        )
        .order_by(
            Evidence.id.desc()
        )
        .all()
    )

    records = [
        serialize_evidence(
            evidence,
            db,
        )
        for evidence in evidence_records
    ]

    return {
        "case": serialize_case(
            case,
            db,
        ),
        "total": len(records),
        "evidence": records,
    }


# ---------------------------------------------------------
# GET CASE BY CASE NUMBER
# ---------------------------------------------------------

@app.get("/cases/number/{case_number}")
def get_case_by_number(
    case_number: str,
    db: Session = Depends(get_db),
):

    case = (
        db.query(Case)
        .filter(
            Case.case_number == case_number
        )
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    return {
        "case": serialize_case(
            case,
            db,
        ),
    }


# ---------------------------------------------------------
# GET ONE CASE
# ---------------------------------------------------------

@app.get("/cases/{case_id}")
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
):

    case = (
        db.query(Case)
        .filter(
            Case.case_id == case_id
        )
        .first()
    )

    if not case:

        raise HTTPException(
            status_code=404,
            detail="Case not found",
        )

    return {
        "case": serialize_case(
            case,
            db,
        ),
    }


# =========================================================
# UPLOAD EVIDENCE
# =========================================================

@app.post("/evidence/upload")
async def upload_evidence(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    investigator: str = Form("admin"),
    evidence_date: str = Form(""),
    case_id: str = Form(""),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # FILE CHECK
    # -----------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected",
        )

    title = title.strip()

    if not title:

        raise HTTPException(
            status_code=400,
            detail="Evidence title is required",
        )

    # -----------------------------------------------------
    # RESOLVE USER
    # -----------------------------------------------------

    current_user = resolve_user(
        db,
        investigator,
    )

    if current_user:

        user_id = current_user.id
        user_name = current_user.username

    else:

        raise HTTPException(
            status_code=404,
            detail=(
                f"User '{investigator}' "
                "was not found"
            ),
        )

    # -----------------------------------------------------
    # CASE VALIDATION
    # -----------------------------------------------------

    selected_case = None

    case_id = (
        case_id or ""
    ).strip()

    if case_id:

        selected_case = (
            db.query(Case)
            .filter(
                Case.case_id == case_id
            )
            .first()
        )

        if not selected_case:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Case '{case_id}' "
                    "was not found"
                ),
            )

        if selected_case.status.lower() in [
            "closed",
            "archived",
        ]:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Evidence cannot be uploaded "
                    "to a closed or archived case"
                ),
            )

    # -----------------------------------------------------
    # GENERATE EVIDENCE ID
    # -----------------------------------------------------

    evidence_id = (
        f"EVD-{uuid.uuid4().hex[:8].upper()}"
    )

    safe_filename = os.path.basename(
        file.filename
    )

    # -----------------------------------------------------
    # READ FILE
    # -----------------------------------------------------

    file_content = await file.read()

    if not file_content:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    file_size = len(file_content)

    # -----------------------------------------------------
    # SHA-256
    # -----------------------------------------------------

    sha256_hash = hashlib.sha256(
        file_content
    ).hexdigest()

    # -----------------------------------------------------
    # HMAC
    # -----------------------------------------------------

    hmac_hash = calculate_hmac(
        sha256_hash
    )

    # -----------------------------------------------------
    # AES ENCRYPTION
    # -----------------------------------------------------

    aes_key = generate_aes_key()

    stored_data, iv = encrypt_data(
        file_content,
        aes_key,
    )

    encrypted_hmac_hash = calculate_hmac(
        stored_data
    )

    # -----------------------------------------------------
    # STORE FILE
    # -----------------------------------------------------

    stored_filename = (
        f"{evidence_id}_{safe_filename}"
    )

    original_file_path = os.path.join(
        ORIGINAL_STORAGE_DIR,
        stored_filename,
    )

    file_path = os.path.join(
        CURRENT_STORAGE_DIR,
        stored_filename,
    )

    # -----------------------------------------------------
    # STORE ORIGINAL ENCRYPTED COPY
    # -----------------------------------------------------

    with open(
        original_file_path,
        "wb",
    ) as output_file:

        output_file.write(
            stored_data
        )

    # -----------------------------------------------------
    # STORE CURRENT COPY
    # -----------------------------------------------------

    with open(
        file_path,
        "wb",
    ) as output_file:

        output_file.write(
            stored_data
        )

    # -----------------------------------------------------
    # DATABASE RECORD
    # -----------------------------------------------------

    evidence = Evidence(
        evidence_id=evidence_id,

        case_id=(
            selected_case.case_id
            if selected_case
            else None
        ),

        file_name=safe_filename,
        title=title,
        file_size=file_size,
        file_path=file_path,
        sha256_hash=sha256_hash,
        hmac_hash=hmac_hash,
        encrypted_hmac_hash=encrypted_hmac_hash,
        uploaded_by=user_id,
        status="Encrypted",
    )

    db.add(evidence)

    db.commit()

    db.refresh(evidence)

    # -----------------------------------------------------
    # UPLOAD REMARKS
    # -----------------------------------------------------

    upload_remarks = (
        description.strip()
        if description.strip()
        else (
            f"Evidence uploaded by "
            f"{user_name} and securely encrypted."
        )
    )

    if selected_case:

        upload_remarks = (
            f"{upload_remarks} "
            f"Linked to case "
            f"{selected_case.case_number}."
        )

    # -----------------------------------------------------
    # CHAIN OF CUSTODY
    # -----------------------------------------------------

    create_custody_record(
        db=db,
        evidence_id=evidence.id,
        user_id=user_id,
        user_name=user_name,
        action="Uploaded",
        description=(
            f"Evidence uploaded by investigator "
            f"{user_name} and securely encrypted."
        ),
        remarks=upload_remarks,
        request=request,
    )

    # -----------------------------------------------------
    # AUDIT LOG
    # -----------------------------------------------------

    audit_description = (
        "Evidence uploaded, SHA-256 hash "
        "generated, HMAC authenticated and "
        "encrypted. Original evidence "
        "preserved separately."
    )

    if selected_case:

        audit_description += (
            f" Evidence linked to case "
            f"{selected_case.case_number} "
            f"({selected_case.case_id})."
        )

    create_audit_log(
        db=db,
        evidence_id=evidence.id,
        user_id=user_id,
        action="Evidence Uploaded",
        description=audit_description,
        request=request,
    )

    db.commit()

    return {
        "message": (
            "Evidence uploaded and "
            "encrypted successfully"
        ),

        "evidence_id": evidence.evidence_id,

        "case_id": evidence.case_id,

        "case_number": (
            selected_case.case_number
            if selected_case
            else None
        ),

        "case_title": (
            selected_case.title
            if selected_case
            else None
        ),

        "file_name": evidence.file_name,
        "title": evidence.title,
        "file_size": evidence.file_size,

        "file_size_kb": round(
            evidence.file_size / 1024,
            2,
        ),

        "sha256_hash": evidence.sha256_hash,
        "hmac_hash": evidence.hmac_hash,

        "status": evidence.status,

        "uploaded_by": user_id,
        "uploaded_by_name": user_name,

        "created_at": evidence.created_at,
    }


# =========================================================
# GET ALL EVIDENCE
# =========================================================

@app.get("/evidence")
def get_all_evidence(
    db: Session = Depends(get_db),
):

    evidence_records = (
        db.query(Evidence)
        .order_by(
            Evidence.id.desc()
        )
        .all()
    )

    records = [
        serialize_evidence(
            evidence,
            db,
        )
        for evidence in evidence_records
    ]

    return {
        "total": len(records),
        "evidence": records,
    }


# =========================================================
# PRESERVE TAMPERED FILE
# =========================================================

def preserve_tampered_copy(
    evidence: Evidence,
    stored_data: bytes,
) -> str:

    safe_filename = os.path.basename(
        evidence.file_name
    )

    tampered_filename = (
        f"{evidence.evidence_id}_"
        f"{uuid.uuid4().hex[:8].upper()}_"
        f"{safe_filename}"
    )

    tampered_path = os.path.join(
        TAMPERED_STORAGE_DIR,
        tampered_filename,
    )

    with open(
        tampered_path,
        "wb",
    ) as output_file:

        output_file.write(
            stored_data
        )

    return tampered_path


# =========================================================
# VIEW PRESERVED TAMPERED FILE
# =========================================================

@app.get("/evidence/tampered/{evidence_id}")
def view_tampered_evidence(
    evidence_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.evidence_id == evidence_id
        )
        .first()
    )

    if not evidence:

        raise HTTPException(
            status_code=404,
            detail="Evidence not found",
        )

    if evidence.status.lower() != "tampered":

        raise HTTPException(
            status_code=400,
            detail=(
                "No tampered evidence is "
                "available for this evidence ID"
            ),
        )

    tampered_files = []

    for filename in os.listdir(
        TAMPERED_STORAGE_DIR
    ):

        if filename.startswith(
            f"{evidence.evidence_id}_"
        ):

            full_path = os.path.join(
                TAMPERED_STORAGE_DIR,
                filename,
            )

            if os.path.isfile(full_path):

                tampered_files.append(
                    full_path
                )

    if not tampered_files:

        raise HTTPException(
            status_code=404,
            detail=(
                "Preserved tampered file "
                "not found"
            ),
        )

    tampered_path = max(
        tampered_files,
        key=os.path.getmtime,
    )

    try:

        with open(
            tampered_path,
            "rb",
        ) as file:

            stored_data = file.read()

        if len(stored_data) <= 16:

            raise ValueError(
                "Invalid preserved encrypted "
                "evidence file"
            )

        aes_key = generate_aes_key()

        iv = stored_data[:16]

        encrypted_data = stored_data[16:]

        if len(encrypted_data) == 0:

            raise ValueError(
                "Encrypted evidence data is empty"
            )

        if len(encrypted_data) % 16 != 0:

            raise ValueError(
                "Invalid encrypted evidence "
                "data length"
            )

        decrypted_data = decrypt_data(
            encrypted_data,
            iv,
            aes_key,
        )

        if not decrypted_data:

            raise ValueError(
                "Decrypted tampered evidence "
                "is empty"
            )

        current_user = resolve_user(
            db,
            "admin",
        )

        view_user_id = (
            current_user.id
            if current_user
            else 1
        )

        view_user_name = (
            current_user.username
            if current_user
            else "admin"
        )

        create_custody_record(
            db=db,
            evidence_id=evidence.id,
            user_id=view_user_id,
            user_name=view_user_name,
            action="Viewed",
            description=(
                "Preserved tampered evidence "
                "was viewed."
            ),
            remarks=(
                "Preserved tampered file "
                "accessed for inspection."
            ),
            request=request,
        )

        create_audit_log(
            db=db,
            evidence_id=evidence.id,
            user_id=view_user_id,
            action="Tampered Evidence Viewed",
            description=(
                "Preserved tampered evidence "
                "file was accessed for inspection."
            ),
            request=request,
        )

        db.commit()

        media_type = (
            mimetypes.guess_type(
                evidence.file_name
            )[0]
            or "application/octet-stream"
        )

        return Response(
            content=decrypted_data,
            media_type=media_type,
            headers={
                "Content-Disposition": (
                    "inline; "
                    f'filename="{evidence.file_name}"'
                )
            },
        )

    except ValueError as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to decrypt preserved "
                "tampered file: "
                f"{str(error)}"
            ),
        )

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to view preserved "
                "tampered file: "
                f"{str(error)}"
            ),
        )


# =========================================================
# VIEW EVIDENCE
# =========================================================

@app.get("/evidence/view/{evidence_id}")
def view_evidence(
    evidence_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.evidence_id == evidence_id
        )
        .first()
    )

    if not evidence:

        raise HTTPException(
            status_code=404,
            detail="Evidence not found",
        )

    if not os.path.exists(
        evidence.file_path
    ):

        raise HTTPException(
            status_code=404,
            detail=(
                "Encrypted evidence file not found"
            ),
        )

    try:

        with open(
            evidence.file_path,
            "rb",
        ) as file:

            stored_data = file.read()

        if len(stored_data) <= 16:

            raise ValueError(
                "Invalid encrypted evidence file"
            )

        aes_key = generate_aes_key()

        iv = stored_data[:16]

        encrypted_data = stored_data[16:]

        if len(encrypted_data) == 0:

            raise ValueError(
                "Encrypted evidence data is empty"
            )

        if len(encrypted_data) % 16 != 0:

            raise ValueError(
                "Invalid encrypted evidence data length"
            )

        decrypted_data = decrypt_data(
            encrypted_data,
            iv,
            aes_key,
        )

        if not decrypted_data:

            raise ValueError(
                "Decrypted evidence data is empty"
            )

        media_type = (
            mimetypes.guess_type(
                evidence.file_name
            )[0]
            or "application/octet-stream"
        )

        return Response(
            content=decrypted_data,
            media_type=media_type,
            headers={
                "Content-Disposition": (
                    "inline; "
                    f'filename="{evidence.file_name}"'
                )
            },
        )

    except ValueError as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to view evidence: "
                f"{str(error)}"
            ),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to view evidence: "
                f"{str(error)}"
            ),
        )


# =========================================================
# DELETE EVIDENCE
# =========================================================

@app.delete("/evidence/{evidence_id}")
def delete_evidence(
    evidence_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.evidence_id == evidence_id
        )
        .first()
    )

    if not evidence:

        raise HTTPException(
            status_code=404,
            detail="Evidence not found",
        )

    try:

        # Delete current encrypted file
        if os.path.exists(
            evidence.file_path
        ):

            os.remove(
                evidence.file_path
            )

        # Delete database record
        db.delete(evidence)

        db.commit()

        return {
            "message": "Evidence deleted successfully",
            "evidence_id": evidence_id,
        }

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to delete evidence: "
                f"{str(error)}"
            ),
        )


# =========================================================
# VERIFY EVIDENCE
# =========================================================

@app.get("/evidence/verify/{evidence_id}")
def verify_evidence(
    evidence_id: str,
    request: Request,
    db: Session = Depends(get_db),
):

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.evidence_id == evidence_id
        )
        .first()
    )

    if not evidence:

        raise HTTPException(
            status_code=404,
            detail="Evidence not found",
        )

    current_storage_path = os.path.realpath(
        CURRENT_STORAGE_DIR
    )

    evidence_file_path = os.path.realpath(
        evidence.file_path
    )

    if (
        os.path.dirname(evidence_file_path)
        != current_storage_path
    ):

        raise HTTPException(
            status_code=409,
            detail=(
                "Evidence file path is outside current storage"
            ),
        )

    if not os.path.exists(
        evidence_file_path
    ):

        raise HTTPException(
            status_code=404,
            detail=(
                "Encrypted evidence file "
                "not found"
            ),
        )

    stored_data = b""

    current_user = resolve_user(
        db,
        "admin",
    )

    verification_user_id = (
        current_user.id
        if current_user
        else 1
    )

    verification_user_name = (
        current_user.username
        if current_user
        else "admin"
    )

    aes_key = generate_aes_key()

    try:

        with open(
            evidence_file_path,
            "rb",
        ) as file:

            stored_data = file.read()

        if len(stored_data) <= 16:

            raise ValueError(
                "Invalid encrypted evidence file"
            )

        encrypted_hmac_match = (
            evidence.encrypted_hmac_hash is not None
            and hmac.compare_digest(
                calculate_hmac(stored_data),
                evidence.encrypted_hmac_hash,
            )
        )

        # -------------------------------------------------
        # ENCRYPTED FILE INTEGRITY CHECK
        # -------------------------------------------------

        if not encrypted_hmac_match:

            tampered_file_path = (
                preserve_tampered_copy(
                    evidence,
                    stored_data,
                )
            )

            evidence.status = "Tampered"

            create_custody_record(
                db=db,
                evidence_id=evidence.id,
                user_id=verification_user_id,
                user_name=verification_user_name,
                action="Tamper Detected",
                description=(
                    "Evidence verification failed because "
                    "the encrypted evidence file HMAC did "
                    "not match the stored integrity value."
                ),
                remarks=(
                    "Encrypted evidence file integrity "
                    "mismatch detected. Current encrypted "
                    "evidence was preserved in tampered storage."
                ),
                request=request,
            )

            create_audit_log(
                db=db,
                evidence_id=evidence.id,
                user_id=verification_user_id,
                action="Tamper Detected",
                description=(
                    "Encrypted evidence file integrity "
                    "verification failed. "
                    f"Tampered copy preserved at: "
                    f"{tampered_file_path}"
                ),
                request=request,
            )

            db.commit()

            return {
                "evidence_id": evidence.evidence_id,
                "file_name": evidence.file_name,
                "case_id": evidence.case_id,
                "file_size": evidence.file_size,
                "created_at": evidence.created_at,
                "status": "Tampered",
                "tampered": True,
                "message": (
                    "Evidence integrity "
                    "verification failed"
                ),
                "error": (
                    "Encrypted evidence file integrity "
                    "check failed"
                ),
                "sha256_match": False,
                "hmac_match": False,
                "encrypted_hmac_match": False,
                "original_sha256": evidence.sha256_hash,
                "current_sha256": None,
                "tampered_file_path": tampered_file_path,
                "sha256_hash": evidence.sha256_hash,
                "hmac_hash": evidence.hmac_hash,
            }

        # -------------------------------------------------
        # FIRST 16 BYTES = IV
        # -------------------------------------------------

        iv = stored_data[:16]

        # -------------------------------------------------
        # REMAINING BYTES = CIPHERTEXT
        # -------------------------------------------------

        encrypted_data = stored_data[16:]

        if len(encrypted_data) == 0:

            raise ValueError(
                "Encrypted evidence data is empty"
            )

        if len(encrypted_data) % 16 != 0:

            raise ValueError(
                "Invalid encrypted evidence "
                "data length"
            )

        try:

            original_data = decrypt_data(
                encrypted_data,
                iv,
                aes_key,
            )

        except Exception as error:

            raise ValueError(
                "Encrypted evidence could not be decrypted"
            ) from error

        if not original_data:

            raise ValueError(
                "Decrypted evidence data is empty"
            )

        current_sha256 = hashlib.sha256(
            original_data
        ).hexdigest()

        current_hmac = calculate_hmac(
            current_sha256
        )

        hash_match = hmac.compare_digest(
            current_sha256,
            evidence.sha256_hash,
        )

        hmac_match = hmac.compare_digest(
            current_hmac,
            evidence.hmac_hash,
        )

        # =================================================
        # VERIFIED
        # =================================================

        if (
            hash_match
            and hmac_match
            and encrypted_hmac_match
        ):

            evidence.status = "Verified"

            create_custody_record(
                db=db,
                evidence_id=evidence.id,
                user_id=verification_user_id,
                user_name=verification_user_name,
                action="Verified",
                description=(
                    "Evidence integrity verified "
                    "successfully. SHA-256 and HMAC "
                    "values matched."
                ),
                remarks=(
                    "Integrity verification "
                    "completed successfully."
                ),
                request=request,
            )

            create_audit_log(
                db=db,
                evidence_id=evidence.id,
                user_id=verification_user_id,
                action="Evidence Verified",
                description=(
                    "Evidence integrity verified "
                    "successfully. SHA-256 and HMAC "
                    "values matched."
                ),
                request=request,
            )

            db.commit()

            return {
                "evidence_id": evidence.evidence_id,
                "file_name": evidence.file_name,
                "case_id": evidence.case_id,
                "file_size": evidence.file_size,
                "created_at": evidence.created_at,
                "status": "Verified",
                "tampered": False,
                "message": (
                    "Evidence integrity "
                    "verified successfully"
                ),
                "sha256_match": hash_match,
                "hmac_match": hmac_match,
                "encrypted_hmac_match": (
                    encrypted_hmac_match
                ),
                "original_sha256": (
                    evidence.sha256_hash
                ),
                "current_sha256": (
                    current_sha256
                ),
                "sha256_hash": (
                    evidence.sha256_hash
                ),
                "hmac_hash": (
                    evidence.hmac_hash
                ),
            }

        # =================================================
        # TAMPERED
        # =================================================

        tampered_file_path = (
            preserve_tampered_copy(
                evidence,
                stored_data,
            )
        )

        evidence.status = "Tampered"

        create_custody_record(
            db=db,
            evidence_id=evidence.id,
            user_id=verification_user_id,
            user_name=verification_user_name,
            action="Tamper Detected",
            description=(
                "Evidence verification failed "
                "because SHA-256 or HMAC values "
                "did not match. Tampered copy "
                "preserved."
            ),
            remarks=(
                "Integrity mismatch detected. "
                "Current encrypted evidence was "
                "preserved in tampered storage."
            ),
            request=request,
        )

        create_audit_log(
            db=db,
            evidence_id=evidence.id,
            user_id=verification_user_id,
            action="Tamper Detected",
            description=(
                "Evidence verification failed "
                "because SHA-256 or HMAC values "
                "did not match. "
                f"Tampered copy preserved at: "
                f"{tampered_file_path}"
            ),
            request=request,
        )

        db.commit()

        return {
            "evidence_id": evidence.evidence_id,
            "file_name": evidence.file_name,
            "case_id": evidence.case_id,
            "file_size": evidence.file_size,
            "created_at": evidence.created_at,
            "status": "Tampered",
            "tampered": True,
            "message": (
                "Evidence integrity "
                "verification failed"
            ),
            "sha256_match": hash_match,
            "hmac_match": hmac_match,
            "encrypted_hmac_match": (
                encrypted_hmac_match
            ),
            "original_sha256": (
                evidence.sha256_hash
            ),
            "current_sha256": (
                current_sha256
            ),
            "tampered_file_path": (
                tampered_file_path
            ),
            "sha256_hash": (
                evidence.sha256_hash
            ),
            "hmac_hash": (
                evidence.hmac_hash
            ),
        }

    except ValueError as error:

        tampered_file_path = None

        if stored_data:

            try:

                tampered_file_path = (
                    preserve_tampered_copy(
                        evidence,
                        stored_data,
                    )
                )

            except Exception:

                tampered_file_path = None

        evidence.status = "Tampered"

        create_custody_record(
            db=db,
            evidence_id=evidence.id,
            user_id=verification_user_id,
            user_name=verification_user_name,
            action="Tamper Detected",
            description=(
                "Evidence verification failed "
                "because the encrypted evidence "
                "could not be successfully "
                "decrypted or verified."
            ),
            remarks=(
                "Encrypted evidence appears to "
                "be corrupted or tampered. "
                "Current encrypted evidence "
                "was preserved."
            ),
            request=request,
        )

        create_audit_log(
            db=db,
            evidence_id=evidence.id,
            user_id=verification_user_id,
            action="Tamper Detected",
            description=(
                "Evidence verification failed "
                "because the encrypted evidence "
                "could not be successfully "
                "decrypted or verified. "
                f"Tampered copy preserved at: "
                f"{tampered_file_path}"
            ),
            request=request,
        )

        db.commit()

        return {
            "evidence_id": evidence.evidence_id,
            "file_name": evidence.file_name,
            "case_id": evidence.case_id,
            "file_size": evidence.file_size,
            "created_at": evidence.created_at,
            "status": "Tampered",
            "tampered": True,
            "message": (
                "Evidence integrity "
                "verification failed"
            ),
            "error": str(error),
            "sha256_match": False,
            "hmac_match": False,
            "encrypted_hmac_match": False,
            "original_sha256": (
                evidence.sha256_hash
            ),
            "current_sha256": None,
            "sha256_hash": (
                evidence.sha256_hash
            ),
            "hmac_hash": (
                evidence.hmac_hash
            ),
            "tampered_file_path": (
                tampered_file_path
            ),
        }

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Evidence verification error: "
                f"{str(error)}"
            ),
        )


# =========================================================
# CHAIN OF CUSTODY
# =========================================================

@app.get("/evidence/custody/{evidence_id}")
def get_chain_of_custody(
    evidence_id: str,
    db: Session = Depends(get_db),
):

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.evidence_id == evidence_id
        )
        .first()
    )

    if not evidence:

        raise HTTPException(
            status_code=404,
            detail="Evidence not found",
        )

    records = (
        db.query(ChainOfCustody)
        .filter(
            ChainOfCustody.evidence_id
            == evidence.id
        )
        .order_by(
            ChainOfCustody.created_at.asc()
        )
        .all()
    )

    custody_history = []

    for record in records:

        record_user_name = (
            record.user_name
            if record.user_name
            else get_user_name(
                db,
                record.user_id,
            )
        )

        custody_history.append(
            {
                "id": record.id,
                "evidence_id": record.evidence_id,
                "user_id": record.user_id,
                "user_name": record_user_name,
                "action": record.action,
                "description": record.description,
                "remarks": record.remarks,
                "ip_address": record.ip_address,
                "created_at": record.created_at,
            }
        )

    return {
        "evidence_id": evidence.evidence_id,
        "case_id": evidence.case_id,
        "file_name": evidence.file_name,
        "total_records": len(
            custody_history
        ),
        "custody": custody_history,
        "records": custody_history,
        "chain_of_custody": custody_history,
    }


# =========================================================
# GET ALL AUDIT LOGS
# =========================================================

@app.get("/audit-logs")
def get_all_audit_logs(
    db: Session = Depends(get_db),
):

    logs = (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .all()
    )

    audit_history = [
        serialize_audit_log(log)
        for log in logs
    ]

    return {
        "total": len(audit_history),
        "audit_logs": audit_history,
    }


# =========================================================
# AUDIT LOGS FOR ONE EVIDENCE
# =========================================================

@app.get("/audit-logs/{evidence_id}")
def get_audit_logs(
    evidence_id: str,
    db: Session = Depends(get_db),
):

    evidence = (
        db.query(Evidence)
        .filter(
            Evidence.evidence_id == evidence_id
        )
        .first()
    )

    if not evidence:

        raise HTTPException(
            status_code=404,
            detail="Evidence not found",
        )

    logs = (
        db.query(AuditLog)
        .filter(
            AuditLog.evidence_id == evidence.id
        )
        .order_by(
            AuditLog.created_at.asc()
        )
        .all()
    )

    audit_history = [
        serialize_audit_log(log)
        for log in logs
    ]

    return {
        "evidence_id": evidence.evidence_id,
        "case_id": evidence.case_id,
        "file_name": evidence.file_name,
        "total_logs": len(audit_history),
        "audit_logs": audit_history,
    }