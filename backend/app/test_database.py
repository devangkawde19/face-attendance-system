import numpy as np
from sqlalchemy import select

from .database import SessionLocal
from .models import Student, FaceEmbedding


def main():
    db = SessionLocal()

    test_student = None

    try:
        # ==========================================
        # 1. CREATE TEST STUDENT
        # ==========================================

        test_student = Student(
            student_code="TEST001",
            full_name="Test Student",
            email="test.student@example.com",
            course="BBA Computer Applications",
        )

        db.add(test_student)
        db.commit()
        db.refresh(test_student)

        print("1. Student created successfully!")
        print("   ID:", test_student.id)
        print("   Name:", test_student.full_name)

        # ==========================================
        # 2. CREATE TEST FACE EMBEDDING
        # ==========================================

        # Create a fake 512-dimensional embedding
        embedding = np.random.rand(512).astype(np.float32)

        # Normalize it like our InsightFace embeddings
        embedding = embedding / np.linalg.norm(embedding)

        face_embedding = FaceEmbedding(
            student_id=test_student.id,
            embedding=embedding.tolist(),
        )

        db.add(face_embedding)
        db.commit()
        db.refresh(face_embedding)

        print("\n2. Face embedding created successfully!")
        print("   Embedding ID:", face_embedding.id)
        print("   Dimensions:", len(embedding))

        # ==========================================
        # 3. READ STUDENT
        # ==========================================

        student = db.scalar(select(Student).where(Student.student_code == "TEST001"))

        if student:
            print("\n3. Student read successfully!")
            print("   ID:", student.id)
            print("   Name:", student.full_name)
            print("   Email:", student.email)
            print("   Course:", student.course)

        # ==========================================
        # 4. READ FACE EMBEDDING
        # ==========================================

        saved_embedding = db.scalar(
            select(FaceEmbedding).where(FaceEmbedding.student_id == test_student.id)
        )

        if saved_embedding:
            print("\n4. Face embedding read successfully!")
            print("   Dimensions:", len(saved_embedding.embedding))

        # ==========================================
        # 5. DELETE TEST DATA
        # ==========================================

        db.delete(test_student)
        db.commit()

        print("\n5. Test student deleted successfully!")

        # Because face_embeddings has ON DELETE CASCADE,
        # the associated embedding should also be deleted.

        remaining_embedding = db.scalar(
            select(FaceEmbedding).where(FaceEmbedding.student_id == test_student.id)
        )

        if remaining_embedding is None:
            print("   Associated embedding deleted by CASCADE.")

        print("\n========================================")
        print("CRUD + pgvector test completed successfully!")
        print("========================================")

    except Exception as e:
        db.rollback()

        print("\nDatabase test failed!")
        print("Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    main()
