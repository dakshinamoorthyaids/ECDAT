import os

from database import SessionLocal
from models import Evidence


db = SessionLocal()

try:
    records = db.query(Evidence).all()

    for evidence in records:
        if os.path.exists(evidence.file_path):
            evidence.file_size = os.path.getsize(evidence.file_path)

            print(
                evidence.evidence_id,
                evidence.file_name,
                evidence.file_size,
                "bytes"
            )
        else:
            print(
                "FILE NOT FOUND:",
                evidence.evidence_id,
                evidence.file_path
            )

    db.commit()

    print("\nFile sizes updated successfully!")

finally:
    db.close()