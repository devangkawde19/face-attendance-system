from fastapi import FastAPI

app = FastAPI(title="Face Attendance System")


@app.get("/")
def home():
    return {"message": "Face Attendance System API is running"}
