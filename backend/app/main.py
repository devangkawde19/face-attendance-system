import cv2
import numpy as np
from datetime import date

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .attendance_service import mark_attendance
from .database import get_db
from .face_service import FaceRecognitionService
from .models import Attendance, FaceEmbedding, Student
from .recognition_service import find_matching_student

app = FastAPI(
    title="AttendVision",
    description="AI-powered face recognition attendance API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


face_service = FaceRecognitionService()


@app.get("/")
def root():
    return {"message": "AttendVision API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/health/database")
def database_health_check(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1"))
        value = result.scalar()

        return {
            "status": "healthy",
            "database": "connected",
            "result": value,
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "connection failed",
            "error": str(e),
        }


# =========================================================
# STUDENT MODELS
# =========================================================


class StudentCreate(BaseModel):
    student_code: str
    full_name: str
    email: str | None = None
    mobile_number: str | None = None
    course: str
    department: str | None = None
    year: str
    semester: int
    section: str | None = None
    enrollment_date: date | None = None
    status: str = "active"


class StudentStatusUpdate(BaseModel):
    status: str


# =========================================================
# STUDENT REGISTRATION
# =========================================================


@app.post("/students")
def create_student(student_data: StudentCreate, db: Session = Depends(get_db)):
    if student_data.status not in {"active", "inactive"}:
        raise HTTPException(
            status_code=400, detail="Status must be either 'active' or 'inactive'."
        )

    existing_student = (
        db.query(Student)
        .filter(Student.student_code == student_data.student_code)
        .first()
    )

    if existing_student:
        raise HTTPException(status_code=409, detail="Student code already exists")

    student = Student(
        student_code=student_data.student_code,
        full_name=student_data.full_name,
        email=student_data.email,
        mobile_number=student_data.mobile_number,
        course=student_data.course,
        department=student_data.department,
        year=student_data.year,
        semester=student_data.semester,
        section=student_data.section,
        enrollment_date=student_data.enrollment_date,
        status=student_data.status,
    )

    db.add(student)

    try:
        db.commit()
        db.refresh(student)

    except Exception:
        db.rollback()

        raise HTTPException(status_code=500, detail="Unable to register student.")

    return {
        "message": "Student registered successfully",
        "student": {
            "id": student.id,
            "student_code": student.student_code,
            "full_name": student.full_name,
            "email": student.email,
            "mobile_number": student.mobile_number,
            "course": student.course,
            "department": student.department,
            "year": student.year,
            "semester": student.semester,
            "section": student.section,
            "enrollment_date": student.enrollment_date,
            "status": student.status,
            "created_at": student.created_at,
        },
    }


# =========================================================
# UPDATE STUDENT STATUS
# =========================================================


@app.patch("/students/{student_id}/status")
def update_student_status(
    student_id: int, status_data: StudentStatusUpdate, db: Session = Depends(get_db)
):
    """
    Activate or deactivate a student.

    Inactive students remain in the database with their
    face data and attendance history preserved.
    """

    if status_data.status not in {"active", "inactive"}:
        raise HTTPException(
            status_code=400, detail="Status must be either 'active' or 'inactive'."
        )

    student = db.query(Student).filter(Student.id == student_id).first()

    if student is None:
        raise HTTPException(status_code=404, detail="Student not found.")

    student.status = status_data.status

    try:
        db.commit()
        db.refresh(student)

    except Exception:
        db.rollback()

        raise HTTPException(status_code=500, detail="Unable to update student status.")

    if student.status == "active":
        message = "Student activated successfully."
    else:
        message = "Student deactivated successfully."

    return {
        "message": message,
        "student_id": student.id,
        "status": student.status,
    }


# =========================================================
# GET STUDENTS
# =========================================================


@app.get("/students")
def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.id).all()

    # Get the number of face samples for each student.
    embedding_counts = (
        db.query(FaceEmbedding.student_id, func.count(FaceEmbedding.id))
        .group_by(FaceEmbedding.student_id)
        .all()
    )

    face_count_map = {student_id: int(count) for student_id, count in embedding_counts}

    student_list = []

    for student in students:
        face_samples = face_count_map.get(student.id, 0)

        if face_samples >= 5:
            face_status = "registered"
        elif face_samples > 0:
            face_status = "incomplete"
        else:
            face_status = "pending"

        student_list.append(
            {
                "id": student.id,
                "student_code": student.student_code,
                "full_name": student.full_name,
                "email": student.email,
                "mobile_number": student.mobile_number,
                "course": student.course,
                "department": student.department,
                "year": student.year,
                "semester": student.semester,
                "section": student.section,
                "enrollment_date": student.enrollment_date,
                "status": student.status,
                "face_samples": face_samples,
                "face_status": face_status,
            }
        )

    return {
        "count": len(student_list),
        "students": student_list,
    }


# =========================================================
# REGISTER SINGLE FACE
# =========================================================


@app.post("/students/{student_id}/face")
async def register_face(
    student_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)

    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Could not read uploaded image")

    try:
        embedding = face_service.get_embedding(image)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    embedding_list = embedding.tolist()

    face_embedding = FaceEmbedding(
        student_id=student.id,
        embedding=embedding_list,
    )

    db.add(face_embedding)

    try:
        db.commit()
        db.refresh(face_embedding)

    except Exception:
        db.rollback()

        raise HTTPException(status_code=500, detail="Face registration failed.")

    return {
        "message": "Face registered successfully",
        "student": {
            "id": student.id,
            "student_code": student.student_code,
            "full_name": student.full_name,
        },
        "face_embedding": {
            "id": face_embedding.id,
            "dimensions": len(embedding_list),
            "norm": float(np.linalg.norm(embedding)),
        },
    }


# =========================================================
# REGISTER MULTIPLE FACES
# =========================================================


@app.post("/students/{student_id}/faces")
async def register_multiple_faces(
    student_id: int,
    file1: UploadFile = File(..., description="Face sample 1"),
    file2: UploadFile = File(..., description="Face sample 2"),
    file3: UploadFile = File(..., description="Face sample 3"),
    file4: UploadFile = File(..., description="Face sample 4"),
    file5: UploadFile = File(..., description="Face sample 5"),
    db: Session = Depends(get_db),
):
    """
    Register exactly 5 face samples.

    All 5 samples are processed and validated before
    modifying the database.

    If any sample fails:
        No new embeddings are saved.

    If all 5 samples succeed:
        Existing embeddings are replaced by the new
        5 samples in one database transaction.
    """

    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    files = [
        file1,
        file2,
        file3,
        file4,
        file5,
    ]

    embeddings = []

    # ---------------------------------------------
    # STEP 1: Validate all 5 images
    # ---------------------------------------------

    for index, file in enumerate(files, start=1):
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=(f"Sample {index}: " "uploaded file must be an image"),
            )

        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail=(f"Sample {index}: " "uploaded image is empty"),
            )

        image_array = np.frombuffer(image_bytes, dtype=np.uint8)

        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(
                status_code=400,
                detail=(f"Sample {index}: " "could not read image"),
            )

        try:
            embedding = face_service.get_embedding(image)

        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Sample {index}: {str(e)}",
            )

        embeddings.append(embedding)

    # ---------------------------------------------
    # STEP 2: Replace face samples atomically
    # ---------------------------------------------

    try:
        (
            db.query(FaceEmbedding)
            .filter(FaceEmbedding.student_id == student.id)
            .delete(synchronize_session=False)
        )

        for embedding in embeddings:
            face_embedding = FaceEmbedding(
                student_id=student.id, embedding=embedding.tolist()
            )

            db.add(face_embedding)

        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=("Face registration failed. " "No face samples were changed."),
        )

    return {
        "message": "5 face samples registered successfully",
        "student": {
            "id": student.id,
            "student_code": student.student_code,
            "full_name": student.full_name,
        },
        "samples_registered": 5,
        "embedding_dimensions": 512,
    }


