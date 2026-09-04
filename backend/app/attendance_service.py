from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from .models import Attendance


def mark_attendance(db: Session, student_id: int):
    """
    Mark attendance for a student for today.

    If attendance is already marked today,
    return the existing attendance record.
    """

    today = date.today()

    # -----------------------------------------------------
    # 1. Check if attendance already exists today
    # -----------------------------------------------------

    existing_attendance = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == student_id, Attendance.attendance_date == today
        )
        .first()
    )

    # -----------------------------------------------------
    # 2. Already marked
    # -----------------------------------------------------

    if existing_attendance:
        return {
            "already_marked": True,
            "attendance": existing_attendance,
        }

    # -----------------------------------------------------
    # 3. Create new attendance
    # -----------------------------------------------------

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

        # Another request may have created today's
        # attendance at the same time.
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

    # -----------------------------------------------------
    # 4. Return newly created attendance
    # -----------------------------------------------------

    return {
        "already_marked": False,
        "attendance": attendance,
    }
