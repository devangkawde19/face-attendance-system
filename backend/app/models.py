from datetime import date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Identity,
    SmallInteger,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)

    student_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)

    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    mobile_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    course: Mapped[str | None] = mapped_column(String(100), nullable=True)

    department: Mapped[str | None] = mapped_column(String(100), nullable=True)

    year: Mapped[str | None] = mapped_column(String(10), nullable=True)

    semester: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    section: Mapped[str | None] = mapped_column(String(20), nullable=True)

    enrollment_date: Mapped[date | None] = mapped_column(
        Date, server_default=func.current_date(), nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20), server_default="active", nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    face_embeddings: Mapped[list["FaceEmbedding"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )

    attendance_records: Mapped[list["Attendance"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)

    student_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )

    embedding: Mapped[list[float]] = mapped_column(Vector(512), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    student: Mapped["Student"] = relationship(back_populates="face_embeddings")


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)

    student_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )

    attendance_date: Mapped[date] = mapped_column(
        Date, server_default=func.text("CURRENT_DATE"), nullable=False
    )

    check_in_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20), server_default="present", nullable=False
    )

    student: Mapped["Student"] = relationship(back_populates="attendance_records")

    __table_args__ = (
        UniqueConstraint(
            "student_id", "attendance_date", name="unique_student_daily_attendance"
        ),
    )