# =========================================================
# FACE RECOGNITION
# =========================================================


@app.post("/recognize")
async def recognize_face(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)

    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Could not read uploaded image")

    try:
        embedding = face_service.get_embedding(image)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        match = find_matching_student(db=db, embedding=embedding, threshold=0.60)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if match is None:
        return {"recognized": False, "message": "No matching student found"}

    return {
        "recognized": True,
        "student": {
            "id": match["student_id"],
            "student_code": match["student_code"],
            "full_name": match["full_name"],
            "email": match["email"],
            "course": match["course"],
        },
        "similarity": match["similarity"],
        "embedding_id": match["embedding_id"],
    }


# =========================================================
# MARK ATTENDANCE BY FACE
# =========================================================


@app.post("/attendance/mark-by-face")
async def mark_attendance_by_face(
    file: UploadFile = File(...), db: Session = Depends(get_db)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)

    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(status_code=400, detail="Could not read uploaded image")

    try:
        embedding = face_service.get_embedding(image)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        match = find_matching_student(db=db, embedding=embedding, threshold=0.60)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if match is None:
        return {
            "recognized": False,
            "attendance_marked": False,
            "message": "No matching student found",
        }

    try:
        attendance_result = mark_attendance(db=db, student_id=match["student_id"])

    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

    attendance = attendance_result["attendance"]

    return {
        "recognized": True,
        "attendance_marked": (not attendance_result["already_marked"]),
        "already_marked": (attendance_result["already_marked"]),
        "student": {
            "id": match["student_id"],
            "student_code": match["student_code"],
            "full_name": match["full_name"],
            "email": match["email"],
            "course": match["course"],
        },
        "similarity": match["similarity"],
        "attendance": {
            "id": attendance.id,
            "date": str(attendance.attendance_date),
            "check_in_time": (attendance.check_in_time.isoformat()),
            "status": attendance.status,
        },
    }


