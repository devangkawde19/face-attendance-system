from .database import engine
from .models import Student, FaceEmbedding, Attendance

print("Student table:", Student.__tablename__)
print("Face embedding table:", FaceEmbedding.__tablename__)
print("Attendance table:", Attendance.__tablename__)

print("\nSQLAlchemy models loaded successfully!")
