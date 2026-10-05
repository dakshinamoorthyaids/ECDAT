from database import engine, Base
from models import User, Evidence, ChainOfCustody

Base.metadata.create_all(bind=engine)

print("✅ All database tables created successfully!")