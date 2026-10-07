from database import SessionLocal
from models import User
from auth import hash_password


db = SessionLocal()

try:
    users = [
        User(
            User(
    username="admin",
    email="admin@secureevidence.com",
    password_hash=hash_password("Admin@123"),
    role="admin"
),
            username="investigator",
            email="investigator@secureevidence.com",
            password_hash=hash_password("Invest@123"),
            role="Investigator"
        ),
        User(
            username="legalofficer",
            email="legal@secureevidence.com",
            password_hash=hash_password("Legal@123"),
            role="Legal Officer"
        ),
        User(
            username="viewer",
            email="viewer@secureevidence.com",
            password_hash=hash_password("Viewer@123"),
            role="Viewer"
        )
    ]

    for user in users:
        existing_user = db.query(User).filter(
            User.username == user.username
        ).first()

        if existing_user:
            print(f"⚠️ User already exists: {user.username}")
        else:
            db.add(user)
            print(f"✅ User created: {user.username}")

    db.commit()

except Exception as e:
    db.rollback()
    print("❌ Error:", e)

finally:
    db.close()