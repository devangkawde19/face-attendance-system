from .database import SessionLocal
from .attendance_service import mark_attendance
from .models import Student


def main():
    db = SessionLocal()

    try:
        # -------------------------------------------------
        # 1. Find test student
        # -------------------------------------------------

        student = db.query(Student).filter(Student.id == 2).first()

        if not student:
            print("ERROR: Student with ID 2 not found.")
            return

        print("Student found!")
        print("ID:", student.id)
        print("Name:", student.full_name)
        print("Code:", student.student_code)

        # -------------------------------------------------
        # 2. First attendance attempt
        # -------------------------------------------------

        print("\n--- First attendance attempt ---")

        result1 = mark_attendance(db=db, student_id=student.id)

        attendance1 = result1["attendance"]

        print("Already marked:", result1["already_marked"])
        print("Attendance ID:", attendance1.id)
        print("Student ID:", attendance1.student_id)
        print("Date:", attendance1.attendance_date)
        print("Check-in time:", attendance1.check_in_time)
        print("Status:", attendance1.status)

        # -------------------------------------------------
        # 3. Second attendance attempt
        # -------------------------------------------------

        print("\n--- Second attendance attempt ---")

        result2 = mark_attendance(db=db, student_id=student.id)

        attendance2 = result2["attendance"]

        print("Already marked:", result2["already_marked"])
        print("Attendance ID:", attendance2.id)
        print("Student ID:", attendance2.student_id)
        print("Date:", attendance2.attendance_date)
        print("Check-in time:", attendance2.check_in_time)
        print("Status:", attendance2.status)

        # -------------------------------------------------
        # 4. Verify duplicate prevention
        # -------------------------------------------------

        print("\n--- Verification ---")

        if (
            result1["already_marked"] is False
            and result2["already_marked"] is True
            and attendance1.id == attendance2.id
        ):
            print("SUCCESS!")
            print("First attempt created attendance.")
            print("Second attempt returned existing attendance.")
            print("Duplicate attendance was prevented.")

        else:
            print("TEST FAILED!")
            print("Unexpected attendance behavior.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
