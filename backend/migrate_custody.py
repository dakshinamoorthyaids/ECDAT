from sqlalchemy import text
from database import engine


def migrate():
    with engine.begin() as connection:
        connection.execute(text("""
            ALTER TABLE chain_of_custody
            ADD COLUMN IF NOT EXISTS user_name VARCHAR(100)
        """))

        connection.execute(text("""
            ALTER TABLE chain_of_custody
            ADD COLUMN IF NOT EXISTS remarks VARCHAR(500)
        """))

        connection.execute(text("""
            ALTER TABLE chain_of_custody
            ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100)
        """))

    print("✅ Chain of Custody migration completed successfully.")
    print("✅ user_name column ready")
    print("✅ remarks column ready")
    print("✅ ip_address column ready")


if __name__ == "__main__":
    migrate()