# =========================================================
# ATTENDANCE HISTORY
# =========================================================


@app.get("/attendance")
def get_attendance(db: Session = Depends(get_db)):
    """
    Return all attendance records with
    student information.

    Results are ordered by newest attendance
    first.
    """

    records = (
        db.query(Attendance, Student)
        .join(Student, Attendance.student_id == Student.id)
        .order_by(Attendance.attendance_date.desc(), Attendance.check_in_time.desc())
        .all()
    )

    attendance_list = []

    for attendance, student in records:
        attendance_list.append(
            {
                "id": attendance.id,
                "student_id": student.id,
                "student_code": student.student_code,
                "full_name": student.full_name,
                "email": student.email,
                "course": student.course,
                "department": student.department,
                "year": student.year,
                "semester": student.semester,
                "section": student.section,
                "attendance_date": str(attendance.attendance_date),
                "check_in_time": (attendance.check_in_time.isoformat()),
                "status": attendance.status,
            }
        )

    return {
        "count": len(attendance_list),
        "attendance": attendance_list,
    }


# =========================================================
# DASHBOARD STATISTICS
# =========================================================


@app.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Return statistics for the dashboard.
    """

    total_students = db.query(func.count(Student.id)).scalar()

    registered_faces = db.query(
        func.count(func.distinct(FaceEmbedding.student_id))
    ).scalar()

    today = date.today()

    today_attendance = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.attendance_date == today)
        .scalar()
    )

    if total_students:
        attendance_percentage = (today_attendance / total_students) * 100
    else:
        attendance_percentage = 0

    return {
        "total_students": total_students or 0,
        "registered_faces": registered_faces or 0,
        "today_attendance": today_attendance or 0,
        "attendance_percentage": round(attendance_percentage, 2),
    }
