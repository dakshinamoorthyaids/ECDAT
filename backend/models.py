from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from database import Base


# ==========================================
# USER MODEL
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String(100),
        unique=True,
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(50),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ==========================================
# CASE MODEL
# ==========================================

class Case(Base):
    __tablename__ = "cases"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    case_id = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    case_number = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="Open"
    )

    created_by = Column(
        Integer,
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


# ==========================================
# EVIDENCE MODEL
# ==========================================

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    evidence_id = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    # --------------------------------------
    # CASE CONNECTION
    # --------------------------------------
    # Links this evidence to a case.
    # Nullable=True keeps existing evidence
    # records compatible.
    case_id = Column(
        String(50),
        nullable=True,
        index=True
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    file_size = Column(
        Integer,
        nullable=False,
        default=0
    )

    file_path = Column(
        String(500),
        nullable=False
    )

    sha256_hash = Column(
        String(64),
        nullable=False
    )

    hmac_hash = Column(
        String(64),
        nullable=False
    )

    encrypted_hmac_hash = Column(
        String(64),
        nullable=True
    )

    uploaded_by = Column(
        Integer,
        nullable=False
    )

    status = Column(
        String(50),
        default="Verified"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ==========================================
# CHAIN OF CUSTODY MODEL
# ==========================================

class ChainOfCustody(Base):
    __tablename__ = "chain_of_custody"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    evidence_id = Column(
        Integer,
        nullable=False
    )

    user_id = Column(
        Integer,
        nullable=False
    )

    user_name = Column(
        String(100),
        nullable=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    remarks = Column(
        String(500),
        nullable=True
    )

    ip_address = Column(
        String(100),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ==========================================
# AUDIT LOG MODEL
# ==========================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    evidence_id = Column(
        Integer,
        nullable=True
    )

    user_id = Column(
        Integer,
        nullable=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    ip_address = Column(
        String(100),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )