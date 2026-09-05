from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from .models import Attendance, Student


def mark_attendance(db: Session, student_id: int):
    """
    Mark attendance for an active student for today.

    Inactive students cannot receive new attendance.
    Existing attendance history is preserved.
    """

    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise ValueError("Student not found")

    if student.status != "active":
        raise ValueError("Student is inactive. Attendance cannot be marked.")

    today = date.today()

    existing_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student_id, Attendance.attendance_date == today
        )
        .first()
    )

    if existing_attendance:
        return {
            "already_marked": True,
            "attendance": existing_attendance,
        }

    attendance = Attendance(
        student_id=student_id,
        attendance_date=today,
        check_in_time=datetime.now(timezone.utc),
        status="present",
    )

    db.add(attendance)

    try:
        db.commit()
        db.refresh(attendance)

    except Exception:
        db.rollback()

        existing_attendance = (
            db.query(Attendance)
            .filter(
                Attendance.student_id == student_id, Attendance.attendance_date == today
            )
            .first()
        )

        if existing_attendance:
            return {
                "already_marked": True,
                "attendance": existing_attendance,
            }

        raise

    return {
        "already_marked": False,
        "attendance": attendance,
    }
